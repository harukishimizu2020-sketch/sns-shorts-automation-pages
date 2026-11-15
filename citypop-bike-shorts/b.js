// 動画B「夕凪ハイウェイ」: 夕暮れの海沿い〜商店街・後方追従視点+逆光シルエット・8mmフィルム調  96BPM 24小節=60秒
'use strict';
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const BAR = 2.5, HZ = 820, F = 900, CAMH = 1.9, CX = -1.8, BZ = 2.08, SPD = 16;
const CUTS = [5, 15, 25, 35, 45, 55];
let S = {};
const hex2 = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
// 時刻d(0=黄金色の夕方, 1=宵)で色を補間
function tod(d, stops) { let i = 0; while (i < stops.length - 2 && d > stops[i + 1][0]) i++; const [d0, a] = stops[i], [d1, b] = stops[i + 1]; const u = clamp((d - d0) / (d1 - d0)); const A = hex2(a), B = hex2(b); return `rgb(${Math.round(lerp(A[0], B[0], u))},${Math.round(lerp(A[1], B[1], u))},${Math.round(lerp(A[2], B[2], u))})`; }
const PAL = {
  skyTop: [[0, '#2f6f9a'], [.4, '#3a5a9a'], [.75, '#3a2f7a'], [1, '#1a1648']],
  skyMid: [[0, '#f7b58a'], [.4, '#f58a7a'], [.75, '#c8588a'], [1, '#6a3a8a']],
  skyLow: [[0, '#ffe2a0'], [.4, '#ffc27a'], [.75, '#ff9a6a'], [1, '#e8707a']],
  sun: [[0, '#fff3c4'], [.5, '#ffd27a'], [1, '#ff8a5a']],
  sea: [[0, '#2f8fa8'], [.4, '#3a7a9a'], [.75, '#4a4a8a'], [1, '#2a2460']],
  seaFar: [[0, '#ffd9a0'], [.4, '#ffb880'], [.75, '#e8808a'], [1, '#a0508a']],
  road: [[0, '#6a6478'], [.5, '#5a4f70'], [1, '#2e2850']],
  walk: [[0, '#e8c8a8'], [.5, '#d09a90'], [1, '#5a4878']],
  land: [[0, '#8fb07a'], [.5, '#8a8a70'], [1, '#3a3a60']],
  sil: [[0, '#3a2a50'], [.5, '#33224e'], [1, '#191338']],
  cloud: [[0, '#ffe9d0'], [.4, '#ffb8a0'], [.75, '#e87a9a'], [1, '#8a4a9a']],
  line: [[0, '#fff6dc'], [1, '#b8a8d8']],
};
const P_ = (k, d) => tod(d, PAL[k]);
const Xr = (s) => 14 * Math.sin(s / 90) + 6 * Math.sin(s / 37 + 1), dXr = (s) => 14 / 90 * Math.cos(s / 90) + 6 / 37 * Math.cos(s / 37 + 1), ddXr = (s) => -14 / 8100 * Math.sin(s / 90) - 6 / 1369 * Math.sin(s / 37 + 1);
function dOf(t) { if (t < 15) return 0.02; if (t < 25) return .18; if (t < 45) return lerp(.3, .78, (t - 25) / 20); if (t < 55) return .9; return 1; }

