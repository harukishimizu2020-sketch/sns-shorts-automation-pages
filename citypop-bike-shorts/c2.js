// 動画②「雨の踏切 Crossing in the Rain」: 新版画(木版画)風。雨の夜、踏切で電車を見送る後ろ姿。72BPM 18小節=60秒
// 進行: 0-5.5 到着 / 6.0 警報開始・遮断機が下りる / 14.2-29 電車通過 / 30.6-33.4 遮断機が上がる / 34.8- 発進して奥へ / 48- 余韻
'use strict';
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const PX0 = 56, PY0 = 64, PX1 = 1024, PY1 = 1776, VX = 540, VY = 930, RAILY = 1215;
const T_BELL0 = 6.0, T_BELL1 = 33.0, T_TR = 14.2, TRV = 1100, CARL = 1530, NCAR = 10, T_GO = 34.8;
let S = {};
const yTL = (x) => 330 + (x - 60) * 1.25, yBL = (x) => 1560 - (x - 60) * 1.3125;         // 左の家の壁の上端・下端
const yTR = (x) => 300 + (1020 - x) * 1.3125, yBR = (x) => 1560 - (1020 - x) * 1.3125;   // 右の家
const stL = (y) => VX - 440 * (y - VY) / 870, stR = (y) => VX + 440 * (y - VY) / 870;     // 道の左右端
function quadL(c, x0, x1, v0, v1, col, yT, yB) { c.fillStyle = col; c.beginPath(); c.moveTo(x0, lerp(yT(x0), yB(x0), v0)); c.lineTo(x1, lerp(yT(x1), yB(x1), v0)); c.lineTo(x1, lerp(yT(x1), yB(x1), v1)); c.lineTo(x0, lerp(yT(x0), yB(x0), v1)); c.closePath(); c.fill(); }
function streak(c, x, y, w, h, col, a, t, seed) { // 濡れた路面の縦の映り込み(細い横筋を重ねて揺らす)
  c.save(); c.globalCompositeOperation = 'lighter'; const n = 44; for (let i = 0; i < n; i++) { const u = i / n, yy = y + u * h, ww = w * (1 - u * .5) * (.72 + .28 * Math.sin(i * 1.9 + seed + t * 1.6)); c.fillStyle = hexA(col, a * Math.pow(1 - u, 1.5) * (.55 + .45 * hash(seed + i * 3.1 + Math.floor(t * 4) * .37))); c.fillRect(x - ww / 2 + Math.sin(t * 1.7 + i * .8 + seed) * (2 + u * 7), yy, ww, h / n * .62); } c.restore();
}
window.init = async function () {
  S.paper = makePaper(77, '#f1e8d4'); S.bike = mk(900, 900);
  // 静的な背景(空・遠景)を先に描いておく
  S.bg = mk(W, H); const c = S.bg.getContext('2d'), r = rng(3);
  const g = c.createLinearGradient(0, 0, 0, VY); g.addColorStop(0, '#0e1a34'); g.addColorStop(.5, '#1d3554'); g.addColorStop(.85, '#3d6278'); g.addColorStop(1, '#6f8f92'); c.fillStyle = g; c.fillRect(0, 0, W, VY + 4);
  for (let i = 0; i < 9; i++) { const y = 90 + r() * 560, w = 300 + r() * 600, x = r() * W - 200, hh = 26 + r() * 50; c.fillStyle = hexA('#0a1428', .22 + r() * .2); rr(c, x, y, w, hh, hh / 2); c.fill(); rr(c, x + w * .2, y + hh * .7, w * .7, hh * .8, hh / 2); c.fill(); }
  c.fillStyle = '#2a4a5e'; c.beginPath(); c.moveTo(0, VY); for (let x = 0; x <= W; x += 14) c.lineTo(x, VY - 96 - 44 * Math.sin(x / 210 + 1) - 22 * Math.sin(x / 77)); c.lineTo(W, VY); c.fill();
  c.fillStyle = '#1e3a4e'; c.beginPath(); c.moveTo(0, VY); for (let x = 0; x <= W; x += 14) c.lineTo(x, VY - 40 - 30 * Math.sin(x / 150 + 4) - 12 * Math.sin(x / 47)); c.lineTo(W, VY); c.fill();
};
function house(c, x, y, w, h, lit, flip) { c.fillStyle = '#15263c'; c.fillRect(x, y - h, w, h); c.fillStyle = '#213a52'; c.beginPath(); c.moveTo(x - w * .12, y - h); c.lineTo(x + w * .2, y - h - h * .34); c.lineTo(x + w * .8, y - h - h * .34); c.lineTo(x + w * 1.12, y - h); c.closePath(); c.fill(); if (lit) { c.fillStyle = '#ffcf80'; c.fillRect(x + w * (flip ? .5 : .16), y - h * .62, w * .32, h * .3); } }
function train(c, t) {
  const front = (t - T_TR) * TRV; if (front < -50 || front - NCAR * CARL > W + 50) return false;
  for (let i = 0; i < NCAR; i++) { const x1 = front - i * CARL, x0 = x1 - CARL + 26; if (x1 < -20 || x0 > W + 20) continue;
    c.fillStyle = '#8a8f96'; rr(c, x0 + 14, 858, x1 - x0 - 28, 30, 12); c.fill();
    c.fillStyle = '#e6d9bc'; rr(c, x0, 876, x1 - x0, 270, 14); c.fill();
    c.fillStyle = '#2f6258'; c.fillRect(x0, 1036, x1 - x0, 100); c.fillStyle = '#d8a14a'; c.fillRect(x0, 1030, x1 - x0, 7);
    c.fillStyle = '#141c2c'; c.fillRect(x0 + 20, 1140, x1 - x0 - 40, 26);
    for (const bx of [x0 + 210, x1 - 210]) { c.fillStyle = '#0f1522'; rr(c, bx - 150, 1146, 300, 34, 8); c.fill(); for (const wx of [bx - 86, bx + 86]) { c.fillStyle = '#39424f'; c.beginPath(); c.arc(wx, 1170, 22, 0, TAU); c.fill(); } }
    for (let k = 0; k < 9; k++) { const wx = x0 + 62 + k * 160; const door = k === 2 || k === 6; if (door) { c.fillStyle = '#d2c4a4'; c.fillRect(wx - 6, 900, 122, 236); c.fillStyle = '#ffd98a'; c.fillRect(wx + 8, 918, 42, 96); c.fillRect(wx + 60, 918, 42, 96); c.fillStyle = '#2f6258'; c.fillRect(wx - 6, 1036, 122, 100); }
      else { c.fillStyle = '#ffdc90'; rr(c, wx, 914, 116, 100, 8); c.fill(); if (hash(i * 13.1 + k * 3.7) < .45) { c.fillStyle = '#4a4034'; const px = wx + 20 + hash(i + k * 9) * 60; c.beginPath(); c.arc(px, 950, 15, 0, TAU); c.fill(); rr(c, px - 20, 964, 40, 54, 10); c.fill(); } c.fillStyle = '#d8c8a0'; c.fillRect(wx, 960, 116, 4); } }
    if (i === 0) { c.fillStyle = '#d8ccb0'; rr(c, x1 - 40, 876, 40, 270, 14); c.fill(); glowDot(c, x1 - 6, 1090, 150, 'rgba(255,244,210,.9)'); c.fillStyle = '#fffbe8'; c.beginPath(); c.arc(x1 - 8, 1090, 13, 0, TAU); c.fill(); }
    if (i === NCAR - 1) { glowDot(c, x0 + 8, 1090, 90, 'rgba(255,60,50,.9)'); c.fillStyle = '#ff4a3a'; c.beginPath(); c.arc(x0 + 10, 1090, 11, 0, TAU); c.fill(); }
    if (i % 3 === 1) { c.strokeStyle = '#3a4250'; c.lineWidth = 5; const px = (x0 + x1) / 2; c.beginPath(); c.moveTo(px - 60, 860); c.lineTo(px, 800); c.lineTo(px + 60, 860); c.moveTo(px - 50, 800); c.lineTo(px + 50, 800); c.stroke(); }
  }
  return true;
}
function gate(c, x, dir, t, down, on) {
  c.fillStyle = '#10182a'; c.fillRect(x - 9, 900, 18, 330); c.fillRect(x - 22, 1200, 44, 30);
  for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? '#10182a' : '#e8b83a'; c.fillRect(x - 9, 1040 + i * 22, 18, 22); }
  for (const a of [.62, -.62]) { c.save(); c.translate(x, 928); c.rotate(a); c.fillStyle = '#e8b83a'; c.fillRect(-66, -9, 132, 18); c.fillStyle = '#141a28'; c.fillRect(-40, -9, 16, 18); c.fillRect(24, -9, 16, 18); c.restore(); }
  c.fillStyle = '#10182a'; rr(c, x - 56, 968, 112, 48, 10); c.fill();
  const ph = Math.floor((t - T_BELL0) * 2) % 2;
  for (const s of [-1, 1]) { const lit = on && ((s < 0) === (ph === 0)); c.fillStyle = lit ? '#ff5a48' : '#4a1a1e'; c.beginPath(); c.arc(x + s * 29, 992, 17, 0, TAU); c.fill(); if (lit) { glowDot(c, x + s * 29, 992, 150, 'rgba(255,70,50,.85)'); glowDot(c, x + s * 29, 992, 30, 'rgba(255,220,200,.9)'); } }
  c.save(); c.translate(x, 1122); c.rotate(dir * -1.42 * (1 - down)); for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? '#141a28' : '#e8b83a'; c.fillRect(dir > 0 ? i * 25 : -(i + 1) * 25, -7, 25, 14); } c.fillStyle = '#10182a'; c.beginPath(); c.arc(0, 0, 13, 0, TAU); c.fill(); c.restore();
}
function scene(c, t, f) {
  const bell = t >= T_BELL0 && t < T_BELL1, down = sstep(6.6, 9.6, t) * (1 - sstep(30.6, 33.4, t)), ph = Math.floor((t - T_BELL0) * 2) % 2;
  const trOn = sstep(T_TR - .2, T_TR + 1.2, t) * (1 - sstep(28.2, 29.4, t));
  c.drawImage(S.bg, 0, 0);
  // 地面
  const gg = c.createLinearGradient(0, VY, 0, H); gg.addColorStop(0, '#2b4658'); gg.addColorStop(.3, '#223a52'); gg.addColorStop(1, '#101c34'); c.fillStyle = gg; c.fillRect(0, VY, W, H - VY);
  // 奥の町並みと道
  house(c, 300, VY + 26, 120, 110, true); house(c, 418, VY + 14, 80, 70, false); house(c, 590, VY + 14, 76, 72, true, true); house(c, 664, VY + 28, 130, 118, false); house(c, 160, VY + 44, 150, 150, false); house(c, 790, VY + 46, 160, 160, true, true);
  glowDot(c, 520, VY - 40, 60, 'rgba(255,230,180,.8)'); c.fillStyle = '#10182a'; c.fillRect(505, VY - 44, 3, 60);
  c.fillStyle = '#1a2c44'; c.beginPath(); c.moveTo(VX - 16, VY + 4); c.lineTo(VX + 16, VY + 4); c.lineTo(stR(1150), 1150); c.lineTo(stL(1150), 1150); c.closePath(); c.fill();
  streak(c, 522, VY + 20, 26, 180, '#ffe6b4', .35, t, 5);
  // 線路
  c.fillStyle = '#16202e'; c.fillRect(0, 1150, W, 72); c.fillStyle = '#2a3440'; for (let x = -10; x < W; x += 38) c.fillRect(x, 1158, 16, 56);
  c.fillStyle = '#4a4638'; c.fillRect(stL(1150) - 14, 1150, stR(1150) - stL(1150) + 28, 72);
  c.fillStyle = '#93a2ac'; c.fillRect(0, 1166, W, 5); c.fillRect(0, 1200, W, 6);
  const tr = train(c, t);
  // 手前の道と歩道
  c.fillStyle = '#1a2a46'; c.beginPath(); c.moveTo(stL(1222), 1222); c.lineTo(stR(1222), 1222); c.lineTo(stR(1900), 1900); c.lineTo(stL(1900), 1900); c.closePath(); c.fill();
  c.strokeStyle = hexA('#c8d4dc', .22); c.lineWidth = 5; c.beginPath(); c.moveTo(stL(1222), 1222); c.lineTo(stL(1900), 1900); c.moveTo(stR(1222), 1222); c.lineTo(stR(1900), 1900); c.stroke();
  c.fillStyle = hexA('#e8e0c8', .5); c.fillRect(stL(1262), 1262, stR(1262) - stL(1262), 10);
  // 電車の灯りが濡れた路面に落ちる
  if (trOn > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const lg = c.createLinearGradient(0, 1222, 0, 1640); lg.addColorStop(0, `rgba(255,214,140,${.34 * trOn})`); lg.addColorStop(1, 'rgba(255,214,140,0)'); c.fillStyle = lg; c.fillRect(0, 1222, W, 420); for (let k = -1; k < 9; k++) { const x = mod((t - T_TR) * TRV + k * 160, 160 * 9) - 120; c.fillStyle = `rgba(255,220,150,${.045 * trOn})`; c.fillRect(x, 1226, 100, 200); } c.restore(); }
  // 左の家(障子の灯り・暖簾・提灯)
  c.fillStyle = '#16263c'; c.beginPath(); c.moveTo(60, yTL(60)); c.lineTo(235, yTL(235)); c.lineTo(235, yBL(235)); c.lineTo(60, yBL(60)); c.closePath(); c.fill();
  c.fillStyle = '#0d1828'; c.beginPath(); c.moveTo(40, 130); c.lineTo(262, 488); c.lineTo(262, 560); c.lineTo(40, 310); c.closePath(); c.fill(); c.strokeStyle = hexA('#5f7f96', .5); c.lineWidth = 3; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(40, 150 + i * 28); c.lineTo(262, 500 + i * 10); c.stroke(); }
  quadL(c, 92, 205, .17, .33, '#f2d9a0', yTL, yBL); c.strokeStyle = '#3a2c20'; c.lineWidth = 3; for (let x = 108; x < 205; x += 19) { c.beginPath(); c.moveTo(x, lerp(yTL(x), yBL(x), .17)); c.lineTo(x, lerp(yTL(x), yBL(x), .33)); c.stroke(); }
  quadL(c, 78, 222, .55, .88, '#ffcf80', yTL, yBL); c.strokeStyle = '#3a2416'; c.lineWidth = 4; for (let x = 90; x < 222; x += 13) { c.beginPath(); c.moveTo(x, lerp(yTL(x), yBL(x), .55)); c.lineTo(x, lerp(yTL(x), yBL(x), .88)); c.stroke(); }
  quadL(c, 74, 226, .47, .56, '#27406a', yTL, yBL); quadL(c, 66, 235, .445, .47, '#0d1828', yTL, yBL);
  streak(c, 190, 1340, 150, 330, '#ffc878', .30, t, 11);
  { const sw = Math.sin(t * 1.1) * .05 + Math.sin(t * 2.7) * .02; c.save(); c.translate(266, 700); c.rotate(sw); c.strokeStyle = '#0d1828'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 70); c.stroke(); glowDot(c, 0, 120, 190, 'rgba(255,150,70,.6)'); c.fillStyle = '#f08a48'; c.beginPath(); c.ellipse(0, 120, 36, 50, 0, 0, TAU); c.fill(); c.fillStyle = '#ffd9a0'; c.beginPath(); c.ellipse(0, 120, 20, 34, 0, 0, TAU); c.fill(); c.fillStyle = '#1a1420'; c.fillRect(-20, 66, 40, 8); c.fillRect(-20, 166, 40, 8); c.font = '36px ZenA'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#5a1a10'; c.fillText('酒', 0, 122); c.restore(); streak(c, 268, 1300, 60, 300, '#ff9a50', .35, t, 17); }
  // 右の家(喫茶のネオン・自販機)
  c.fillStyle = '#18283e'; c.beginPath(); c.moveTo(1020, yTR(1020)); c.lineTo(845, yTR(845)); c.lineTo(845, yBR(845)); c.lineTo(1020, yBR(1020)); c.closePath(); c.fill();
  c.fillStyle = '#0d1828'; c.beginPath(); c.moveTo(1040, 110); c.lineTo(818, 470); c.lineTo(818, 540); c.lineTo(1040, 290); c.closePath(); c.fill(); c.strokeStyle = hexA('#5f7f96', .5); c.lineWidth = 3; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(1040, 130 + i * 28); c.lineTo(818, 482 + i * 10); c.stroke(); }
  quadL(c, 866, 1000, .56, .86, '#7fd2c4', yTR, yBR); quadL(c, 866, 1000, .56, .64, '#c8553f', yTR, yBR); c.strokeStyle = '#12202e'; c.lineWidth = 4; for (const x of [900, 934, 968]) { c.beginPath(); c.moveTo(x, lerp(yTR(x), yBR(x), .56)); c.lineTo(x, lerp(yTR(x), yBR(x), .86)); c.stroke(); }
  quadL(c, 880, 990, .2, .34, '#3a5a70', yTR, yBR);
  streak(c, 900, 1340, 140, 320, '#7fe0d0', .26, t, 23);
  const nf = (t > 51.6 && t < 53.2 && hash(Math.floor(t * 14)) < .5) ? .25 : 1;
  c.fillStyle = '#0c1422'; rr(c, 760, 588, 82, 260, 8); c.fill(); c.fillRect(838, 620, 14, 8); c.fillRect(838, 800, 14, 8);
  c.save(); c.globalAlpha = nf; c.shadowColor = '#5fe6e0'; c.shadowBlur = 16; c.strokeStyle = '#8ff4ee'; c.lineWidth = 3; rr(c, 768, 596, 66, 244, 6); c.stroke(); c.restore();
  c.save(); c.globalAlpha = nf; neon(c, '喫茶', 801, 652, 52, '#ff5f9e', { vertical: true, pitch: 66, font: 'Rock', glow: .5 }); c.shadowColor = '#5fe6e0'; c.shadowBlur = 12; c.strokeStyle = '#a8fff8'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(784, 778); c.lineTo(818, 778); c.lineTo(813, 806); c.lineTo(789, 806); c.closePath(); c.moveTo(818, 784); c.quadraticCurveTo(830, 790, 816, 798); c.moveTo(793, 770); c.quadraticCurveTo(798, 762, 795, 754); c.moveTo(806, 770); c.quadraticCurveTo(811, 762, 808, 754); c.stroke(); c.restore();
  streak(c, 800, 1300, 70, 330, '#ff5f9e', .30 * nf, t, 29); streak(c, 770, 1330, 34, 240, '#5fe6e0', .2 * nf, t, 31);
  glowDot(c, 916, 1420, 240, 'rgba(210,235,255,.4)'); c.fillStyle = '#e6f0f6'; rr(c, 872, 1330, 92, 196, 6); c.fill(); c.fillStyle = '#c8553f'; c.fillRect(872, 1330, 92, 34); const vc = ['#e8a23a', '#4aa8c0', '#e8d05a', '#5fb078']; for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) { c.fillStyle = vc[(i + j) % 4]; c.fillRect(881 + i * 20, 1376 + j * 38, 14, 27); } c.fillStyle = '#27405a'; c.fillRect(882, 1480, 72, 26);
  streak(c, 918, 1530, 90, 230, '#d8ecff', .32, t, 37);
  // 電柱・電線・街灯
  c.strokeStyle = '#0a1220'; c.lineWidth = 2.5; for (const [x0, y0, x1, y1, sag] of [[955, 196, 40, 240, 120], [955, 240, 40, 300, 130], [955, 196, 600, 800, 40], [955, 240, 610, 820, 44]]) { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1); c.stroke(); }
  c.fillStyle = '#0a1220'; c.fillRect(598, 790, 5, 150); c.fillRect(584, 800, 34, 4);
  c.fillRect(944, 60, 22, 1500); c.fillRect(880, 190, 150, 11); c.fillRect(896, 236, 118, 9); rr(c, 968, 300, 44, 74, 8); c.fill();
  c.strokeStyle = '#0a1220'; c.lineWidth = 7; c.beginPath(); c.moveTo(950, 470); c.lineTo(872, 446); c.stroke();
  c.save(); c.globalCompositeOperation = 'lighter'; const cg = c.createLinearGradient(0, 450, 0, 1300); cg.addColorStop(0, 'rgba(210,236,255,.30)'); cg.addColorStop(1, 'rgba(210,236,255,0)'); c.fillStyle = cg; c.beginPath(); c.moveTo(866, 452); c.lineTo(650, 1300); c.lineTo(990, 1300); c.closePath(); c.fill(); c.restore();
  glowDot(c, 866, 456, 130, 'rgba(225,244,255,.9)'); c.fillStyle = '#f6fcff'; c.beginPath(); c.ellipse(866, 452, 24, 10, 0, 0, TAU); c.fill();
  streak(c, 800, 1560, 110, 200, '#d0e8ff', .16, t, 41);
  // 踏切
  gate(c, 372, 1, t, down, bell); gate(c, 708, -1, t, down, bell);
  if (bell) { const lx = (ph === 0 ? -29 : 29); streak(c, 372 + lx, 1236, 50, 300, '#ff4a38', .5, t, 43); streak(c, 708 + lx, 1236, 50, 300, '#ff4a38', .5, t, 47); }
  // 雨の波紋
  c.strokeStyle = hexA('#d6e6f2', .34); c.lineWidth = 2; for (let i = 0; i < 44; i++) { const per = 1.0 + hash(i) * .8, ph2 = (t + hash(i * 3.3) * 5) / per, cyc = Math.floor(ph2), u = ph2 - cyc; const x = PX0 + hash(i * 7.1 + cyc * 1.37) * (PX1 - PX0), y = 1250 + Math.pow(hash(i * 2.9 + cyc * 3.1), .8) * 500, s = .5 + (y - 1250) / 500; c.globalAlpha = (1 - u) * .8; c.beginPath(); c.ellipse(x, y, (6 + u * 30) * s, (2 + u * 9) * s, 0, 0, TAU); c.stroke(); } c.globalAlpha = 1;
  // バイク
  const ar = 1 - Math.pow(1 - clamp(t / 5.5), 3), zz = 1 + 9 * Math.pow(sstep(T_GO, 48.5, t), 1.7), stopped = t > 5.3 && t < T_GO;
  const bs = .78 * (1 + (1 - ar) * .32) / zz, bx = VX + (450 - VX) / zz, by = VY + (1622 - VY) / zz + (1 - ar) * 600;
  const b = S.bike, bc = b.getContext('2d'); bc.setTransform(1, 0, 0, 1, 0, 0); bc.globalCompositeOperation = 'source-over'; bc.clearRect(0, 0, 900, 900); bc.setTransform(1.15, 0, 0, 1.15, 450, 840);
  drawBikeRear(bc, { t: stopped ? t * .25 : t, lightOn: true, footDown: stopped, body: '#3f8f86', jacket: '#e9dcc0', sleeve: '#2a4a6e', scarf: '#d8553f', mirror: '#6f8fa0', helmet: '#efe8d8', helmetStripe: '#d8553f' });
  bc.setTransform(1, 0, 0, 1, 0, 0); bc.globalCompositeOperation = 'source-atop'; bc.fillStyle = 'rgba(14,26,56,.5)'; bc.fillRect(0, 0, 900, 900);
  if (trOn > 0) { const tg = bc.createLinearGradient(0, 60, 0, 520); tg.addColorStop(0, `rgba(255,214,140,${.5 * trOn})`); tg.addColorStop(1, 'rgba(255,214,140,0)'); bc.fillStyle = tg; bc.fillRect(0, 0, 900, 900); }
  const sc = bs / 1.15;
  c.save(); c.translate(bx, by + 6 * sc); c.scale(sc, -sc * .55); c.globalAlpha = .22; if (stopped) c.rotate(.035); c.drawImage(b, -450, -840); c.restore();
  c.save(); c.translate(bx, by); c.scale(sc, sc); c.fillStyle = 'rgba(4,8,24,.45)'; c.beginPath(); c.ellipse(0, 4, 150, 22, 0, 0, TAU); c.fill(); if (stopped) c.rotate(-.035); c.drawImage(b, -450, -840); const br = (t < T_GO + .4 && t > 3.4) ? 1 : .6; glowDot(c, 0, -258, 150, `rgba(255,50,40,${.85 * br})`); glowDot(c, 0, -258, 34, `rgba(255,210,200,${.9 * br})`); c.restore();
  streak(c, bx, by + 14 * sc, 60 * sc + 8, 260 * sc + 20, '#ff4030', .42, t, 53);
  // 雨(木版画の雨: まっすぐな細い線)
  c.save(); c.strokeStyle = hexA('#dfeaf2', .20); c.lineWidth = 1.6; c.beginPath(); for (let i = 0; i < 150; i++) { const sp = 1700 + hash(i * 1.7) * 700, y = mod(hash(i * 5.3) * H + t * sp, H + 300) - 200, x = hash(i * 9.1) * (W + 200) - 40 - (y / H) * 110, l = 120 + hash(i * 3) * 150; c.moveTo(x, y); c.lineTo(x - l * .09, y + l); } c.stroke();
  c.strokeStyle = hexA('#f4faff', .5); c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 26; i++) { const sp = 1900, y = mod(hash(i * 4.3) * 900 + t * sp, 860) + 450, x = 700 + hash(i * 6.1) * 270 - (y - 450) * .09, l = 90; if (x > 866 - (y - 452) * .26 && x < 866 + (y - 452) * .15) { c.moveTo(x, y); c.lineTo(x - l * .09, y + l); } } c.stroke(); c.restore();
}
window.renderFrame = function (f) {
  const t = f / FPS, c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#101c34'; c.fillRect(0, 0, W, H);
  const z = 1 + .075 * (t / 60);
  c.save(); c.translate(540, 1050); c.scale(z, z); c.translate(-540, -1050); scene(c, t, f); c.restore();
  const fi = 1 - sstep(0, 2, t); if (fi > 0) { c.fillStyle = `rgba(14,22,44,${fi})`; c.fillRect(0, 0, W, H); }
  inkFilter(c, PX0, PY0, PX1 - PX0, PY1 - PY0, { ink: [10, 18, 40], th: 50, gain: .012, step: 1, strength: .7 });
  // 版画の余白・題・落款
  c.fillStyle = '#efe6d2'; c.fillRect(0, 0, W, PY0); c.fillRect(0, PY1, W, H - PY1); c.fillRect(0, 0, PX0, H); c.fillRect(PX1, 0, W - PX1, H);
  c.strokeStyle = '#1a2440'; c.lineWidth = 3; c.strokeRect(PX0, PY0, PX1 - PX0, PY1 - PY0);
  const ta = sstep(1.5, 3.5, t); c.save(); c.globalAlpha = ta; c.fillStyle = '#1e2a48'; c.textBaseline = 'middle'; c.textAlign = 'left'; c.font = '50px ZenA'; c.letterSpacing = '10px'; c.fillText('雨の踏切', PX0 + 4, 1846); c.textAlign = 'right'; c.font = '31px Kaisei'; c.letterSpacing = '5px'; c.fillText('Crossing in the Rain', PX1 - 96, 1848);
  c.fillStyle = '#c0432e'; rr(c, PX1 - 76, 1810, 72, 72, 8); c.fill(); c.fillStyle = '#f6eede'; c.font = '30px ZenA'; c.letterSpacing = '0px'; c.textAlign = 'center'; c.fillText('夜', PX1 - 40, 1830); c.fillText('雨', PX1 - 40, 1864); c.restore();
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .7; c.drawImage(S.paper, 0, 0); c.restore();
  const fo = sstep(57.8, 59.8, t); if (fo > 0) { c.fillStyle = `rgba(10,14,30,${fo})`; c.fillRect(0, 0, W, H); }
};
