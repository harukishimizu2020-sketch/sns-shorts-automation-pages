#!/usr/bin/env python3
"""静かなシティポップBGM 3曲 (numpy + scipy)。旋律・進行はすべて本プロジェクト用の書き下ろし。
  track_c1.wav : 夕暮れの海沿い   84 BPM, 21小節 = 60.000 s, Eb major  (+波音, 風鈴 6.0/19.5/33.0/47.0 s)
  track_c2.wav : 雨の夜の踏切     72 BPM, 18小節 = 60.000 s, D minor   (+雨, 踏切 6.0-33.0 s, 電車 13.5-30.5 s)
  track_c3.wav : 夜明けの干潟     80 BPM, 20小節 = 60.000 s, A major   (+波音, 30 s以降に小鳥)
使い方: python3 audio/music2.py [c1 c2 c3]
"""
import os, subprocess, sys
import numpy as np
from scipy import signal
import music as M
from music import (SR, N, TAIL, TAU, HERE, Mix, mtof, lp, hp, bp, ar, held, ep_note, round_bass, kick, rimshot,
                   vibe_note, pad_chord, chorus, make_ir, reverb, echo, autopan, master)

L = N + TAIL
TT = np.arange(L) / SR


def env_pts(ts, vs):
    return np.interp(TT, ts, vs)


def bass2(m, dur, vel=0.9):
    """丸いベース+中域倍音(スマホのスピーカーでも輪郭が出るように)"""
    y = round_bass(m, dur, vel)
    n = len(y); t = np.arange(n) / SR; f = mtof(m)
    h = sum(a * np.sin(TAU * f * k * t) for k, a in ((3, .5), (4, .35), (5, .25), (6, .15), (8, .08)))
    h *= (0.25 + 0.75 * np.exp(-t * 5)) * held(n, dur, 0.04) * ar(n, 0.006, 0.02) * vel
    return y + 0.48 * h


def brush(seed=0, length=0.22):
    n = int(length * SR); t = np.arange(n) / SR
    y = bp(np.random.default_rng(900 + seed).standard_normal(n), 1800, 9000)
    y *= np.minimum(t / 0.012, 1.0) * np.exp(-t * 17)
    return y / np.max(np.abs(y))


def soft_hat(seed=0):
    n = int(0.05 * SR); t = np.arange(n) / SR
    y = hp(np.random.default_rng(700 + seed).standard_normal(n), 6000, 2) * np.exp(-t * 90)
    return y / np.max(np.abs(y)) * ar(n, 0.001, 0.01)


def chime(seed=0):
    """風鈴(ガラス): 非整数倍音の高いベルを2〜3打"""
    r = np.random.default_rng(40 + seed)
    n = int(2.6 * SR); t = np.arange(n) / SR; out = np.zeros((n, 2))
    f0 = 2350 * r.uniform(0.98, 1.02)
    for k, (dt, v) in enumerate(((0.0, 1.0), (0.17, 0.6), (0.41, 0.38))[: 3 if seed % 2 == 0 else 2] + ((0.33, 0.45),) * (seed % 2)):
        i = int(dt * SR); tt = t[: n - i]
        s = sum(a * np.sin(TAU * f0 * q * tt + r.uniform(0, TAU)) * np.exp(-tt * d)
                for q, a, d in ((1, 1, 3.2), (2.71, .5, 5.5), (1.52, .28, 4.5), (4.1, .22, 9), (5.4, .1, 14)))
        s *= np.minimum(tt / 0.0015, 1.0) * v
        pan = r.uniform(-0.4, 0.4)
        out[i:, 0] += s * np.cos((pan + 1) * np.pi / 4); out[i:, 1] += s * np.sin((pan + 1) * np.pi / 4)
    return out / np.max(np.abs(out))


def put(buf, sig, t, gain=1.0):
    i = int(round(t * SR)); n = min(len(sig), L - i)
    if n > 0:
        buf[i:i + n] += sig[:n] * gain


def waves(seed, period=6.5, hi=0.35):
    nz = np.random.default_rng(seed).standard_normal((L, 2))
    s1 = (0.5 + 0.5 * np.sin(TAU * TT / period - 1.2)) ** 2 * 0.8 + 0.2
    s2 = (0.5 + 0.5 * np.sin(TAU * TT / period - 0.5)) ** 4
    return lp(hp(nz, 180), 1100, 2) * s1[:, None] + bp(nz, 1800, 7000) * hi * s2[:, None]


