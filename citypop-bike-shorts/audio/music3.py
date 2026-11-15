#!/usr/bin/env python3
"""第3弾BGM 3曲(完全オリジナル)。music.py / music2.py の音源とミックスを再利用する。
  python3 audio/music3.py [d1 d2 d3]
  d1: 青空のリゾート 104BPM 26小節 / d2: 夕暮れの湾岸 120BPM 30小節(20s,40sで転換)
  d3: 夜の峠 128BPM 32小節(15.0, 26.25, 41.25, 52.5s で転換)   各60.000秒
"""
import os, sys
import numpy as np
from scipy.io import wavfile
import music as M
from music import (SR, N, HERE, Mix, hp, bp, ep_note, slap_bass, kick, snare_gated, snare_soft, rimshot, hat, shaker,
                   clap, tom, crash, ks_pluck, lead_note, vibe_note, pad_chord, chorus, make_ir, reverb, echo, autopan, master)
from music2 import bass2, chord, fit, band_db, hiss

CH = {  # 和音名: (ボイシング, ベースの根音)
    'Fmaj7': ([57, 60, 64, 65], 41), 'Em7': ([55, 59, 62, 64], 40), 'Dm7': ([57, 60, 62, 65], 38), 'Gsus': ([55, 60, 62, 65], 43),
    'G7': ([55, 59, 62, 65], 43), 'Am7': ([55, 57, 60, 64], 45), 'Cmaj9': ([55, 59, 62, 64], 36), 'Cmaj7': ([55, 59, 60, 64], 36),
    'Gmaj7': ([55, 59, 62, 66], 43), 'F#m7': ([57, 61, 64, 66], 42), 'A7sus': ([57, 62, 64, 67], 45), 'Bm7': ([57, 59, 62, 66], 47),
    'Dmaj9': ([57, 61, 64, 66], 38), 'D69': ([57, 59, 62, 66], 38), 'Em9': ([54, 55, 59, 62], 40),
}


def padd(mx, sig, t, gain):
    """ステレオのパッドをバスへ直接加算する"""
    buf = mx.get('pad'); i = int(round(t * SR)); n = min(len(sig), len(buf) - i)
    if n > 0:
        buf[i:i + n] += sig[:n] * gain


