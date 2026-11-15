// 動画③「朝凪 Morning Calm」: 夜明けの干潟を渡る一本道。余白の大きいミニマルな長回し。80BPM 20小節=60秒
'use strict';
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const HZ = 1180, RY = 1340, SPD = 430;
let S = {};
const SKY = {
  top: [[0, '#16224a'], [.35, '#2f4a80'], [.7, '#5f8fbf'], [1, '#8fc0dc']],
  mid: [[0, '#3f4f86'], [.35, '#a07aa8'], [.7, '#f2a9a0'], [1, '#ffd9b4']],
  low: [[0, '#a48fb8'], [.35, '#f0a6a0'], [.7, '#ffd0a0'], [1, '#fff0cc']],
  hill1: [[0, '#5a6a9a'], [.5, '#b08aa8'], [1, '#c8b0c0']],
  hill2: [[0, '#3f4f82'], [.5, '#8a6f98'], [1, '#a895b0']],
  hill3: [[0, '#2c3a68'], [.5, '#5f5486'], [1, '#7f7aa0']],
  sil: [[0, '#101733'], [.5, '#1f2244'], [1, '#2c2a4c']],
  sea: [[0, '#2a3a70'], [.35, '#6a6a9a'], [.7, '#c89aa0'], [1, '#e8c8b0']],
};
const R = (k, p) => ramp(p, SKY[k]);
window.init = async function () {
  S.tmp = mk(W, 700); S.paper = makePaper(31, '#f6efe2');
  S.vig = mk(W, H); { const c = S.vig.getContext('2d'); const g = c.createRadialGradient(W / 2, H * .55, 620, W / 2, H * .55, 1300); g.addColorStop(0, 'rgba(20,20,50,0)'); g.addColorStop(1, 'rgba(20,20,50,.34)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
};
function ridge(c, y0, amp, seed, off, col, peak) {
  c.fillStyle = col; c.beginPath(); c.moveTo(-20, HZ + 4);
  for (let x = -20; x <= W + 20; x += 12) { const u = x + off; let y = y0 - amp * (.5 + .5 * Math.sin(u / 310 + seed)) - amp * .35 * Math.sin(u / 97 + seed * 2.3) - amp * .15 * Math.sin(u / 41 + seed * 5.1); if (peak) { const dx = (u - peak.x) / peak.w; y -= peak.h * Math.max(0, 1 - Math.pow(Math.abs(dx), 1.25)); } c.lineTo(x, y); }
  c.lineTo(W + 20, HZ + 4); c.closePath(); c.fill();
}
function scene(c, t, f) {
  const p = sstep(0, 1, t / 60) * .55 + (t / 60) * .45, sc = t * SPD, sil = R('sil', p);
  // 空
  const g = c.createLinearGradient(0, 0, 0, HZ); g.addColorStop(0, R('top', p)); g.addColorStop(.58, R('mid', p)); g.addColorStop(1, R('low', p)); c.fillStyle = g; c.fillRect(-60, -60, W + 120, HZ + 62);
  const sa = 1 - sstep(.15, .5, p); if (sa > 0) for (let i = 0; i < 130; i++) { const tw = .65 + .35 * Math.sin(t * (.8 + hash(i) * 2) + i * 3); c.fillStyle = `rgba(255,250,240,${sa * tw * (.3 + hash(i * 7) * .7)})`; const s = hash(i * 3) < .08 ? 3.4 : 2; c.fillRect(hash(i * 1.9) * W, Math.pow(hash(i * 5.3), 1.5) * 820, s, s); }
  if (sa > 0) { c.save(); c.globalAlpha = sa * .9; c.fillStyle = '#fff6e0'; c.beginPath(); c.arc(210, 330, 46, 0, TAU); c.fill(); c.globalCompositeOperation = 'destination-out'; c.restore(); c.fillStyle = R('top', p); c.globalAlpha = sa; c.beginPath(); c.arc(228, 320, 42, 0, TAU); c.fill(); c.globalAlpha = 1; }
  // 太陽
  const sunX = 905, sunY = lerp(1330, 985, sstep(.3, 1, p)), sunR = 112;
  c.save(); c.beginPath(); c.rect(-60, -60, W + 120, HZ + 60); c.clip(); glowDot(c, sunX, sunY, 620, `rgba(255,214,160,${.5 * sstep(.25, .8, p)})`); c.fillStyle = ramp(p, [[0, '#ffb890'], [.6, '#ffd9a8'], [1, '#fff6dc']]); c.beginPath(); c.arc(sunX, sunY, sunR, 0, TAU); c.fill(); c.restore();
  // たなびく雲
  for (let i = 0; i < 7; i++) { const y = 560 + hash(i * 2.1) * 520, w = 260 + hash(i * 3.7) * 520, x = mod(hash(i * 5.9) * 1900 - t * (3 + hash(i) * 5), W + 1000) - 600, hh = 7 + hash(i * 6.1) * 12; c.fillStyle = hexA('#ffffff', 0); c.globalAlpha = .28 + hash(i * 4.4) * .3; c.fillStyle = ramp(p, [[0, '#8f8fc0'], [.45, '#ffb0a8'], [1, '#fff4e4']]); rr(c, x, y, w, hh, hh / 2); c.fill(); rr(c, x + w * .22, y + hh * 1.5, w * .6, hh * .7, hh / 2); c.fill(); } c.globalAlpha = 1;
  // 山並み(遠→近)
  ridge(c, HZ - 60, 90, 1.3, 400 + sc * .012, R('hill1', p), { x: 760 + 400, w: 430, h: 300 });
  { const px = 760 - sc * .012, py = HZ - 60 - 90 - 300 + 62; c.fillStyle = ramp(p, [[0, '#b8c0e0'], [.6, '#ffe0d8'], [1, '#fffaf2']]); c.beginPath(); c.moveTo(px - 64, py + 56); c.lineTo(px - 22, py - 14); c.lineTo(px + 6, py - 20); c.lineTo(px + 56, py + 50); c.lineTo(px + 30, py + 36); c.lineTo(px + 10, py + 58); c.lineTo(px - 14, py + 38); c.lineTo(px - 38, py + 62); c.closePath(); c.globalAlpha = .8; c.fill(); c.globalAlpha = 1; }
  const mg = c.createLinearGradient(0, HZ - 150, 0, HZ); mg.addColorStop(0, 'rgba(255,255,255,0)'); mg.addColorStop(1, hexA('#ffffff', .1 + .22 * p)); c.fillStyle = mg; c.fillRect(0, HZ - 150, W, 150);
  ridge(c, HZ - 20, 70, 4.1, 900 + sc * .03, R('hill2', p)); c.fillStyle = mg; c.fillRect(0, HZ - 150, W, 150);
  ridge(c, HZ + 2, 44, 7.7, 300 + sc * .06, R('hill3', p));
  // 海(空の映り込み)
  const sg = c.createLinearGradient(0, HZ, 0, RY); sg.addColorStop(0, R('low', p)); sg.addColorStop(1, R('sea', p)); c.fillStyle = sg; c.fillRect(-60, HZ, W + 120, RY - HZ);
  // 海中の鳥居
  { const x = 1250 - sc * .09, y = HZ + 46, s = .9, col = ramp(p, [[0, '#4a2f55'], [.6, '#b0483e'], [1, '#c8553f']]); if (x > -200 && x < W + 200) { const tor = (flip) => { c.save(); c.translate(x, y); if (flip) { c.scale(1, -.7); c.globalAlpha = .28; } c.fillStyle = col; c.fillRect(-46 * s, -104 * s, 9 * s, 104 * s); c.fillRect(37 * s, -104 * s, 9 * s, 104 * s); c.fillRect(-58 * s, -84 * s, 116 * s, 8 * s); c.beginPath(); c.moveTo(-74 * s, -112 * s); c.quadraticCurveTo(0, -102 * s, 74 * s, -112 * s); c.lineTo(70 * s, -100 * s); c.quadraticCurveTo(0, -92 * s, -70 * s, -100 * s); c.closePath(); c.fill(); c.restore(); }; tor(false); tor(true); } }
  // 小舟
  { const x = 2500 - sc * .16, y = HZ + 84; if (x > -200 && x < W + 200) { c.fillStyle = sil; c.beginPath(); c.moveTo(x - 60, y - 10); c.quadraticCurveTo(x, y + 12, x + 66, y - 14); c.lineTo(x + 50, y + 4); c.lineTo(x - 46, y + 4); c.closePath(); c.fill(); c.fillRect(x - 4, y - 46, 3, 40); c.globalAlpha = .22; c.fillRect(x - 50, y + 6, 100, 5); c.globalAlpha = 1; } }
  // 水面のきらめき
  c.save(); c.globalCompositeOperation = 'lighter'; const fq = Math.floor(t * 6); const ga = sstep(.3, .75, p); for (let i = 0; i < 90; i++) { const yy = HZ + 4 + Math.pow(hash(i * 1.3), 1.5) * (RY - HZ - 14), sp = 30 + (yy - HZ) * 1.1; const x = sunX + (hash(i * 3.1 + fq * 1.7) - .5) * 2 * sp; c.fillStyle = `rgba(255,236,200,${.65 * ga})`; c.fillRect(x - 14, yy, (12 + hash(i) * 34) * (.5 + (yy - HZ) / 160), 2 + (yy - HZ) / 70); } c.restore();
  c.strokeStyle = hexA('#ffffff', .10); c.lineWidth = 2; for (let i = 0; i < 12; i++) { const y = HZ + 10 + i * 12 + Math.sin(t * .5 + i) * 2, x = mod(hash(i * 2.7) * 1400 - sc * (.05 + i * .01), W + 500) - 250, w = 120 + hash(i * 9) * 300; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y); c.stroke(); }
  // ----- 干潟(鏡)と映り込み -----
  const fg = c.createLinearGradient(0, RY, 0, H); fg.addColorStop(0, R('sea', p)); fg.addColorStop(.25, R('mid', p)); fg.addColorStop(1, R('top', p)); c.fillStyle = fg; c.fillRect(-60, RY, W + 120, H - RY + 60);
  // 太陽の映り込み
  c.save(); c.globalCompositeOperation = 'lighter'; const ra = sstep(.4, .9, p); for (let i = 0; i < 46; i++) { const yy = RY + 46 + i * 11 + hash(i) * 6, ww = (sunR * 1.5) * (1 - i / 70) * (.55 + hash(i * 3 + fq) * .6); c.fillStyle = `rgba(255,232,190,${.5 * ra * (1 - i / 60)})`; c.fillRect(sunX - ww + Math.sin(t * 1.4 + i * .7) * 9, yy, ww * 2, 4.5); } c.restore();
  // 砂州
  c.fillStyle = hexA('#141a3a', .16 + .1 * (1 - p)); for (let i = 0; i < 7; i++) { const y = RY + 150 + hash(i * 4.1) * 430, w = 260 + hash(i * 2.3) * 520, x = mod(hash(i * 6.7) * 2600 - sc * (1.15 + (y - RY) / 900), W + 1500) - 800; c.beginPath(); c.ellipse(x, y, w / 2, 7 + hash(i) * 10, 0, 0, TAU); c.fill(); }
  // 堤(一本道)と電柱
  const bs = .58, bx = 540 - 155 * bs - 40;
  const poles = []; for (let k = -1; k < 3; k++) poles.push(k * 760 - mod(sc, 760) + 300);
  const drawPoles = (flip) => { c.save(); if (flip) { c.translate(0, RY + 40); c.scale(1, -.8); c.translate(0, -RY); c.globalAlpha = .26; } c.strokeStyle = sil; c.fillStyle = sil; for (const x of poles) { c.fillRect(x - 5, RY - 380, 10, 384); c.fillRect(x - 46, RY - 356, 92, 6); c.fillRect(x - 34, RY - 322, 68, 5); c.lineWidth = 1.8; for (const [dy, sag] of [[-354, 54], [-320, 60]]) for (const dx of [-40, 40]) { c.beginPath(); c.moveTo(x + dx, RY + dy); c.quadraticCurveTo(x + 380, RY + dy + sag, x + 760 + dx, RY + dy); c.stroke(); } c.lineWidth = 4; c.beginPath(); c.moveTo(x, RY - 290); c.lineTo(x + 50, RY - 280); c.stroke(); } c.restore(); };
  drawPoles(true);
  // バイクの映り込み
  c.save(); c.translate(bx, RY + 40); c.scale(bs, -bs * .8); c.globalAlpha = .30; drawBikeSide(c, { sil, rot: sc / (BIKE.R * bs), t }); c.restore();
  c.save(); c.globalAlpha = .5; c.fillStyle = hexA('#ffffff', .0); c.restore();
  // 映り込みを横波でほどく
  c.fillStyle = R('mid', p); c.globalAlpha = .22; for (let i = 0; i < 26; i++) { const y = RY + 46 + i * 12 + Math.sin(t * .9 + i * 1.3) * 3; c.fillRect(-60, y, W + 120, 2.2 + (i % 3)); } c.globalAlpha = 1;
  drawPoles(false);
  const la = 1 - sstep(.45, .7, p); if (la > 0) for (const x of poles) { glowDot(c, x + 54, RY - 276, 120, `rgba(255,226,170,${.75 * la})`); c.fillStyle = `rgba(255,244,214,${la})`; c.beginPath(); c.ellipse(x + 54, RY - 280, 12, 5, 0, 0, TAU); c.fill(); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,220,160,${.12 * la})`; c.fillRect(x + 46, RY + 50, 16, 210); c.restore(); }
  const wg = c.createLinearGradient(0, RY, 0, RY + 40); wg.addColorStop(0, ramp(p, [[0, '#2a3160'], [1, '#4a4468']])); wg.addColorStop(1, sil); c.fillStyle = wg; c.fillRect(-60, RY, W + 120, 40);
  c.fillStyle = hexA('#ffffff', .10 + .18 * p); c.fillRect(-60, RY, W + 120, 3);
  c.fillStyle = hexA('#000018', .22); for (let k = -1; k < 16; k++) { const x = k * 84 - mod(sc, 84); c.fillRect(x, RY + 12, 2, 28); }
  // バイク
  if (la > 0) { const hx = bx + 297 * bs, hy = RY - 184 * bs; c.save(); c.globalCompositeOperation = 'lighter'; const hg = c.createLinearGradient(hx, 0, hx + 430, 0); hg.addColorStop(0, `rgba(255,240,196,${.5 * la})`); hg.addColorStop(1, 'rgba(255,240,196,0)'); c.fillStyle = hg; c.beginPath(); c.moveTo(hx, hy - 6); c.lineTo(hx + 430, hy - 50); c.lineTo(hx + 430, RY + 10); c.lineTo(hx + 90, RY + 2); c.closePath(); c.fill(); c.restore(); }
  c.save(); c.translate(bx, RY); c.scale(bs, bs); drawBikeSide(c, { sil, rot: sc / (BIKE.R * bs), t, bob: Math.sin(t * 13) * .6 + Math.sin(t * 4.3) * .9 }); c.restore();
  if (la > 0) { glowDot(c, bx + 300 * bs, RY - 184 * bs, 90, `rgba(255,244,206,${.95 * la})`); glowDot(c, bx + 300 * bs, RY - 184 * bs, 22, `rgba(255,255,255,${la})`); }
  glowDot(c, bx - 32 * bs, RY - 148 * bs, 34, 'rgba(255,70,60,.9)', .5 + .5 * la);
  // 鳥
  c.strokeStyle = sil; c.lineWidth = 3; c.lineCap = 'round'; const ba = sstep(.35, .6, p); c.globalAlpha = ba; for (let i = 0; i < 5; i++) { const x = mod(-200 + i * 70 + (t - 20) * 34, W + 600) - 300 + Math.sin(i * 2.1) * 40, y = 760 - (t - 20) * 3 + Math.cos(i * 1.7) * 46 + Math.sin(t * .7 + i) * 12, fl = Math.sin(t * 4.2 + i * 1.9) * 9, s = .8; c.beginPath(); c.moveTo(x - 22 * s, y - fl); c.quadraticCurveTo(x - 9 * s, y - 10 * s, x, y); c.quadraticCurveTo(x + 9 * s, y - 10 * s, x + 22 * s, y - fl); c.stroke(); } c.globalAlpha = 1;
  // 手前の葦
  c.fillStyle = hexA('#0c1230', .9); for (let k = 0; k < 6; k++) { const x = mod(k * 900 + hash(k) * 500 - sc * 1.9, 5400) - 400; if (x > W + 240) continue; for (let q = 0; q < 11; q++) { const bx2 = x - 100 + q * 20 + hash(k * 9 + q) * 14, hh = 120 + hash(k * 5 + q) * 220, sw = Math.sin(t * 1.1 + q * .6 + k) * 14; c.beginPath(); c.moveTo(bx2 - 5, H + 10); c.quadraticCurveTo(bx2 + sw * .3, H - hh * .6, bx2 + sw + (hash(q + k) - .5) * 50, H - hh); c.quadraticCurveTo(bx2 + sw * .4 + 4, H - hh * .5, bx2 + 6, H + 10); c.closePath(); c.fill(); } }
}
window.renderFrame = function (f) {
  const t = f / FPS, c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const z = 1 + .34 * sstep(20, 34, t) * (1 - sstep(44, 56, t));
  c.save(); c.translate(540, 1300); c.scale(z, z); c.translate(-540 - 30 * (z - 1) / .34, -1300); scene(c, t, f); c.restore();
  // 題字(小さく、和英併記)
  const a = sstep(2.2, 4.2, t) * (1 - sstep(9, 11, t)); if (a > 0) { c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff8ee'; c.shadowColor = 'rgba(20,30,80,.5)'; c.shadowBlur = 24; c.font = '120px ZenA'; c.fillText('朝', W / 2 - 96, 520); c.fillText('凪', W / 2 + 96, 520); c.fillRect(W / 2 - 70, 628, 140, 2); c.font = '40px Kaisei'; c.letterSpacing = '14px'; c.fillText('MORNING CALM', W / 2 + 7, 684); c.restore(); }
  const e = sstep(51, 53, t) * (1 - sstep(57.4, 59, t)); if (e > 0) { c.save(); c.globalAlpha = e * .92; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#3a3558'; c.font = '46px ZenA'; c.letterSpacing = '10px'; c.fillText('夜が明ける。', W / 2 + 5, 470); c.font = '32px Kaisei'; c.letterSpacing = '8px'; c.fillText('A NEW DAY BREAKS', W / 2 + 4, 536); c.restore(); }
  c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = .55; c.drawImage(S.paper, 0, 0); c.restore();
  c.drawImage(S.vig, 0, 0);
  const fi = 1 - sstep(0, 2.2, t); if (fi > 0) { c.fillStyle = `rgba(12,16,40,${fi})`; c.fillRect(0, 0, W, H); }
  const fo = sstep(57.6, 59.8, t); if (fo > 0) { c.fillStyle = `rgba(250,244,232,${fo})`; c.fillRect(0, 0, W, H); }
};