def rain(seed):
    r = np.random.default_rng(seed)
    nz = r.standard_normal((L, 2))
    bed = bp(nz, 900, 9000) * 0.5 + hp(nz, 5000, 2) * 0.25 + lp(hp(nz, 200), 700) * 0.35
    bed *= (1 + 0.18 * np.sin(TAU * TT / 7.3) + 0.1 * np.sin(TAU * TT / 2.9 + 1))[:, None]
    drops = np.zeros((L, 2))
    nd = int(0.03 * SR); td = np.arange(nd) / SR
    for _ in range(1500):  # ランダムな粒(近くの雨だれ)
        f = r.uniform(1800, 6500); i = r.integers(0, L - nd)
        s = np.sin(TAU * f * td * (1 + 6 * td)) * np.exp(-td * r.uniform(150, 400)) * r.uniform(0.15, 1.0) ** 2
        p = r.uniform(-1, 1)
        drops[i:i + nd, 0] += s * np.cos((p + 1) * np.pi / 4); drops[i:i + nd, 1] += s * np.sin((p + 1) * np.pi / 4)
    return bed, drops


def crossing_bell(t0, t1):
    """踏切警報: 約650Hz+550Hzが重なる打鐘風、毎秒2回"""
    out = np.zeros(L); n = int(0.55 * SR); t = np.arange(n) / SR
    k = 0
    while t0 + k * 0.5 < t1 - 0.05:
        s = (np.sin(TAU * 650 * t) + 0.9 * np.sin(TAU * 550 * t) + 0.22 * np.sin(TAU * 1300 * t) * np.exp(-t * 6)
             + 0.18 * np.sin(TAU * 1650 * t) * np.exp(-t * 8) + 0.08 * np.sin(TAU * 2600 * t) * np.exp(-t * 14))
        s *= np.exp(-t * 7.5) * np.minimum(t / 0.002, 1.0) * ar(n, 0.001, 0.05)
        put(out, s, t0 + k * 0.5); k += 1
    return np.stack([out * 0.8, out], axis=1), k


def train(t0, t1):
    r = np.random.default_rng(77)
    nz = r.standard_normal((L, 2))
    e = env_pts([0, t0, t0 + 1.0, t1 - 1.0, t1, 60 + 4], [0, 0, 1, 1, 0, 0])
    rumble = lp(hp(nz, 35), 260, 2) * 1.0 + bp(nz, 300, 1800) * 0.34 + bp(nz, 2500, 6000) * 0.07
    rumble *= (1 + 0.15 * np.sin(TAU * 3.1 * TT))[:, None]
    clk = np.zeros(L); n = int(0.14 * SR); t = np.arange(n) / SR
    def thump(seed, v):
        q = np.random.default_rng(seed).standard_normal(n)
        return (lp(q, 420) * np.exp(-t * 30) * 2.2 + bp(q, 900, 3200) * np.exp(-t * 70) * 0.5
                + np.sin(TAU * 85 * t) * np.exp(-t * 26) * 1.2) * v
    tt = t0 + 0.3; k = 0
    while tt < t1:  # ガタン・ゴトン(台車ごとに2打ずつ)
        put(clk, thump(k, 1.0), tt); put(clk, thump(k + 50, 0.8), tt + 0.11)
        put(clk, thump(k + 99, 0.9), tt + 0.36); put(clk, thump(k + 150, 0.7), tt + 0.47)
        tt += 0.92; k += 1
    pan = env_pts([0, t0, t1, 64], [-0.5, -0.5, 0.5, 0.5])
    g = np.stack([np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)], axis=1)
    return (rumble * 0.55 + clk[:, None] * 0.5) * e[:, None] * g * 1.4