def drums(mx, T, b, rng, kicks, snares, sn, hats16=False, hat_gain=1.0, open_last=True):
    kk = kick()
    for bt, g in kicks:
        mx.add('kick', kk, T(b, bt), g, 0)
    for bt, g in snares:
        mx.add('snare', sn, T(b, bt), g, 0.05)
    n = 16 if hats16 else 8
    for s in range(n):
        bt = s * 4 / n
        acc = (0.55 if s % (n // 4) == 0 else 0.34 if s % (n // 8) == 0 else 0.22) * rng.uniform(0.85, 1) * hat_gain
        op = open_last and s == n - (n // 8)
        mx.add('hat', hat(op, seed=s + b * 16), T(b, bt), acc * (0.8 if op else 1), 0.3)


def fill(mx, T, b):
    for i, f0 in enumerate((190, 160, 130, 100)):
        mx.add('tom', tom(f0), T(b, 3 + i * 0.25), 0.75 + 0.05 * i, (-0.5, -0.2, 0.2, 0.5)[i])


def guitar(mx, T, b, notes, steps, rng):
    for s in steps:
        for j, m in enumerate(notes[1:]):
            mx.add('gtr', ks_pluck(m + 12, 0.055 if s % 4 else 0.08, rng.uniform(0.6, 0.9), seed=s + j + b),
                   T(b, s / 4) + j * 0.004, 0.8, 0.45)


def finish(mx, beat, lead_bus, ep_g=0.42, extra=0.0, air=0.9, dr=1.0):
    ir = make_ir(1.8, 3.4, 9)
    ep = chorus(autopan(mx.get('ep'), 4.4, 0.3), 3.0, 13, 0.55, 0.5)
    gtr = chorus(mx.get('gtr'), 1.5, 9, 0.9, 0.3)
    pad = chorus(mx.get('pad'), 4.0, 16, 0.3, 0.5)
    lead = mx.get(lead_bus); lead = lead + echo(lead, beat * 0.75, 0.28, 3)
    dw = mx.get('snare') * 0.22 + mx.get('clap') * 0.45 + mx.get('tom') * 0.4 + mx.get('crash') * 0.5
    wet = reverb(ep * 0.30 + gtr * 0.25 + pad * 0.5 + lead * 0.45 + dw, ir)
    music = (mx.get('kick') * 0.74 * dr + mx.get('snare') * 0.62 * dr + mx.get('clap') * 0.34 + mx.get('hat') * 0.50 + mx.get('shk') * 0.4
             + mx.get('tom') * 0.5 + mx.get('crash') * 0.28 + mx.get('bass') * 0.50 + ep * ep_g + gtr * 0.50
             + pad * 0.38 + lead * 0.42 + wet * 0.5)
    music = hp(music + bp(music, 1000, 2400, 1) * 0.7 + hp(music, 5500, 1) * air, 40, 2)   # 1-2kHzと高域を足してスマホでの抜けを確保
    return music + hiss(3, 0.003) + extra


# ================================================================= D1 青空のリゾート
def build_d1():
    bpm = 104.0; beat = 60 / bpm; bar = 4 * beat; NB = 26
    mx = Mix(); rng = np.random.default_rng(104); T = lambda b, bt=0.0: b * bar + bt * beat
    P1 = ['Fmaj7', 'Em7', 'Dm7', 'Gsus']; P2 = ['Fmaj7', 'Em7', 'Dm7', 'Cmaj9']
    bars = ['Fmaj7', 'Gsus'] + P1 + P2 + P1 + P2 + P1 + ['Dm7', 'Gsus', 'Cmaj9', 'Cmaj9']
    assert len(bars) == NB
    for b in range(NB):
        notes, root = CH[bars[b]]
        if b >= 24:
            if b == 24:
                chord(mx, [48, 55] + notes + [74], T(b), 7.5 * beat, 0.62, roll=0.13, bright=0.7, sustain=0.6)
                mx.add('bass', bass2(36, 6.5 * beat, 0.8), T(b), 1.0, 0)
                mx.add('crash', crash(2.6, True), T(b), 0.4, 0.2)
            continue
        if b < 2:
            chord(mx, notes, T(b), 3.6 * beat, 0.55, roll=0.11, bright=0.7, sustain=0.8)
            mx.add('shk', shaker(b), T(b, 2), 0.5, 0.3); mx.add('shk', shaker(b + 9), T(b, 3), 0.5, 0.3)
            continue
        for bt, d, v in ((0, 1.4, 0.62), (1.5, 0.9, 0.46), (2.5, 1.3, 0.52)):
            chord(mx, notes, T(b, bt), d * beat, v, bright=1.0, sustain=1.0, rng=rng)
        nxt = CH[bars[b + 1]][1]
        for bt, m, d in ((0, root, 1.3), (1.5, root, 0.4), (2.5, root + 7, 0.8), (3.5, nxt - 2 if b % 2 else nxt + 2, 0.4)):
            mx.add('bass', bass2(fit(m), d * beat, 0.85), T(b, bt), 1.0, 0)
        drums(mx, T, b, rng, [(0, 0.8), (2.5, 0.55)], [(1, 0.6), (3, 0.7)], rimshot() if b < 10 else snare_soft(),
              hat_gain=0.9, open_last=b % 2 == 1)
        if b >= 6:
            guitar(mx, T, b, notes, (2, 3, 6, 10, 11, 14), rng)
        if b in (9, 17):
            mx.add('tom', tom(150, True), T(b, 3.5), 0.5, 0.3); mx.add('tom', tom(110, True), T(b, 3.75), 0.6, -0.3)
    mel = {10: [(0, 76, 1), (1, 79, .5), (1.5, 81, 1.5), (3, 79, 1)], 11: [(0, 76, 2), (2.5, 74, .5), (3, 72, 1)],
           12: [(0, 74, 1), (1, 77, 1), (2, 81, 1.5), (3.5, 79, .5)], 13: [(0, 79, 3)],
           14: [(0.5, 81, .5), (1, 84, 1.5), (2.5, 81, .5), (3, 79, 1)], 15: [(0, 76, 1.5), (1.5, 74, .5), (2, 79, 2)],
           16: [(0, 77, 1), (1, 74, 1), (2, 72, 1), (3, 74, 1)], 17: [(0, 76, 3.5)],
           18: [(1, 79, .5), (1.5, 81, 1), (2.5, 84, 1.5)], 19: [(0, 83, 1.5), (1.5, 79, 2)],
           20: [(0.5, 77, .5), (1, 81, 1), (2, 77, 1), (3, 74, 1)], 21: [(0, 74, 1), (1, 72, 2.5)],
           22: [(0, 74, 1), (1, 77, 1), (2, 81, 2)], 23: [(0, 79, 1.5), (1.5, 74, .5), (2, 76, 2)], 24: [(0, 76, 4)]}
    for b, ns in mel.items():
        for bt, m, d in ns:
            mx.add('vibe', vibe_note(m, d * beat, 0.78 if bt % 1 == 0 else 0.62), T(b, bt), 1.0, 0.12)
    sec = [('intro', 0), ('A', 2), ('A+gtr', 6), ('B+vibe', 10), ('B2', 14), ("A'", 18), ('turn', 22), ('outro', 24)]
    return finish(mx, beat, 'vibe', ep_g=0.62, dr=0.5), bpm, sec   # 打楽器の山を下げ、リミッターで全体が沈むのを防ぐ


# ================================================================= D2 夕暮れの湾岸
def build_d2():
    bpm = 120.0; beat = 60 / bpm; bar = 4 * beat; NB = 30
    mx = Mix(); rng = np.random.default_rng(120); T = lambda b, bt=0.0: b * bar + bt * beat
    P = ['Gmaj7', 'F#m7', 'Em7', 'A7sus']; Q = ['Bm7', 'Em7', 'A7sus', 'Dmaj9']
    bars = P + P + ['Em7', 'A7sus'] + P + Q + ['Gmaj7', 'A7sus'] + P + P + ['Dmaj9', 'Dmaj9']
    assert len(bars) == NB
    sn_s, sn_g, cl = snare_soft(), snare_gated(), clap()
    for b in range(NB):
        notes, root = CH[bars[b]]; s2 = 10 <= b < 20; s3 = b >= 20
        if b >= 28:
            if b == 28:
                chord(mx, [50, 57] + notes + [74], T(b), 7.5 * beat, 0.65, roll=0.1, bright=0.8, sustain=0.6)
                mx.add('bass', slap_bass(38, 6.5 * beat, 0.85), T(b), 1.0, 0)
                mx.add('crash', crash(2.6, True), T(b), 0.45, -0.2)
            continue
        for bt, d, v in ((0, 0.9, 0.62), (1.5, 0.5, 0.48), (2.5, 0.9, 0.55), (3.5, 0.4, 0.42)) if not s3 else ((0, 2.2, 0.58), (2.5, 1.2, 0.46)):
            chord(mx, notes, T(b, bt), d * beat, v, bright=1.1, sustain=1.0, rng=rng)
        if b >= 2:
            nxt = CH[bars[b + 1]][1]
            pat = ((0, root, .45, 0), (0.75, root + 12, .2, 1), (1.5, root, .45, 0), (2.25, root + 7, .2, 1), (2.5, root, .4, 0),
                   (3, root + 12, .2, 1), (3.5, nxt - 1, .4, 0)) if not s3 else ((0, root, 1.3, 0), (2.5, root + 7, .7, 0), (3.5, nxt - 2, .4, 0))
            for bt, m, d, pop in pat:
                mx.add('bass', slap_bass(fit(m, 33, 52) if pop else fit(m), d * beat, 0.75 if pop else 0.9, bool(pop)), T(b, bt), 1.0, 0)
            drums(mx, T, b, rng, [(0, 0.85), (2, 0.8)] + ([(1.5, 0.45)] if not s3 else []) + ([(3.5, 0.4)] if s2 else []),
                  [(1, 0.7), (3, 0.78)], sn_g if s2 else sn_s, hat_gain=1.0 if not s3 else 0.75)
            if s2:
                mx.add('clap', cl, T(b, 1), 0.5, -0.1); mx.add('clap', cl, T(b, 3), 0.58, -0.1)
            if not s3 or b < 24:
                guitar(mx, T, b, notes, (1, 2, 5, 7, 9, 10, 13, 15) if not s3 else (2, 6, 10, 14), rng)
        else:
            for s in range(8):
                mx.add('hat', hat(False, seed=s + b), T(b, s / 2), 0.3 + 0.2 * (s % 2 == 0), 0.3)
        if b in (9, 19):
            fill(mx, T, b)
        if b in (10, 20):
            mx.add('crash', crash(), T(b), 0.6, -0.25)
        if s2:
            padd(mx, pad_chord(notes, bar * 0.98, 1500, seed=b), T(b), 0.28)
    mel = {10: [(0, 78, .75), (0.75, 81, .75), (1.5, 83, 1.5), (3.5, 81, .5)], 11: [(0, 81, 1.5), (2, 78, .5), (2.5, 76, 1)],
           12: [(0, 76, .75), (0.75, 79, .75), (1.5, 83, 2)], 13: [(0, 81, 1), (1.5, 79, .5), (2, 76, 1.5)],
           14: [(0, 78, .5), (0.5, 81, .5), (1, 86, 1.5), (3, 83, 1)], 15: [(0, 83, 1), (1, 79, 1), (2.5, 76, 1)],
           16: [(0, 79, .75), (0.75, 81, .75), (1.5, 85, 1.5), (3.5, 83, .5)], 17: [(0, 81, 3)],
           18: [(0.5, 83, .5), (1, 86, 1), (2, 83, .5), (2.5, 81, .5), (3, 78, 1)], 19: [(0, 79, 1), (1, 76, 1.5)]}
    for b, ns in mel.items():
        for bt, m, d in ns:
            for dm, g in ((0, 0.6), (-12, 0.32), (7, 0.12)):   # オクターブ下と5度を重ねてブラス風に
                mx.add('lead', lead_note(m + dm, d * beat * 0.92, 0.82), T(b, bt), g, -0.05)
    for b, ns in {22: [(0, 78, 2), (2.5, 76, 1)], 23: [(0, 74, 3)], 26: [(0, 79, 1.5), (2, 76, 1.5)], 27: [(0, 76, 1), (1, 74, 2.5)], 28: [(0, 78, 4)]}.items():
        for bt, m, d in ns:
            mx.add('lead', vibe_note(m, d * beat, 0.7), T(b, bt), 0.9, 0.12)
    sec = [('intro', 0), ('groove', 2), ('bright(20.0s)', 10), ('calm(40.0s)', 20), ('outro', 28)]
    return finish(mx, beat, 'lead'), bpm, sec


# ================================================================= D3 夜の峠
def build_d3():
    bpm = 128.0; beat = 60 / bpm; bar = 4 * beat; NB = 32
    mx = Mix(); rng = np.random.default_rng(128); T = lambda b, bt=0.0: b * bar + bt * beat
    PA = ['Cmaj7', 'D69', 'Em7', 'Em7']; PB = ['Am7', 'Bm7', 'Cmaj7', 'D69']
    bars = PA + PA + PA + ['Cmaj7', 'D69'] + PB + PB + PA + ['Cmaj7', 'D69'] + ['Em9'] * 4
    assert len(bars) == NB
    sn = snare_gated()
    for b in range(NB):
        notes, root = CH[bars[b]]; peak = 22 <= b < 28
        if b >= 28:
            if b == 28:
                chord(mx, [40, 47] + notes + [71], T(b), 11 * beat, 0.65, roll=0.08, bright=0.8, sustain=0.5)
                mx.add('bass', slap_bass(28, 9 * beat, 0.85), T(b), 1.0, 0)
                mx.add('crash', crash(3.0), T(b), 0.6, 0.2)
                padd(mx, pad_chord(notes, bar * 3.2, 1100, seed=b), T(b), 0.6)
            if b < 30:
                for s in range(8):
                    mx.add('hat', hat(False, seed=s + b), T(b, s / 2), 0.22 * (1 - (b - 28) * 0.4), 0.3)
            continue
        padd(mx, pad_chord(notes, bar * 0.98, 1300 if b < 8 else 1700, seed=b), T(b), 0.55 if b < 8 else 0.45)
        r = fit(root, 28, 40)
        for s in range(8):                       # 8分で刻むシンセベース(オクターブ交互)
            if b < 2 and s % 2: continue
            m = r + (12 if s in (3, 7) else 0)
            mx.add('bass', slap_bass(m, 0.42 * beat, 0.9 if s % 2 == 0 else 0.75), T(b, s / 2), 1.0, 0)
        if b >= 8:
            for bt, d, v in ((0, 0.6, 0.6), (1.5, 0.5, 0.5), (3, 0.7, 0.52)):
                chord(mx, notes, T(b, bt), d * beat, v, bright=1.2, sustain=0.9, rng=rng)
            guitar(mx, T, b, notes, (2, 3, 6, 10, 11, 14, 15) if b >= 14 else (2, 6, 10, 14), rng)
        if b >= 4:
            drums(mx, T, b, rng, [(0, 0.9), (1, 0.75), (2, 0.85), (3, 0.75)], [(1, 0.72), (3, 0.8)] if b >= 8 else [],
                  sn, hats16=True, hat_gain=1.0 if b >= 8 else 0.8)
            if peak:
                mx.add('clap', clap(), T(b, 1), 0.6, -0.1); mx.add('clap', clap(), T(b, 3), 0.7, -0.1)
        else:
            for s in range(16):
                mx.add('hat', hat(False, seed=s + b), T(b, s / 4), (0.3 if s % 4 == 0 else 0.16) * (0.5 + b * 0.17), 0.3)
        if b in (7, 13, 21, 27):
            fill(mx, T, b)
        if b in (8, 14, 22):
            mx.add('crash', crash(), T(b), 0.65, -0.25)
    mel = {8: [(0, 76, .5), (0.5, 79, .5), (1, 83, 1.5), (3, 81, 1)], 9: [(0, 81, 1), (1, 78, 1), (2.5, 81, .5), (3, 83, 1)],
           10: [(0, 83, 2.5), (3, 79, .5), (3.5, 81, .5)], 11: [(0, 76, 2), (2.5, 79, .5), (3, 81, 1)],
           12: [(0, 79, .5), (0.5, 81, .5), (1, 84, 1), (2, 83, 1), (3, 79, 1)], 13: [(0, 81, 1.5), (1.5, 78, 1)],
           14: [(0, 84, 1.5), (1.5, 81, .5), (2, 79, 1), (3, 76, 1)], 15: [(0, 78, 1), (1, 81, 1), (2, 86, 2)],
           16: [(0, 88, 1), (1, 86, .5), (1.5, 83, 1.5), (3, 79, 1)], 17: [(0, 81, 3)],
           18: [(0.5, 84, .5), (1, 88, 1.5), (2.5, 84, .5), (3, 81, 1)], 19: [(0, 83, 1), (1, 86, 1), (2, 90, 2)],
           20: [(0, 88, 1.5), (1.5, 84, .5), (2, 83, 1), (3, 79, 1)], 21: [(0, 81, 1), (1, 78, 1.5)],
           22: [(0, 88, .5), (0.5, 91, .5), (1, 95, 1.5), (3, 93, 1)], 23: [(0, 93, 1), (1, 90, 1), (2.5, 93, .5), (3, 95, 1)],
           24: [(0, 95, 2.5), (3, 91, .5), (3.5, 93, .5)], 25: [(0, 88, 2), (2.5, 86, .5), (3, 83, 1)],
           26: [(0, 84, 1), (1, 88, 1), (2, 91, 2)], 27: [(0, 90, 1.5), (1.5, 86, 1)], 28: [(0, 88, 6)]}
    for b, ns in mel.items():
        for bt, m, d in ns:
            mx.add('lead', lead_note(m, d * beat * 0.93, 0.82), T(b, bt), 0.8 if b >= 22 else 1.0, -0.06)
    sec = [('intro', 0), ('kick in', 4), ('A(15.0s)', 8), ('B(26.25s)', 14), ("A' peak(41.25s)", 22), ('outro(52.5s)', 28)]
    return finish(mx, beat, 'lead', ep_g=0.38), bpm, sec


if __name__ == '__main__':
    B = {'d1': (build_d1, 4.0, 2.0), 'd2': (build_d2, 3.5, 1.8), 'd3': (build_d3, 5.0, 1.8)}
    for w in (sys.argv[1:] or list(B)):
        fn, fo, shelf = B[w]
        out, bpm, sec = fn(); path = os.path.join(HERE, f'track_{w}.wav')
        y, I, pk, lra = master(out, path, fade_out=fo, target=-14.0, shelf=shelf)
        # 仕上げ: 真のピークを -1.5 dB 以下に保ったまま -14 LUFS に合わせる(天井 c の軽いソフトクリップで押し上げる)
        g, c, y0 = 1.0, 0.80, y
        for _ in range(10):
            if pk <= -1.5 and abs(I + 14.0) <= 0.3: break
            if pk > -1.5: c *= 10 ** ((-1.7 - pk) / 20)
            g *= 10 ** ((-14.0 - I) / 20 * 1.1)
            y = c * np.tanh(y0 * g / c)
            wavfile.write(path, SR, np.round(y * 32767).astype(np.int16)); I, pk, lra = M.measure(path)
        sr, d = wavfile.read(path); bar = 240 / bpm
        lo, hi = band_db(y, 0, 120), band_db(y, 6000, 16000)
        print(f'=== track_{w}: len={len(d) / sr:.6f}s I={I} LUFS truepeak={pk} dBFS LRA={lra} LU  '
              f'<120Hz={lo:.1f}dB >6kHz={hi:.1f}dB diff={lo - hi:.1f}dB  clip={int((np.abs(d) >= 32767).sum())} dc={y.mean():.5f} '
              f'tail_max={np.abs(y[-int(0.1 * SR):]).max():.4f}')
        print('    ' + '  '.join(f'{nm}:bar{b}={b * bar:.3f}s' for nm, b in sec))
        seg = [10 * np.log10(np.mean(y[int(a * bar * SR):int(min(60, (c if c else 60 / bar) * bar) * SR)] ** 2) + 1e-12)
               for (_, a), c in zip(sec, [b for _, b in sec[1:]] + [None])]
        print('    RMS(dBFS): ' + ' '.join(f'{v:.1f}' for v in seg))
