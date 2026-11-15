// 動画D1「ENDLESS SUMMER」: 青空・ヤシ・プールの平塗りリゾート風ポスター。カットなしの長回し。104BPM 26小節=60秒
'use strict';
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const IX0 = 60, IY0 = 330, IX1 = 1020, IY1 = 1790, HZ = 1120, RY = 1500, GY = 1650, SPD = 380, PER = 4200;
let S = {};
const par = (y) => lerp(.5, 1, clamp((y - 1180) / (RY - 1180)));
const wx = (x, y, sc) => mod(x - sc * par(y) + 600, PER) - 600;
window.init = async function () {
  // エアブラシ風の粒子
  S.grain = mk(W, H); { const c = S.grain.getContext('2d'), img = c.createImageData(W, H), d = img.data, r = rng(9); for (let i = 0; i < d.length; i += 4) { const v = r() < .5 ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = r() * 34; } c.putImageData(img, 0, 0); }
  // 木立(点描)
  S.trees = mk(2400, 320); { const c = S.trees.getContext('2d'), r = rng(4); for (let x = -40; x < 2400; x += 70 + r() * 60) { const hh = 130 + r() * 170, w = 90 + r() * 80, cone = r() < .55; c.fillStyle = r() < .5 ? '#1d6a3a' : '#17582f'; c.beginPath(); if (cone) { c.moveTo(x, 320); c.quadraticCurveTo(x + w * .1, 320 - hh * .7, x + w / 2, 320 - hh); c.quadraticCurveTo(x + w * .9, 320 - hh * .7, x + w, 320); } else { c.ellipse(x + w / 2, 320 - hh * .45, w * .7, hh * .5, 0, 0, TAU); } c.fill(); }
    c.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 9000; i++) { c.fillStyle = r() < .5 ? 'rgba(120,200,120,.35)' : 'rgba(6,40,24,.4)'; c.fillRect(r() * 2400, r() * 320, 3, 3); } }
};
function palm2(c, x, y, hgt, seed, t, col) {
  const bend = (hash(seed * 3) - .5) * hgt * .22; c.save(); c.translate(x, y); c.lineCap = 'round';
  c.strokeStyle = col ? col : '#8f5f3a'; c.lineWidth = 15; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(bend * .1, -hgt * .55, bend, -hgt); c.stroke();
  if (!col) { c.strokeStyle = '#6b4226'; c.lineWidth = 5; c.beginPath(); c.moveTo(5, 0); c.quadraticCurveTo(bend * .1 + 5, -hgt * .55, bend + 4, -hgt); c.stroke(); }
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < 11; i++) { const a = -Math.PI * (i / 10) + Math.sin(t * 1.3 + i + seed) * .04, L = 120 + hash(seed + i) * 60, droop = 70 + Math.abs(Math.cos(a)) * 80; const ex = bend + Math.cos(a) * L * 1.15, ey = -hgt + Math.sin(a) * L * .6 + droop * .55;
    c.fillStyle = col ? col : (pass ? (i % 2 ? '#2f9a4f' : '#1f7f3f') : '#14592e'); if (pass && i % 3 === 0) continue; c.beginPath(); c.moveTo(bend, -hgt); c.quadraticCurveTo(bend + Math.cos(a) * L * .7, -hgt + Math.sin(a) * L * .9 - 14 - pass * 10, ex, ey - pass * 8); c.quadraticCurveTo(bend + Math.cos(a) * L * .55, -hgt + Math.sin(a) * L * .6 + 26, bend, -hgt); c.fill(); }
  c.restore();
}
function house(c, x, y, v) {
  const shd = 'rgba(18,30,96,.42)';
  c.fillStyle = '#b8705a'; c.fillRect(x + 40, y - 150, 280, 150); c.fillStyle = '#c85a3c'; c.fillRect(x + 330 + v * 40, y - 310, 54, 310); c.fillStyle = shd; c.fillRect(x + 384 + v * 40, y - 310, 14, 310);
  c.fillStyle = '#12405c'; c.fillRect(x + 100, y - 150, 200, 138); c.fillStyle = '#f6f3ec'; for (let i = 0; i <= 4; i++) c.fillRect(x + 100 + i * 50 - 3, y - 150, 6, 138); c.fillStyle = 'rgba(160,220,240,.25)'; c.beginPath(); c.moveTo(x + 106, y - 20); c.lineTo(x + 180, y - 146); c.lineTo(x + 230, y - 146); c.lineTo(x + 156, y - 20); c.fill();
  c.fillStyle = '#f6f3ec'; c.fillRect(x - 30, y - 172, 470, 22); c.fillStyle = shd; c.fillRect(x - 10, y - 150, 450, 20);
  c.fillStyle = '#f6f3ec'; c.fillRect(x + 320, y - 250, 300, 20); c.fillStyle = shd; c.fillRect(x + 340, y - 230, 280, 16);
  c.fillStyle = '#f6f3ec'; for (const dx of [352, 470, 596]) c.fillRect(x + dx, y - 230, 10, 230);
  c.fillStyle = '#a8644e'; c.fillRect(x + 440, y - 112, 180, 112); c.fillStyle = '#12405c'; c.fillRect(x + 470, y - 96, 60, 80);
  c.fillStyle = '#f6f3ec'; for (let i = 0; i < 5; i++) c.fillRect(x + 300 - i * 16, y - 12 - (4 - i) * 12, 70 + i * 6, 12);
  c.fillStyle = '#f6f3ec'; c.fillRect(x - 30, y - 6, 700, 10);
}
function pool(c, x, y, w, t, dusk) {
  const d = 120; c.fillStyle = '#f6f3ec'; c.beginPath(); c.moveTo(x + 50, y - 12); c.lineTo(x + w + 14, y - 12); c.lineTo(x + w - 74, y + d + 12); c.lineTo(x - 62, y + d + 12); c.closePath(); c.fill();
  const g = c.createLinearGradient(0, y, 0, y + d); g.addColorStop(0, mixHex('#2f9fd0', '#e8809a', dusk * .5)); g.addColorStop(1, mixHex('#6fd6e6', '#ffc0a0', dusk * .5)); c.fillStyle = g; c.beginPath(); c.moveTo(x + 62, y); c.lineTo(x + w, y); c.lineTo(x + w - 78, y + d); c.lineTo(x - 40, y + d); c.closePath(); c.fill();
  c.fillStyle = 'rgba(16,60,130,.45)'; c.beginPath(); c.moveTo(x + 62, y); c.lineTo(x + w, y); c.lineTo(x + w - 12, y + 18); c.lineTo(x + 50, y + 18); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 26; i++) { const u = hash(i * 2.7), v = hash(i * 5.1), yy = y + 26 + v * (d - 34), xx = x + 62 - (yy - y) * .85 + u * (w - 70), tw = Math.sin(t * 2.2 + i * 1.7); if (tw > -.2) c.fillRect(xx + Math.sin(t * .9 + i) * 6, yy, 8 + hash(i) * 22 * (tw + .4), 3); }
  c.strokeStyle = '#dfe4ea'; c.lineWidth = 5; for (const dx of [0, 22]) { c.beginPath(); c.moveTo(x + w - 120 + dx, y + 30); c.lineTo(x + w - 120 + dx, y - 26); c.quadraticCurveTo(x + w - 120 + dx, y - 44, x + w - 100 + dx, y - 44); c.stroke(); }
}
function parasol(c, x, y) { c.fillStyle = '#f6f3ec'; c.fillRect(x - 3, y - 110, 6, 110); c.beginPath(); c.moveTo(x - 70, y - 100); c.quadraticCurveTo(x, y - 150, x + 70, y - 100); c.closePath(); c.fill(); c.fillStyle = '#e8553f'; c.beginPath(); c.moveTo(x - 24, y - 100); c.quadraticCurveTo(x, y - 146, x + 24, y - 100); c.closePath(); c.fill(); for (const s of [-1, 1]) { c.fillStyle = '#f6f3ec'; c.fillRect(x + s * 70 - 30, y - 26, 60, 7); c.fillRect(x + s * 70 - 30, y - 26, 5, 26); c.fillRect(x + s * 70 + 25, y - 26, 5, 26); c.fillRect(x + s * 70 + (s < 0 ? -30 : 25), y - 56, 5, 34); } c.fillStyle = 'rgba(18,30,96,.3)'; c.beginPath(); c.ellipse(x + 30, y + 4, 90, 12, 0, 0, TAU); c.fill(); }
function scene(c, t, f) {
  const sc = 800 + t * SPD, dusk = sstep(38, 58, t), shd = `rgba(22,26,104,${.38 + dusk * .1})`;
  const g = c.createLinearGradient(0, IY0, 0, HZ); g.addColorStop(0, mixHex('#1746b8', '#2a2f8c', dusk)); g.addColorStop(.55, mixHex('#2f72dc', '#8f5fb0', dusk)); g.addColorStop(1, mixHex('#5aa0ee', '#ffa890', dusk)); c.fillStyle = g; c.fillRect(0, IY0 - 400, W, HZ - IY0 + 400);
  // 飛行機雲
  { const u = mod(t / 46 + .25, 1), x = 1100 - u * 1300, y = 760 - u * 300; c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 4; c.lineCap = 'round'; const gl = c.createLinearGradient(x, y, x + 300, y + 70); gl.addColorStop(0, 'rgba(255,255,255,.9)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); c.strokeStyle = gl; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 300, y + 70); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fill(); }
  if (dusk > 0) { glowDot(c, 250, HZ - 30, 420, `rgba(255,190,130,${.6 * dusk})`); c.fillStyle = mixHex('#ffd070', '#ff8a60', dusk); c.globalAlpha = dusk; c.beginPath(); c.arc(250, HZ - 10 + dusk * 30, 60, Math.PI, TAU); c.fill(); c.globalAlpha = 1; }
  // 海
  const sg = c.createLinearGradient(0, HZ, 0, HZ + 80); sg.addColorStop(0, mixHex('#1a44b0', '#b8607a', dusk * .6)); sg.addColorStop(1, mixHex('#2f72d8', '#5a4aa0', dusk * .6)); c.fillStyle = sg; c.fillRect(0, HZ, W, 90);
  c.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 40; i++) { const x = mod(hash(i * 3.3) * 1400 - sc * .06, 1300) - 100, y = HZ + 8 + hash(i * 7.7) * 60; if (Math.sin(t * 2 + i * 2.3) > 0) c.fillRect(x, y, 6 + hash(i) * 16, 2.5); }
  { const x = mod(1500 - sc * .08, 2600) - 300; c.fillStyle = '#f6f3ec'; c.beginPath(); c.moveTo(x, HZ + 26); c.lineTo(x + 4, HZ - 34); c.lineTo(x + 34, HZ + 22); c.closePath(); c.fill(); c.fillRect(x - 22, HZ + 26, 64, 7); }
  // 木立・芝
  { const off = mod(sc * .42, 2400); c.drawImage(S.trees, -off, HZ + 62 - 320 + 20); c.drawImage(S.trees, -off + 2400, HZ + 62 - 320 + 20); }
  c.fillStyle = mixHex('#2f9450', '#3a6a6a', dusk * .6); c.fillRect(0, HZ + 78, W, RY - HZ - 78);
  c.fillStyle = mixHex('#268544', '#2f5a62', dusk * .6); for (let k = 0; k < 9; k++) c.fillRect(0, HZ + 96 + k * 44, W, 14);
  // 邸宅・プール・パラソル
  const sets = [[300, 0], [1750, 1], [3150, 0]];
  for (const [bx, v] of sets) { house(c, wx(bx, 1210, sc), 1210, v); }
  c.fillStyle = mixHex('#edb9a6', '#d08a9a', dusk * .5); c.fillRect(0, 1392, W, 34);
  for (const [bx, v] of sets) { pool(c, wx(bx + 140 + v * 500, 1300, sc), 1262, 520 + v * 120, t, dusk); parasol(c, wx(bx + 900 - v * 1100, 1370, sc), 1372); }
  // ヤシ(影→本体)
  const palms = [[120, 1440, 640], [520, 1470, 860], [640, 1452, 720], [1500, 1462, 800], [2100, 1446, 620], [2280, 1474, 900], [2900, 1458, 760], [3700, 1470, 840], [3860, 1444, 660]];
  c.fillStyle = shd; for (const [px, py, hh] of palms) { const x = wx(px, py, sc); c.beginPath(); c.moveTo(x - 6, py); c.lineTo(x + 8, py); c.lineTo(x + hh * .5 + 8, py + hh * .22); c.lineTo(x + hh * .5 - 6, py + hh * .22); c.closePath(); c.fill(); c.beginPath(); c.ellipse(x + hh * .52, py + hh * .22, 130, 34, .2, 0, TAU); c.fill(); }
  // 道路
  c.fillStyle = mixHex('#cfc8dc', '#a890b8', dusk * .7); c.fillRect(0, RY, W, 400); c.fillStyle = '#f6f3ec'; c.fillRect(0, RY, W, 9); c.fillStyle = 'rgba(40,40,110,.18)'; c.fillRect(0, RY + 9, W, 7);
  c.fillStyle = '#f6f3ec'; for (let k = -1; k < 5; k++) { const x = k * 360 - mod(sc * 1.12, 360); c.fillRect(x, 1730, 190, 9); }
  c.fillStyle = shd; for (const [px, py, hh] of palms) { const x = wx(px, py, sc) + hh * .5; if (py + hh * .22 > RY - 40) { c.beginPath(); c.ellipse(x + 20, Math.max(RY + 30, py + hh * .22), 120, 30, .2, 0, TAU); c.fill(); } }
  for (const [px, py, hh] of palms) palm2(c, wx(px, py, sc), py, hh, px, t);
  // バイク
  const bs = 1.15, bx = 470 - 145 * bs;
  c.fillStyle = shd; c.beginPath(); c.ellipse(bx + 190 * bs, GY + 16, 200 * bs, 20, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(bx + 60 * bs, GY + 8); c.lineTo(bx + 300 * bs, GY + 8); c.lineTo(bx + 420 * bs, GY + 46); c.lineTo(bx + 150 * bs, GY + 46); c.closePath(); c.fill();
  c.save(); c.translate(bx, GY); c.scale(bs, bs); drawRacerSide(c, { rot: sc / (RR.R * bs), t, bob: Math.sin(t * 17) * .6 + Math.sin(t * 5.3) * .8, lightOn: dusk > .6 }); c.restore();
  // 手前を横切るヤシの幹
  for (let k = 0; k < 2; k++) { const x = mod(k * 2600 + 1900 - sc * 1.8, 5200) - 500; if (x > -300 && x < W + 300) { c.fillStyle = '#5a3a26'; c.beginPath(); c.moveTo(x, IY1 + 20); c.lineTo(x + 56, IY1 + 20); c.lineTo(x + 96, IY0 - 300); c.lineTo(x + 60, IY0 - 300); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,220,180,.18)'; c.beginPath(); c.moveTo(x + 6, IY1 + 20); c.lineTo(x + 20, IY1 + 20); c.lineTo(x + 72, IY0 - 300); c.lineTo(x + 64, IY0 - 300); c.closePath(); c.fill(); } }
}
window.renderFrame = function (f) {
  const t = f / FPS, c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#f7f4ec'; c.fillRect(0, 0, W, H);
  const z = 1 + .55 * sstep(18, 30, t) * (1 - sstep(42, 54, t));
  c.save(); c.beginPath(); c.rect(IX0, IY0, IX1 - IX0, IY1 - IY0); c.clip(); c.translate(500, 1560); c.scale(z, z); c.translate(-500, -1560); scene(c, t, f); c.restore();
  c.save(); c.globalCompositeOperation = 'overlay'; c.beginPath(); c.rect(IX0, IY0, IX1 - IX0, IY1 - IY0); c.clip(); c.drawImage(S.grain, 0, 0); c.restore();
  // ポスターの題字
  const a = sstep(.6, 2, t); c.save(); c.globalAlpha = a; c.fillStyle = '#15151c'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.font = 'italic 150px Anton'; c.letterSpacing = '14px'; c.save(); c.translate(W / 2 + 7, 236); c.transform(1, 0, -.18, 1, 0, 0); c.fillText('ENDLESS SUMMER', 0, 0, 940); c.restore();
  c.font = '34px Kaisei'; c.letterSpacing = '9px'; c.fillStyle = '#f7f4ec'; c.fillText('city pop for riders', W / 2 + 4, 392);
  c.fillStyle = '#15151c'; c.font = '34px ZenA'; c.letterSpacing = '6px'; c.textAlign = 'left'; c.fillText('夏は、終わらない。', IX0, 1858); c.textAlign = 'right'; c.font = '28px Kaisei'; c.letterSpacing = '4px'; c.fillText('Summer never ends.', IX1, 1856); c.restore();
  const fi = 1 - sstep(0, 1.2, t); if (fi > 0) { c.fillStyle = `rgba(247,244,236,${fi})`; c.fillRect(0, 0, W, H); }
  const fo = sstep(58, 59.8, t); if (fo > 0) { c.fillStyle = `rgba(247,244,236,${fo})`; c.fillRect(0, 0, W, H); }
};