def birds(t_from, seed=5):
    r = np.random.default_rng(seed); out = np.zeros((L, 2)); times = []
    t = t_from + 0.6
    while t < 56.5:
        f0 = r.uniform(3000, 4800); nn = r.integers(2, 5); p = r.uniform(-0.8, 0.8); tt = t
        for _ in range(nn):
            d = r.uniform(0.05, 0.11); n = int(d * SR); x = np.arange(n) / SR
            f = f0 * (1 + r.uniform(-0.25, 0.35) * x / d) * (1 + 0.03 * np.sin(TAU * 38 * x))
            s = np.sin(TAU * np.cumsum(f) / SR) * np.sin(np.pi * x / d) ** 1.5 * r.uniform(0.5, 1.0)
            i = int(tt * SR)
            out[i:i + n, 0] += s * np.cos((p + 1) * np.pi / 4); out[i:i + n, 1] += s * np.sin((p + 1) * np.pi / 4)
            tt += d + r.uniform(0.02, 0.07)
        times.append(round(t, 2)); t += r.uniform(1.6, 4.2)
    return out, times


def wow(x, depth_ms=0.5, rate=0.45):
    """薄いテープ揺れ"""
    i = np.arange(len(x), dtype=float)
    d = (2.0 + depth_ms * np.sin(TAU * rate * i / SR) + 0.1 * np.sin(TAU * 6.3 * i / SR)) * SR / 1000.0
    return np.stack([np.interp(i - d, i, x[:, c], left=0) for c in (0, 1)], axis=1)


def hiss(seed, lvl=0.004):
    return hp(np.random.default_rng(seed).standard_normal((L, 2)), 3000) * lvl


def chord(mx, notes, t, dur, vel, roll=0.0, bright=0.8, sustain=1.0, rng=None):
    for i, m in enumerate(notes):
        v = vel * (rng.uniform(0.9, 1.0) if rng is not None else 1.0)
        mx.add('ep', ep_note(m, dur, v, bright, tine=0.32, sustain=sustain), t + i * roll + (0.008 * i if not roll else 0),
               0.85, (i - (len(notes) - 1) / 2) * 0.2)


def fit(m, lo=28, hi=47):
    while m < lo: m += 12
    while m > hi: m -= 12
    return m