window.init = async function () {
  S.bike = mk(900, 900); S.tmp = mk(W, H);
  S.side = [0]; for (let f = 1; f <= 1800; f++) { const t = f / FPS; S.side.push(S.side[f - 1] + 1000 * (t < 5 ? sstep(3.3, 5, t) : 1) / FPS); }
  // 街のスカイライン(遠景シルエット)
  S.skyline = mk(2400, 200); { const c = S.skyline.getContext('2d'), r = rng(5); c.fillStyle = '#fff'; let x = 0; while (x < 2400) { const w = 30 + r() * 90, h = 30 + r() * r() * 150; c.fillRect(x, 200 - h, w + 1, h); x += w; } }
  S.hills = mk(2400, 260); { const c = S.hills.getContext('2d'); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, 260); for (let x = 0; x <= 2400; x += 20) c.lineTo(x, 260 - (70 + 60 * Math.sin(x / 190) + 40 * Math.sin(x / 83 + 2) + 30 * Math.sin(x / 400))); c.lineTo(2400, 260); c.fill(); }
  S.vig = mk(W, H); { const c = S.vig.getContext('2d'); const g = c.createRadialGradient(W / 2, H / 2, 560, W / 2, H / 2, 1220); g.addColorStop(0, 'rgba(40,10,0,0)'); g.addColorStop(1, 'rgba(40,10,0,.55)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
};
function tintImg(c, img, col, x, y, w, h, a) { const tc = S.tmp.getContext('2d'); tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'source-over'; tc.clearRect(0, 0, W, 300); tc.drawImage(img, 0, 0); tc.globalCompositeOperation = 'source-in'; tc.fillStyle = col; tc.fillRect(0, 0, W * 3, 300); tc.globalCompositeOperation = 'source-over'; }
function silStrip(c, img, col, off, y, sc, a) { // 白で描いた素材を色付けしてタイル描画
  const tc = S.tmp.getContext('2d'); const w = img.width, hh = img.height; tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'source-over'; tc.clearRect(0, 0, W, H);
  let x = -mod(off, w * sc); for (; x < W; x += w * sc) tc.drawImage(img, x, 0, w * sc, hh * sc);
  tc.globalCompositeOperation = 'source-in'; tc.fillStyle = col; tc.fillRect(0, 0, W, hh * sc + 2); tc.globalCompositeOperation = 'source-over';
  c.save(); c.globalAlpha = a == null ? 1 : a; c.drawImage(S.tmp, 0, 0, W, hh * sc, 0, y - hh * sc, W, hh * sc); c.restore();
}
function sky(c, d, sunX, sunY, sunR, t, hz, scroll) {
  const g = c.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, P_('skyTop', d)); g.addColorStop(.62, P_('skyMid', d)); g.addColorStop(1, P_('skyLow', d)); c.fillStyle = g; c.fillRect(-50, -50, W + 100, hz + 60);
  if (d > .55) { const a = sstep(.55, 1, d); for (let i = 0; i < 90; i++) { const tw = .6 + .4 * Math.sin(t * (1 + hash(i) * 3) + i); c.fillStyle = `rgba(255,250,235,${a * tw * (.4 + hash(i * 7) * .6)})`; const s = hash(i * 3) < .1 ? 4 : 2.4; c.fillRect(hash(i * 1.9) * W, hash(i * 5.3) * hz * .62, s, s); } }
  // 太陽(縞入り)
  if (sunY - sunR < hz) { glowDot(c, sunX, sunY, sunR * 2.6, 'rgba(255,220,150,.42)'); c.save(); c.beginPath(); c.rect(-50, -50, W + 100, hz + 50); c.clip(); const sg = c.createLinearGradient(0, sunY - sunR, 0, sunY + sunR); sg.addColorStop(0, P_('sun', d)); sg.addColorStop(1, tod(d, [[0, '#ff9a5a'], [1, '#ff4a6a']])); c.fillStyle = sg; c.beginPath(); c.arc(sunX, sunY, sunR, 0, TAU); c.fill();
    c.globalCompositeOperation = 'destination-out'; c.restore(); c.save(); c.beginPath(); c.arc(sunX, sunY, sunR + 2, 0, TAU); c.clip(); c.fillStyle = P_('skyLow', d); for (let i = 0; i < 6; i++) { const y = sunY + sunR * (.12 + i * .15), hh = sunR * (.022 + i * .013); if (y < hz) c.fillRect(sunX - sunR - 4, y, sunR * 2 + 8, Math.min(hh, hz - y)); } c.restore(); }
  // 雲
  const cc = P_('cloud', d); c.fillStyle = cc;
  for (let i = 0; i < 9; i++) { const y = hz * (.12 + hash(i * 2.1) * .66), w = 220 + hash(i * 3.7) * 420, x = mod(hash(i * 5.9) * 1800 - scroll * (.3 + hash(i) * .3) + t * (4 + hash(i * 8) * 6), W + 900) - 500; c.globalAlpha = .34 + hash(i * 4.4) * .4; const hh = 16 + hash(i * 6.1) * 26; rr(c, x, y, w, hh, hh / 2); c.fill(); rr(c, x + w * .18, y - hh * .8, w * .5, hh, hh / 2); c.fill(); rr(c, x - w * .12, y + hh * .8, w * .7, hh * .7, hh / 2); c.fill(); }
  c.globalAlpha = 1;
}
function palm(c, x, y, k, col, seed, t) { // k: px/m
  c.save(); c.translate(x, y); c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round'; const hgt = (7 + hash(seed) * 3) * k, bend = (hash(seed * 3) - .5) * 2.4 * k;
  c.lineWidth = Math.max(1.5, .34 * k); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(bend * .2, -hgt * .6, bend, -hgt); c.stroke();
  for (let i = 0; i < 9; i++) { const a = -Math.PI * (.02 + i / 8 * .96) + Math.sin(t * 1.6 + i + seed) * .05, L = (2.6 + hash(seed + i) * 1.2) * k; const ex = bend + Math.cos(a) * L, ey = -hgt + Math.sin(a) * L * .55 + L * .45; c.beginPath(); c.moveTo(bend, -hgt); c.quadraticCurveTo(bend + Math.cos(a) * L * .6, -hgt + Math.sin(a) * L * .7, ex, ey); c.quadraticCurveTo(bend + Math.cos(a) * L * .5, -hgt + Math.sin(a) * L * .7 + .5 * k, bend, -hgt); c.fill(); c.lineWidth = Math.max(1, .1 * k); c.stroke(); }
  c.restore();
}
const SIGNS = ['喫茶', 'パーマ', '酒', '薬', 'レコード', '写真', '時計', 'たばこ', '食堂', '本', '氷', '洋品', '電器', '中華', '寿司', 'クリーニング', '理容', '文具', '金物', '靴'];
const WALLS = ['#f2dcc0', '#f0b8a0', '#bfe0cf', '#b8d4ec', '#f0d080', '#e8c4d8', '#d8e0c0', '#f4e8d8'];
const SCOL = ['#e8452f', '#2f7fc0', '#f0b030', '#2fa07a', '#d83a7a', '#f4f0e0', '#7a4ac0'];

