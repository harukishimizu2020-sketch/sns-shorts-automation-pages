// 動画①「海沿いの道 The Coast Road」: カラー漫画風。1ページのコマ割りの中で各コマが静かに動き続ける。84BPM 21小節=60秒
// 午後の入道雲から夕暮れへ、60秒かけて色が移ろう。風鈴は 6.0 / 19.5 / 33.0 / 47.0 秒に鳴る(BGMと同期)
'use strict';
const cv = document.getElementById('cv'), ctx = cv.getContext('2d', { willReadFrequently: true });
const PA = [[40, 40], [1040, 40], [1040, 770], [40, 830]], PB = [[40, 858], [1040, 798], [1040, 1350], [40, 1350]], PC1 = [[40, 1378], [510, 1378], [510, 1880], [40, 1880]], PC2 = [[538, 1378], [1040, 1378], [1040, 1880], [538, 1880]];
const CHIMES = [6.0, 19.5, 33.0, 47.0], SPD = 560;
let S = {};
const K = {
  skyTop: [[0, '#3f98d6'], [.45, '#5a86cc'], [.8, '#5f4fa0'], [1, '#2c2c6c']],
  skyLow: [[0, '#cdeaf4'], [.45, '#ffdca4'], [.8, '#ff9c7c'], [1, '#d0708c']],
  cloud: [[0, '#ffffff'], [.45, '#fff2e0'], [.8, '#ffc6b4'], [1, '#c09ac6']],
  cshade: [[0, '#b4d2ee'], [.45, '#f2b68c'], [.8, '#cc7c9c'], [1, '#6c5c9c']],
  sea: [[0, '#2a8cc4'], [.45, '#3c86b4'], [.8, '#4c5a9c'], [1, '#2c306c']],
  seaHi: [[0, '#8fd4ec'], [.45, '#ffd0a0'], [.8, '#ff9a84'], [1, '#b06a94']],
  wall: [[0, '#f0e8d8'], [.45, '#f4dcc0'], [.8, '#d0a0b0'], [1, '#7c6c9c']],
  road: [[0, '#8c8ea4'], [.45, '#8a809c'], [.8, '#6c5c8c'], [1, '#3c3868']],
  dark: [[0, '#2c3450'], [.8, '#2a2448'], [1, '#18143a']],
  land: [[0, '#4c9c7c'], [.45, '#5c8c6c'], [.8, '#4c4c7c'], [1, '#2a2a58']],
};
const C = (k, d) => ramp(d, K[k]);
const path = (c, p) => { c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); c.closePath(); };
window.init = async function () { S.paper = makePaper(55, '#f7f1e3'); };
function skyFill(c, d, y0, y1) { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, C('skyTop', d)); g.addColorStop(1, C('skyLow', d)); c.fillStyle = g; c.fillRect(0, y0 - 2, W, y1 - y0 + 4); }
const BLOBS = [[0, 0, 92], [84, -44, 112], [176, -96, 124], [268, -44, 104], [340, 12, 84], [124, -176, 94], [206, -214, 74], [-72, 22, 72], [410, 30, 60]];
function nyudo(c, x, y, s, d, base) { // 入道雲
  c.save(); c.beginPath(); c.rect(-100, -2000, W + 200, 2000 + base); c.clip();
  for (const [col, ox, oy] of [[C('cshade', d), 0, 0], [C('cloud', d), -18 * s, -22 * s]]) { c.fillStyle = col; for (const [bx, by, br] of BLOBS) { c.beginPath(); c.arc(x + bx * s + ox, y + by * s + oy, br * s, 0, TAU); c.fill(); } }
  c.restore();
}
function sun(c, x, y, r, d) { glowDot(c, x, y, r * 2.4, hexA('#ffe0a0', .5)); c.fillStyle = ramp(d, [[0, '#fff8d8'], [.5, '#ffe090'], [1, '#ff8a6a']]); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
function glitter(c, x, y0, y1, t, d, n) { c.fillStyle = hexA('#fff6dc', .8 - d * .3); const fq = Math.floor(t * 7); for (let i = 0; i < n; i++) { const yy = y0 + 3 + Math.pow(hash(i * 1.3), 1.4) * (y1 - y0 - 8), sp = 20 + (yy - y0) * 1.5; c.fillRect(x + (hash(i * 3.1 + fq * 1.7) - .5) * 2 * sp, yy, (40 + hash(i) * 70) * (.5 + (yy - y0) / 90), 5); } }
const BK = { body: '#2aa39a', body2: '#1a6f6a', jacket: '#eadcc0', jeans: '#3a5a8c', scarf: '#e8553f', helmet: '#f4efe2', helmetStripe: '#e8553f', stripe: '#fff0c0' };
function tint(c, d, p) { // 夕暮れの色かぶり(乗算)
  c.save(); path(c, p); c.clip(); c.globalCompositeOperation = 'multiply'; c.fillStyle = ramp(d, [[0, '#ffffff'], [.5, '#fff0dc'], [.85, '#d8b4d0'], [1, '#a096c8']]); c.fillRect(0, 0, W, H); c.restore();
}
// ---- コマA: 海沿いを走る引きの絵 ----
function panelA(c, t, d) {
  const sc = t * SPD, HZ = 560, RY = 690, GY = 748, bs = .62, bx = 470 - 155 * bs, lit = sstep(.72, .9, d);
  c.save(); path(c, PA); c.clip();
  skyFill(c, d, 40, HZ);
  if (d > .6) for (let i = 0; i < 40; i++) { c.fillStyle = hexA('#fffbe8', sstep(.6, 1, d) * (.4 + hash(i) * .6)); c.fillRect(hash(i * 1.9) * W, 50 + hash(i * 5.3) * 260, 3, 3); }
  sun(c, 330, lerp(250, 600, d), 58, d);
  nyudo(c, 640 - t * 2.2, 470, 1.25, d, HZ); nyudo(c, 60 - t * 1.4, 530, .5, d, HZ);
  // 岬と灯台
  { const hx = 900 - sc * .02; c.fillStyle = C('land', d); c.beginPath(); c.moveTo(hx - 300, HZ); c.quadraticCurveTo(hx - 120, HZ - 110, hx + 40, HZ - 70); c.quadraticCurveTo(hx + 200, HZ - 40, hx + 320, HZ); c.closePath(); c.fill(); c.fillStyle = '#fbf6ea'; c.beginPath(); c.moveTo(hx + 30, HZ - 70); c.lineTo(hx + 38, HZ - 150); c.lineTo(hx + 58, HZ - 150); c.lineTo(hx + 66, HZ - 66); c.closePath(); c.fill(); c.fillStyle = '#e8553f'; c.fillRect(hx + 34, HZ - 162, 28, 14); if (lit > 0 && Math.sin(t * 2.2) > .2) glowDot(c, hx + 48, HZ - 156, 110, hexA('#fff0b0', .9 * lit)); }
  const sg = c.createLinearGradient(0, HZ, 0, RY - 50); sg.addColorStop(0, C('seaHi', d)); sg.addColorStop(.35, C('sea', d)); sg.addColorStop(1, C('sea', d)); c.fillStyle = sg; c.fillRect(0, HZ, W, RY - 50 - HZ);
  glitter(c, 330, HZ, RY - 50, t, d, 16);
  c.strokeStyle = hexA('#ffffff', .55); c.lineWidth = 3; for (let i = 0; i < 6; i++) { const y = HZ + 22 + i * 12, x = mod(hash(i * 2.7) * 1400 - sc * (.03 + i * .012), W + 400) - 200, w = 80 + hash(i * 9) * 160; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 5, x + w, y); c.stroke(); }
  // 防波堤・道
  c.fillStyle = C('wall', d); c.fillRect(0, RY - 50, W, 50); c.fillStyle = hexA('#3a3050', .16); for (let k = -1; k < 12; k++) { const x = k * 120 - mod(sc, 120); c.fillRect(x, RY - 50, 3, 50); } c.fillStyle = hexA('#3a3050', .22); c.fillRect(0, RY - 8, W, 8);
  c.fillStyle = C('road', d); c.fillRect(0, RY, W, 160); c.fillStyle = hexA('#fff6dc', .85); for (let k = -1; k < 5; k++) { const x = k * 330 - mod(sc * 1.15, 330); c.fillRect(x, 800, 170, 9); }
  // 道ばたの物(電柱・バス停・鳥居・自販機)
  const dk = C('dark', d);
  for (let k = -1; k < 3; k++) { const x = k * 800 - mod(sc, 800) + 260; c.fillStyle = dk; c.fillRect(x - 7, RY - 340, 14, 344); c.fillRect(x - 54, RY - 318, 108, 8); c.fillRect(x - 40, RY - 280, 80, 7); c.strokeStyle = dk; c.lineWidth = 2.5; for (const [dy, sag] of [[-314, 56], [-276, 66]]) for (const dx of [0]) { c.beginPath(); c.moveTo(x + dx, RY + dy); c.quadraticCurveTo(x + 400, RY + dy + sag, x + 800 + dx, RY + dy); c.stroke(); } c.lineWidth = 5; c.beginPath(); c.moveTo(x, RY - 250); c.lineTo(x + 56, RY - 238); c.stroke(); c.fillStyle = lit > 0 ? '#fff6d0' : '#e8e4d8'; c.beginPath(); c.ellipse(x + 60, RY - 236, 16, 7, 0, 0, TAU); c.fill(); if (lit > 0) glowDot(c, x + 60, RY - 230, 120, hexA('#ffe6a8', .8 * lit)); }
  const obj = mod(sc, 3600);
  { const x = 1500 - obj; if (x > -300 && x < W + 100) { c.fillStyle = '#f4efe2'; c.fillRect(x, RY - 150, 200, 14); c.fillStyle = dk; c.fillRect(x + 10, RY - 136, 8, 136); c.fillRect(x + 182, RY - 136, 8, 136); c.fillStyle = '#7fb8d0'; c.fillRect(x + 30, RY - 44, 140, 12); c.fillStyle = dk; c.fillRect(x + 40, RY - 32, 6, 32); c.fillRect(x + 154, RY - 32, 6, 32); c.fillRect(x + 234, RY - 130, 7, 130); c.fillStyle = '#ffd24a'; c.beginPath(); c.arc(x + 237, RY - 150, 30, 0, TAU); c.fill(); c.fillStyle = '#e8553f'; c.fillRect(x + 212, RY - 156, 50, 12); } }
  { const x = 2700 - obj; if (x > -300 && x < W + 100) { c.fillStyle = '#d8503c'; c.fillRect(x, RY - 170, 14, 170); c.fillRect(x + 116, RY - 170, 14, 170); c.fillRect(x - 14, RY - 140, 158, 11); c.beginPath(); c.moveTo(x - 34, RY - 186); c.quadraticCurveTo(x + 65, RY - 170, x + 164, RY - 186); c.lineTo(x + 158, RY - 166); c.quadraticCurveTo(x + 65, RY - 152, x - 28, RY - 166); c.closePath(); c.fill(); c.fillStyle = '#b8b0a0'; c.fillRect(x + 20, RY - 14, 90, 14); } }
  { const x = 3500 - obj + (obj < 400 ? -3600 : 0) + 0; const xx = mod(x + 400, 3600) - 400; if (xx > -200 && xx < W + 100) { c.fillStyle = '#f6fbff'; rr(c, xx, RY - 150, 74, 150, 5); c.fill(); c.fillStyle = '#e8553f'; c.fillRect(xx, RY - 150, 74, 28); const vc = ['#f0a030', '#4ab0d0', '#f0d85a']; for (let i = 0; i < 3; i++) { c.fillStyle = vc[i]; c.fillRect(xx + 9 + i * 20, RY - 110, 14, 26); c.fillRect(xx + 9 + i * 20, RY - 74, 14, 26); } if (lit > 0) glowDot(c, xx + 37, RY - 80, 130, hexA('#e0f0ff', .6 * lit)); } }
  c.fillStyle = dk; c.fillRect(0, RY - 2, W, 5);
  // バイク
  c.fillStyle = hexA('#1a1430', .35); c.beginPath(); c.ellipse(bx + 155 * bs, GY + 4, 130 * bs + 30, 9, 0, 0, TAU); c.fill();
  c.save(); c.translate(bx, GY); c.scale(bs, bs); drawBikeSide(c, { ...BK, rot: sc / (BIKE.R * bs), t, bob: Math.sin(t * 15) * .7 + Math.sin(t * 5.1) * 1, lightOn: lit > 0 }); c.restore();
  c.restore(); tint(c, d, PA);
  if (lit > 0) { c.save(); path(c, PA); c.clip(); const hx = bx + 297 * bs, hy = GY - 184 * bs; c.globalCompositeOperation = 'lighter'; const hg = c.createLinearGradient(hx, 0, hx + 420, 0); hg.addColorStop(0, hexA('#fff0c0', .6 * lit)); hg.addColorStop(1, hexA('#fff0c0', 0)); c.fillStyle = hg; c.beginPath(); c.moveTo(hx, hy - 6); c.lineTo(hx + 420, hy - 46); c.lineTo(hx + 420, GY + 14); c.lineTo(hx + 80, GY + 4); c.closePath(); c.fill(); c.restore(); }
}
// ---- コマB: 寄り(横顔)と後ろ姿を15秒ごとに切り替え ----
function panelB(c, t, d) {
  const mode = Math.floor(t / 15) % 2, sc = t * 1500;
  c.save(); path(c, PB); c.clip();
  if (mode === 0) {
    skyFill(c, d, 790, 1150); c.fillStyle = C('sea', d); c.fillRect(0, 1130, W, 90); c.fillStyle = C('wall', d); c.fillRect(0, 1210, W, 64); c.fillStyle = C('road', d); c.fillRect(0, 1270, W, 90);
    nyudo(c, 760 - t * 5, 1100, 1.5, d, 1132);
    for (let i = 0; i < 30; i++) { const y = 820 + hash(i * 2.3) * 520, w = 240 + hash(i * 4.1) * 600, x = W + 300 - mod(sc * (.7 + hash(i) * .8) + hash(i * 7) * 3000, W + 1400), hh = 3 + hash(i * 5) * 7; c.fillStyle = hexA('#ffffff', .75); c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y - hh / 2); c.lineTo(x + w, y + hh / 2); c.closePath(); c.fill(); }
    const s = 1.35, bx = 300, by = 1424; c.save(); c.translate(bx, by); c.scale(s, s); drawBikeSide(c, { ...BK, rot: sc / (BIKE.R * s), t, bob: Math.sin(t * 22) * 1 + Math.sin(t * 6.7) * 1.4, lightOn: d > .75 }); c.restore();
    for (let i = 0; i < 6; i++) { const y = 1180 + hash(i * 3.9) * 170, w = 300 + hash(i * 6.1) * 500, x = W + 300 - mod(sc * 1.3 + hash(i * 11) * 3000, W + 1600); c.fillStyle = hexA('#ffffff', .9); c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y - 4); c.lineTo(x + w, y + 4); c.closePath(); c.fill(); }
  } else {
    const vx = 560, vy = 1010; skyFill(c, d, 790, vy); sun(c, vx + 40, lerp(900, 1010, d), 70, d); nyudo(c, 120 - t * 2, 990, .9, d, vy);
    c.fillStyle = C('sea', d); c.fillRect(0, vy, vx, 400); glitter(c, vx - 120, vy, vy + 150, t, d, 12);
    c.fillStyle = C('land', d); c.beginPath(); c.moveTo(vx, vy); c.lineTo(W, vy - 40); c.lineTo(W, 1360); c.lineTo(vx + 300, 1360); c.closePath(); c.fill();
    c.fillStyle = C('road', d); c.beginPath(); c.moveTo(vx - 8, vy); c.lineTo(vx + 8, vy); c.lineTo(1080, 1360); c.lineTo(-60, 1360); c.closePath(); c.fill();
    c.fillStyle = C('wall', d); c.beginPath(); c.moveTo(vx - 8, vy); c.lineTo(-60, 1360); c.lineTo(-240, 1360); c.lineTo(vx - 12, vy - 2); c.closePath(); c.fill();
    for (let k = 0; k < 7; k++) { const u = mod(k / 7 + t * .9, 1), z0 = Math.pow(u, 2.6), z1 = Math.pow(Math.min(1, u + .06), 2.6); const y0 = vy + z0 * 350, y1 = vy + z1 * 350, x0 = vx + (500 - vx) * z0, x1 = vx + (500 - vx) * z1, w0 = 2 + z0 * 22, w1 = 2 + z1 * 22; c.fillStyle = '#ffe9a8'; c.beginPath(); c.moveTo(x0 - w0 / 2, y0); c.lineTo(x0 + w0 / 2, y0); c.lineTo(x1 + w1 / 2, y1); c.lineTo(x1 - w1 / 2, y1); c.closePath(); c.fill(); }
    for (let k = 0; k < 4; k++) { const u = mod(k / 4 + t * .5, 1), z = Math.pow(u, 2.4), x = vx + 40 + z * 700, y = vy + z * 300, hh = 30 + z * 620; c.fillStyle = C('dark', d); c.fillRect(x, y - hh, 3 + z * 16, hh); c.fillRect(x - hh * .14, y - hh * .94, hh * .3, 2 + z * 8); }
    for (let i = 0; i < 22; i++) { const a = hash(i * 3.3) * TAU, r0 = 150 + mod(hash(i * 7) * 500 + t * 900, 520), r1 = r0 + 80 + hash(i) * 160; if (Math.sin(a) < -.15) { c.strokeStyle = hexA('#ffffff', .8); c.lineWidth = 3; c.beginPath(); c.moveTo(vx + Math.cos(a) * r0 * 1.5, vy + Math.sin(a) * r0 * .5); c.lineTo(vx + Math.cos(a) * r1 * 1.5, vy + Math.sin(a) * r1 * .5); c.stroke(); } }
    c.save(); c.translate(430, 1470); c.scale(.74, .74); c.rotate(Math.sin(t * .8) * .03); drawBikeRear(c, { t, lightOn: d > .7, body: BK.body, jacket: BK.jacket, scarf: BK.scarf, mirror: C('skyLow', d), helmet: BK.helmet, helmetStripe: BK.helmetStripe }); c.restore();
  }
  c.restore(); tint(c, d, PB);
  const sw = (t % 15); if (sw < .35 && t > 1) { c.save(); path(c, PB); c.clip(); c.fillStyle = hexA('#ffffff', 1 - sw / .35); c.fillRect(0, 0, W, H); c.restore(); }
}
// ---- コマC1: 軒先の風鈴 ----
function panelC1(c, t, d) {
  c.save(); path(c, PC1); c.clip(); skyFill(c, d, 1378, 1880); nyudo(c, 150 - t * 1.2, 1860, .95, d, 1900);
  c.fillStyle = '#4a3428'; c.beginPath(); c.moveTo(40, 1378); c.lineTo(510, 1378); c.lineTo(510, 1440); c.lineTo(40, 1500); c.closePath(); c.fill(); c.fillStyle = '#2c1e18'; for (let i = 0; i < 6; i++) { const x = 70 + i * 80; c.beginPath(); c.moveTo(x, 1378); c.lineTo(x + 26, 1378); c.lineTo(x + 26, 1500 - (x + 26 - 40) * .128); c.lineTo(x, 1500 - (x - 40) * .128); c.closePath(); c.fill(); } c.fillStyle = '#6a4a38'; c.beginPath(); c.moveTo(40, 1486); c.lineTo(510, 1426); c.lineTo(510, 1444); c.lineTo(40, 1504); c.closePath(); c.fill();
  let th = .10 * Math.sin(t * 1.25) + .04 * Math.sin(t * 3.1); for (const t0 of CHIMES) if (t > t0) th += .30 * Math.exp(-(t - t0) * 1.0) * Math.sin((t - t0) * 7);
  const px = 280, py = 1462; c.save(); c.translate(px, py); c.rotate(th);
  c.strokeStyle = '#3a2c28'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 62); c.stroke();
  c.fillStyle = hexA('#c8f0f4', .82); c.beginPath(); c.moveTo(-64, 122); c.quadraticCurveTo(-70, 58, 0, 58); c.quadraticCurveTo(70, 58, 64, 122); c.quadraticCurveTo(0, 136, -64, 122); c.closePath(); c.fill();
  c.fillStyle = '#e8553f'; c.beginPath(); c.ellipse(-14, 94, 18, 9, -.3, 0, TAU); c.fill(); c.beginPath(); c.moveTo(2, 96); c.lineTo(22, 84); c.lineTo(18, 106); c.closePath(); c.fill(); c.strokeStyle = '#3f98d6'; c.lineWidth = 4; c.beginPath(); c.moveTo(-44, 114); c.quadraticCurveTo(-30, 104, -16, 114); c.quadraticCurveTo(-2, 124, 14, 114); c.quadraticCurveTo(28, 104, 44, 114); c.stroke(); c.fillStyle = hexA('#ffffff', .85); c.beginPath(); c.ellipse(-34, 78, 9, 14, .5, 0, TAU); c.fill();
  c.rotate(th * 1.4); c.strokeStyle = '#3a2c28'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, 62); c.lineTo(0, 190); c.stroke(); c.fillStyle = '#d8b24a'; c.beginPath(); c.arc(0, 128, 7, 0, TAU); c.fill();
  c.translate(0, 190); c.rotate(th * 1.6 + Math.sin(t * 2.3) * .08); c.fillStyle = '#fbf4e0'; c.fillRect(-24, 0, 48, 170); c.fillStyle = '#3f98d6'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 40 + i * 44, 12, Math.PI, TAU); c.fill(); } c.fillStyle = '#e8553f'; c.fillRect(-24, 150, 48, 8);
  c.restore(); c.restore(); tint(c, d, PC1);
}
// ---- コマC2: 防波堤の猫と夕陽 ----
function panelC2(c, t, d) {
  const WY = 1720; c.save(); path(c, PC2); c.clip(); skyFill(c, d, 1378, 1640);
  sun(c, 690, lerp(1450, 1650, d), 64, d);
  const sg = c.createLinearGradient(0, 1640, 0, WY); sg.addColorStop(0, C('seaHi', d)); sg.addColorStop(1, C('sea', d)); c.fillStyle = sg; c.fillRect(0, 1640, W, WY - 1640); glitter(c, 690, 1640, WY, t, d, 10);
  { const x = 1100 - mod(t * 9, 700); c.fillStyle = '#fbf6ea'; c.beginPath(); c.moveTo(x - 30, 1660); c.lineTo(x + 34, 1660); c.lineTo(x + 24, 1672); c.lineTo(x - 22, 1672); c.closePath(); c.fill(); c.beginPath(); c.moveTo(x, 1626); c.lineTo(x + 20, 1656); c.lineTo(x, 1656); c.closePath(); c.fill(); }
  c.fillStyle = C('wall', d); c.fillRect(0, WY, W, 200); c.fillStyle = hexA('#3a3050', .2); c.fillRect(0, WY + 26, W, 6); c.fillRect(700, WY + 32, 4, 150); c.fillRect(960, WY + 32, 4, 150);
  // ラムネ瓶
  c.fillStyle = hexA('#9fe0d8', .9); rr(c, 600, WY - 86, 30, 86, 8); c.fill(); rr(c, 606, WY - 112, 18, 34, 6); c.fill(); c.fillStyle = hexA('#ffffff', .8); c.fillRect(606, WY - 76, 5, 50); c.fillStyle = '#3f98d6'; c.fillRect(600, WY - 52, 30, 16);
  // 猫(三毛)
  const cx = 840, hx = cx - 6 + Math.sin(t * .45) * 9, tw = Math.sin(t * 1.6) * .5 + Math.sin(t * .7) * .3;
  c.strokeStyle = '#fbf6ea'; c.lineWidth = 22; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx + 52, WY - 16); c.quadraticCurveTo(cx + 96, WY + 20, cx + 80 + tw * 26, WY + 86); c.stroke(); c.strokeStyle = '#3a2c2c'; c.lineWidth = 22; c.beginPath(); c.moveTo(cx + 82 + tw * 20, WY + 66); c.lineTo(cx + 80 + tw * 26, WY + 86); c.stroke();
  c.fillStyle = '#fbf6ea'; c.beginPath(); c.moveTo(cx - 70, WY); c.quadraticCurveTo(cx - 78, WY - 90, cx - 34, WY - 146); c.quadraticCurveTo(cx, WY - 170, cx + 34, WY - 146); c.quadraticCurveTo(cx + 78, WY - 90, cx + 70, WY); c.closePath(); c.fill();
  c.fillStyle = '#e89a4a'; c.beginPath(); c.ellipse(cx + 30, WY - 70, 30, 44, .3, 0, TAU); c.fill(); c.fillStyle = '#3a2c2c'; c.beginPath(); c.ellipse(cx - 36, WY - 44, 24, 34, -.3, 0, TAU); c.fill();
  c.fillStyle = '#fbf6ea'; c.beginPath(); c.arc(hx, WY - 190, 50, 0, TAU); c.fill();
  const ear = (s, col) => { const tq = (Math.sin(t * 2.1 + s) > .93) ? 8 : 0; c.fillStyle = col; c.beginPath(); c.moveTo(hx + s * 16, WY - 228); c.lineTo(hx + s * 40 + s * tq, WY - 262); c.lineTo(hx + s * 48, WY - 204); c.closePath(); c.fill(); }; ear(-1, '#3a2c2c'); ear(1, '#e89a4a');
  c.fillStyle = '#e89a4a'; c.beginPath(); c.arc(hx + 22, WY - 204, 22, -1.2, 1.4); c.fill(); c.fillStyle = '#3a2c2c'; c.beginPath(); c.arc(hx - 24, WY - 206, 20, 1.8, 4.6); c.fill();
  c.restore(); tint(c, d, PC2);
}
function sfx(c, str, x, y, size, rot, a) { c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = a; c.font = `${size}px Dela`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.strokeStyle = '#15121c'; c.lineWidth = size * .2; c.strokeText(str, 0, 0); c.fillStyle = '#fffdf4'; c.fillText(str, 0, 0); c.restore(); }
function caption(c, x, y, jp, en, a, align) { if (a <= 0) return; c.save(); c.globalAlpha = a; c.font = '36px Kaisei'; const w = Math.max(c.measureText(jp).width, (c.font = '27px Kaisei', c.measureText(en).width)) + 52, hh = 112, x0 = align === 'right' ? x - w : x; c.fillStyle = '#fffdf6'; c.fillRect(x0, y, w, hh); c.strokeStyle = '#15121c'; c.lineWidth = 5; c.strokeRect(x0, y, w, hh); c.fillStyle = '#15121c'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = '36px Kaisei'; c.fillText(jp, x0 + 26, y + 38); c.font = '27px Kaisei'; c.fillStyle = '#4a4458'; c.fillText(en, x0 + 26, y + 82); c.restore(); }
window.renderFrame = function (f) {
  const t = f / FPS, c = ctx, d = sstep(0, 1, t / 60) * .4 + (t / 60) * .6; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#f7f1e3'; c.fillRect(0, 0, W, H);
  panelA(c, t, d); panelB(c, t, d); panelC1(c, t, d); panelC2(c, t, d);
  inkFilter(c, 40, 40, 1000, 1840, { ink: [21, 18, 28], th: 38, gain: .022, step: 2, strength: 1, period: 9, toneHi: .56, toneLo: .14, tone: .7 });
  // コマ枠と余白
  c.fillStyle = '#f7f1e3'; c.beginPath(); c.rect(0, 0, W, H); for (const p of [PA, PB, PC1, PC2]) { c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); c.closePath(); } c.fill('evenodd');
  c.strokeStyle = '#15121c'; c.lineWidth = 7; c.lineJoin = 'miter'; for (const p of [PA, PB, PC1, PC2]) { path(c, p); c.stroke(); }
  // 擬音(描き文字)
  const mode = Math.floor(t / 15) % 2, jx = (hash(Math.floor(t * 12)) - .5) * 6, jy = (hash(Math.floor(t * 12) + 9) - .5) * 6;
  if (mode === 0) sfx(c, 'ドドドド', 80 + jx, 950 + jy, 86, -.1, .95); else sfx(c, 'ブロロロ…', 640 + jx, 1290 + jy, 70, -.06, .95);
  for (const t0 of CHIMES) { const u = t - t0; if (u > 0 && u < 2.2) { const a = sstep(0, .15, u) * (1 - sstep(1.4, 2.2, u)); sfx(c, 'チリン', 300 + u * 6, 1700 - u * 10, 58, -.12, a); c.save(); c.globalAlpha = a; c.strokeStyle = '#15121c'; c.lineWidth = 5; c.lineCap = 'round'; for (const [ax, ay, r0] of [[170, 1600, 26], [170, 1600, 44]]) { c.beginPath(); c.arc(ax, ay, r0 + u * 8, 2.5, 3.8); c.stroke(); } c.restore(); } }
  caption(c, 62, 62, '夏の終わり、海沿いの道。', 'Late summer. The coast road.', sstep(1.5, 2.6, t) * (1 - sstep(13, 14.2, t)));
  caption(c, 1018, 1216, 'どこまでも、行ける気がした。', 'It felt like I could ride forever.', sstep(46.2, 47.4, t) * (1 - sstep(56.5, 57.8, t)), 'right');
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .6; c.drawImage(S.paper, 0, 0); c.restore();
  const fi = 1 - sstep(0, 1.4, t); if (fi > 0) { c.fillStyle = `rgba(247,241,227,${fi})`; c.fillRect(0, 0, W, H); }
  const fo = sstep(58, 59.8, t); if (fo > 0) { c.fillStyle = `rgba(247,241,227,${fo})`; c.fillRect(0, 0, W, H); }
};