# ================================================================= C1 夕暮れの海沿い
def build_c1():
    bpm = 84.0; beat = 60 / bpm; bar = 4 * beat
    mx = Mix(); rng = np.random.default_rng(84); T = lambda b, bt=0.0: b * bar + bt * beat
    CH = {'Abmaj7': ([56, 60, 63, 67], 32), 'Gm7': ([55, 58, 62, 65], 31), 'Fm9': ([53, 56, 60, 63, 67], 29),
          'Bbsus': ([56, 58, 63, 65], 34), 'Ebmaj9': ([55, 58, 62, 65], 39), 'Cm7': ([55, 58, 60, 63], 36)}
    P1 = [[('Abmaj7', 0, 4)], [('Gm7', 0, 4)], [('Fm9', 0, 4)], [('Bbsus', 0, 4)]]
    P2 = [[('Abmaj7', 0, 4)], [('Gm7', 0, 2), ('Cm7', 2, 2)], [('Fm9', 0, 2), ('Bbsus', 2, 2)], [('Ebmaj9', 0, 4)]]
    bars = [[('Abmaj7', 0, 4)], [('Bbsus', 0, 4)]] + P1 + P2 + P1 + P2 + [[('Bbsus', 0, 4)], [('Ebmaj9', 0, 4)], [('Ebmaj9', 0, 4)]]
    assert len(bars) == 21
    kk, rim = kick(soft=True), rimshot()
    for b in range(21):
        intro, outro = b < 2, b >= 19
        for (nm, st, ln) in bars[b]:
            notes, root = CH[nm]
            if outro:
                if b == 19:
                    chord(mx, [39, 46] + notes + [70], T(b), 7.5 * beat, 0.62, roll=0.17, bright=0.6, sustain=0.5)
                    mx.add('bass', bass2(27 + 12, 6.5 * beat, 0.8), T(b), 1.0, 0)
                continue
            if intro:
                chord(mx, notes, T(b), 3.7 * beat, 0.55, roll=0.14, bright=0.55, sustain=0.7)
                mx.add('ep', ep_note(notes[-1] + 12, 1.5 * beat, 0.4, 0.5, tine=0.3), T(b, 2.5), 0.8, 0.3)
                continue
            hits = [(0, 2.4, 0.66), (2.5, 1.3, 0.48)] if ln == 4 else [(0, 1.8, 0.62)]
            for (bt, d, v) in hits:
                chord(mx, notes, T(b, st + bt), d * beat, v, bright=1.0, sustain=1.0, rng=rng)
            r = root
            if ln == 4:
                nxt = CH[bars[b + 1][0][0]][1] if b + 1 < 21 else 39
                seq = [(0, r, 1.4), (2.5, r + 7, 0.9), (3.5, nxt - 2 if b % 2 else nxt + 2, 0.45)]
            else:
                seq = [(0, r, 1.6)]
            for (bt, m, d) in seq:
                mx.add('bass', bass2(fit(m), d * beat, 0.85), T(b, st + bt), 1.0, 0)
        if not intro and not outro:
            mx.add('kick', kk, T(b, 0), 0.7, 0); mx.add('kick', kk, T(b, 2.5), 0.45, 0)
            mx.add('rim', rim, T(b, 1), 0.6, -0.2); mx.add('rim', rim, T(b, 3), 0.7, -0.2)
            if b >= 6:
                mx.add('brush', brush(b), T(b, 1), 0.5, 0.2); mx.add('brush', brush(b + 30), T(b, 3), 0.6, 0.2)
                for s in range(8):
                    mx.add('hat', soft_hat(s + b), T(b, s / 2), (0.5 if s % 2 == 0 else 0.3) * rng.uniform(0.8, 1), 0.35)
    mel = {10: [(0, 79, 1.5), (2, 75, 1), (3, 77, 1)], 11: [(0, 74, 2.5), (3, 72, .5), (3.5, 74, .5)],
           12: [(0, 75, 1.5), (1.5, 72, .5), (2, 79, 2)], 13: [(0, 77, 3)],
           14: [(0.5, 79, .5), (1, 82, 1.5), (2.5, 79, .5), (3, 75, 1)], 15: [(0, 77, 2), (2, 75, 1), (3, 72, 1)],
           16: [(0, 72, 1), (1, 75, 1), (2, 77, 2)], 17: [(0, 79, 3.5)], 18: [(1, 77, 1), (2, 75, 1), (3, 72, 1)],
           19: [(0, 74, 4)]}
    for b, ns in mel.items():
        for (bt, m, d) in ns:
            mx.add('vibe', vibe_note(m, d * beat, 0.75 if bt % 1 == 0 else 0.6), T(b, bt), 1.0, 0.12)
    ch = np.zeros((L, 2)); CT = [6.0, 19.5, 33.0, 47.0]
    for i, t in enumerate(CT):
        put(ch, chime(i), t)
    ir = make_ir(2.4, 2.4, 21, 220, 7500)
    ep = chorus(autopan(mx.get('ep'), 4.2, 0.35), 2.5, 12, 0.5, 0.45)
    vibe = mx.get('vibe'); vibe = vibe + echo(vibe, beat * 1.5, 0.22, 2, 3500)
    wet = reverb(ep * 0.4 + vibe * 0.55 + mx.get('rim') * 0.35 + mx.get('brush') * 0.3 + ch * 0.7, ir)
    wv = waves(3, 6.5) * env_pts([0, 5, 10, 54, 57, 64], [0.9, 0.75, 0.42, 0.42, 0.8, 0.8])[:, None]
    music = (mx.get('kick') * 0.34 + mx.get('rim') * 0.36 + mx.get('brush') * 0.36 + mx.get('hat') * 0.26
             + mx.get('bass') * 0.42 + ep * 0.58 + vibe * 0.54)
    music = hp(music + bp(music, 1000, 2200, 1) * 1.0, 45, 2)  # 1-2kHzの谷を埋め、超低域を整理
    out = wow(music) + wet * 0.55 + wv * 0.30 + ch * 0.22 + hiss(1, 0.005)
    sec = [('intro', 0), ('A1', 2), ('A2+brush', 6), ('B+vibe', 10), ('B2', 14), ('turn', 18), ('outro', 19)]
    return out, bpm, sec, dict(chime=CT)


