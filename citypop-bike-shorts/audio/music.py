#!/usr/bin/env python3
"""Original city-pop BGM synth (numpy + scipy only).
  track_a.wav : night / neon / funky   112 BPM, 28 bars = 60.000 s, A major
  track_b.wav : sunset / mellow AOR     96 BPM, 24 bars = 60.000 s, F major
All melodies/progressions are written for this project (no quotation of existing songs).
"""
import os, re, subprocess, sys
import numpy as np
from scipy import signal
from scipy.io import wavfile
from scipy.ndimage import maximum_filter1d, uniform_filter1d

SR = 44100
DUR = 60.0
N = int(SR * DUR)
TAIL = SR * 4
HERE = os.path.dirname(os.path.abspath(__file__))
TAU = 2 * np.pi


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def sos_lp(fc, order=2):
    return signal.butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos')


def sos_hp(fc, order=2):
    return signal.butter(order, fc, 'high', fs=SR, output='sos')


def lp(x, fc, order=2):
    return signal.sosfilt(sos_lp(fc, order), x, axis=0)


def hp(x, fc, order=2):
    return signal.sosfilt(sos_hp(fc, order), x, axis=0)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, hi], 'band', fs=SR, output='sos'), x, axis=0)


def ar(n, a=0.003, r=0.03):
    """attack/release window of n samples"""
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    na, nr = min(na, n), min(nr, n)
    e[:na] *= np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def held(n_total, dur, rel):
    """1 until dur, then exponential release"""
    t = np.arange(n_total) / SR
    e = np.ones(n_total)
    m = t > dur
    e[m] = np.exp(-(t[m] - dur) / rel)
    return e


class Mix:
    def __init__(self):
        self.bus = {}

    def add(self, name, sig, t, gain=1.0, pan=0.0):
        b = self.bus.setdefault(name, np.zeros((N + TAIL, 2)))
        i = int(round(t * SR))
        if i < 0 or i >= N + TAIL:
            return
        n = min(len(sig), N + TAIL - i)
        l = np.cos((pan + 1) * np.pi / 4) * gain
        r = np.sin((pan + 1) * np.pi / 4) * gain
        b[i:i + n, 0] += sig[:n] * l
        b[i:i + n, 1] += sig[:n] * r

    def get(self, name):
        return self.bus.setdefault(name, np.zeros((N + TAIL, 2)))


