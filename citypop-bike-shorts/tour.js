// ゆっくり走るツーリング3本(e1: 海岸線の平塗り / e2: 山と湖の線画ポップ / e3: 夕方の高原の平塗り)
// 体を起こして走り、ときどき奥の景色を眺め、対向ライダーとすれ違うたびに手を上げる(ヤエー)。カットなしの長回し60秒
'use strict';
const VAR = new URLSearchParams(location.search).get('v') || 'e1';
const cv = document.getElementById('cv'), ctx = cv.getContext('2d', { willReadFrequently: true });
const PASS = [14, 31, 47], LOOKS = [[4.5, 9.5], [20, 25.5], [37, 42.5], [52, 57]], SPD = 300, VREL = 520;
const waveAt = (t) => Math.max(...PASS.map(tp => sstep(tp - 2.2, tp - 1.3, t) * (1 - sstep(tp + .6, tp + 1.5, t))));
const lookAt = (t) => Math.max(...LOOKS.map(([a, b]) => sstep(a, a + .9, t) * (1 - sstep(b - .9, b, t))));
const ONC = [{ body: '#2f8a58', body2: '#1c5a38', jacket: '#3a3a44', helmet: '#f4d23a', helmetStripe: '#20242e', scarf: '#f4efe2' }, { body: '#e8a820', body2: '#a86c10', jacket: '#7a3a2a', helmet: '#f4efe2', helmetStripe: '#2f6fb8', scarf: '#2f6fb8' }, { body: '#2a2e3c', body2: '#14161e', jacket: '#b83a2a', helmet: '#20242e', helmetStripe: '#e8553f', scarf: '#f4efe2' }];
let S = {};
window.init = async function () {
  S.grain = mk(W, H); { const c = S.grain.getContext('2d'), img = c.createImageData(W, H), d = img.data, r = rng(9); for (let i = 0; i < d.length; i += 4) { const v = r() < .5 ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = r() * 30; } c.putImageData(img, 0, 0); }
};
// 対向ライダー(奥の車線を右から左へ)
function oncoming(c, t, bx, gy, bs, shd) {
  PASS.forEach((tp, i) => { const s = bs * .9, x = bx + 150 * bs + (tp - t) * VREL, y = gy - 46 * bs; if (x < -400 || x > W + 400) return;
    if (shd) { c.fillStyle = shd; c.beginPath(); c.ellipse(x, y + 8, 190 * s, 13 * s, 0, 0, TAU); c.fill(); }
    c.save(); c.translate(x + 155 * s, y); c.scale(-s, s); drawBikeSide(c, { ...ONC[i], rot: t * 14, t: t + i, bob: Math.sin(t * 15 + i) * .8, wave: sstep(tp - 2.6, tp - 1.8, t) * (1 - sstep(tp - .2, tp + .6, t)) }); c.restore(); });
}
function ourBike(c, t, bx, gy, bs, sc, o = {}) { c.save(); c.translate(bx, gy); c.scale(bs, bs); drawRacerSide(c, { rot: sc / (RR.R * bs), t, bob: Math.sin(t * 11) * .5 + Math.sin(t * 3.7) * .9, upright: true, wave: waveAt(t), look: lookAt(t), ...o }); c.restore(); }
function yaehLabel(c, t, bx, gy, bs, style) {
  PASS.forEach((tp, i) => { const u = t - (tp - 1.3); if (u < 0 || u > 2.6) return; const a = sstep(0, .25, u) * (1 - sstep(1.8, 2.6, u)), x = bx + 250 * bs, y = gy - 430 * bs - u * 14;
    c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(-.1); c.textAlign = 'left'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    if (style === 'pop') { c.font = '74px Dela'; c.strokeStyle = '#27215a'; c.lineWidth = 16; c.strokeText('ヤエー!', 0, 0); c.fillStyle = '#ffd84a'; c.fillText('ヤエー!', 0, 0); }
    else { c.font = '58px Dela'; c.strokeStyle = 'rgba(20,30,70,.55)'; c.lineWidth = 10; c.strokeText('ヤエー!', 0, 0); c.fillStyle = '#fffdf4'; c.fillText('ヤエー!', 0, 0); }
    if (i === 0) { c.font = 'italic 28px Kaisei'; c.fillStyle = style === 'pop' ? '#27215a' : '#fffdf4'; c.letterSpacing = '3px'; c.fillText("the riders' wave", 6, 58); }
    c.restore(); });
}
function cumulus(c, x, y, s, cw, cs) { const B = [[0, 0, 70], [70, -34, 90], [150, -70, 96], [230, -30, 84], [300, 6, 62], [110, -130, 70], [-56, 14, 54]]; c.save(); c.beginPath(); c.rect(-200, -3000, W + 400, 3000 + y + 34 * s); c.clip(); for (const [col, ox, oy] of [[cs, 0, 0], [cw, -14 * s, -18 * s]]) { c.fillStyle = col; for (const [bx, by, br] of B) { c.beginPath(); c.arc(x + bx * s + ox, y + by * s + oy, br * s, 0, TAU); c.fill(); } } c.restore(); }
function hills(c, y0, amp, seed, off, col, base, k = 1) { c.fillStyle = col; c.beginPath(); c.moveTo(-60, base); for (let x = -60; x <= W + 60; x += 12) { const u = (x + off) * k; c.lineTo(x, y0 - amp * (.5 + .5 * Math.sin(u / 330 + seed)) - amp * .35 * Math.sin(u / 113 + seed * 2.3) - amp * .1 * Math.sin(u / 41 + seed * 5)); } c.lineTo(W + 60, base); c.closePath(); c.fill(); }
const hillY = (x, y0, amp, seed, off, k = 1) => { const u = (x + off) * k; return y0 - amp * (.5 + .5 * Math.sin(u / 330 + seed)) - amp * .35 * Math.sin(u / 113 + seed * 2.3) - amp * .1 * Math.sin(u / 41 + seed * 5); };