# ================================================================= C2 雨の夜の踏切
def build_c2():
    bpm = 72.0; beat = 60 / bpm; bar = 4 * beat
    mx = Mix(); rng = np.random.default_rng(72); T = lambda b, bt=0.0: b * bar + bt * beat
    CH = {'Dm9': ([53, 57, 60, 64], 38), 'Bbmaj7': ([53, 57, 58, 62], 34), 'Gm9': ([53, 57, 58, 62], 43),
          'C9sus': ([53, 58, 60, 62], 36), 'Fmaj9': ([52, 55, 57, 60], 41), 'Am7': ([55, 57, 60, 64], 33)}
    seq = ['Dm9', 'Bbmaj7', 'Gm9', 'C9sus', 'Dm9', 'Bbmaj7', 'Gm9', 'Am7', 'Dm9', 'Bbmaj7',
           'Gm9', 'C9sus', 'Fmaj9', 'Dm9', 'Bbmaj7', 'C9sus', 'Dm9', 'Dm9']
    assert len(seq) == 18
    kk = kick(soft=True)
    for b, nm in enumerate(seq):
        notes, root = CH[nm]
        tr = 4 <= b <= 8
        if b == 16:
            chord(mx, [38, 45] + notes + [69], T(b), 7.5 * beat, 0.6, roll=0.2, bright=0.55, sustain=0.45)
            mx.add('bass', bass2(38, 6.5 * beat, 0.75), T(b), 1.0, 0)
        if b >= 16:
            continue
        if b < 2 or tr:
            chord(mx, notes, T(b), 3.8 * beat, 0.5, roll=0.16, bright=0.8, sustain=0.6)
            if b % 2 == 1:
                mx.add('ep', ep_note(notes[-1] + 12, 1.6 * beat, 0.36, 0.5, tine=0.3), T(b, 2.5), 0.8, 0.3)
        else:
            chord(mx, notes, T(b), 2.6 * beat, 0.6, bright=0.95, sustain=0.9, rng=rng)
            chord(mx, notes[1:], T(b, 2.5), 1.3 * beat, 0.42, bright=0.7, sustain=1.0, rng=rng)
            nxt = CH[seq[b + 1]][1]
            for (bt, m, d) in [(0, root, 1.8), (2.5, root + 7, 1.0)] + ([(3.5, nxt + 2, 0.45)] if b % 2 else []):
                mx.add('bass', bass2(fit(m, 29, 48), d * beat, 0.8), T(b, bt), 1.0, 0)
        if 10 <= b < 16:
            mx.add('kick', kk, T(b, 0), 0.5, 0)
            mx.add('brush', brush(b, 0.3), T(b, 1), 0.5, 0.2); mx.add('brush', brush(b + 30, 0.3), T(b, 3), 0.6, -0.1)
    mel = {10: [(0, 74, 2), (2.5, 77, 1.5)], 11: [(0, 79, 3)], 12: [(0, 81, 1.5), (1.5, 79, .5), (2, 76, 2)],
           13: [(0, 77, 2), (2, 74, 2)], 14: [(0, 74, 1), (1, 77, 1), (2, 81, 2)], 15: [(0, 79, 2), (2, 76, 2)],
           16: [(1.5, 76, 4)]}
    for b, ns in mel.items():
        for (bt, m, d) in ns:
            mx.add('lead', ep_note(m, d * beat, 0.66, 1.25, tine=0.5, sustain=0.9), T(b, bt), 1.0, 0.1)
    bell, nb = crossing_bell(6.0, 33.0)
    trn = train(13.5, 30.5)
    bed, drops = rain(9)
    ir = make_ir(2.8, 2.1, 31, 200, 7000)
    ep = chorus(autopan(mx.get('ep'), 3.6, 0.3), 2.5, 12, 0.45, 0.45)
    lead = mx.get('lead'); lead = lead + echo(lead, beat * 1.5, 0.28, 3, 3200)
    duck = env_pts([0, 13.3, 14.5, 29.5, 31.0, 64], [1, 1, 0.6, 0.6, 1, 1])[:, None]
    wet = reverb(ep * 0.45 + lead * 0.6 + mx.get('brush') * 0.3 + bell * 0.22 + trn * 0.08, ir)
    music = (mx.get('kick') * 0.30 + mx.get('brush') * 0.36 + mx.get('bass') * 0.42 + ep * 0.60 + lead * 0.56) * duck
    rl = env_pts([0, 3, 54, 58, 64], [0.9, 0.75, 0.75, 0.95, 0.95])[:, None]
    out = wow(music, 0.6, 0.38) + wet * 0.6 + (bed * 0.13 + drops * 0.15) * rl + bell * 0.085 + trn * 0.95 + hiss(2, 0.003)
    sec = [('intro', 0), ('bass in', 2), ('train', 4), ('return', 9), ('melody', 10), ('outro', 16)]
    return out, bpm, sec, dict(bell=(6.0, 6.0 + (nb - 1) * 0.5), bell_count=nb, train=(13.5, 30.5))