# ---------------------------------------------------------------- instruments
def saw_add(phase, f, kmax=30, odd_boost=0.0):
    K = int(min(kmax, (SR * 0.42) // max(f, 1)))
    y = np.zeros_like(phase)
    for k in range(1, K + 1):
        a = 1.0 / k
        if odd_boost and k % 2 == 1:
            a *= (1 + odd_boost)
        y += a * np.sin(k * phase)
    return y * 0.6


def ep_note(m, dur, vel=0.8, bright=1.0, tine=0.22, sustain=1.6):
    f = mtof(m)
    n = int((dur + 0.5) * SR)
    t = np.arange(n) / SR
    idx = (0.35 + 1.5 * vel * bright) * np.exp(-t * 6.0) + 0.28 * bright
    y = np.sin(TAU * f * t + idx * np.sin(TAU * f * t))
    y += tine * vel * np.sin(TAU * f * 14.0 * t) * np.exp(-t * 28.0) if f * 14 < SR * 0.4 else 0
    y += 0.12 * np.sin(TAU * 2 * f * t) * np.exp(-t * 3.0)
    amp = np.exp(-t * sustain) * held(n, dur, 0.07)
    return y * amp * ar(n, 0.003, 0.02) * vel


def slap_bass(m, dur, vel=0.9, pop=False):
    f = mtof(m)
    n = int((dur + 0.12) * SR)
    t = np.arange(n) / SR
    ph = TAU * f * t
    raw = saw_add(ph, f, 40, 0.3)
    dark = lp(raw, 320 if not pop else 600, 2)
    brt = lp(raw, 2600 if not pop else 4200, 2)
    w = np.exp(-t * (16 if not pop else 22))
    y = dark * (1 - 0.75 * w) + brt * w * (1.2 if pop else 0.9)
    y += 0.9 * np.sin(ph) * (0.0 if pop else 1.0)
    click = hp(np.random.default_rng(int(m * 7 + dur * 100)).standard_normal(n), 1500) * np.exp(-t * 220) * (0.5 if pop else 0.25)
    amp = np.exp(-t * (5.0 if pop else 2.2)) * held(n, dur, 0.02)
    return np.tanh((y + click) * amp * 1.3) * ar(n, 0.002, 0.01) * vel


def round_bass(m, dur, vel=0.9):
    f = mtof(m)
    n = int((dur + 0.15) * SR)
    t = np.arange(n) / SR
    ph = TAU * f * t
    y = np.sin(ph) + 0.45 * np.sin(2 * ph) * np.exp(-t * 4) + 0.22 * np.sin(3 * ph) * np.exp(-t * 7) \
        + 0.08 * np.sin(4 * ph) * np.exp(-t * 10)
    amp = (0.35 + 0.65 * np.exp(-t * 2.2)) * held(n, dur, 0.04)
    return np.tanh(y * amp * 1.1) * ar(n, 0.006, 0.02) * vel


def kick(vel=1.0, soft=False):
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    f0, f1, k = (115, 46, 26) if not soft else (95, 44, 22)
    f = f1 + (f0 - f1) * np.exp(-t * k)
    ph = TAU * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-t * (8.5 if not soft else 10))
    cl = hp(np.random.default_rng(1).standard_normal(n), 2500) * np.exp(-t * 300) * (0.25 if not soft else 0.08)
    return np.tanh((y * 1.5 + cl)) * ar(n, 0.001, 0.03) * vel


_rng_d = np.random.default_rng(1984)


def snare_gated():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    nz = bp(_rng_d.standard_normal(n), 900, 9000) * np.exp(-t * 16)
    tone = (np.sin(TAU * 185 * t) + 0.6 * np.sin(TAU * 330 * t)) * np.exp(-t * 26)
    dry = nz * 0.9 + tone * 0.8
    # gated reverb: convolve with a short dense burst then hard gate
    g = int(0.17 * SR)
    burst = _rng_d.standard_normal(g) * np.linspace(1.0, 0.55, g)
    wet = signal.fftconvolve(dry, burst)[:n] / np.sqrt(g) * 1.6
    gate = np.ones(n)
    g0, gf = int(0.19 * SR), int(0.025 * SR)
    gate[g0:g0 + gf] = np.linspace(1, 0, gf)
    gate[g0 + gf:] = 0
    wet = lp(hp(wet, 300), 7000) * gate
    y = dry + wet * 0.55
    return y / np.max(np.abs(y))


def snare_soft():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    nz = bp(_rng_d.standard_normal(n), 1200, 7000) * np.exp(-t * 30)
    tone = np.sin(TAU * 200 * t) * np.exp(-t * 40)
    y = nz + tone * 0.6
    return y / np.max(np.abs(y))


def rimshot():
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    y = (np.sin(TAU * 1720 * t) + 0.6 * np.sin(TAU * 820 * t) + 0.4 * np.sin(TAU * 2950 * t)) * np.exp(-t * 85)
    y += hp(_rng_d.standard_normal(n), 3000) * np.exp(-t * 400) * 0.6
    return y / np.max(np.abs(y)) * ar(n, 0.0005, 0.01)


def hat(open_=False, seed=0):
    n = int((0.32 if open_ else 0.07) * SR)
    t = np.arange(n) / SR
    r = np.random.default_rng(100 + seed)
    y = hp(r.standard_normal(n), 7500, 4)
    y *= np.exp(-t * (11 if open_ else 75))
    return y / np.max(np.abs(y)) * ar(n, 0.0005, 0.01)


def shaker(seed=0):
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    y = bp(np.random.default_rng(500 + seed).standard_normal(n), 4500, 11000)
    y *= np.sin(np.pi * np.minimum(t / 0.05, 1.0)) ** 2
    return y / np.max(np.abs(y))


def clap():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    env = np.zeros(n)
    for d in (0.0, 0.011, 0.023):
        m = t >= d
        env[m] += np.exp(-(t[m] - d) * 110)
    m = t >= 0.034
    env[m] += 1.2 * np.exp(-(t[m] - 0.034) * 22)
    y = bp(_rng_d.standard_normal(n), 900, 3800) * env
    return y / np.max(np.abs(y)) * ar(n, 0.0005, 0.02)


def tom(f0, soft=False):
    n = int(0.4 * SR)
    t = np.arange(n) / SR
    f = f0 * (0.72 + 0.28 * np.exp(-t * 14))
    y = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t * (9 if not soft else 13))
    y += bp(_rng_d.standard_normal(n), 300, 3000) * np.exp(-t * 60) * (0.25 if not soft else 0.08)
    return np.tanh(y * 1.2) * ar(n, 0.001, 0.03)


def crash(length=2.2, soft=False):
    n = int(length * SR)
    t = np.arange(n) / SR
    y = hp(_rng_d.standard_normal(n), 4500 if not soft else 6000, 2)
    y = y * np.exp(-t * (2.4 if not soft else 1.8))
    if soft:
        y *= np.minimum(t / 0.25, 1.0)
    return y / np.max(np.abs(y)) * ar(n, 0.002, 0.2)


def ks_pluck(m, dur=0.09, vel=0.8, seed=0):
    """Karplus-Strong muted guitar chop"""
    f = mtof(m)
    P = int(round(SR / f))
    n = int((dur + 0.05) * SR)
    r = np.random.default_rng(900 + seed + m)
    exc = np.zeros(n)
    exc[:P] = lp(r.standard_normal(P + 64), 4200)[64:]
    a = np.zeros(P + 2)
    a[0] = 1.0
    a[P] = -0.497
    a[P + 1] = -0.497
    y = signal.lfilter([1.0], a, exc)
    t = np.arange(n) / SR
    y = hp(y, 350) * held(n, dur, 0.012)
    return y / (np.max(np.abs(y)) + 1e-9) * ar(n, 0.001, 0.01) * vel


def lead_note(m, dur, vel=0.8):
    f = mtof(m)
    n = int((dur + 0.12) * SR)
    t = np.arange(n) / SR
    vib = 0.0045 * np.clip((t - 0.22) / 0.25, 0, 1) * np.sin(TAU * 5.6 * t)
    bend = -0.012 * np.exp(-t * 45)  # tiny scoop into the note
    ph = TAU * np.cumsum(f * (1 + vib + bend)) / SR
    raw = saw_add(ph, f, 26, 0.5) + 0.35 * saw_add(ph * 1.004, f, 20)
    fc = 1400 + 2600 * vel
    y = lp(raw, fc, 2)
    env = np.minimum(t / 0.018, 1.0) * (0.72 + 0.28 * np.exp(-t * 3.5)) * held(n, dur, 0.05)
    return y * env * ar(n, 0.002, 0.02) * vel