// ================= e1: 海岸線(平塗り) =================
function ocean(c, t) {
  const sc = 500 + t * SPD, HZ = 1010, RY = 1430, GY = 1590, bs = 1.12, bx = 430 - 145 * bs, shd = 'rgba(24,40,120,.34)';
  const g = c.createLinearGradient(0, 0, 0, HZ); g.addColorStop(0, '#1c56c8'); g.addColorStop(.6, '#4f98e8'); g.addColorStop(1, '#a8d8f4'); c.fillStyle = g; c.fillRect(0, 0, W, HZ);
  cumulus(c, mod(700 - t * 3, 1900) - 400, 840, 1.25, '#ffffff', '#c4dcf4'); cumulus(c, mod(1500 - t * 2, 2100) - 500, 900, 1.0, '#ffffff', '#c4dcf4'); cumulus(c, mod(200 - t * 4, 1700) - 500, 620, .8, '#ffffff', '#cfe4f8');
  // 海
  const sg = c.createLinearGradient(0, HZ, 0, RY - 60); sg.addColorStop(0, '#1a4cb0'); sg.addColorStop(.45, '#2a84cc'); sg.addColorStop(1, '#3fc4cc'); c.fillStyle = sg; c.fillRect(0, HZ, W, RY - HZ);
  for (let i = 0; i < 3; i++) { const x = mod(900 + i * 1300 - sc * .04, 3000) - 500, w = 300 + i * 90; c.fillStyle = '#3f9a68'; c.beginPath(); c.moveTo(x, HZ + 2); c.quadraticCurveTo(x + w * .3, HZ - 60 - i * 14, x + w * .6, HZ - 30); c.quadraticCurveTo(x + w * .8, HZ - 44, x + w, HZ + 2); c.closePath(); c.fill(); c.fillStyle = '#f2ead4'; c.fillRect(x + 10, HZ - 4, w - 20, 8); }
  for (let i = 0; i < 2; i++) { const x = mod(400 + i * 1100 - sc * .06, 2400) - 200; c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x, HZ + 34); c.lineTo(x + 5, HZ - 22); c.lineTo(x + 36, HZ + 30); c.closePath(); c.fill(); c.fillRect(x - 20, HZ + 34, 62, 6); }
  c.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 70; i++) { const v = Math.pow(hash(i * 7.7), 1.4), y = HZ + 10 + v * (RY - HZ - 150), x = mod(hash(i * 3.3) * 1500 - sc * (.05 + v * .2), 1400) - 150; if (Math.sin(t * 1.8 + i * 2.3) > .1) c.fillRect(x, y, (8 + hash(i) * 20) * (.6 + v), 3 + v * 2); }
  // 岬(白い崖と灯台)
  for (let k = 0; k < 2; k++) { const x = mod(1300 + k * 1900 - sc * .32, 3800) - 900, w = 760; if (x > W + 50 || x + w < -50) continue; c.fillStyle = '#f4ecd6'; c.beginPath(); c.moveTo(x, RY - 40); c.lineTo(x + 60, RY - 250); c.lineTo(x + 260, RY - 330); c.lineTo(x + 520, RY - 290); c.lineTo(x + 700, RY - 160); c.lineTo(x + w, RY - 40); c.closePath(); c.fill();
    c.fillStyle = 'rgba(40,60,140,.2)'; c.beginPath(); c.moveTo(x + 260, RY - 330); c.lineTo(x + 520, RY - 290); c.lineTo(x + 700, RY - 160); c.lineTo(x + w, RY - 40); c.lineTo(x + 420, RY - 40); c.closePath(); c.fill();
    c.fillStyle = '#3f9a58'; c.beginPath(); c.moveTo(x + 44, RY - 238); c.lineTo(x + 60, RY - 262); c.quadraticCurveTo(x + 250, RY - 372, x + 530, RY - 302); c.lineTo(x + 712, RY - 164); c.lineTo(x + 690, RY - 150); c.lineTo(x + 516, RY - 270); c.quadraticCurveTo(x + 260, RY - 320, x + 70, RY - 232); c.closePath(); c.fill();
    if (k === 0) { c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x + 300, RY - 334); c.lineTo(x + 312, RY - 470); c.lineTo(x + 344, RY - 470); c.lineTo(x + 356, RY - 334); c.closePath(); c.fill(); c.fillStyle = '#e8553f'; c.fillRect(x + 308, RY - 492, 40, 22); c.fillRect(x + 306, RY - 420, 44, 20); c.fillStyle = shd; c.beginPath(); c.moveTo(x + 344, RY - 470); c.lineTo(x + 356, RY - 334); c.lineTo(x + 336, RY - 334); c.closePath(); c.fill(); }
    c.fillStyle = '#ffffff'; for (let q = 0; q < 9; q++) { const fx = x - 20 + q * 96 + Math.sin(t * 1.3 + q) * 10; c.beginPath(); c.ellipse(fx, RY - 40, 56, 9 + Math.sin(t * 2 + q * 1.7) * 4, 0, 0, TAU); c.fill(); } }
  // 路肩の草地と柵
  c.fillStyle = '#43a85c'; c.fillRect(0, RY - 62, W, 62); c.fillStyle = '#358f4c'; c.fillRect(0, RY - 22, W, 22);
  for (let i = 0; i < 46; i++) { const x = mod(hash(i * 4.1) * 1400 - sc * .96, 1300) - 100, y = RY - 54 + hash(i * 9.3) * 44; c.fillStyle = i % 3 ? '#ffe04a' : '#ffffff'; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill(); }
  for (let k = 0; k < 2; k++) { const x = mod(700 + k * 1700 - sc * .96, 3400) - 500; c.fillStyle = shd; c.beginPath(); c.ellipse(x + 130, RY - 6, 150, 16, 0, 0, TAU); c.fill(); c.strokeStyle = '#6a4630'; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, RY - 10); c.quadraticCurveTo(x + 20, RY - 130, x + 80, RY - 210); c.stroke(); for (const [dx, dy, rx, ry, col] of [[60, -230, 150, 44, '#1f6a3c'], [120, -280, 120, 38, '#2a8048'], [20, -276, 90, 30, '#2a8048'], [90, -320, 80, 26, '#35945a']]) { c.fillStyle = col; c.beginPath(); c.ellipse(x + dx + Math.sin(t * 1.2 + dx) * 4, RY + dy, rx, ry, -.12, 0, TAU); c.fill(); } }
  c.fillStyle = '#ffffff'; for (let k = -1; k < 11; k++) { const x = k * 120 - mod(sc * .98, 120); c.fillRect(x, RY - 58, 12, 62); c.fillStyle = 'rgba(24,40,120,.25)'; c.fillRect(x + 8, RY - 58, 4, 62); c.fillStyle = '#ffffff'; } c.fillRect(0, RY - 46, W, 6); c.fillRect(0, RY - 24, W, 5);
  // 道
  c.fillStyle = '#cdd2de'; c.fillRect(0, RY, W, 330); c.fillStyle = '#ffffff'; c.fillRect(0, RY, W, 8); c.fillStyle = '#ffffff'; for (let k = -1; k < 5; k++) { const x = k * 340 - mod(sc * 1.04, 340); c.fillRect(x, GY - 96, 170, 8); }
  c.fillStyle = shd; for (let k = 0; k < 2; k++) { const x = mod(700 + k * 1700 - sc * .96, 3400) - 500 + 150; c.beginPath(); c.ellipse(x + 60, RY + 40, 170, 26, .1, 0, TAU); c.fill(); }
  oncoming(c, t, bx, GY, bs, shd);
  c.fillStyle = shd; c.beginPath(); c.ellipse(bx + 170 * bs, GY + 14, 200 * bs, 18, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(bx + 40, GY + 8); c.lineTo(bx + 300 * bs, GY + 8); c.lineTo(bx + 400 * bs, GY + 44); c.lineTo(bx + 130, GY + 44); c.closePath(); c.fill();
  ourBike(c, t, bx, GY, bs, sc);
  // 手前の草花
  c.fillStyle = '#358f4c'; c.fillRect(0, 1760, W, 200); c.fillStyle = '#43a85c'; c.fillRect(0, 1760, W, 14);
  for (let i = 0; i < 60; i++) { const x = mod(hash(i * 5.3) * 1500 - sc * 1.25, 1400) - 150, y = 1790 + hash(i * 2.9) * 110, sw = Math.sin(t * 1.6 + i) * 5; c.strokeStyle = '#2a7a40'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y + 40); c.lineTo(x + sw, y); c.stroke(); c.fillStyle = i % 3 ? '#ffe04a' : (i % 2 ? '#ffffff' : '#ff8fa8'); c.beginPath(); c.arc(x + sw, y, 9, 0, TAU); c.fill(); }
  // カモメ
  c.strokeStyle = '#ffffff'; c.lineWidth = 5; c.lineCap = 'round'; for (let i = 0; i < 4; i++) { const x = mod(200 + i * 330 + t * (26 + i * 7), W + 300) - 150, y = 520 + i * 80 + Math.sin(t * .8 + i) * 30, fl = Math.sin(t * 5 + i * 2) * 12; c.beginPath(); c.moveTo(x - 28, y - fl); c.quadraticCurveTo(x - 11, y - 13, x, y); c.quadraticCurveTo(x + 11, y - 13, x + 28, y - fl); c.stroke(); }
  return [bx, GY, bs];
}
// ================= e2: 山と湖(線画ポップ) =================
const OL2 = '#27215a';
function lake(c, t) {
  const sc = 300 + t * SPD, HZ = 1040, RY = 1440, GY = 1600, bs = 1.12, bx = 430 - 145 * bs; c.strokeStyle = OL2; c.lineJoin = 'round';
  c.fillStyle = '#dff1f8'; c.fillRect(0, 0, W, HZ); c.fillStyle = '#bfe2f4'; for (let i = 0; i < 20; i++) { const y = Math.pow(i / 20, 1.3) * HZ; c.fillRect(0, y, W, HZ / 20 * (.3 + .4 * (1 - i / 20))); } c.fillStyle = '#ffd84a'; for (let i = 0; i < 6; i++) c.fillRect(0, 260 + i * 110, W, 3);
  c.fillStyle = '#ffd84a'; c.lineWidth = 5; c.beginPath(); c.arc(820, 380, 58, 0, TAU); c.fill(); c.stroke();
  // 連峰(雪)
  const peaks = (off, base, hh, col, n, seed) => { for (let k = -1; k < n; k++) { const w = 520, x = k * 380 - mod(off, 380), ph = hh * (.7 + .3 * hash(seed + Math.floor(off / 380) + k)), px = x + w / 2; c.fillStyle = col; c.beginPath(); c.moveTo(x, base); c.lineTo(px - 40, base - ph); c.lineTo(px + 30, base - ph * .9); c.lineTo(x + w, base); c.closePath(); c.fill(); c.lineWidth = 5; c.stroke();
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(px - 40, base - ph); c.lineTo(px + 30, base - ph * .9); c.lineTo(px + 96, base - ph * .62); c.lineTo(px + 50, base - ph * .7); c.lineTo(px + 14, base - ph * .56); c.lineTo(px - 30, base - ph * .72); c.lineTo(px - 74, base - ph * .6); c.lineTo(px - 104, base - ph * .64); c.closePath(); c.fill(); c.lineWidth = 4; c.stroke(); } };
  peaks(sc * .04, HZ, 520, '#9a98dc', 5, 3); peaks(sc * .09 + 190, HZ, 330, '#7a78c8', 5, 11);
  // 湖
  c.fillStyle = '#8fdcd2'; c.fillRect(0, HZ, W, RY - HZ); c.fillStyle = '#6fcabe'; for (let i = 0; i < 12; i++) c.fillRect(0, HZ + 20 + i * 30, W, 8 + i * 1.5);
  c.save(); c.globalAlpha = .35; c.translate(0, HZ * 2); c.scale(1, -1); c.beginPath(); c.rect(0, HZ - 260, W, 260); c.clip(); peaks(sc * .09 + 190, HZ, 330, '#7a78c8', 5, 11); c.restore();
  c.fillStyle = '#ffffff'; for (let i = 0; i < 26; i++) { const y = HZ + 30 + hash(i * 7.7) * (RY - HZ - 150), x = mod(hash(i * 3.3) * 1500 - sc * .2, 1400) - 150; if (Math.sin(t * 1.7 + i * 2.3) > 0) c.fillRect(x, y, 30 + hash(i) * 50, 5); }
  c.lineWidth = 5; c.beginPath(); c.moveTo(0, HZ); c.lineTo(W, HZ); c.stroke();
  // 対岸の針葉樹
  for (let k = -1; k < 24; k++) { const x = k * 56 - mod(sc * .14, 56), hh = 70 + hash(k + Math.floor(sc * .14 / 56)) * 60; c.fillStyle = '#2a8a82'; c.beginPath(); c.moveTo(x, HZ + 6); c.lineTo(x + 28, HZ + 6 - hh); c.lineTo(x + 56, HZ + 6); c.closePath(); c.fill(); c.lineWidth = 4; c.stroke(); }
  // 小舟と桟橋
  { const x = mod(1700 - sc * .5, 2800) - 500; c.fillStyle = '#e8553f'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, RY - 190); c.lineTo(x + 150, RY - 190); c.lineTo(x + 126, RY - 160); c.lineTo(x + 22, RY - 160); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#c8a070'; c.fillRect(x + 260, RY - 150, 260, 16); c.strokeRect(x + 260, RY - 150, 260, 16); for (const dx of [280, 380, 480]) { c.fillRect(x + dx, RY - 150, 14, 60); c.strokeRect(x + dx, RY - 150, 14, 60); } }
  // 岸辺の草地・花・木柵
  c.fillStyle = '#9fe0b8'; c.fillRect(0, RY - 100, W, 100); c.fillStyle = '#6fc890'; for (let i = 0; i < 4; i++) c.fillRect(0, RY - 84 + i * 24, W, 9); c.lineWidth = 5; c.beginPath(); c.moveTo(0, RY - 100); c.lineTo(W, RY - 100); c.stroke();
  for (let i = 0; i < 30; i++) { const x = mod(hash(i * 4.1) * 1400 - sc * .95, 1300) - 100, y = RY - 86 + hash(i * 9.3) * 60; c.fillStyle = i % 2 ? '#ff7fa8' : '#ffd84a'; c.beginPath(); c.arc(x, y, 8, 0, TAU); c.fill(); c.lineWidth = 3; c.stroke(); }
  for (let k = 0; k < 3; k++) { const x = mod(500 + k * 1100 - sc * .97, 3300) - 400, s = 1 + (k % 2) * .25; c.fillStyle = '#8a5a3a'; c.lineWidth = 5; c.fillRect(x - 12, RY - 150 * s, 24, 150 * s); c.strokeRect(x - 12, RY - 150 * s, 24, 150 * s); for (let q = 0; q < 4; q++) { const w = (190 - q * 36) * s, yy = RY - (120 + q * 110) * s; c.fillStyle = q % 2 ? '#1f7a72' : '#2a8a82'; c.beginPath(); c.moveTo(x - w / 2, yy); c.lineTo(x + Math.sin(t * 1.1 + k) * 4, yy - 170 * s); c.lineTo(x + w / 2, yy); c.closePath(); c.fill(); c.stroke(); } }
  c.fillStyle = '#c8a070'; c.lineWidth = 5; c.fillRect(0, RY - 50, W, 12); c.strokeRect(-10, RY - 50, W + 20, 12); c.fillRect(0, RY - 22, W, 10); c.strokeRect(-10, RY - 22, W + 20, 10); for (let k = -1; k < 9; k++) { const x = k * 150 - mod(sc * .98, 150); c.fillRect(x, RY - 70, 18, 76); c.strokeRect(x, RY - 70, 18, 76); }
  // 道(縞)
  c.fillStyle = '#d4cdea'; c.fillRect(0, RY, W, 330); c.fillStyle = '#bcb2de'; for (let i = 0; i < 7; i++) c.fillRect(0, RY + 30 + i * 44, W, 10 + i * 2); c.lineWidth = 5; c.beginPath(); c.moveTo(0, RY + 3); c.lineTo(W, RY + 3); c.stroke();
  c.fillStyle = '#ffffff'; for (let k = -1; k < 5; k++) { const x = k * 340 - mod(sc * 1.04, 340); c.fillRect(x, GY - 98, 170, 10); c.lineWidth = 3; c.strokeRect(x, GY - 98, 170, 10); }
  oncoming(c, t, bx, GY, bs, 'rgba(60,40,130,.4)');
  c.fillStyle = 'rgba(60,40,130,.45)'; c.beginPath(); c.ellipse(bx + 160 * bs, GY + 12, 200 * bs, 16, 0, 0, TAU); c.fill();
  ourBike(c, t, bx, GY, bs, sc, { shade: 'rgba(110,80,180,.28)' });
  c.fillStyle = '#6fc890'; c.fillRect(0, 1770, W, 200); c.fillStyle = '#4fae78'; for (let i = 0; i < 4; i++) c.fillRect(0, 1800 + i * 34, W, 12); c.lineWidth = 5; c.strokeStyle = OL2; c.beginPath(); c.moveTo(0, 1770); c.lineTo(W, 1770); c.stroke();
  for (let i = 0; i < 26; i++) { const x = mod(hash(i * 5.3) * 1500 - sc * 1.25, 1400) - 150, y = 1810 + hash(i * 2.9) * 80; c.fillStyle = i % 2 ? '#ff7fa8' : '#ffffff'; c.beginPath(); c.arc(x, y, 12, 0, TAU); c.fill(); c.lineWidth = 4; c.stroke(); c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fill(); }
  return [bx, GY, bs];
}
// ================= e3: 夕方の高原(平塗り) =================
function highland(c, t) {
  const sc = 400 + t * SPD, HZ = 1060, RY = 1450, GY = 1600, bs = 1.12, bx = 430 - 145 * bs, shd = 'rgba(70,40,90,.36)';
  const g = c.createLinearGradient(0, 0, 0, HZ); g.addColorStop(0, '#3a78b4'); g.addColorStop(.45, '#8fb4c8'); g.addColorStop(.75, '#f4c090'); g.addColorStop(1, '#ffe4a8'); c.fillStyle = g; c.fillRect(0, 0, W, HZ + 4);
  const sx = 800, sy = HZ - 120 + t * .9; glowDot(c, sx, sy, 560, 'rgba(255,224,160,.6)'); c.fillStyle = '#fff4d0'; c.beginPath(); c.arc(sx, sy, 70, 0, TAU); c.fill();
  for (let i = 0; i < 8; i++) { const y = 380 + hash(i * 2.1) * 560, w = 280 + hash(i * 3.7) * 520, x = mod(hash(i * 5.9) * 1900 - t * (3 + hash(i) * 5), W + 1000) - 600, hh = 9 + hash(i * 6.1) * 14; c.globalAlpha = .5 + hash(i * 4.4) * .35; c.fillStyle = i % 2 ? '#ffd0b0' : '#f09a90'; rr(c, x, y, w, hh, hh / 2); c.fill(); rr(c, x + w * .2, y + hh * 1.4, w * .6, hh * .7, hh / 2); c.fill(); } c.globalAlpha = 1;
  // 遠くの火山と噴煙
  { const x = 280 - sc * .012; c.fillStyle = '#8f9ac0'; c.beginPath(); c.moveTo(x - 420, HZ); c.lineTo(x - 70, HZ - 300); c.quadraticCurveTo(x, HZ - 284, x + 60, HZ - 300); c.lineTo(x + 460, HZ); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,240,220,.7)'; for (let q = 0; q < 6; q++) { const u = mod(t * .05 + q / 6, 1); c.globalAlpha = (1 - u) * .7; c.beginPath(); c.arc(x - 6 + u * 150, HZ - 300 - u * 190, 22 + u * 54, 0, TAU); c.fill(); } c.globalAlpha = 1; }
  // 重なる丘
  const L = [[HZ - 20, 120, 1.3, .03, '#a8b89a'], [HZ + 60, 130, 4.1, .07, '#b4bc74'], [HZ + 170, 120, 7.7, .14, '#98ac58'], [HZ + 290, 110, 2.6, .28, '#7c9a48']];
  L.forEach(([y0, amp, seed, par, col], li) => { hills(c, y0, amp, seed, sc * par + li * 500, col, RY);
    if (li === 2) { for (let k = 0; k < 3; k++) { const x = mod(300 + k * 900 - sc * par, 2700) - 300, y = hillY(x, y0, amp, seed, sc * par + li * 500); c.fillStyle = 'rgba(70,40,90,.3)'; c.beginPath(); c.ellipse(x - 60, y + 6, 80, 9, 0, 0, TAU); c.fill(); c.fillStyle = '#5a3c2a'; c.fillRect(x - 5, y - 60, 10, 62); c.fillStyle = '#3f7a3a'; c.beginPath(); c.arc(x, y - 92, 46, 0, TAU); c.fill(); c.fillStyle = '#5a9a48'; c.beginPath(); c.arc(x + 12, y - 102, 30, 0, TAU); c.fill(); } }
    if (li === 3) { for (let k = 0; k < 9; k++) { const x = mod(hash(k * 3.7) * 2400 - sc * par, 2400) - 200, y = hillY(x, y0, amp, seed, sc * par + li * 500) + 26 + hash(k) * 40; c.fillStyle = k % 3 ? '#4a3428' : '#f4ecd8'; c.beginPath(); c.ellipse(x, y, 22, 12, 0, 0, TAU); c.fill(); c.fillRect(x - 16, y, 5, 16); c.fillRect(x + 10, y, 5, 16); c.beginPath(); c.arc(x + 24, y - 4 + Math.sin(t + k) * 3, 8, 0, TAU); c.fill(); } } });
  const hz2 = c.createLinearGradient(0, HZ - 60, 0, HZ + 200); hz2.addColorStop(0, 'rgba(255,220,160,0)'); hz2.addColorStop(.4, 'rgba(255,220,160,.34)'); hz2.addColorStop(1, 'rgba(255,220,160,0)'); c.fillStyle = hz2; c.fillRect(0, HZ - 60, W, 260);
  // 牧柵と道
  c.fillStyle = '#6c8a40'; c.fillRect(0, RY - 40, W, 40);
  c.fillStyle = '#5a4030'; for (let k = -1; k < 9; k++) { const x = k * 150 - mod(sc * .97, 150); c.fillRect(x, RY - 92, 12, 96); } c.fillRect(0, RY - 76, W, 5); c.fillRect(0, RY - 46, W, 5);
  c.fillStyle = '#948c9c'; c.fillRect(0, RY, W, 330); c.fillStyle = '#fff4dc'; c.fillRect(0, RY, W, 7); for (let k = -1; k < 5; k++) { const x = k * 340 - mod(sc * 1.04, 340); c.fillRect(x, GY - 98, 170, 8); }
  c.fillStyle = shd; for (let k = -1; k < 9; k++) { const x = k * 150 - mod(sc * .97, 150); c.beginPath(); c.moveTo(x, RY + 4); c.lineTo(x + 12, RY + 4); c.lineTo(x - 110, RY + 70); c.lineTo(x - 122, RY + 70); c.closePath(); c.fill(); }
  oncoming(c, t, bx, GY, bs, shd);
  c.fillStyle = shd; c.beginPath(); c.ellipse(bx + 150 * bs, GY + 12, 200 * bs, 16, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(bx + 20, GY + 8); c.lineTo(bx + 290 * bs, GY + 8); c.lineTo(bx + 60 * bs, GY + 120); c.lineTo(bx - 260, GY + 120); c.closePath(); c.fill();
  ourBike(c, t, bx, GY, bs, sc, { shade: 'rgba(120,60,90,.26)' });
  c.save(); c.globalCompositeOperation = 'lighter'; const wg = c.createLinearGradient(0, RY, 0, H); wg.addColorStop(0, 'rgba(255,190,120,.16)'); wg.addColorStop(1, 'rgba(255,190,120,0)'); c.fillStyle = wg; c.fillRect(0, RY - 400, W, H); c.restore();
  // 手前のススキ
  c.fillStyle = '#6c8a40'; c.fillRect(0, 1790, W, 200);
  for (let i = 0; i < 46; i++) { const x = mod(hash(i * 5.3) * 1700 - sc * 1.35, 1600) - 250, hh = 170 + hash(i * 2.9) * 240, sw = Math.sin(t * 1.4 + i * .7) * 22 + 30; c.strokeStyle = '#8a7a3a'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, H + 10); c.quadraticCurveTo(x + sw * .2, H - hh * .6, x + sw, H - hh); c.stroke(); c.strokeStyle = i % 2 ? '#fff0c0' : '#f4d890'; c.lineWidth = 13; c.beginPath(); c.moveTo(x + sw, H - hh); c.quadraticCurveTo(x + sw + 26, H - hh - 34, x + sw + 54, H - hh - 26); c.stroke(); }
  return [bx, GY, bs];
}
function title(c, t, big, jp, en, col, sh) {
  const a = sstep(1.2, 2.6, t) * (1 - sstep(8.4, 9.8, t)); if (a <= 0) return; c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.shadowColor = sh; c.shadowBlur = 18;
  if (VAR === 'e2') { c.shadowBlur = 0; c.font = '170px Dafoe'; c.lineJoin = 'round'; c.strokeStyle = OL2; c.lineWidth = 16; c.save(); c.translate(W / 2, 250); c.rotate(-.06); c.strokeText(big, 6, 8); c.fillStyle = '#ffffff'; c.fillText(big, 0, 0); c.restore(); c.fillStyle = OL2; }
  else { c.save(); c.translate(W / 2 + 8, 250); c.transform(1, 0, -.16, 1, 0, 0); c.font = 'italic 150px Anton'; c.letterSpacing = '16px'; c.fillText(big, 0, 0, 960); c.restore(); }
  c.font = '44px ZenA'; c.letterSpacing = '10px'; c.fillText(jp, W / 2 + 5, 400); c.font = 'italic 30px Kaisei'; c.letterSpacing = '6px'; c.fillText(en, W / 2 + 3, 458); c.restore();
}
window.renderFrame = function (f) {
  const t = f / FPS, c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#f7f4ec'; c.fillRect(0, 0, W, H);
  const z = 1 + .34 * sstep(16, 28, t) * (1 - sstep(40, 52, t)); let P;
  c.save(); c.translate(470, 1560); c.scale(z, z); c.translate(-470, -1560);
  if (VAR === 'e1') P = ocean(c, t); else if (VAR === 'e2') P = lake(c, t); else P = highland(c, t);
  c.restore();
  if (VAR === 'e2') inkFilter(c, 0, 0, W, H, { ink: [39, 33, 90], th: 46, gain: .02, step: 2, strength: 1, period: 10, toneHi: .5, toneLo: .16, tone: .8 });
  else { c.save(); c.globalCompositeOperation = 'overlay'; c.drawImage(S.grain, 0, 0); c.restore(); }
  c.save(); c.translate(470, 1560); c.scale(z, z); c.translate(-470, -1560); yaehLabel(c, t, P[0], P[1], P[2], VAR === 'e2' ? 'pop' : 'flat'); c.restore();
  if (VAR === 'e1') title(c, t, 'OCEAN ROAD', '海岸線を、ゆっくりと。', 'Take it slow along the coast.', '#ffffff', 'rgba(20,50,140,.5)');
  else if (VAR === 'e2') title(c, t, 'Mountain Lake', '山と湖の道。', 'A road between peaks and water.', '#ffffff', 'rgba(0,0,0,0)');
  else title(c, t, 'HIGHLAND', '高原に、風が吹く。', 'Wind over the highlands.', '#ffffff', 'rgba(120,60,40,.5)');
  const fc = VAR === 'e2' ? '#dff1f8' : (VAR === 'e3' ? '#ffe9c0' : '#f7f4ec');
  const fi = 1 - sstep(0, 1.2, t); if (fi > 0) { c.fillStyle = hexA(fc, fi); c.fillRect(0, 0, W, H); }
  const fo = sstep(58, 59.8, t); if (fo > 0) { c.fillStyle = hexA(fc, fo); c.fillRect(0, 0, W, H); }
};