# ================================================================= C3 夜明けの干潟
def build_c3():
    bpm = 80.0; beat = 60 / bpm; bar = 4 * beat
    mx = Mix(); rng = np.random.default_rng(80); T = lambda b, bt=0.0: b * bar + bt * beat
    CH = {'Dmaj9': ([54, 57, 61, 64], 38), 'C#m7': ([56, 59, 61, 64], 37), 'Bm9': ([57, 61, 62, 66], 35),
          'E9sus': ([57, 59, 62, 66], 40), 'Amaj9': ([56, 59, 61, 64], 33), 'F#m7': ([52, 57, 61, 64], 42)}
    P1 = [[('Dmaj9', 0, 4)], [('C#m7', 0, 4)], [('Bm9', 0, 4)], [('E9sus', 0, 4)]]
    P2 = [[('Dmaj9', 0, 4)], [('C#m7', 0, 2), ('F#m7', 2, 2)], [('Bm9', 0, 2), ('E9sus', 2, 2)], [('Amaj9', 0, 4)]]
    bars = P1 + P2 + P1 + P2 + [[('Dmaj9', 0, 4)], [('E9sus', 0, 4)], [('Amaj9', 0, 4)], [('Amaj9', 0, 4)]]
    assert len(bars) == 20
    kk, rim = kick(soft=True), rimshot()
    padbuf = mx.get('pad')
    for b in range(20):
        outro = b >= 18
        for (nm, st, ln) in bars[b]:
            notes, root = CH[nm]
            if outro:
                if b == 18:
                    chord(mx, [33, 45] + notes + [71], T(b), 7.5 * beat, 0.6, roll=0.18, bright=0.6, sustain=0.45)
                    mx.add('bass', bass2(33, 6.5 * beat, 0.8), T(b), 1.0, 0)
                    p = pad_chord([n + 12 for n in notes] + [45], 6.5 * beat, 2200, seed=b); padbuf[int(T(b) * SR):int(T(b) * SR) + len(p)] += p * 0.8
                continue
            p = pad_chord([n + 12 for n in notes[1:]] + [notes[0]], ln * beat, 1300 + 120 * b, seed=b)  # 夜明けに向けて少しずつ明るく
            i0 = int(T(b, st) * SR); padbuf[i0:i0 + len(p)] += p * (0.7 if b >= 16 else 1.0)
            # エレピのアルペジオ(8分)
            arp = [notes[0], notes[2], notes[3], notes[1] + 12, notes[3], notes[2], notes[0] + 12, notes[2]]
            thin = b >= 16
            for s in range(int(ln * 2)):
                if thin and s % 2:
                    continue
                v = (0.52 if s % 4 == 0 else 0.38) * rng.uniform(0.88, 1.0) * (0.8 if b < 4 else 1.0)
                mx.add('ep', ep_note(arp[s % 8] + 12, 1.4 * beat, v, 0.95, tine=0.45, sustain=1.6), T(b, st + s / 2), 0.85,
                       0.45 * np.sin(s * 1.3))
            if b >= 4:
                if ln == 4:
                    nxt = CH[bars[b + 1][0][0]][1]
                    sq = [(0, root, 1.8), (2.5, root + 7, 0.9)] + ([(3.5, nxt + 2, 0.45)] if b % 2 else [])
                else:
                    sq = [(0, root, 1.7)]
                for (bt, m, d) in sq:
                    mx.add('bass', bass2(fit(m, 30, 49), d * beat, 0.82), T(b, st + bt), 1.0, 0)
        if 8 <= b < 16:
            mx.add('kick', kk, T(b, 0), 0.6, 0); mx.add('kick', kk, T(b, 2.5), 0.4, 0)
            mx.add('rim', rim, T(b, 1), 0.5, -0.2); mx.add('rim', rim, T(b, 3), 0.6, -0.2)
            mx.add('brush', brush(b), T(b, 1), 0.4, 0.2); mx.add('brush', brush(b + 30), T(b, 3), 0.5, 0.2)
            for s in range(8):
                mx.add('hat', soft_hat(s + b), T(b, s / 2), (0.45 if s % 2 == 0 else 0.28) * rng.uniform(0.8, 1), 0.35)
    mel = {8: [(0, 76, 1.5), (1.5, 78, .5), (2, 81, 2)], 9: [(0, 76, 2), (2, 73, 1), (3, 76, 1)],
           10: [(0, 78, 1.5), (1.5, 76, .5), (2, 73, 2)], 11: [(0, 71, 3), (3, 73, 1)],
           12: [(0, 73, 1), (1, 76, 1), (2, 78, 1.5), (3.5, 81, .5)], 13: [(0, 83, 2), (2, 81, 1), (3, 78, 1)],
           14: [(0, 76, 1.5), (1.5, 78, .5), (2, 76, 1), (3, 71, 1)], 15: [(0, 73, 3.5)],
           16: [(1, 78, 1), (2, 76, 2)], 17: [(0, 71, 3)], 18: [(0, 73, 4)]}
    for b, ns in mel.items():
        for (bt, m, d) in ns:
            mx.add('vibe', vibe_note(m, d * beat, 0.72 if bt % 1 == 0 else 0.58), T(b, bt), 1.0, 0.1)
    bd, bt_ = birds(30.0)
    ir = make_ir(3.0, 2.0, 41, 220, 8000)
    ep = chorus(mx.get('ep'), 2.5, 12, 0.5, 0.45)
    pad = chorus(mx.get('pad'), 4.0, 17, 0.25, 0.5)
    vibe = mx.get('vibe'); vibe = vibe + echo(vibe, beat * 1.5, 0.24, 2, 3600)
    wet = reverb(ep * 0.45 + pad * 0.5 + vibe * 0.6 + mx.get('rim') * 0.3 + mx.get('brush') * 0.3 + bd * 0.6, ir)
    wv = waves(13, 8.0, 0.3) * env_pts([0, 6, 12, 52, 57, 64], [0.85, 0.7, 0.4, 0.4, 0.75, 0.75])[:, None]
    bright = env_pts([0, 60, 64], [0.15, 0.7, 0.7])[:, None]
    music = (mx.get('kick') * 0.32 + mx.get('rim') * 0.32 + mx.get('brush') * 0.34 + mx.get('hat') * 0.24
             + mx.get('bass') * 0.42 + ep * 0.54 + pad * 0.48 + vibe * 0.54)
    music = music + hp(music, 3500, 1) * bright
    out = wow(music, 0.4, 0.4) + wet * 0.6 + wv * 0.28 + bd * 0.06 + hiss(3, 0.004)
    sec = [('pad+arp', 0), ('bass', 4), ('drums+mel', 8), ('mel2', 12), ('thin', 16), ('outro', 18)]
    return out, bpm, sec, dict(birds=bt_)


