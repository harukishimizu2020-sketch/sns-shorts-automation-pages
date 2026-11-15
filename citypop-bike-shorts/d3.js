// 動画D3「真夜中の峠 MIDNIGHT PASS」: 80年代セルアニメ風の夜の峠と眼下の街の灯。128BPM 32小節=60秒
// 0-15 横の併走 / 15-26.25 後方視点でS字 / 26.25-41.25 夜景の見える区間とトンネル / 41.25-52.5 街へ下る後方視点 / 52.5-60 引き
'use strict';
const cv = document.getElementById('cv'), ctx = cv.getContext('2d', { willReadFrequently: true });
const CUTS = [15, 26.25, 41.25, 52.5], OLI = [14, 16, 44];
let S = {};
window.init = async function () { S.bike = mk(1300, 1000); S.late = []; };
function nightSky(c, t, hz, pan) {
  const g = c.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, '#0a1038'); g.addColorStop(.5, '#1c2a6c'); g.addColorStop(.82, '#4a4a96'); g.addColorStop(1, '#c88aa8'); c.fillStyle = g; c.fillRect(-60, -60, W + 120, hz + 62);
  for (let i = 0; i < 120; i++) { const tw = .6 + .4 * Math.sin(t * (1 + hash(i) * 3) + i * 2); c.fillStyle = `rgba(255,250,235,${tw * (.3 + hash(i * 7) * .7)})`; const s = hash(i * 3) < .1 ? 4 : 2.4; c.fillRect(mod(hash(i * 1.9) * 1400 - pan * .02, 1400) - 160, Math.pow(hash(i * 5.3), 1.4) * hz * .7, s, s); }
  for (let i = 0; i < 7; i++) { const y = hz * (.5 + hash(i * 2.1) * .42), w = 300 + hash(i * 3.7) * 500, x = mod(hash(i * 5.9) * 1900 - pan * .05, W + 1000) - 600, hh = 10 + hash(i * 6.1) * 16; c.fillStyle = i % 2 ? 'rgba(20,24,80,.75)' : 'rgba(232,160,190,.5)'; rr(c, x, y, w, hh, hh / 2); c.fill(); rr(c, x + w * .25, y + hh, w * .5, hh * .7, hh / 2); c.fill(); }
}
function ridge3(c, y0, amp, seed, off, col, base) { c.fillStyle = col; c.beginPath(); c.moveTo(-60, base); for (let x = -60; x <= W + 60; x += 14) { const u = x + off; c.lineTo(x, y0 - amp * (.5 + .5 * Math.sin(u / 340 + seed)) - amp * .4 * Math.sin(u / 121 + seed * 2.3) - amp * .12 * Math.sin(u / 47 + seed * 5)); } c.lineTo(W + 60, base); c.closePath(); c.fill(); }
function cityLights(c, t, x0, y0, w, h, pan, n, skip) {
  const m = c.getTransform();
  S.late.push(() => { c.save(); c.setTransform(m); const cols = ['255,214,140', '255,150,190', '140,230,255', '255,240,210'];
    for (let i = 0; i < n; i++) { const v = Math.pow(hash(i * 2.3), 1.3), y = y0 + v * h, x = mod(hash(i * 5.7) * 2400 - pan * (.03 + v * .1), 2400) - 600 + x0, tw = .55 + .45 * Math.sin(t * (1.5 + hash(i) * 4) + i), sz = 3 + v * 4; if (x < -20 || x > W + 20) continue; if (skip && x > skip[0] && x < skip[1] && y > skip[2]) continue; if (skip && skip[3] != null && x > skip[3] - 34 && x < skip[4] + 34) continue; c.fillStyle = `rgba(${cols[i % 4]},${tw})`; c.fillRect(x, y, sz, sz); if (i % 7 === 0) glowDot(c, x + sz / 2, y + sz / 2, 14 + v * 22, `rgba(${cols[i % 4]},.55)`); }
    c.restore(); });
}
function bikeCel(c, x, y, s, t, rot, o = {}) {
  const b = S.bike, bc = b.getContext('2d'); bc.setTransform(1, 0, 0, 1, 0, 0); bc.globalCompositeOperation = 'source-over'; bc.clearRect(0, 0, 1300, 1000); bc.setTransform(s, 0, 0, s, 160 * s / 1.7 + 60, 940);
  if (o.rear) { bc.setTransform(s, 0, 0, s, 650, 940); drawRacerRear(bc, { t, lightOn: true, mirror: '#3a4a8a' }); } else drawRacerSide(bc, { rot, t, bob: Math.sin(t * 19) * .7 + Math.sin(t * 5.7) * 1, lightOn: true, shade: 'rgba(20,24,90,.34)' });
  bc.setTransform(1, 0, 0, 1, 0, 0); bc.globalCompositeOperation = 'source-atop'; bc.fillStyle = o.tint || 'rgba(26,34,110,.34)'; bc.fillRect(0, 0, 1300, 1000);
  if (o.rim) { const g = bc.createLinearGradient(0, 300, 0, 800); g.addColorStop(0, o.rim); g.addColorStop(1, 'rgba(0,0,0,0)'); bc.fillStyle = g; bc.fillRect(0, 0, 1300, 1000); }
  const ox = o.rear ? 650 : 160 * s / 1.7 + 60; c.drawImage(b, x - ox, y - 940);
}
// ---- 横の併走 ----
function sideRun(c, t, o) {
  const sc = t * 1500, GY = o.gy, s = o.s, RAILY = GY - 230 * s / 1.7, bx = o.bx;
  nightSky(c, t, RAILY, sc);
  if (o.moon) { glowDot(c, 820, 330, 260, 'rgba(230,236,255,.35)'); c.fillStyle = '#eef0ff'; c.beginPath(); c.arc(820, 330, 54, 0, TAU); c.fill(); }
  ridge3(c, RAILY - 250, 300, 1.1, sc * .012, '#27357e', RAILY); ridge3(c, RAILY - 150, 240, 4.3, 500 + sc * .03, '#1a2560', RAILY);
  if (o.city) { c.fillStyle = '#101644'; c.fillRect(-60, RAILY - 330, W + 120, 330); const hg = c.createLinearGradient(0, RAILY - 430, 0, RAILY - 300); hg.addColorStop(0, 'rgba(255,150,170,0)'); hg.addColorStop(1, 'rgba(255,150,170,.34)'); c.fillStyle = hg; c.fillRect(-60, RAILY - 430, W + 120, 130); cityLights(c, t, 0, RAILY - 320, W, 290, sc, 560, [bx - 10, bx + 330 * s, RAILY - 330 * s / 1.7 - 60, o.tun ? o.tun[0] : null, o.tun ? o.tun[1] : null]); ridge3(c, RAILY + 30, 90, 8.8, 900 + sc * .22, '#0b1034', RAILY + 4); }
  else ridge3(c, RAILY - 30, 170, 7.7, 900 + sc * .08, '#101848', RAILY);
  // トンネル
  if (o.tun) { const [x0, x1] = o.tun; if (x1 > 0 && x0 < W) { const a = Math.max(-60, x0), b = Math.min(W + 60, x1); c.fillStyle = '#2a1408'; c.fillRect(a, -60, b - a, RAILY + 80); const wg = c.createLinearGradient(0, 300, 0, RAILY); wg.addColorStop(0, '#6a3410'); wg.addColorStop(1, '#a85c1c'); c.fillStyle = wg; c.fillRect(a, 420, b - a, RAILY - 400); c.fillStyle = '#1a0c04'; c.fillRect(a, -60, b - a, 480); c.save(); c.beginPath(); c.rect(a, -60, b - a, RAILY + 80); c.clip(); for (let k = -1; k < 4; k++) { const x = k * 520 - mod(sc, 520) + 200; glowDot(c, x, 470, 560, 'rgba(255,170,60,.55)'); c.fillStyle = '#fff0c0'; rr(c, x - 130, 452, 260, 26, 10); c.fill(); } c.strokeStyle = 'rgba(40,16,4,.5)'; c.lineWidth = 5; for (let k = -1; k < 8; k++) { const x = k * 220 - mod(sc, 220); c.beginPath(); c.moveTo(x, 520); c.lineTo(x, RAILY); c.stroke(); } c.restore(); c.fillStyle = '#b8bcd0'; if (x0 > -60) c.fillRect(x0 - 30, -60, 60, RAILY + 80); if (x1 < W + 60) c.fillRect(x1 - 30, -60, 60, RAILY + 80); } }
  // ガードレール
  c.fillStyle = '#8f98c2'; c.fillRect(-60, RAILY - 30, W + 120, 34); c.fillStyle = '#c4cbe8'; c.fillRect(-60, RAILY - 30, W + 120, 9); c.fillStyle = '#5c6494'; c.fillRect(-60, RAILY - 8, W + 120, 6);
  c.fillStyle = '#6a72a4'; for (let k = -1; k < 6; k++) { const x = k * 260 - mod(sc, 260); c.fillRect(x, RAILY - 36, 20, 92); }
  // 路面
  const rg = c.createLinearGradient(0, RAILY + 50, 0, H); rg.addColorStop(0, '#3a4470'); rg.addColorStop(1, '#232a50'); c.fillStyle = rg; c.fillRect(-60, RAILY + 50, W + 120, H - RAILY);
  c.fillStyle = 'rgba(12,16,50,.4)'; for (let i = 0; i < 26; i++) { const y = RAILY + 70 + hash(i * 3.3) * (H - RAILY - 90), w = 60 + hash(i * 5.1) * 240, x = W + 300 - mod(sc * (1 + (y - RAILY) / 900) + hash(i * 9) * 3000, W + 900); c.fillRect(x, y, w, 4); }
  const ly = GY + 150 * s / 1.7; c.fillStyle = '#e8c63a'; c.fillRect(-60, ly, W + 120, 15); c.fillStyle = 'rgba(40,30,0,.3)'; for (let k = -1; k < 8; k++) { const x = k * 190 - mod(sc * 1.3, 190); c.fillRect(x, ly, 26, 15); }
  // ヘッドライト
  const hx = bx + 306 * s, hy = GY - 188 * s; c.save(); c.filter = 'blur(22px)'; c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(hx, 0, hx + 700, 0); g.addColorStop(0, 'rgba(255,244,200,.34)'); g.addColorStop(1, 'rgba(255,244,200,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(hx, hy - 8); c.lineTo(hx + 700, hy - 100); c.lineTo(hx + 700, GY + 40); c.lineTo(hx + 120, GY + 10); c.closePath(); c.fill(); c.restore();
  c.fillStyle = 'rgba(6,8,34,.55)'; c.beginPath(); c.ellipse(bx + 150 * s, GY + 8, 200 * s, 15 * s / 1.7 + 6, 0, 0, TAU); c.fill();
  const inT = o.tun && bx + 150 * s > o.tun[0] && bx + 150 * s < o.tun[1], pulse = inT ? .5 + .5 * Math.cos(mod(sc, 520) / 520 * TAU) : 0;
  bikeCel(c, bx, GY, s, t, sc / (RR.R * s), { tint: inT ? `rgba(120,50,0,${.3 - pulse * .12})` : 'rgba(26,34,110,.34)', rim: inT ? `rgba(255,170,60,${.25 + pulse * .3})` : 'rgba(150,170,255,.16)' });
  glowDot(c, hx + 4, hy + 6, 130 * s / 1.7 + 30, 'rgba(255,246,210,.95)'); glowDot(c, hx + 4, hy + 6, 34, 'rgba(255,255,255,1)');
  c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; for (const a of [0, Math.PI / 2, .6, -.6]) { c.beginPath(); c.moveTo(hx + 4 - Math.cos(a) * 110, hy + 6 - Math.sin(a) * 110 * (a ? .6 : 1)); c.lineTo(hx + 4 + Math.cos(a) * 110, hy + 6 + Math.sin(a) * 110 * (a ? .6 : 1)); c.stroke(); }
  glowDot(c, bx - 44 * s, GY - 182 * s, 60, 'rgba(255,50,40,.9)');
}
// ---- 後方視点 ----
function chase3(c, t, o) {
  const HZ = 880, F = 900, CAMH = 1.5, BZ = 1.95, s0 = o.s0, Xr = (s) => 22 * Math.sin(s / 55) + 9 * Math.sin(s / 23 + 1), dX = (s) => 22 / 55 * Math.cos(s / 55) + 9 / 23 * Math.cos(s / 23 + 1), ddX = (s) => -22 / 3025 * Math.sin(s / 55) - 9 / 529 * Math.sin(s / 23 + 1);
  const h = dX(s0), off = (z) => Xr(s0 + z) - Xr(s0) - z * h, P = (x, y, z) => { const k = F / z; return [W / 2 + (x + off(z) + 1.4) * k, HZ + (CAMH - y) * k, k]; };
  const quad = (p, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); c.closePath(); c.fill(); };
  const pan = h * F * .9;
  nightSky(c, t, HZ, pan * 20);
  glowDot(c, 760 - pan, 300, 260, 'rgba(230,236,255,.35)'); c.fillStyle = '#eef0ff'; c.beginPath(); c.arc(760 - pan, 300, 50, 0, TAU); c.fill();
  ridge3(c, HZ - 120, 300, 2.2, pan + 300, '#27357e', HZ + 2); ridge3(c, HZ - 30, 200, 5.5, pan * 1.3 + 900, '#182258', HZ + 2);
  c.fillStyle = '#0c1238'; c.fillRect(-60, HZ, W + 120, H - HZ + 60);
  if (o.city) { const hg = c.createLinearGradient(0, HZ - 150, 0, HZ + 10); hg.addColorStop(0, 'rgba(255,150,170,0)'); hg.addColorStop(1, 'rgba(255,150,170,.4)'); c.fillStyle = hg; c.fillRect(-60, HZ - 150, W + 120, 160); cityLights(c, t, -pan, HZ - 6, W, 44, 0, 300); }
  const zs = []; for (let z = 1.2; z < 300; z *= 1.08) zs.push(z);
  for (let i = zs.length - 2; i >= 0; i--) { const a = zs[i], b = zs[i + 1];
    quad([P(-3.3, 0, a), P(-3.3, 0, b), P(-30, 9, b), P(-30, 9, a)], '#141c4c');            // 山側の法面
    quad([P(-3.2, 0, a), P(-3.2, 0, b), P(3.2, 0, b), P(3.2, 0, a)], i % 2 ? '#343e6c' : '#313a66');
    quad([P(-3.0, 0, a), P(-3.0, 0, b), P(-2.86, 0, b), P(-2.86, 0, a)], '#d8dcf0'); quad([P(3.0, 0, a), P(3.0, 0, b), P(2.86, 0, b), P(2.86, 0, a)], '#d8dcf0');
    quad([P(-.1, 0, a), P(-.1, 0, b), P(.1, 0, b), P(.1, 0, a)], '#e8c63a');
    quad([P(3.6, .45, a), P(3.6, .45, b), P(3.6, .8, b), P(3.6, .8, a)], '#9aa2cc'); }
  // ヘッドライトの照射
  c.save(); c.filter = 'blur(26px)'; c.globalCompositeOperation = 'lighter'; const lg = c.createLinearGradient(0, HZ + 40, 0, HZ + 620); lg.addColorStop(0, 'rgba(255,240,200,0)'); lg.addColorStop(.35, 'rgba(255,240,200,.26)'); lg.addColorStop(1, 'rgba(255,240,200,.05)'); c.fillStyle = lg; c.beginPath(); const l0 = P(-4.2, 0, 34), r0 = P(1.4, 0, 34), l1 = P(-2.6, 0, 2.6), r1 = P(-.2, 0, 2.6); c.moveTo(l0[0], l0[1]); c.lineTo(r0[0], r0[1]); c.lineTo(r1[0], r1[1]); c.lineTo(l1[0], l1[1]); c.closePath(); c.fill(); c.restore();
  // 視線誘導標とガードレールの支柱
  for (let j = Math.floor(s0 / 9) + 34; j >= Math.floor(s0 / 9); j--) { const z = j * 9 - s0; if (z < 1.5) continue; for (const sx of [-1, 1]) { const p0 = P(sx * 3.5, 0, z), p1 = P(sx * 3.5, .95, z), k = p0[2]; c.strokeStyle = '#c4cbe8'; c.lineWidth = Math.max(1, .09 * k); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); const br = clamp(1.2 - z / 70); glowDot(c, p1[0], p1[1], Math.max(4, .5 * k), `rgba(255,170,60,${.5 + .5 * br})`); c.fillStyle = '#ffd890'; c.beginPath(); c.arc(p1[0], p1[1], Math.max(1.2, .09 * k), 0, TAU); c.fill(); } }
  // バイク
  const bp = P(-1.4, 0, BZ), lean = clamp(-ddX(s0 + BZ) * 34, -.42, .42);
  c.save(); c.translate(bp[0] + Math.sin(t * .9) * 10, bp[1]); c.fillStyle = 'rgba(4,6,30,.5)'; c.beginPath(); c.ellipse(0, 6, 150, 22, 0, 0, TAU); c.fill(); c.rotate(lean); bikeCel(c, 0, 0, 1.22, t, 0, { rear: true, rim: 'rgba(150,170,255,.14)' }); glowDot(c, 0, -246 * 1.22, 130, 'rgba(255,50,40,.85)'); glowDot(c, 0, -246 * 1.22, 30, 'rgba(255,220,210,.9)'); c.restore();
}
function post(c, t, f) {
  inkFilter(c, 0, 0, W, H, { ink: OLI, th: 54, gain: .016, step: 2, strength: .9 });
  for (const fn of S.late) fn(); S.late = [];
  for (let k = 0; k < 5; k++) { const x = hash(f * 7.1 + k * 3) * W, y = hash(f * 5.3 + k * 9) * H, r = 1.5 + hash(f + k) * 3; c.fillStyle = hash(f * 2 + k) < .5 ? 'rgba(10,10,30,.5)' : 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(x, y, r, r * .6, hash(f * k) * 3, 0, TAU); c.fill(); }
  const vg = c.createRadialGradient(W / 2, H / 2, 560, W / 2, H / 2, 1240); vg.addColorStop(0, 'rgba(0,0,20,0)'); vg.addColorStop(1, 'rgba(0,0,20,.5)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
}
function logo(c, t) {
  const a = sstep(1.6, 2.6, t) * (1 - sstep(8, 9.2, t)); if (a <= 0) return; c.save(); c.globalAlpha = a; c.translate(W / 2, 330); c.transform(1, 0, -.2, 1, 0, 0); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.font = '168px Dela'; c.strokeStyle = '#0c1038'; c.lineWidth = 40; c.strokeText('真夜中の峠', 0, 0); c.strokeStyle = '#fff'; c.lineWidth = 18; c.strokeText('真夜中の峠', 0, 0); const g = c.createLinearGradient(0, -80, 0, 80); g.addColorStop(0, '#ffd84a'); g.addColorStop(.5, '#ff6a2a'); g.addColorStop(1, '#e2241c'); c.fillStyle = g; c.fillText('真夜中の峠', 0, 0);
  c.font = 'italic 64px Anton'; c.letterSpacing = '16px'; c.strokeStyle = '#0c1038'; c.lineWidth = 14; c.strokeText('MIDNIGHT PASS', 8, 150); c.fillStyle = '#fff'; c.fillText('MIDNIGHT PASS', 8, 150); c.restore();
}
window.renderFrame = function (f) {
  const t = f / FPS, c = ctx; S.late = []; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#0a1038'; c.fillRect(0, 0, W, H);
  c.save(); c.translate(W / 2 + (hash(f * 1.3) - .5) * 2.4, H / 2 + (hash(f * 2.9) - .5) * 3); c.scale(1.008, 1.008); c.translate(-W / 2, -H / 2);
  if (t < 15) sideRun(c, t, { gy: 1520, s: 1.7, bx: 170, moon: true });
  else if (t < 26.25) chase3(c, t, { s0: 60 + 22 * (t - 15) });
  else if (t < 41.25) { const tun = [W + 200 - (t - 32.2) * 1500, W + 200 - (t - 36.6) * 1500]; sideRun(c, t, { gy: 1520, s: 1.45, bx: 230, city: true, tun }); }
  else if (t < 52.5) chase3(c, t, { s0: 420 + 22 * (t - 41.25), city: true });
  else { const z = lerp(1.12, 1.0, sstep(52.5, 59, t)); c.translate(540, 1300); c.scale(z, z); c.translate(-540, -1300); sideRun(c, t, { gy: 1560, s: .8, bx: 400, city: true, moon: true }); }
  c.restore();
  post(c, t, f); logo(c, t);
  const e = sstep(53.6, 55, t) * (1 - sstep(58, 59.2, t)); if (e > 0) { c.save(); c.globalAlpha = e; c.textAlign = 'center'; c.fillStyle = '#fff'; c.shadowColor = 'rgba(10,12,60,.9)'; c.shadowBlur = 16; c.font = '54px ZenA'; c.letterSpacing = '10px'; c.fillText('夜は、まだ終わらない。', W / 2 + 5, 560); c.font = 'italic 34px Kaisei'; c.letterSpacing = '6px'; c.fillText('The night is still young.', W / 2 + 3, 626); c.restore(); }
  for (const ct of CUTS) if (t >= ct && t < ct + .16) { c.fillStyle = hexA('#ffffff', (1 - (t - ct) / .16) * .7); c.fillRect(0, 0, W, H); }
  const fi = 1 - sstep(0, 1.2, t); if (fi > 0) { c.fillStyle = `rgba(6,8,30,${fi})`; c.fillRect(0, 0, W, H); }
  const fo = sstep(58.2, 59.8, t); if (fo > 0) { c.fillStyle = `rgba(6,8,30,${fo})`; c.fillRect(0, 0, W, H); }
};