def vibe_note(m, dur, vel=0.8):
    f = mtof(m)
    n = int((max(dur, 0.5) + 1.3) * SR)
    t = np.arange(n) / SR
    idx = 1.1 * vel * np.exp(-t * 7.0) + 0.08
    y = np.sin(TAU * f * t + idx * np.sin(TAU * 4 * f * t))
    y += 0.2 * np.sin(TAU * 2 * f * t) * np.exp(-t * 5)
    trem = 1 - 0.22 * (0.5 + 0.5 * np.sin(TAU * 4.6 * t + 1.0))
    amp = np.exp(-t * 2.1) * held(n, dur + 0.5, 0.35) * trem
    return y * amp * ar(n, 0.002, 0.05) * vel


def pad_chord(notes, dur, bright=1200, seed=0):
    n = int((dur + 1.0) * SR)
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    r = np.random.default_rng(300 + seed)
    for m in notes:
        f = mtof(m)
        for det, pan in ((-0.0045, -0.7), (0.0, 0.0), (0.005, 0.7)):
            ph = TAU * f * (1 + det) * t + r.uniform(0, TAU)
            s = saw_add(ph, f, 14)
            out[:, 0] += s * np.cos((pan + 1) * np.pi / 4)
            out[:, 1] += s * np.sin((pan + 1) * np.pi / 4)
    out = lp(out, bright, 2)
    env = np.minimum(t / 0.45, 1.0) * held(n, dur, 0.4)
    return out * (env * ar(n, 0.01, 0.1))[:, None] / max(1, len(notes))


# ---------------------------------------------------------------- effects
def chorus(x, depth_ms=3.0, base_ms=13.0, rate=0.6, mix=0.5):
    n = len(x)
    i = np.arange(n, dtype=float)
    out = np.empty_like(x)
    for ch, phs in ((0, 0.0), (1, np.pi * 0.9)):
        d = (base_ms + depth_ms * np.sin(TAU * rate * i / SR + phs)) * SR / 1000.0
        out[:, ch] = x[:, ch] * (1 - mix * 0.4) + mix * np.interp(i - d, i, x[:, ch], left=0)
    return out


def make_ir(length=1.8, decay=3.4, seed=7, lo=250, hi=6500):
    n = int(length * SR)
    t = np.arange(n) / SR
    r = np.random.default_rng(seed)
    ir = r.standard_normal((n, 2)) * np.exp(-t * decay)[:, None]
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))[:, None]  # pre-delay-ish
    ir = lp(hp(ir, lo), hi)
    return ir / np.sqrt(np.sum(ir ** 2, axis=0, keepdims=True))


def reverb(x, ir):
    m = x.mean(axis=1)
    return np.stack([signal.fftconvolve(m, ir[:, c])[: len(x)] for c in (0, 1)], axis=1)


def echo(x, delay_s, fb=0.32, taps=4, damp=3500):
    out = np.zeros_like(x)
    d = int(delay_s * SR)
    cur = x
    for k in range(1, taps + 1):
        cur = lp(cur, damp) * fb
        sh = np.zeros_like(x)
        sh[d * k:] = cur[: len(x) - d * k]
        # ping-pong
        if k % 2:
            sh[:, 0] *= 0.35
        else:
            sh[:, 1] *= 0.35
        out += sh
        cur = x * (fb ** k)
    return out


def autopan(x, rate=4.8, depth=0.45):
    t = np.arange(len(x)) / SR
    l = 1 - depth * (0.5 + 0.5 * np.sin(TAU * rate * t))
    r = 1 - depth * (0.5 - 0.5 * np.sin(TAU * rate * t))
    return x * np.stack([l, r], axis=1)


def limiter(x, ceil=0.84, look=0.004):
    pk = np.max(np.abs(x), axis=1)
    w = int(look * SR) | 1
    pk = maximum_filter1d(pk, size=2 * w + 1)
    g = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    g = uniform_filter1d(g, size=w)
    # slow release
    rel = np.exp(-1.0 / (0.08 * SR))
    b = signal.lfilter([1 - rel], [1, -rel], g[::-1])[::-1]  # anticipatory smoothing
    g = np.minimum(g, np.minimum(1.0, b + 0.0))
    return x * g[:, None]


def measure(path):
    p = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true',
                        '-f', 'null', '-'], capture_output=True, text=True)
    s = p.stderr[p.stderr.rfind('Summary:'):]
    I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', s).group(1))
    pk = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', s).group(1))
    lra = float(re.search(r'LRA:\s+(-?[\d.]+) LU', s).group(1))
    return I, pk, lra


def master(mixd, path, fade_out, target=-14.0, shelf=0.0):
    x = mixd[:N].copy()
    x = hp(x, 28, 2)
    if shelf:
        x = x + shelf * hp(x, 3000, 1)  # gentle high shelf
    x -= x.mean(axis=0, keepdims=True)
    # edges
    fi = int(0.006 * SR)
    x[:fi] *= np.linspace(0, 1, fi)[:, None]
    fo = int(fade_out * SR)
    sil = int(0.12 * SR)
    curve = np.ones(N)
    curve[N - fo - sil: N - sil] = np.cos(np.linspace(0, np.pi / 2, fo)) ** 2
    curve[N - sil:] = 0
    x *= curve[:, None]
    x /= np.max(np.abs(x))
    gain = 0.5
    y = x
    for it in range(8):
        y = limiter(np.tanh(x * gain * 0.9) / 0.9 if gain > 0.9 else x * gain)
        y = np.clip(y, -0.86, 0.86)
        y[N - sil:] = 0
        wavfile.write(path, SR, np.round(y * 32767).astype(np.int16))
        I, pk, lra = measure(path)
        if abs(I - target) < 0.15:
            break
        gain *= 10 ** ((target - I) / 20.0)
    return y, I, pk, lra