// ---------- 後方追従視点 ----------
function chase(c, t, o) {
  const d = o.d, s0 = o.s0, h = dXr(s0), off = (z) => Xr(s0 + z) - Xr(s0) - z * h;
  const P = (x, y, z) => { const k = F / z; return [W / 2 + (x + off(z) - CX) * k, HZ + (CAMH - y) * k, k]; };
  const quad = (pts, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fill(); };
  const town = o.mode === 'town', lit = sstep(.5, .72, d);
  const sunX = W / 2 - h * F * .8 + 40, sunY = HZ - 210 + d * 330;
  sky(c, d, sunX, sunY, 190, t, HZ, h * F * .8);
  const silc = P_('sil', d);
  if (town) { silStrip(c, S.hills, tod(d, [[0, '#c89ab0'], [1, '#4a3a7a']]), h * F * .8 + 600, HZ + 2, 1, .9); silStrip(c, S.skyline, tod(d, [[0, '#a87a9a'], [1, '#33285e']]), h * F * .8 + 300, HZ + 2, 1); if (lit > 0) { for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,220,150,${lit * (.4 + hash(i) * .6)})`; c.fillRect(mod(hash(i * 3.3) * 2400 - h * F * .8, 2400) - 600, HZ - 6 - hash(i * 7.1) * 90, 4, 4); } } }
  else { silStrip(c, S.hills, tod(d, [[0, '#7aa0b0'], [1, '#3a3070']]), h * F * .8 + 1500, HZ + 2, .8, .85); }
  // 地面(海 or 街の地面)
  const gg = c.createLinearGradient(0, HZ, 0, H); if (town) { gg.addColorStop(0, P_('walk', d)); gg.addColorStop(1, P_('walk', d)); } else { gg.addColorStop(0, P_('seaFar', d)); gg.addColorStop(.12, P_('sea', d)); gg.addColorStop(1, tod(d, [[0, '#1f6f8a'], [1, '#1a1a50']])); }
  c.fillStyle = gg; c.fillRect(-50, HZ, W + 100, H - HZ + 50);
  if (!town) { c.save(); c.globalCompositeOperation = 'lighter'; const fq = Math.floor(t * 10); for (let i = 0; i < 120; i++) { const yy = HZ + 4 + Math.pow(hash(i * 1.3), 2) * 520, sp = 40 + (yy - HZ) * .9; const x = sunX + (hash(i * 3.1 + fq * 1.7) - .5) * 2 * sp - 80; c.fillStyle = `rgba(255,236,190,${.55 * (1 - d * .5)})`; c.fillRect(x, yy, (10 + hash(i) * 40) * (.4 + (yy - HZ) / 300), 2 + (yy - HZ) / 120); } c.restore(); }
  // 道路セグメント
  const zs = []; for (let z = 1.25; z < 330; z *= 1.075) zs.push(z);
  const roadC = P_('road', d), lineC = P_('line', d);
  for (let i = zs.length - 2; i >= 0; i--) { const a = zs[i], b = zs[i + 1];
    if (!town) { quad([P(3.6, 0, a), P(3.6, 0, b), P(90, 0, b), P(90, 0, a)], P_('land', d)); quad([P(3.6, 0, a), P(3.6, 0, b), P(5.4, 0, b), P(5.4, 0, a)], P_('walk', d)); quad([P(-3.6, 0, a), P(-3.6, 0, b), P(-4.6, 0, b), P(-4.6, 0, a)], P_('walk', d)); }
    quad([P(-3.6, 0, a), P(-3.6, 0, b), P(3.6, 0, b), P(3.6, 0, a)], roadC);
    quad([P(-3.45, 0, a), P(-3.45, 0, b), P(-3.3, 0, b), P(-3.3, 0, a)], lineC); quad([P(3.45, 0, a), P(3.45, 0, b), P(3.3, 0, b), P(3.3, 0, a)], lineC);
    if (town) { quad([P(3.6, 0, a), P(3.6, 0, b), P(3.85, .18, b), P(3.85, .18, a)], tod(d, [[0, '#b8a090'], [1, '#3a3060']])); quad([P(-3.6, 0, a), P(-3.6, 0, b), P(-3.85, .18, b), P(-3.85, .18, a)], tod(d, [[0, '#b8a090'], [1, '#3a3060']])); }
    else { quad([P(-4.5, .55, a), P(-4.5, .55, b), P(-4.5, .78, b), P(-4.5, .78, a)], '#f4efe4'); }
  }
  for (let j = Math.floor(s0 / 8); j < Math.floor(s0 / 8) + 40; j++) { let a = j * 8 - s0, b = a + 3.6; if (b < 1.3) continue; a = Math.max(a, 1.3); quad([P(-.09, 0, a), P(-.09, 0, b), P(.09, 0, b), P(.09, 0, a)], tod(d, [[0, '#ffd870'], [1, '#c8a8a0']])); }
  if (!town) for (let j = Math.floor(s0 / 3); j < Math.floor(s0 / 3) + 60; j++) { const z = j * 3 - s0; if (z < 1.4) continue; const p0 = P(-4.5, 0, z), p1 = P(-4.5, .8, z); c.strokeStyle = '#d8d0c8'; c.lineWidth = Math.max(1, .12 * p0[2]); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); }
  // --- 沿道の物体を集めて奥から描く ---
  const objs = [];
  const add = (z, fn) => { if (z > 1.35 && z < 300) objs.push([z, fn]); };
  const i0 = Math.floor(s0 / 12) - 1;
  if (town || o.houses) for (let i = i0; i < i0 + 26; i++) for (const sx of (town ? [-1, 1] : [1])) {
    const id = i * 2 + (sx > 0 ? 1 : 0); if (!town && hash(id * 1.31) > .3) continue;
    const zb = i * 12 - s0, z1 = Math.max(zb, 1.4), z2 = zb + 10.4; if (z2 < 1.6) continue;
    const hgt = town ? 5.2 + Math.floor(hash(id * 2.7) * 3) * 2.7 : 4.2, wall = WALLS[Math.floor(hash(id * 3.9) * WALLS.length)], wx = sx * (town ? 6.6 : 8.5);
    const shade = tod(d, [[0, '#6a4a7a'], [1, '#1a1440']]);
    const mixc = (col, a) => { const A = hex2(col), m = shade.match(/\d+/g).map(Number); return `rgb(${Math.round(lerp(A[0], m[0], a))},${Math.round(lerp(A[1], m[1], a))},${Math.round(lerp(A[2], m[2], a))})`; };
    const sideC = mixc(wall, .12 + d * .62), endC = mixc(wall, .42 + d * .45);
    objs.push([Math.max(zb, 1.36), () => {
      if (zb > 1.4) { const a = P(wx, 0, zb), b = P(wx + sx * 10, hgt, zb); c.fillStyle = endC; c.fillRect(Math.min(a[0], b[0]), b[1], Math.abs(b[0] - a[0]), a[1] - b[1]); c.fillStyle = 'rgba(0,0,0,.14)'; c.fillRect(Math.min(a[0], b[0]), b[1], Math.abs(b[0] - a[0]), Math.max(2, .25 * a[2])); }
      quad([P(wx, 0, z1), P(wx, hgt, z1), P(wx, hgt, z2), P(wx, 0, z2)], sideC);
      // 1階の店先
      const openC = lit > 0 ? tod(lit, [[0, '#4a3a5a'], [1, '#ffcf7a']]) : '#5a4a60';
      for (let k2 = 0; k2 < 2; k2++) { const a = Math.max(zb + .6 + k2 * 5, 1.4), b = zb + 5 + k2 * 5; if (b > a + .2) quad([P(wx, 0, a), P(wx, 2.4, a), P(wx, 2.4, b), P(wx, 0, b)], openC); }
      const aw = SCOL[Math.floor(hash(id * 5.1) * SCOL.length)]; quad([P(wx, 3.1, z1), P(wx - sx * 1.1, 2.55, z1), P(wx - sx * 1.1, 2.55, z2), P(wx, 3.1, z2)], mixc(aw, d * .5));
      // 窓
      const fl = Math.round((hgt - 3.4) / 2.7); for (let j = 0; j < fl; j++) for (let k2 = 0; k2 < 3; k2++) { const a = zb + 1 + k2 * 3.2, b = a + 2; if (a < 1.4) continue; const y0 = 3.9 + j * 2.7; const on = lit > 0 && hash(id * 7.7 + j * 3.1 + k2) < .55; quad([P(wx, y0, a), P(wx, y0 + 1.5, a), P(wx, y0 + 1.5, b), P(wx, y0, b)], on ? tod(lit, [[0, '#6a6a90'], [1, '#ffd98a']]) : tod(d, [[0, '#8a9ab8'], [.4, '#e89a80'], [1, '#2a2458']])); }
    }]);
    // 袖看板
    const nS = town ? 2 : 0; for (let q = 0; q < nS; q++) { const zs2 = zb + 2 + q * 5 + hash(id + q) * 2; add(zs2, () => { const txt = SIGNS[Math.floor(hash(id * 9.3 + q * 4.1) * SIGNS.length)], n = [...txt].length; const col = SCOL[Math.floor(hash(id * 4.7 + q) * SCOL.length)]; const top = P(wx - sx * 1.25, 3.5 + n * 1.0 + hash(id + q * 2) * 1.5, zs2), k = top[2], x = Math.min(top[0], top[0] + sx * 1.15 * k), w = 1.15 * k, hh = (n * 1.0 + .3) * k;
      c.fillStyle = mixc(col, d * .35); c.fillRect(x, top[1], w, hh); if (lit > 0 && hash(id * 3.3 + q) < .6) { glowDot(c, x + w / 2, top[1] + hh / 2, hh * .9, mixHex(col, '#ffffff', .2).replace('rgb', 'rgba').replace(')', `,${lit * .45})`)); c.fillStyle = col; c.fillRect(x, top[1], w, hh); }
      if (k > 9) { c.fillStyle = col === '#f4f0e0' || col === '#f0b030' ? '#3a2030' : '#fff8e8'; c.font = `${.85 * k}px Dela`; vtext(c, txt, x + w / 2, top[1] + .65 * k, .85 * k, 1.0 * k); } }); }
  }
  // 電柱と電線
  for (let i = Math.floor(s0 / 24) - 1; i < Math.floor(s0 / 24) + 12; i++) for (const sx of (town ? [-1, 1] : [1])) { const z = i * 24 + (sx > 0 ? 0 : 12) - s0; add(z, () => { const px = sx * (town ? 4.25 : 6); const a = P(px, 0, z), b = P(px, 9, z), k = a[2]; c.strokeStyle = silc; c.lineWidth = Math.max(1.2, .26 * k); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.lineWidth = Math.max(1, .14 * k); const cr = P(px, 8.3, z); c.beginPath(); c.moveTo(cr[0] - 1.2 * k, cr[1]); c.lineTo(cr[0] + 1.2 * k, cr[1]); c.stroke(); const cr2 = P(px, 7.5, z); c.beginPath(); c.moveTo(cr2[0] - .9 * k, cr2[1]); c.lineTo(cr2[0] + .9 * k, cr2[1]); c.stroke();
      c.lineWidth = Math.max(.8, .035 * k); for (const dx of [-1.1, 0, 1.1]) { const zn = z + 24; const p0 = P(px + dx, 8.3, z), pm = P(px + dx, 7.6, z + 12), p1 = P(px + dx, 8.3, zn); c.beginPath(); c.moveTo(p0[0], p0[1]); c.quadraticCurveTo(pm[0], pm[1], p1[0], p1[1]); c.stroke(); }
      // 街灯
      const lp = P(px - sx * 1.6, 6.6, z); c.lineWidth = Math.max(1, .1 * k); c.beginPath(); c.moveTo(P(px, 6.9, z)[0], P(px, 6.9, z)[1]); c.lineTo(lp[0], lp[1]); c.stroke(); c.fillStyle = lit > 0 ? '#fff4d0' : '#e8e0d0'; c.beginPath(); c.ellipse(lp[0], lp[1], .45 * k, .2 * k, 0, 0, TAU); c.fill(); if (lit > 0) { glowDot(c, lp[0], lp[1] + .2 * k, 3.4 * k, `rgba(255,220,150,${.6 * lit})`); const gp = P(px - sx * 1.6, 0, z); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,210,140,${.16 * lit})`; c.beginPath(); c.ellipse(gp[0], gp[1], 3.4 * k, .5 * k, 0, 0, TAU); c.fill(); c.restore(); } }); }
  // ヤシ(海沿い)
  if (!town) { for (let i = Math.floor(s0 / 16) - 1; i < Math.floor(s0 / 16) + 16; i++) { const z = i * 16 + 5 - s0; add(z, () => { const p = P(-5.6, 0, z); palm(c, p[0], p[1], p[2], tod(d, [[0, '#2a5a5a'], [.5, '#33304e'], [1, '#171338']]), i * 3.3, t); }); if (hash(i * 5.7) < .45) { const z3 = i * 16 + 11 - s0; add(z3, () => { const p = P(7.6, 0, z3); palm(c, p[0], p[1], p[2], tod(d, [[0, '#3a6a5a'], [.5, '#3a3a5a'], [1, '#1c173e']]), i * 7.1, t); }); } } }
  // 商店街アーチと提灯
  if (town) { for (let i = Math.floor(s0 / 150); i < Math.floor(s0 / 150) + 3; i++) { const z = i * 150 + 90 - s0; add(z, () => { const l = P(-3.95, 0, z), r = P(3.95, 0, z), k = l[2], top = P(0, 7.9, z), b0 = P(0, 6.2, z); c.fillStyle = tod(d, [[0, '#e8452f'], [1, '#8a2a4a']]); c.fillRect(l[0] - .25 * k, top[1], .5 * k, l[1] - top[1]); c.fillRect(r[0] - .25 * k, top[1], .5 * k, r[1] - top[1]); c.fillStyle = tod(d, [[0, '#fff4dc'], [1, '#c8b8d8']]); c.fillRect(l[0], top[1], r[0] - l[0], b0[1] - top[1]); c.fillStyle = tod(d, [[0, '#e8452f'], [1, '#8a2a4a']]); c.fillRect(l[0], top[1], r[0] - l[0], .22 * k); c.fillRect(l[0], b0[1] - .22 * k, r[0] - l[0], .22 * k); c.beginPath(); c.ellipse(top[0], top[1], 1.9 * k, .9 * k, 0, Math.PI, TAU); c.fill();
        if (k > 5) { c.fillStyle = '#c0282a'; c.font = `${1.15 * k}px Dela`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('夕凪銀座商店街', top[0], (top[1] + b0[1]) / 2 + .04 * k, (r[0] - l[0]) * .92); c.fillStyle = '#fff4dc'; c.font = `${.6 * k}px Dela`; c.fillText('★', top[0], top[1] - .42 * k); }
        if (lit > 0) for (let q = 0; q < 9; q++) { const bx = lerp(l[0], r[0], (q + .5) / 9); glowDot(c, bx, b0[1] + .1 * k, .9 * k, `rgba(255,230,160,${.8 * lit})`); } }); }
    for (let i = Math.floor(s0 / 30) - 1; i < Math.floor(s0 / 30) + 8; i++) { const z = i * 30 + 14 - s0; add(z, () => { const l = P(-4.2, 5.6, z), r = P(4.2, 5.6, z), k = l[2]; c.strokeStyle = silc; c.lineWidth = Math.max(.8, .04 * k); c.beginPath(); c.moveTo(l[0], l[1]); c.quadraticCurveTo((l[0] + r[0]) / 2, l[1] + .9 * k, r[0], r[1]); c.stroke(); for (let q = 1; q < 8; q++) { const u = q / 8, x = lerp(l[0], r[0], u), y = l[1] + .9 * k * 2 * u * (1 - u) + .3 * k; if (lit > 0) glowDot(c, x, y, 1.1 * k, `rgba(255,120,70,${.55 * lit})`); c.fillStyle = q % 2 ? '#e8452f' : '#fff0d8'; c.beginPath(); c.ellipse(x, y, .22 * k, .3 * k, 0, 0, TAU); c.fill(); } }); } }
  objs.sort((a, b) => b[0] - a[0]);
  let hazed = false; const haze = () => { const hg = c.createLinearGradient(0, HZ - 150, 0, HZ + 120); hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(.55, P_('skyLow', d).replace('rgb', 'rgba').replace(')', ',.55)')); hg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = hg; c.fillRect(-50, HZ - 150, W + 100, 270); hazed = true; };
  for (const [z, fn] of objs) { if (!hazed && z < 70) haze(); c.save(); fn(); c.restore(); } if (!hazed) haze();
  // 道路への夕陽の照り返し
  c.save(); c.globalCompositeOperation = 'lighter'; const rg = c.createLinearGradient(0, HZ, 0, HZ + 500); rg.addColorStop(0, `rgba(255,190,120,${.34 * (1 - d * .7)})`); rg.addColorStop(1, 'rgba(255,190,120,0)'); c.fillStyle = rg; c.beginPath(); c.moveTo(P(-3.4, 0, 300)[0], HZ); c.lineTo(P(3.4, 0, 300)[0], HZ); c.lineTo(P(3.4, 0, 2.2)[0], HZ + 780); c.lineTo(P(-3.4, 0, 2.2)[0], HZ + 780); c.fill(); c.restore();
  // バイク
  const bz = o.bz || BZ, bp = P(CX, 0, bz), bs = 1.15 * BZ / bz, lean = clamp(-ddXr(s0 + bz) * 50, -.3, .3) + Math.sin(t * 1.3) * .012;
  const bx = bp[0] + (o.bz ? 0 : Math.sin(t * .7) * 14), by = bp[1];
  const b = S.bike, bc = b.getContext('2d'); bc.setTransform(1, 0, 0, 1, 0, 0); bc.globalCompositeOperation = 'source-over'; bc.clearRect(0, 0, 900, 900); bc.setTransform(1.15, 0, 0, 1.15, 450, 840);
  drawBikeRear(bc, { t, lightOn: d > .5, body: '#2aa39a', jacket: '#f0e4cc', scarf: '#ff5a4d', mirror: P_('skyLow', d) });
  bc.setTransform(1, 0, 0, 1, 0, 0); bc.globalCompositeOperation = 'source-atop'; bc.fillStyle = tod(d, [[0, 'rgb(90,40,80)'], [1, 'rgb(20,14,60)']].map(([a, b2]) => [a, '#' + b2.match(/\d+/g).map(v => (+v).toString(16).padStart(2, '0')).join('')])).replace('rgb', 'rgba').replace(')', `,${.2 + d * .42})`); bc.fillRect(0, 0, 900, 900);
  const tg = bc.createLinearGradient(0, 80, 0, 520); tg.addColorStop(0, `rgba(255,200,130,${.45 * (1 - d * .6)})`); tg.addColorStop(1, 'rgba(255,200,130,0)'); bc.fillStyle = tg; bc.fillRect(0, 0, 900, 900);
  c.save(); c.translate(bx, by); c.scale(bs / 1.15, bs / 1.15);
  c.fillStyle = 'rgba(30,10,50,.30)'; c.beginPath(); c.moveTo(-50, -6); c.lineTo(50, -6); c.lineTo(130, 420); c.lineTo(-130, 420); c.closePath(); c.fill();
  if (d > .5) { c.save(); c.globalCompositeOperation = 'lighter'; const lg = c.createRadialGradient(0, -260, 0, 0, -260, 420); lg.addColorStop(0, `rgba(255,236,180,${.4 * lit})`); lg.addColorStop(1, 'rgba(255,236,180,0)'); c.translate(0, -640); c.scale(.8, .22); c.translate(0, 260); c.fillStyle = lg; c.fillRect(-420, -680, 840, 840); c.restore(); }
  c.rotate(lean); c.drawImage(b, -450, -840);
  if (d > .5) glowDot(c, 0, -258, 110, `rgba(255,50,50,${.8 * lit})`);
  c.restore();
}