# ================================================================= 検証
def band_db(y, lo, hi):
    m = y.mean(axis=1)
    x = bp(m, lo, hi, 4) if lo > 0 else lp(m, hi, 4)
    return 10 * np.log10(np.mean(x ** 2) + 1e-20)


def env_of(y, lo, hi, win=0.02):
    from scipy.ndimage import uniform_filter1d
    return np.sqrt(np.maximum(uniform_filter1d(bp(y.mean(axis=1), lo, hi, 4) ** 2, int(win * SR)), 0))


def verify(name, y, bpm, sec, ev):
    bar = 240 / bpm; nb = int(round(60 / bar))
    print(f'--- {name}: samples={len(y)} dur={len(y) / SR:.6f}s DC={y.mean(axis=0)} max|x|={np.abs(y).max():.4f} '
          f'head={np.abs(y[:8]).max():.5f} tail100ms={np.abs(y[-int(.1 * SR):]).max():.6f}')
    for i, (nm, b0) in enumerate(sec):
        b1 = sec[i + 1][1] if i + 1 < len(sec) else nb
        seg = y[int(b0 * bar * SR):int(b1 * bar * SR)]
        print(f'    {nm:10s} bars {b0:2d}-{b1 - 1:2d} t={b0 * bar:6.3f}-{b1 * bar:6.3f}s rms={20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12):6.2f} dBFS')
    lo, mid, pres, hi = band_db(y, 0, 120), band_db(y, 120, 2000), band_db(y, 2000, 8000), 10 * np.log10(np.mean(hp(y.mean(axis=1), 6000, 4) ** 2) + 1e-20)
    print(f'  bands dB: <120Hz={lo:.1f} 120-2k={mid:.1f} 2-8k={pres:.1f} >6k={hi:.1f}  (<120 minus >6k = {lo - hi:.1f} dB)')
    if 'chime' in ev:
        e = env_of(y, 2200, 2500, 0.01); ref = np.median(e)
        for t in ev['chime']:
            w = e[int((t - 0.5) * SR):int((t + 0.8) * SR)]; thr = ref + 0.35 * (w.max() - ref)
            on = t - 0.5 + np.argmax(w > thr) / SR
            print(f'  chime target {t:5.2f}s -> onset {on:6.3f}s  peak/median={w.max() / ref:.1f}')
    if 'bell' in ev:
        e = env_of(y, 630, 670, 0.05)
        q = lambda a, b: 20 * np.log10(e[int(a * SR):int(b * SR)].mean() + 1e-12)
        print(f'  bell band(650Hz) dB: 2-5.8s={q(2, 5.8):.1f} | 6-13s={q(6, 13):.1f} | 14.5-29.5s={q(14.5, 29.5):.1f} | 30.5-33s={q(30.5, 33):.1f} | 34-40s={q(34, 40):.1f}  count={ev["bell_count"]} last strike={ev["bell"][1]}s')
        e2 = env_of(y, 630, 670, 0.004); w = e2[int(5.5 * SR):int(6.5 * SR)]
        print(f'  bell first onset ~ {5.5 + np.argmax(w > 0.5 * w.max()) / SR:.3f}s')
        from scipy.ndimage import uniform_filter1d
        r = np.sqrt(uniform_filter1d(lp(y.mean(axis=1), 110, 4) ** 2, int(0.5 * SR)))
        print('  train rumble(<110Hz) dB @t: ' + ' '.join(f'{t}s={20 * np.log10(r[int(t * SR)] + 1e-12):.0f}' for t in (12, 13.5, 14.5, 22, 29.5, 30.5, 32, 45)))
    if 'birds' in ev:
        e = env_of(y, 3000, 5500, 0.05); q = lambda a, b: 20 * np.log10(e[int(a * SR):int(b * SR)].mean() + 1e-12)
        print(f'  bird band(3-5.5k) dB: 10-28s={q(10, 28):.1f} 31-56s={q(31, 56):.1f}; chirp times={ev["birds"]}')
    png = os.path.join(HERE, f'spec_{name[-2:]}.png')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(HERE, name + '.wav'), '-lavfi',
                    'showspectrumpic=s=1500x520:legend=1:scale=log:fscale=log:start=30:stop=16000', png])


if __name__ == '__main__':
    B = {'c1': (build_c1, -15.0, 4.2, 1.3), 'c2': (build_c2, -16.0, 4.5, 1.3), 'c3': (build_c3, -15.0, 4.5, 1.4)}
    for w in (sys.argv[1:] or list(B)):
        fn, target, fo, shelf = B[w]
        out, bpm, sec, ev = fn()
        y, I, pk, lra = master(out, os.path.join(HERE, f'track_{w}.wav'), fade_out=fo, target=target, shelf=shelf)
        if pk > -1.7:  # 真のピークを -1.5 dB 以下に確実に収める
            from scipy.io import wavfile
            y = y * 10 ** ((-1.8 - pk) / 20)
            wavfile.write(os.path.join(HERE, f'track_{w}.wav'), SR, np.round(y * 32767).astype(np.int16))
            I, pk, lra = M.measure(os.path.join(HERE, f'track_{w}.wav'))
        print(f'=== track_{w}: I={I} LUFS truepeak={pk} dBFS LRA={lra} LU')
        verify(f'track_{w}', y, bpm, sec, ev)