# ---------------------------------------------------------------- reporting
def report(name, y, bpm, sections, kick_bars):
    beat = 60.0 / bpm
    bar = beat * 4
    print(f'--- {name}: samples={len(y)} dur={len(y) / SR:.6f}s  DC={y.mean(axis=0)}  max|x|={np.abs(y).max():.4f}')
    print('  section RMS (dBFS):')
    for i, (nm, b0) in enumerate(sections):
        b1 = sections[i + 1][1] if i + 1 < len(sections) else int(round(DUR / bar))
        seg = y[int(b0 * bar * SR): int(b1 * bar * SR)]
        print(f'    {nm:10s} bars {b0:2d}-{b1 - 1:2d}  t={b0 * bar:6.3f}-{b1 * bar:6.3f}s  rms={20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12):6.2f}')
    print('  per-bar RMS (dBFS): ' + ' '.join(
        f'{20 * np.log10(np.sqrt(np.mean(y[int(b * bar * SR): int((b + 1) * bar * SR)] ** 2)) + 1e-12):.1f}'
        for b in range(int(round(DUR / bar)))))
    # kick onset check: low band envelope around bar heads
    low = np.abs(lp(y.mean(axis=1), 85, 4))
    env = uniform_filter1d(low, int(0.01 * SR))
    ref = np.median(env[int(5 * SR): int(50 * SR)])
    miss, offs = [], []
    for b in kick_bars:
        c = int(round(b * bar * SR))
        w = env[max(0, c - int(0.03 * SR)): c + int(0.12 * SR)]
        pre = env[max(0, c - int(0.06 * SR)): max(1, c - int(0.02 * SR))].mean()
        pkv = w.max()
        # onset = first sample where full-band energy jumps
        full = env[c - int(0.02 * SR): c + int(0.05 * SR)]
        thr = 0.5 * full.max()
        on = (np.argmax(full > thr) - int(0.02 * SR)) / SR * 1000
        offs.append(on)
        if pkv < 1.5 * ref:
            miss.append((b, round(pkv / ref, 2), round(pre / ref, 2)))
    print(f'  kick-at-bar-head: checked {len(kick_bars)} bars, weak={miss}')
    print(f'  onset offset vs grid (ms): min={min(offs):.1f} max={max(offs):.1f}')
    tail = np.abs(y[-int(0.1 * SR):]).max()
    head = np.abs(y[:8]).max()
    print(f'  head|x|(first 8 smp)={head:.5f}  tail|x|(last 100ms)={tail:.6f}')


