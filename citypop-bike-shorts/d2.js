// 動画D2「Twilight Bay」: ピンクと紫の線画スカイライン+原色と網点のポップアート。120BPM 30小節=60秒
// 0-20s 湾岸を走る引き / 20-40s ヘルメットの大写し(バイザーに街が映る) / 40-60s 日が落ちて灯がともる
'use strict';
const cv = document.getElementById('cv'), ctx = cv.getContext('2d', { willReadFrequently: true });
const OL = '#2e1248', PEACH = '#f7bfa6', PINK = '#ee8fa0', HOT = '#ee3f8e', PUR = '#8f4fa6', PUR2 = '#74388c', DEEP = '#4a2068', YEL = '#ffd84a', CYAN = '#49b6e0';
const HZ = 1010, RAIL = 1180, GY = 1560, SPD = 640;
let S = {};
function box(c, x, y, w, h, fill) { c.fillStyle = fill; c.fillRect(x, y, w, h); c.strokeRect(x, y, w, h); }
function makeSkyline(lights) {
  const w = 2600, h = 620, c0 = mk(w, h), c = c0.getContext('2d'), r = rng(12); c.strokeStyle = OL; c.lineWidth = 4; c.lineJoin = 'miter';
  let x = 380;
  const win = (bx, by, bw, bh, r2) => { for (let yy = by + 16; yy < by + bh - 10; yy += 20) for (let xx = bx + 12; xx < bx + bw - 14; xx += 18) if (r2() < .5) { c.fillStyle = YEL; c.fillRect(xx, yy, 8, 9); } };
  while (x < w - 60) {
    const bw = 70 + r() * 110, bh = 150 + r() * r() * 400, y = h - bh, kind = r(); const r2 = rng(Math.floor(x));
    if (lights) { win(x, y, bw, bh, r2); x += bw - 4; r(); r(); continue; }
    box(c, x, y, bw, bh, r() < .5 ? PUR : PUR2);
    if (kind < .35) { for (let yy = y + 18; yy < h - 8; yy += 18) { c.beginPath(); c.moveTo(x + 10, yy); c.lineTo(x + bw - 10, yy); c.stroke(); } }
    else if (kind < .6) { for (let xx = x + 16; xx < x + bw - 8; xx += 16) { c.beginPath(); c.moveTo(xx, y + 14); c.lineTo(xx, h - 6); c.stroke(); } }
    else if (kind < .8) { box(c, x + bw * .2, y - 46, bw * .6, 46, PUR2); box(c, x + bw * .4, y - 80, bw * .2, 34, PUR); c.beginPath(); c.moveTo(x + bw / 2, y - 80); c.lineTo(x + bw / 2, y - 140); c.stroke(); }
    else { c.fillStyle = PUR; c.beginPath(); c.moveTo(x, y); c.lineTo(x + bw / 2, y - 120); c.lineTo(x + bw, y); c.closePath(); c.fill(); c.stroke(); for (let yy = y + 22; yy < h - 8; yy += 26) { c.beginPath(); c.moveTo(x + 8, yy); c.lineTo(x + bw - 8, yy); c.stroke(); } }
    x += bw - 4;
  }
  if (!lights) { // 吊り橋(架空)
    c.fillStyle = PUR; c.lineWidth = 5; for (const tx of [150]) { box(c, tx - 44, 190, 20, h - 190, PUR); box(c, tx + 24, 190, 20, h - 190, PUR); for (let yy = 230; yy < 520; yy += 90) { c.beginPath(); c.moveTo(tx - 24, yy); c.lineTo(tx + 24, yy + 70); c.moveTo(tx + 24, yy); c.lineTo(tx - 24, yy + 70); c.stroke(); box(c, tx - 44, yy - 14, 88, 14, PUR2); } }
    c.beginPath(); c.moveTo(-200, 300); c.quadraticCurveTo(0, 380, 150, 196); c.quadraticCurveTo(300, 560, 700, 540); c.stroke(); for (let xx = 190; xx < 660; xx += 34) { const u = (xx - 150) / 550, yy = 196 + (1 - Math.pow(1 - u, 2)) * 344; c.lineWidth = 2; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, 548); c.stroke(); } c.lineWidth = 5; box(c, -10, 548, 720, 22, PUR2);
  }
  return c0;
}
window.init = async function () { S.sky = makeSkyline(false); S.lights = makeSkyline(true); S.bike = mk(900, 700); };
function stripes(c, y0, y1, a, b, n, pow) { c.fillStyle = a; c.fillRect(0, y0, W, y1 - y0); c.fillStyle = b; for (let i = 0; i < n; i++) { const u = Math.pow(i / n, pow), y = y0 + u * (y1 - y0), hh = (y1 - y0) / n * (.25 + .5 * (i / n)); c.fillRect(0, y, W, hh); } }
function wide(c, t, d) {
  const sc = t * SPD, lit = sstep(.45, .8, d);
  // 空(横縞)と太陽
  stripes(c, 0, HZ, mixHex(PINK, '#b0589a', d), mixHex(PEACH, '#e88aa0', d), 24, 1.35);
  c.fillStyle = mixHex(YEL, '#ff9a6a', d); for (let i = 0; i < 9; i++) c.fillRect(0, 300 + i * 78 + (i % 2) * 14, W, 3);
  const sy = lerp(640, 990, d); c.save(); c.beginPath(); c.rect(0, 0, W, HZ); c.clip(); c.fillStyle = mixHex(YEL, '#ffb04a', d); c.strokeStyle = OL; c.lineWidth = 5; c.beginPath(); c.arc(560, sy, 54, 0, TAU); c.fill(); c.stroke(); c.restore();
  // スカイライン
  const off = mod(sc * .1 + 200, 2600); for (const k of [0, 1]) { c.drawImage(S.sky, -off + k * 2600, HZ - 620); if (lit > 0) { c.globalAlpha = lit; c.drawImage(S.lights, -off + k * 2600, HZ - 620); c.globalAlpha = 1; } }
  // 水面
  stripes(c, HZ, RAIL + 30, mixHex(PINK, '#8a4a9a', d), mixHex(PEACH, '#d87a9a', d), 9, 1); c.strokeStyle = OL; c.lineWidth = 4; c.beginPath(); c.moveTo(0, HZ); c.lineTo(W, HZ); c.stroke();
  c.fillStyle = mixHex(YEL, '#ffb04a', d); for (let i = 0; i < 12; i++) { const y = HZ + 14 + i * 13, w = 30 + hash(i * 3 + Math.floor(t * 5)) * 90; c.fillRect(560 - w / 2 + Math.sin(t * 2 + i) * 8, y, w, 4); }
  // 地面(下へ濃くなる縞)
  stripes(c, RAIL + 30, H, mixHex(PEACH, '#c87a9a', d), mixHex(PINK, '#8f4f9a', d), 11, 1.2);
  c.fillStyle = mixHex(PUR, DEEP, d); for (let i = 0; i < 6; i++) c.fillRect(0, 1640 + i * 50, W, 8 + i * 5);
  // 手すり
  c.strokeStyle = OL; c.lineWidth = 5; c.fillStyle = mixHex(PUR, DEEP, d * .6);
  c.fillRect(0, RAIL - 46, W, 14); c.strokeRect(-10, RAIL - 46, W + 20, 14); c.fillRect(0, RAIL + 4, W, 10); c.strokeRect(-10, RAIL + 4, W + 20, 10);
  for (let k = -1; k < 8; k++) { const x = k * 190 - mod(sc * .8, 190); c.beginPath(); c.moveTo(x + 20, RAIL - 32); c.quadraticCurveTo(x + 95, RAIL - 4, x + 170, RAIL - 32); c.stroke(); c.fillRect(x - 8, RAIL - 60, 16, 104); c.strokeRect(x - 8, RAIL - 60, 16, 104); }
  for (let k = -1; k < 3; k++) { const x = k * 760 - mod(sc * .8, 760) + 420; c.fillStyle = mixHex(PINK, PUR, d); c.beginPath(); c.moveTo(x - 34, RAIL + 44); c.lineTo(x - 22, RAIL - 76); c.quadraticCurveTo(x, RAIL - 96, x + 22, RAIL - 76); c.lineTo(x + 34, RAIL + 44); c.closePath(); c.fill(); c.stroke(); }
  // 街灯
  for (let k = -1; k < 2; k++) { const x = k * 1500 - mod(sc, 1500) + 900; c.fillStyle = OL; c.fillRect(x - 6, 620, 12, GY - 620 - 60); c.lineWidth = 7; c.beginPath(); c.moveTo(x, 624); c.quadraticCurveTo(x - 10, 560, x - 100, 566); c.stroke(); c.lineWidth = 5; c.fillStyle = lit > 0 ? YEL : PEACH; c.beginPath(); c.ellipse(x - 104, 574, 34, 13, -.1, 0, TAU); c.fill(); c.stroke(); if (lit > 0) glowDot(c, x - 104, 590, 260, hexA(YEL, .5 * lit)); c.fillStyle = OL; c.fillRect(x - 16, GY - 80, 32, 24); }
  // バイクと長い影
  const bs = 1.36, bx = 500 - 145 * bs;
  c.fillStyle = hexA(DEEP, .5); c.beginPath(); c.ellipse(bx + 150 * bs, GY + 10, 190 * bs, 16, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(bx + 20, GY + 8); c.lineTo(bx + 300 * bs, GY + 8); c.lineTo(bx + 250 * bs, GY + 120); c.lineTo(bx - 60, GY + 120); c.closePath(); c.fill();
  c.save(); c.translate(bx, GY); c.scale(bs, bs); drawRacerSide(c, { rot: sc / (RR.R * bs), t, bob: Math.sin(t * 17) * .6 + Math.sin(t * 5.3) * .8, lightOn: lit > 0, shade: 'rgba(120,60,150,.3)' }); c.restore();
  if (lit > 0) { const hx = bx + 306 * bs, hy = GY - 188 * bs; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(hx, 0, hx + 520, 0); g.addColorStop(0, hexA(YEL, .5 * lit)); g.addColorStop(1, hexA(YEL, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(hx, hy - 6); c.lineTo(hx + 520, hy - 60); c.lineTo(hx + 520, GY + 20); c.lineTo(hx + 90, GY + 6); c.closePath(); c.fill(); c.restore(); }
  if (d > 0) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = mixHex('#ffffff', '#b89ad8', d); c.fillRect(0, 0, W, H); c.restore(); }
}
function memphis(c, t) {
  c.strokeStyle = OL; c.lineWidth = 6; c.lineCap = 'round';
  for (let i = 0; i < 16; i++) { const x = mod(hash(i * 3.1) * 1300 + t * (6 + hash(i) * 14), 1300) - 110, y = hash(i * 7.3) * H, k = i % 4, rot = t * (.1 + hash(i * 2) * .2) + i; c.save(); c.translate(x, y); c.rotate(rot);
    if (k === 0) { c.strokeStyle = OL; c.beginPath(); c.moveTo(-40, 0); for (let q = 0; q < 5; q++) c.lineTo(-40 + (q + 1) * 16, q % 2 ? 12 : -12); c.stroke(); }
    else if (k === 1) { c.fillStyle = YEL; c.beginPath(); c.moveTo(0, -26); c.lineTo(26, 20); c.lineTo(-26, 20); c.closePath(); c.fill(); c.stroke(); }
    else if (k === 2) { c.fillStyle = CYAN; c.beginPath(); c.arc(0, 0, 16, 0, TAU); c.fill(); c.stroke(); }
    else { c.fillStyle = '#fff'; c.fillRect(-22, -6, 44, 12); c.strokeRect(-22, -6, 44, 12); }
    c.restore(); }
}
function portrait(c, t, u) {
  // 背景
  c.fillStyle = HOT; c.fillRect(0, 0, W, H);
  const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(255,120,180,.5)'); g.addColorStop(1, 'rgba(90,20,110,.55)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.lineWidth = 6; c.strokeStyle = OL;
  for (const [x, y, r, col, sp] of [[860, 330, 190, YEL, .3], [760, 420, 150, CYAN, -.2], [150, 1500, 230, DEEP, .15], [960, 1560, 120, '#fff', .25]]) { c.fillStyle = col; c.globalAlpha = col === '#fff' ? .9 : .85; c.beginPath(); c.arc(x + Math.sin(t * sp) * 30, y + Math.cos(t * sp * 1.3) * 24, r, 0, TAU); c.fill(); c.globalAlpha = 1; }
  memphis(c, t);
  const z = lerp(1.0, 1.1, u / 20), sway = Math.sin(t * .8) * .02;
  c.save(); c.translate(520, 900); c.scale(z, z); c.rotate(-.1 + sway); c.lineJoin = 'round'; c.strokeStyle = OL; c.lineWidth = 9;
  // 肩
  c.fillStyle = '#f7f4ec'; c.beginPath(); c.moveTo(-430, 760); c.quadraticCurveTo(-400, 380, -150, 300); c.lineTo(190, 300); c.quadraticCurveTo(460, 380, 520, 760); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#2456a8'; c.beginPath(); c.moveTo(-150, 300); c.lineTo(190, 300); c.lineTo(150, 380); c.lineTo(-110, 380); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = CYAN; c.globalAlpha = .6; c.beginPath(); c.moveTo(-430, 760); c.quadraticCurveTo(-400, 380, -150, 300); c.lineTo(-110, 380); c.quadraticCurveTo(-270, 470, -250, 760); c.closePath(); c.fill(); c.globalAlpha = 1;
  c.fillStyle = '#e2342b'; c.beginPath(); c.moveTo(250, 470); c.lineTo(420, 520); c.lineTo(450, 640); c.lineTo(270, 600); c.closePath(); c.fill(); c.stroke();
  // 帽体
  const shell = () => { c.beginPath(); c.moveTo(-290, 40); c.quadraticCurveTo(-304, -290, 0, -312); c.quadraticCurveTo(300, -302, 312, 20); c.quadraticCurveTo(314, 200, 222, 272); c.lineTo(-120, 292); c.quadraticCurveTo(-270, 240, -290, 40); c.closePath(); };
  c.fillStyle = '#f7f4ec'; shell(); c.fill();
  c.save(); shell(); c.clip();
  c.fillStyle = '#2456a8'; c.beginPath(); c.moveTo(-300, -150); c.quadraticCurveTo(-120, -340, 190, -330); c.lineTo(170, -236); c.quadraticCurveTo(-80, -250, -230, -70); c.closePath(); c.fill();
  c.fillStyle = YEL; c.beginPath(); c.moveTo(-236, -60); c.quadraticCurveTo(-80, -236, 168, -224); c.lineTo(160, -186); c.quadraticCurveTo(-70, -196, -200, -30); c.closePath(); c.fill();
  c.fillStyle = '#e2342b'; c.beginPath(); c.moveTo(-300, 120); c.lineTo(-60, 150); c.lineTo(-40, 210); c.lineTo(-300, 190); c.closePath(); c.fill();
  c.fillStyle = CYAN; c.globalAlpha = .62; c.beginPath(); c.moveTo(-300, 60); c.quadraticCurveTo(-310, -200, -200, -270); c.quadraticCurveTo(-250, -60, -180, 160); c.quadraticCurveTo(-150, 250, -110, 300); c.lineTo(-300, 300); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-110, 300); c.quadraticCurveTo(80, 230, 230, 270); c.lineTo(240, 320); c.lineTo(-110, 320); c.closePath(); c.fill(); c.globalAlpha = 1;
  c.restore(); shell(); c.stroke();
  // バイザー(街と夕陽が流れて映る)
  const visor = () => { c.beginPath(); c.moveTo(-44, -124); c.quadraticCurveTo(180, -176, 308, -62); c.lineTo(310, 62); c.quadraticCurveTo(180, 112, -34, 92); c.quadraticCurveTo(-84, -10, -44, -124); c.closePath(); };
  c.fillStyle = '#1a1440'; visor(); c.fill(); c.save(); visor(); c.clip();
  const vg = c.createLinearGradient(0, -170, 0, 110); vg.addColorStop(0, '#3a1a6a'); vg.addColorStop(.55, HOT); vg.addColorStop(1, '#ffb070'); c.fillStyle = vg; c.fillRect(-100, -190, 440, 320);
  c.fillStyle = YEL; c.beginPath(); c.arc(210 - Math.sin(t * .3) * 20, 20, 44, 0, TAU); c.fill();
  const off = mod(t * 90, 2600); c.save(); c.translate(-100, 96); c.scale(.42, .42); c.globalAlpha = .95; for (const k of [0, 1]) c.drawImage(S.sky, -off + k * 2600, -620); c.restore();
  c.fillStyle = 'rgba(20,10,50,.45)'; c.fillRect(-100, 96, 440, 40);
  c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.moveTo(-10, -112); c.quadraticCurveTo(90, -140, 170, -128); c.lineTo(150, -100); c.quadraticCurveTo(70, -112, 0, -84); c.closePath(); c.fill();
  c.restore(); visor(); c.stroke();
  c.fillStyle = OL; for (const [vx, vy] of [[120, 176], [160, 170], [200, 160]]) { c.save(); c.translate(vx, vy); c.rotate(-.15); rr(c, -14, -6, 28, 12, 6); c.fill(); c.restore(); }
  c.fillStyle = '#f7f4ec'; c.beginPath(); c.arc(-36, -10, 22, 0, TAU); c.fill(); c.stroke();
  // きらめき
  for (const [sx, sy, ph] of [[-150, -220, 0], [240, -230, 2], [60, 240, 4]]) { const a = Math.max(0, Math.sin(t * 2.4 + ph)); c.fillStyle = '#fff'; c.save(); c.translate(sx, sy); c.scale(a, a); c.beginPath(); for (let i = 0; i < 8; i++) { const rad = i % 2 ? 9 : 44, ang = i * Math.PI / 4; c.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad); } c.closePath(); c.fill(); c.restore(); }
  c.restore();
}
function script(c, t, a, str, x, y, size, rot, col) { c.save(); c.globalAlpha = a; c.translate(x, y); c.rotate(rot); c.font = `${size}px Dafoe`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.strokeStyle = OL; c.lineWidth = size * .09; c.strokeText(str, 6, 8); c.fillStyle = col; c.fillText(str, 0, 0); c.restore(); }
window.renderFrame = function (f) {
  const t = f / FPS, c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = PEACH; c.fillRect(0, 0, W, H);
  if (t < 20) { const z = lerp(1.0, 1.1, t / 20); c.save(); c.translate(500, 1400); c.scale(z, z); c.translate(-500, -1400); wide(c, t, sstep(0, 20, t) * .22); c.restore(); }
  else if (t < 40) portrait(c, t, t - 20);
  else { const z = lerp(1.18, 1.0, sstep(40, 58, t)); c.save(); c.translate(500, 1400); c.scale(z, z); c.translate(-500, -1400); wide(c, t, lerp(.55, 1, sstep(40, 56, t))); c.restore(); }
  inkFilter(c, 0, 0, W, H, { ink: [46, 18, 72], th: 46, gain: .02, step: 2, strength: 1, period: 10, toneHi: .5, toneLo: .16, tone: .78 });
  // 文字
  if (t < 20) { const a = sstep(.8, 2, t) * (1 - sstep(18.6, 19.6, t)); script(c, t, a, 'Twilight Bay', W / 2, 190, 150, -.06, '#ffffff'); c.save(); c.globalAlpha = a; c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'italic 34px Kaisei'; c.letterSpacing = '8px'; c.fillText('夕暮れの湾岸  /  A RIDE AT DUSK', W / 2 + 4, 300); c.restore(); }
  else if (t < 40) { const u = t - 20, a = sstep(.6, 1.4, u) * (1 - sstep(18.8, 19.7, u)); script(c, t, a, 'Twilight Bay', 540, 1450, 232, -.2, YEL); c.save(); c.globalAlpha = a; c.translate(700, 1626); c.rotate(-.2); c.fillStyle = YEL; c.strokeStyle = OL; c.lineWidth = 8; c.lineJoin = 'round'; c.font = 'italic 62px Anton'; c.letterSpacing = '6px'; c.textAlign = 'center'; c.strokeText('RIDE INTO THE NIGHT', 0, 0); c.fillText('RIDE INTO THE NIGHT', 0, 0); c.restore(); }
  else { const a = sstep(47, 49, t) * (1 - sstep(57.4, 58.6, t)); c.save(); c.globalAlpha = a; c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '48px ZenA'; c.letterSpacing = '10px'; c.fillText('街に、灯がともる。', W / 2 + 5, 210); c.font = 'italic 32px Kaisei'; c.letterSpacing = '6px'; c.fillText('The city lights up.', W / 2 + 3, 272); c.restore(); }
  for (const ct of [20, 40]) if (t >= ct && t < ct + .3) { c.fillStyle = hexA('#ffffff', 1 - (t - ct) / .3); c.fillRect(0, 0, W, H); }
  const fi = 1 - sstep(0, 1.0, t); if (fi > 0) { c.fillStyle = hexA(PEACH, fi); c.fillRect(0, 0, W, H); }
  const fo = sstep(58.2, 59.8, t); if (fo > 0) { c.fillStyle = hexA('#2e1248', fo); c.fillRect(0, 0, W, H); }
};