// ---------- 逆光シルエット(横) ----------
function sideShot(c, t, f, o) {
  const d = o.d, off = S.side[f] + (o.off || 0), hz = 1190, GY = 1480, sil = P_('sil', d);
  sky(c, d, 540, o.sunY, 360, t, hz, off * .01);
  silStrip(c, S.hills, tod(d, [[0, '#d88a8a'], [1, '#4a3a80']]), off * .012 + 300, hz + 3, .7, .9);
  const sg = c.createLinearGradient(0, hz, 0, GY); sg.addColorStop(0, P_('seaFar', d)); sg.addColorStop(.35, tod(d, [[0, '#f09a7a'], [.6, '#a05a8a'], [1, '#3a2a6a']])); sg.addColorStop(1, tod(d, [[0, '#7a4a7a'], [1, '#1f1a4a']])); c.fillStyle = sg; c.fillRect(-50, hz, W + 100, GY - hz);
  c.save(); c.globalCompositeOperation = 'lighter'; const fq = Math.floor(t * 9); for (let i = 0; i < 110; i++) { const yy = hz + 3 + Math.pow(hash(i * 1.3), 1.6) * (GY - hz - 40), sp = 60 + (yy - hz) * 1.3; const x = 540 + (hash(i * 3.1 + fq * 1.7) - .5) * 2 * sp; c.fillStyle = `rgba(255,240,200,${(.75 - d * .45)})`; c.fillRect(x - 20, yy, (16 + hash(i) * 50) * (.5 + (yy - hz) / 200), 2.5 + (yy - hz) / 80); } c.restore();
  if (d > .6) { for (let i = 0; i < 60; i++) { const x = mod(hash(i * 3.7) * 1600 - off * .012, 1600) - 200; const col = ['255,220,150', '255,150,170', '170,230,255'][i % 3]; glowDot(c, x, hz - 4 - hash(i) * 26, 10, `rgba(${col},.9)`); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(${col},.22)`; c.fillRect(x - 2, hz + 4, 4, 30 + hash(i * 2) * 60); c.restore(); } }
  // カモメ
  if (d < .6) { c.strokeStyle = sil; c.lineWidth = 4; c.lineCap = 'round'; for (let i = 0; i < 4; i++) { const x = mod(200 + i * 310 + t * (22 + i * 6), W + 200) - 100, y = 520 + i * 70 + Math.sin(t * .8 + i) * 30, fl = Math.sin(t * 5 + i * 2) * 12, s = 1 - i * .12; c.beginPath(); c.moveTo(x - 30 * s, y - fl); c.quadraticCurveTo(x - 12 * s, y - 14 * s, x, y); c.quadraticCurveTo(x + 12 * s, y - 14 * s, x + 30 * s, y - fl); c.stroke(); } }
  // 奥の電柱・電線・ヤシ・ガードレール
  c.strokeStyle = sil; c.fillStyle = sil;
  for (let k = -1; k < 3; k++) { const x = k * 900 - mod(off * .8, 900) + 300; c.fillRect(x - 8, GY - 590, 16, 600); c.fillRect(x - 64, GY - 566, 128, 9); c.fillRect(x - 48, GY - 520, 96, 8); c.lineWidth = 2.5; for (const [dy, sag] of [[-562, 60], [-516, 70]]) for (const dx of [-56, 0, 56]) { c.beginPath(); c.moveTo(x + dx, GY + dy); c.quadraticCurveTo(x + 450, GY + dy + sag, x + 900 + dx, GY + dy); c.stroke(); }
    if (d > .6) { glowDot(c, x - 70, GY - 440, 170, 'rgba(255,220,150,.6)'); c.fillStyle = '#fff4d0'; c.beginPath(); c.ellipse(x - 70, GY - 446, 22, 9, 0, 0, TAU); c.fill(); c.fillStyle = sil; c.lineWidth = 6; c.beginPath(); c.moveTo(x, GY - 470); c.lineTo(x - 70, GY - 452); c.stroke(); } }
  for (let k = -1; k < 3; k++) { const x = k * 1300 - mod(off * .8 + 500, 1300) + 300; palm(c, x, GY + 6, 66, sil, k + Math.floor((off * .8 + 500) / 1300) * 1.7, t); }
  c.fillRect(-50, GY - 62, W + 100, 9); c.fillRect(-50, GY - 34, W + 100, 7); for (let k = -1; k < 9; k++) { const x = k * 150 - mod(off, 150); c.fillRect(x, GY - 66, 10, 70); }
  // 路面
  const gg = c.createLinearGradient(0, GY, 0, H); gg.addColorStop(0, tod(d, [[0, '#4a3058'], [1, '#221a48']])); gg.addColorStop(.2, sil); gg.addColorStop(1, tod(d, [[0, '#241634'], [1, '#0e0a24']])); c.fillStyle = gg; c.fillRect(-50, GY, W + 100, H - GY + 50);
  c.fillStyle = tod(d, [[0, '#ffb080'], [1, '#7a5aa0']]); c.globalAlpha = .55; c.fillRect(-50, GY, W + 100, 5); c.globalAlpha = .3; for (let k = -1; k < 5; k++) { const x = k * 440 - mod(off * 1.25, 440); c.beginPath(); c.moveTo(x, 1690); c.lineTo(x + 240, 1690); c.lineTo(x + 230, 1708); c.lineTo(x - 10, 1708); c.closePath(); c.fill(); } c.globalAlpha = 1;
  // バイク
  const s = 1.5, bx = 540 - 155 * s; const moving = S.side[f] > 1;
  if (d > .6) { const hx = bx + 297 * s, hy = GY - 184 * s; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(hx, 0, hx + 700, 0); g.addColorStop(0, 'rgba(255,240,190,.5)'); g.addColorStop(1, 'rgba(255,240,190,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(hx, hy - 10); c.lineTo(hx + 700, hy - 90); c.lineTo(hx + 700, GY + 30); c.lineTo(hx + 150, GY + 8); c.closePath(); c.fill(); c.restore(); }
  c.save(); c.translate(bx, GY); c.scale(s, s); drawBikeSide(c, { sil: tod(d, [[0, '#2a1a3e'], [1, '#0c0820']]), rot: off / (BIKE.R * s), t, bob: moving ? Math.sin(t * 21) * .8 + Math.sin(t * 6.1) * 1.1 : 0 }); c.restore();
  // 逆光の縁取り
  if (d < .6) glowDot(c, bx + 170 * s, GY - 338 * s - 30, 90, 'rgba(255,230,170,.5)');
  if (d > .6) { glowDot(c, bx + 300 * s, GY - 184 * s, 150, 'rgba(255,244,200,.95)'); glowDot(c, bx + 300 * s, GY - 184 * s, 40, 'rgba(255,255,255,1)'); }
  glowDot(c, bx - 32 * s, GY - 148 * s, 70, 'rgba(255,50,50,.9)', d > .6 ? 1 : .6);
  // 手前の草
  c.fillStyle = tod(d, [[0, '#1c1028'], [1, '#080616']]); for (let k = 0; k < 9; k++) { const x = mod(k * 520 + hash(k) * 300 - off * 1.7, 4200) - 300; if (x > W + 200) continue; c.beginPath(); c.moveTo(x - 90, H + 10); for (let q = 0; q < 9; q++) { const a = q / 8, hh = 150 + hash(k * 9 + q) * 190; c.quadraticCurveTo(x - 90 + a * 180 - 10, H - hh * .6, x - 90 + a * 180 + (hash(q + k) - .5) * 80 + Math.sin(t * 3 + q) * 8, H - hh); c.lineTo(x - 90 + a * 180 + 18, H + 10); } c.closePath(); c.fill(); }
}
function titleCard(c, t) {
  const a = sstep(.7, 1.6, t) * (1 - sstep(4.0, 4.8, t)); if (a <= 0) return; c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.font = '150px Reggae'; c.strokeStyle = '#c0382a'; c.lineWidth = 30; c.strokeText('夕凪', W / 2, 250); c.strokeText('ハイウェイ', W / 2, 420); c.strokeStyle = '#fff4dc'; c.lineWidth = 12; c.strokeText('夕凪', W / 2, 250); c.strokeText('ハイウェイ', W / 2, 420);
  const g = c.createLinearGradient(0, 180, 0, 480); g.addColorStop(0, '#ffb23a'); g.addColorStop(1, '#f0503a'); c.fillStyle = g; c.fillText('夕凪', W / 2, 250); c.fillText('ハイウェイ', W / 2, 420);
  c.font = '84px Pacifico'; c.fillStyle = '#fff8e8'; c.shadowColor = 'rgba(160,50,40,.7)'; c.shadowBlur = 0; c.shadowOffsetX = 4; c.shadowOffsetY = 5; c.fillText('Yunagi Highway', W / 2, 570);
  c.font = '44px Kaisei'; c.shadowOffsetX = 2; c.shadowOffsetY = 3; c.fillText('昭和五十八年  晩夏', W / 2, 680); c.restore();
}
function post(c, t, f) {
  // フィルムの明滅・光漏れ・傷・ゴミ
  const fl = (hash(f * 1.7) - .5) * .05; c.fillStyle = fl > 0 ? `rgba(255,240,210,${fl})` : `rgba(30,10,0,${-fl})`; c.fillRect(0, 0, W, H);
  c.save(); c.globalCompositeOperation = 'lighter'; const la = .10 + .09 * Math.sin(t * .9) + (hash(Math.floor(t * 4)) < .12 ? .12 : 0); const lg = c.createRadialGradient(-80, 500 + 300 * Math.sin(t * .31), 0, -80, 500 + 300 * Math.sin(t * .31), 700); lg.addColorStop(0, `rgba(255,120,40,${la})`); lg.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = lg; c.fillRect(0, 0, W, H); c.restore();
  for (let k = 0; k < 3; k++) if (hash(f * 3.3 + k * 11) < .22) { const x = hash(Math.floor(f / 5) * 2.1 + k) * W + (hash(f + k) - .5) * 6; c.fillStyle = `rgba(255,250,235,${.08 + hash(f * k) * .12})`; c.fillRect(x, 0, 2, H); }
  for (let k = 0; k < 7; k++) { const x = hash(f * 7.1 + k * 3) * W, y = hash(f * 5.3 + k * 9) * H, r = 2 + hash(f + k) * 5; c.fillStyle = hash(f * 2 + k) < .6 ? 'rgba(30,14,10,.55)' : 'rgba(255,250,235,.5)'; c.beginPath(); c.ellipse(x, y, r, r * (.5 + hash(k + f * 3)), hash(f * k) * 3, 0, TAU); c.fill(); }
  c.drawImage(S.vig, 0, 0);
  // 写真の日付焼き込み風
  c.save(); c.font = '66px VT'; c.textAlign = 'right'; c.textBaseline = 'middle'; c.shadowColor = '#ff6a10'; c.shadowBlur = 14; c.fillStyle = '#ffa030'; c.fillText("'83  8 21", W - 70, H - 150); c.restore();
  let g = 0; for (const ct of CUTS) if (t >= ct && t < ct + .22) g = 1 - (t - ct) / .22; if (g > 0) { c.fillStyle = `rgba(255,236,200,${g * .8})`; c.fillRect(0, 0, W, H); }
  const fi = 1 - sstep(0, 1.0, t); if (fi > 0) { c.fillStyle = `rgba(255,232,190,${fi})`; c.fillRect(0, 0, W, H); }
  const fo = sstep(58.2, 59.8, t); if (fo > 0) { c.fillStyle = `rgba(10,4,20,${fo})`; c.fillRect(0, 0, W, H); }
}
const LY = { color: '#fff8ea', glow: 'rgba(200,70,40,.9)', stroke: 'rgba(90,30,40,.5)', back: 'rgba(80,30,50,.22)', font: 'Yusei', size: 72 };
window.renderFrame = function (f) {
  const t = f / FPS, c = ctx, d = dOf(t); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  // ゲートの揺れ
  c.save(); c.translate(W / 2 + (hash(f * 1.3) - .5) * 3, H / 2 + (hash(f * 2.9) - .5) * 4); c.scale(1.01, 1.01); c.translate(-W / 2, -H / 2);
  if (t < 5) { sideShot(c, t, f, { d, sunY: 1010 }); }
  else if (t < 15) { chase(c, t, { d, mode: 'coast', s0: 40 + SPD * (t - 5), houses: true }); }
  else if (t < 25) { const z = lerp(1.0, 1.12, (t - 15) / 10); c.translate(540, 1300); c.scale(z, z); c.translate(-540, -1300); sideShot(c, t, f, { d, sunY: 1040 }); }
  else if (t < 35) { chase(c, t, { d, mode: 'town', s0: 300 + SPD * (t - 25) }); }
  else if (t < 45) { const z = lerp(1.42, 1.25, (t - 35) / 10); c.translate(540, 1420); c.scale(z, z); c.translate(-540, -1420); chase(c, t, { d, mode: 'town', s0: 300 + SPD * (t - 25) }); }
  else if (t < 55) { sideShot(c, t, f, { d, sunY: 1500, off: 3000 }); }
  else { const u = t - 55; chase(c, t, { d, mode: 'coast', s0: 900 + SPD * .55 * u, houses: true, bz: BZ + Math.pow(sstep(.3, 5, u), 1.5) * 24 }); }
  c.restore();
  titleCard(c, t);
  lyricV(c, '海沿いの道、\n夏の終わり。', t, 5.7, 14.6, { ...LY, x: 950, y: 150 });
  lyricV(c, '夕陽に、\n追いつけそうな気がした。', t, 15.7, 24.6, { ...LY, x: 950, y: 120, size: 66 });
  lyricV(c, 'いつもの街が、\n茜色に染まる。', t, 25.7, 34.6, { ...LY, x: 950, y: 150 });
  lyricV(c, '商店街に、\n灯がともる。', t, 35.7, 44.6, { ...LY, x: 950, y: 150 });
  lyricV(c, '風の匂いを、\nまだ覚えている。', t, 45.7, 54.6, { ...LY, x: 950, y: 150, glow: 'rgba(120,70,200,.9)', back: 'rgba(20,10,60,.4)' });
  lyricV(c, 'また、\nあの夏へ。', t, 55.9, 59.5, { ...LY, x: 620, y: 240, size: 88, glow: 'rgba(120,70,200,.9)', back: 'rgba(20,10,60,.4)' });
  post(c, t, f);
};