# ================================================================= TRACK A
def build_a():
    bpm = 112.0
    beat = 60.0 / bpm
    bar = 4 * beat
    mx = Mix()
    rng = np.random.default_rng(112)
    T = lambda b, bt=0.0: b * bar + bt * beat

    CH = {
        'Dmaj7': ([54, 57, 61, 64], 38), 'C#7': ([53, 56, 59, 61], 37), 'F#m7': ([57, 61, 64, 68], 42),
        'Em7': ([55, 59, 62, 66], 40), 'A7': ([55, 59, 61, 66], 33), 'Bm7': ([57, 61, 62, 66], 35),
        'E7': ([56, 61, 62, 66], 40), 'C#m7': ([56, 59, 61, 64], 37), 'E7sus4': ([57, 59, 62, 66], 40),
        'Dmaj9': ([54, 57, 61, 64, 69], 38),
    }
    A4 = [[('Dmaj7', 0, 4)], [('C#7', 0, 4)], [('F#m7', 0, 4)], [('Em7', 0, 2), ('A7', 2, 2)]]
    B8 = [[('Bm7', 0, 4)], [('E7', 0, 4)], [('C#m7', 0, 4)], [('F#m7', 0, 4)],
          [('Bm7', 0, 4)], [('C#m7', 0, 4)], [('Dmaj7', 0, 4)], [('E7sus4', 0, 2), ('E7', 2, 2)]]
    bars = A4 + A4 + A4 + B8 + A4 + A4[:2] + [[('Dmaj9', 0, 4)], [('Dmaj9', 0, 4)]]
    assert len(bars) == 28
    SEC = [('intro', 0), ('A', 4), ('B', 12), ("A'", 20), ('outro', 26)]

    def next_root(b):
        return CH[bars[b + 1][0][0]][1] if b + 1 < 28 else 38

    sn, sn_s, cl = snare_gated(), snare_soft(), clap()
    kk = kick()

    for b in range(28):
        intro, outro = b < 4, b >= 26
        sectB = 12 <= b < 20
        fill = b in (11, 19, 25)
        # ---------------- EP comping
        for (nm, st, ln) in bars[b]:
            notes, root = CH[nm]
            if outro:
                if b == 26:
                    for i, m in enumerate([38 + 12] + notes):
                        mx.add('ep', ep_note(m, 7.5 * beat, 0.8, 0.9, sustain=0.75), T(b, i * 0.14), 0.9, (i - 2.5) * 0.18)
                continue
            if ln == 4:
                hits = [(0, 1.35, 0.85), (1.5, 0.4, 0.6), (2.5, 1.3, 0.75)]
                if b % 2 == 1:
                    hits.append((3.75, 0.2, 0.5))
            else:
                hits = [(0, 1.2, 0.85), (1.5, 0.4, 0.65)] if st == 0 else [(0, 1.0, 0.8), (1.5, 0.4, 0.6)]
            if intro:
                hits = [(0, 2.3, 0.8), (2.5, 1.3, 0.65)] if ln == 4 else [(0, 1.7, 0.8)]
            for (bt, d, v) in hits:
                for i, m in enumerate(notes):
                    mx.add('ep_intro' if intro else 'ep', ep_note(m, d * beat, v * rng.uniform(0.9, 1.0)),
                           T(b, st + bt) + i * 0.004, 0.8, (i - 1.5) * 0.25)
            # ---------------- guitar chops (16ths)
            if not intro:
                pat = 'x.xx.x.xx.xx.xx.' if not sectB else '..x..x.x..x.x.x.'
                s0, s1 = int(st * 4), int((st + ln) * 4)
                for s in range(s0, s1):
                    if pat[s] == 'x' and not (fill and s >= 10):
                        up = (s % 2 == 1)
                        for i, m in enumerate(notes[1:]):
                            mx.add('gtr', ks_pluck(m + 12, 0.055 if s % 4 else 0.08, 0.7 if up else 0.9, seed=s),
                                   T(b, s / 4.0) + (2 - i if up else i) * 0.006, 0.6, 0.45)
            # ---------------- pad
            if sectB or 20 <= b < 26:
                mx.add_pad = None
                p = pad_chord([n + 12 for n in notes[:3]] + [notes[3]], ln * beat, 1500, seed=b)
                bp_ = mx.get('pad')
                i0 = int(T(b, st) * SR)
                bp_[i0:i0 + len(p)] += p * 0.9
        # ---------------- bass
        if not intro and not outro:
            ch = bars[b]
            if len(ch) == 1:
                r = CH[ch[0][0]][1]
                app = next_root(b) - 1
                seq = [(0, r, 0.5, 0), (0.75, r, 0.2, 0), (1.5, r + 12, 0.22, 1), (2, r, 0.42, 0),
                       (2.75, r + 12, 0.2, 1), (3.0, r, 0.3, 0), (3.5, app, 0.42, 0)]
                if b % 4 == 2:
                    seq = [(0, r, 0.5, 0), (0.75, r, 0.2, 0), (1.0, r + 12, 0.2, 1), (1.5, r + 7, 0.3, 0), (2, r, 0.42, 0),
                           (2.5, r, 0.2, 0), (2.75, r + 12, 0.2, 1), (3.25, r + 10, 0.2, 0), (3.5, app, 0.42, 0)]
            else:
                r1, r2 = CH[ch[0][0]][1], CH[ch[1][0]][1]
                app = next_root(b) - 1
                seq = [(0, r1, 0.5, 0), (0.75, r1, 0.2, 0), (1.5, r1 + 12, 0.22, 1), (2, r2, 0.42, 0),
                       (2.75, r2 + 12, 0.2, 1), (3.0, r2, 0.3, 0), (3.5, app, 0.42, 0)]
            for (bt, m, d, pop) in seq:
                while m < 30:
                    m += 12
                mx.add('bass', slap_bass(m, d * beat, 0.9 if not pop else 0.75, bool(pop)), T(b, bt), 1.0, 0.0)
        if outro and b == 26:
            mx.add('bass', slap_bass(38, 6.5 * beat, 0.9), T(b), 1.0, 0.0)
        # ---------------- drums
        if intro:
            step = 0.5 if b < 2 else 0.25
            k = 0
            bt = 0.0
            while bt < 4 - 1e-9:
                if not (b == 3 and bt >= 3):
                    v = (0.25 + 0.12 * b) * (1.0 if (bt * 2) % 1 == 0 else 0.5)
                    mx.add('hat', hat(False, k), T(b, bt), v, 0.3)
                bt += step
                k += 1
            if b == 3:
                for i in range(4):
                    mx.add('snare', sn_s, T(b, 3 + i * 0.25), 0.35 + 0.18 * i, -0.1)
                mx.add('tom', tom(150), T(b, 3.5), 0.6, 0.3)
                mx.add('tom', tom(110), T(b, 3.75), 0.7, -0.3)
            if b >= 2:
                mx.add('kick', kk, T(b, 0), 0.55, 0)
                mx.add('kick', kk, T(b, 2), 0.55, 0)
        elif not outro:
            mx.add('kick', kk, T(b, 0), 1.0, 0)
            mx.add('kick', kk, T(b, 2.5), 0.9, 0)
            if b % 2 == 1:
                mx.add('kick', kk, T(b, 1.75), 0.6, 0)
            if sectB:
                mx.add('kick', kk, T(b, 2.0), 0.75, 0)
            mx.add('snare', sn, T(b, 1), 0.95, 0.0)
            if not fill:
                mx.add('snare', sn, T(b, 3), 1.0, 0.0)
                if sectB or b >= 20:
                    mx.add('clap', cl, T(b, 3), 0.8, 0.15)
            else:
                mx.add('snare', sn_s, T(b, 2.5), 0.7, 0)
                mx.add('snare', sn_s, T(b, 2.75), 0.8, 0)
                for i, f0 in enumerate((210, 210, 150, 105)):
                    mx.add('tom', tom(f0), T(b, 3 + i * 0.25), 0.8 + 0.05 * i, (-0.5, -0.5, 0.1, 0.5)[i])
            for s in range(16):
                if fill and s >= 12:
                    break
                acc = (1.0, 0.38, 0.68, 0.38)[s % 4] * rng.uniform(0.85, 1.0)
                if s == 14 and b % 2 == 1 and not fill:
                    mx.add('hat', hat(True, s), T(b, s / 4), 0.6, 0.3)
                else:
                    mx.add('hat', hat(False, s + b), T(b, s / 4), 0.5 * acc, 0.3)
        if b in (4, 12, 20, 26):
            mx.add('crash', crash(), T(b), 0.6, -0.25)
        if b == 26:
            mx.add('kick', kk, T(b), 1.0, 0)

    # ---------------- lead melody (original)
    mel = {
        12: [(0, 78, 1.5), (1.5, 76, .5), (2, 74, 1), (3, 71, .5), (3.5, 73, .5)],
        13: [(0, 71, 2), (2.5, 68, .5), (3, 71, .5), (3.5, 73, .5)],
        14: [(0, 76, 1.5), (1.5, 73, .5), (2, 71, 1), (3, 68, 1)],
        15: [(0, 69, 2.5), (3, 73, .5), (3.5, 76, .5)],
        16: [(0, 78, 1), (1, 81, 1), (2, 78, .5), (2.5, 76, .5), (3, 74, 1)],
        17: [(0, 76, 1.5), (1.5, 80, .5), (2, 76, 1), (3, 73, 1)],
        18: [(0, 78, 1.5), (1.5, 76, .5), (2, 73, 1), (3, 69, .5), (3.5, 71, .5)],
        19: [(0, 71, 3), (3.5, 73, .5)],
        20: [(0, 81, 1.5), (1.5, 78, .5), (2, 76, 1), (3, 73, 1)],
        21: [(0, 71, 1), (1, 73, .5), (1.5, 77, 1.5), (3, 80, 1)],
        22: [(0, 81, 2), (2, 78, .5), (2.5, 76, .5), (3, 73, 1)],
        23: [(0, 74, 1), (1, 71, 1), (2, 73, 1), (3, 76, .5), (3.5, 79, .5)],
        24: [(0, 78, 2), (2, 81, 1), (3, 78, .5), (3.5, 76, .5)],
        25: [(0, 77, 1.5), (1.5, 80, .5), (2, 80, 1), (3, 77, .5), (3.5, 76, .5)],
        26: [(0, 76, 5.0)],
    }
    for b, ns in mel.items():
        for (bt, m, d) in ns:
            v = 0.85 if bt % 1 == 0 else 0.72
            mx.add('lead', lead_note(m, d * beat * 0.94, v), T(b, bt), 1.0, -0.08)

    # ---------------- intro EP filter sweep
    e = mx.get('ep_intro')
    p = np.clip(np.arange(len(e)) / (4 * bar * SR), 0, 1)
    lo, mid = lp(e, 450, 2), lp(e, 1800, 2)
    w0 = np.clip(1 - 2 * p, 0, 1)
    w2 = np.clip(2 * p - 1, 0, 1)
    w1 = 1 - w0 - w2
    mx.bus['ep_intro'] = lo * w0[:, None] * 1.5 + mid * w1[:, None] * 1.2 + e * w2[:, None]

    # ---------------- tape hiss
    hiss = bp(np.random.default_rng(5).standard_normal((N + TAIL, 2)), 1500, 9000) * 0.0035

    # ---------------- mix
    ir = make_ir(1.7, 3.6, 7)
    ep = chorus(mx.get('ep') + mx.get('ep_intro'), 3.0, 13, 0.55, 0.5)
    gtr = chorus(mx.get('gtr'), 1.5, 9, 0.9, 0.3)
    pad = chorus(mx.get('pad'), 4.0, 16, 0.3, 0.5)
    lead = mx.get('lead')
    lead = lead + echo(lead, beat * 0.75, 0.3, 3)
    drums_wet = mx.get('snare') * 0.25 + mx.get('clap') * 0.5 + mx.get('tom') * 0.4 + mx.get('crash') * 0.5
    send = ep * 0.30 + gtr * 0.25 + pad * 0.5 + lead * 0.45 + drums_wet
    wet = reverb(send, ir)
    out = (mx.get('kick') * 0.80 + mx.get('snare') * 0.70 + mx.get('clap') * 0.36 + mx.get('hat') * 0.34
           + mx.get('tom') * 0.55 + mx.get('crash') * 0.30 + mx.get('bass') * 0.50 + ep * 0.42 + gtr * 0.50
           + pad * 0.40 + lead * 0.40 + wet * 0.5 + hiss)
    return out, bpm, SEC, list(range(4, 27))


# ================================================================= TRACK B
def build_b():
    bpm = 96.0
    beat = 60.0 / bpm
    bar = 4 * beat
    mx = Mix()
    rng = np.random.default_rng(96)
    T = lambda b, bt=0.0: b * bar + bt * beat

    CH = {
        'Bbmaj7': ([57, 60, 62, 65], 34), 'Am7': ([55, 57, 60, 64], 33), 'Gm7': ([53, 57, 58, 62], 31),
        'C7sus4': ([53, 58, 60, 62], 36), 'C7': ([52, 57, 58, 62], 36), 'Fmaj7': ([52, 55, 57, 60], 29),
        'Dm7': ([53, 57, 60, 64], 38), 'Fmaj9': ([53, 57, 60, 64, 67], 29),
    }
    P1 = [[('Bbmaj7', 0, 4)], [('Am7', 0, 4)], [('Gm7', 0, 4)], [('C7sus4', 0, 2), ('C7', 2, 2)]]
    P2 = [[('Bbmaj7', 0, 4)], [('Am7', 0, 4)], [('Gm7', 0, 2), ('C7', 2, 2)], [('Fmaj7', 0, 4)]]
    B8 = [[('Dm7', 0, 4)], [('Gm7', 0, 4)], [('C7sus4', 0, 4)], [('Fmaj7', 0, 4)],
          [('Bbmaj7', 0, 4)], [('Am7', 0, 2), ('Dm7', 2, 2)], [('Gm7', 0, 4)], [('C7sus4', 0, 2), ('C7', 2, 2)]]
    bars = [[('Bbmaj7', 0, 4)], [('C7sus4', 0, 4)]] + P1 + P2 + B8 + P1 + [[('Fmaj9', 0, 4)], [('Fmaj9', 0, 4)]]
    assert len(bars) == 24
    SEC = [('intro', 0), ('A1', 2), ('A2+mel', 6), ('B', 10), ('C', 18), ('outro', 22)]

    def next_root(b):
        return CH[bars[b + 1][0][0]][1] if b + 1 < 24 else 29

    kk, rim, sn_s = kick(soft=True), rimshot(), snare_soft()

    for b in range(24):
        intro, outro = b < 2, b >= 22
        sectB = 10 <= b < 18
        fill = b in (9, 17, 21)
        for (nm, st, ln) in bars[b]:
            notes, root = CH[nm]
            if outro:
                if b == 22:
                    for i, m in enumerate([41] + notes):
                        mx.add('ep', ep_note(m, 7.6 * beat, 0.7, 0.55, tine=0.3, sustain=0.6), T(b, i * 0.16), 0.9, (i - 2.5) * 0.15)
                continue
            if intro:
                # gentle rolled chords
                for i, m in enumerate(notes):
                    mx.add('ep', ep_note(m, 3.6 * beat, 0.6, 0.5, tine=0.3, sustain=0.8), T(b, i * 0.12), 0.9, (i - 1.5) * 0.2)
                mx.add('ep', ep_note(notes[3] + 12, 1.2 * beat, 0.45, 0.5, tine=0.3), T(b, 2.5), 0.8, 0.3)
                mx.add('ep', ep_note(notes[2] + 12, 1.0 * beat, 0.4, 0.5, tine=0.3), T(b, 3.25), 0.8, -0.3)
                continue
            hits = [(0, 2.2, 0.72), (2.5, 1.3, 0.55)] if ln == 4 else [(0, 1.8, 0.7)]
            if ln == 4 and b % 2 == 1:
                hits.append((3.5, 0.45, 0.45))
            for (bt, d, v) in hits:
                for i, m in enumerate(notes):
                    mx.add('ep', ep_note(m, d * beat, v * rng.uniform(0.9, 1.0), 0.8, tine=0.3, sustain=1.1),
                           T(b, st + bt) + i * 0.012, 0.85, (i - 1.5) * 0.2)
            if sectB or 18 <= b < 22:
                p = pad_chord([n + 12 for n in notes[1:]] + [notes[0]], ln * beat, 1100 if sectB else 900, seed=b)
                bp_ = mx.get('pad')
                i0 = int(T(b, st) * SR)
                bp_[i0:i0 + len(p)] += p * (1.0 if sectB else 0.75)
        # bass
        if not intro and not outro:
            ch = bars[b]
            app = next_root(b)
            app = app - 1 if (b % 2 == 0) else app + 2
            if len(ch) == 1:
                r = CH[ch[0][0]][1]
                seq = [(0, r, 1.35), (1.5, r, 0.4), (2.5, r + 7, 0.85), (3.5, app, 0.45)]
                if sectB and b % 2 == 1:
                    seq = [(0, r, 1.35), (1.5, r, 0.4), (2, r + 12, 0.4), (2.5, r + 7, 0.6), (3.25, r + 10, 0.2), (3.5, app, 0.45)]
            else:
                r1, r2 = CH[ch[0][0]][1], CH[ch[1][0]][1]
                seq = [(0, r1, 1.35), (1.5, r1, 0.4), (2, r2, 1.3), (3.5, app, 0.45)]
            for (bt, m, d) in seq:
                while m < 29:
                    m += 12
                while m > 50:
                    m -= 12
                mx.add('bass', round_bass(m, d * beat, 0.9), T(b, bt), 1.0, 0)
        if b == 22:
            mx.add('bass', round_bass(29, 6.5 * beat, 0.9), T(b), 1.0, 0)
            mx.add('bass', round_bass(41, 6.5 * beat, 0.5), T(b), 1.0, 0)
        # drums
        if not intro and not outro:
            mx.add('kick', kk, T(b, 0), 1.0, 0)
            mx.add('kick', kk, T(b, 2.5), 0.8, 0)
            if sectB and b % 2 == 1:
                mx.add('kick', kk, T(b, 1.75), 0.5, 0)
            mx.add('rim', rim, T(b, 1), 0.8, -0.2)
            if not fill:
                mx.add('rim', rim, T(b, 3), 0.85, -0.2)
            else:
                mx.add('rim', rim, T(b, 3), 0.7, -0.2)
                mx.add('tom', tom(165, True), T(b, 3.25), 0.5, -0.3)
                mx.add('tom', tom(125, True), T(b, 3.5), 0.6, 0.1)
                mx.add('tom', tom(95, True), T(b, 3.75), 0.7, 0.4)
            if sectB:
                mx.add('snare', sn_s, T(b, 3), 0.35, 0.0)
            for s in range(8):
                v = (0.55 if s % 2 == 0 else 0.33) * rng.uniform(0.85, 1.0)
                if s == 7 and b % 4 == 3 and not fill:
                    mx.add('hat', hat(True, s), T(b, s / 2), 0.4, 0.35)
                else:
                    mx.add('hat', hat(False, s + b), T(b, s / 2), v, 0.35)
            if b >= 10:
                for s in range(16):
                    v = (0.5, 0.25, 0.38, 0.25)[s % 4] * (1.0 if sectB else 0.7)
                    mx.add('shaker', shaker(s), T(b, s / 4) - 0.02, v, -0.4)
        if b in (10, 18):
            mx.add('crash', crash(2.6, True), T(b) - 0.25, 0.5, 0.2)
        if b == 22:
            mx.add('kick', kk, T(b), 0.9, 0)
            mx.add('crash', crash(3.0, True), T(b) - 0.25, 0.5, -0.2)

    # melody (original) -- vibraphone / bell
    mel = {
        6: [(0.5, 74, .5), (1, 77, 1), (2, 81, 1.5), (3.5, 79, .5)],
        7: [(0, 76, 1.5), (1.5, 79, .5), (2, 76, 1), (3, 72, 1)],
        8: [(0, 74, 1), (1, 77, 1), (2, 76, 1), (3, 74, .5), (3.5, 72, .5)],
        9: [(0, 69, 2), (2, 72, 1), (3, 72, .5), (3.5, 74, .5)],
        10: [(0, 77, 1.5), (1.5, 81, .5), (2, 79, .5), (2.5, 77, .5), (3, 74, 1)],
        11: [(0, 74, 1.5), (1.5, 77, .5), (2, 79, 2)],
        12: [(0, 79, 1.5), (1.5, 77, .5), (2, 74, 1), (3, 72, 1)],
        13: [(0, 81, 2.5), (3, 79, .5), (3.5, 77, .5)],
        14: [(0, 74, 1), (1, 77, 1), (2, 81, 1), (3, 84, 1)],
        15: [(0, 79, 1.5), (1.5, 76, .5), (2, 77, 1), (3, 74, .5), (3.5, 72, .5)],
        16: [(0, 70, 1.5), (1.5, 74, .5), (2, 77, 1.5), (3.5, 79, .5)],
        17: [(0, 77, 2), (2, 76, 1), (3, 74, .5), (3.5, 72, .5)],
        18: [(0, 81, 1.5), (1.5, 77, .5), (2, 74, 1), (3, 77, 1)],
        19: [(0, 79, 1.5), (1.5, 76, .5), (2, 72, 1), (3, 76, 1)],
        20: [(0, 74, 1), (1, 77, .5), (1.5, 79, .5), (2, 82, 1.5), (3.5, 81, .5)],
        21: [(0, 79, 2), (2, 76, 1), (3, 79, 1)],
        22: [(0, 81, 3), (2.0, 65, 1), (2.5, 69, 1), (3.0, 72, 1), (3.5, 76, 1)],
        23: [(0, 79, 3)],
    }
    for b, ns in mel.items():
        for (bt, m, d) in ns:
            v = 0.8 if bt % 1 == 0 else 0.65
            if b >= 22 and m < 78:
                v = 0.5
            mx.add('vibe', vibe_note(m, d * beat, v), T(b, bt), 1.0, 0.12)
            if 10 <= b < 18 and bt % 1 == 0 and d >= 1:  # octave bell doubling in B section
                mx.add('vibe', vibe_note(m + 12, d * beat * 0.6, 0.28), T(b, bt), 1.0, -0.3)

    # ocean waves (filtered noise with slow swells)
    r = np.random.default_rng(42)
    nz = r.standard_normal((N + TAIL, 2))
    t = np.arange(N + TAIL) / SR
    swell = (0.5 + 0.5 * np.sin(TAU * t / 5.0 - 1.2)) ** 2 * 0.85 + 0.15
    wave_lo = lp(hp(nz, 150), 900, 2)
    wave_hi = bp(nz, 1500, 6000) * 0.35
    sw2 = (0.5 + 0.5 * np.sin(TAU * t / 5.0 - 0.6)) ** 4
    waves = wave_lo * swell[:, None] + wave_hi * sw2[:, None]
    lvl = np.interp(t, [0, 5, 10, 14, 52, 56, 60], [1.0, 0.8, 0.3, 0.12, 0.12, 0.7, 0.7])
    waves *= lvl[:, None]

    ir = make_ir(2.2, 2.6, 11, 200, 5500)
    ep = chorus(autopan(mx.get('ep'), 4.8, 0.4), 2.5, 12, 0.5, 0.45)
    pad = chorus(mx.get('pad'), 4.0, 17, 0.25, 0.5)
    vibe = mx.get('vibe')
    vibe = vibe + echo(vibe, beat * 1.5, 0.22, 2, 3000)
    send = ep * 0.4 + pad * 0.5 + vibe * 0.55 + mx.get('rim') * 0.35 + mx.get('snare') * 0.4 + mx.get('tom') * 0.4 \
        + mx.get('crash') * 0.5
    wet = reverb(send, ir)
    out = (mx.get('kick') * 0.62 + mx.get('rim') * 0.42 + mx.get('snare') * 0.3 + mx.get('hat') * 0.20
           + mx.get('shaker') * 0.16 + mx.get('tom') * 0.4 + mx.get('crash') * 0.18 + mx.get('bass') * 0.50
           + ep * 0.50 + pad * 0.42 + vibe * 0.46 + wet * 0.55 + waves * 0.30)
    return out, bpm, SEC, list(range(2, 23))


if __name__ == '__main__':
    which = sys.argv[1:] or ['a', 'b']
    for w in which:
        out, bpm, sec, kb = (build_a if w == 'a' else build_b)()
        path = os.path.join(HERE, f'track_{w}.wav')
        y, I, pk, lra = master(out, path, fade_out=3.2 if w == 'a' else 3.6, shelf=0.6 if w == 'a' else 0.5)
        print(f'=== track_{w}: I={I} LUFS  truepeak={pk} dBFS  LRA={lra} LU')
        report(f'track_{w}', y, bpm, sec, kb)
