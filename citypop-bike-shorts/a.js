// 動画A「真夜中クルーズ」: 夜のネオン街・横スクロール・VHS調  112BPM 28小節=60秒
'use strict';
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const BAR = 60 / 28, V = 1000;           // V: 街並みの流れる速さ px/s
const BASE = 1300, ROADTOP = 1356, BIKEY = 1575, BS = 1.35; // 画面レイアウト(引き)
const NEON = ['#ff3d9a', '#3df0ff', '#ffc04d', '#ff4b4b', '#5dff9b', '#b47bff', '#fff2cc'];
const CUTS = [4, 8, 12, 16, 20, 23, 26].map(b => b * BAR);
let S = {};  // 事前描画した素材

// ---------- 素材生成 ----------
function makeSky(moon) {
  const c0 = mk(W, H), c = c0.getContext('2d'), r = rng(7);
  const g = c.createLinearGradient(0, 0, 0, 1400); g.addColorStop(0, '#070722'); g.addColorStop(.35, '#1a1050'); g.addColorStop(.65, '#4a1a6e'); g.addColorStop(.85, '#a8327f'); g.addColorStop(1, '#ff7a9c');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) { const y = r() * r() * 1000; c.globalAlpha = .25 + r() * .75; c.fillStyle = pick(r, ['#fff', '#cfe6ff', '#ffe6f2']); const s = r() < .08 ? 3 : 1.6; c.fillRect(r() * W, y, s, s); }
  c.globalAlpha = 1;
  for (let i = 0; i < 9; i++) { const y = 260 + r() * 700, x = r() * W, w = 300 + r() * 500; const cg = c.createRadialGradient(x, y, 0, x, y, w); cg.addColorStop(0, 'rgba(160,90,200,.16)'); cg.addColorStop(1, 'rgba(160,90,200,0)'); c.save(); c.translate(0, y); c.scale(1, .12); c.translate(0, -y); c.fillStyle = cg; c.fillRect(x - w, y - w, w * 2, w * 2); c.restore(); }
  if (moon) { glowDot(c, moon.x, moon.y, moon.r * 4.2, 'rgba(255,230,200,.30)'); c.fillStyle = '#fff3d6'; c.beginPath(); c.arc(moon.x, moon.y, moon.r, 0, TAU); c.fill(); c.fillStyle = 'rgba(214,180,150,.35)'; for (const [dx, dy, s] of [[-.3, -.2, .22], [.25, .1, .3], [-.1, .4, .16], [.35, -.4, .12]]) { c.beginPath(); c.arc(moon.x + dx * moon.r, moon.y + dy * moon.r, moon.r * s, 0, TAU); c.fill(); } }
  return c0;
}
function windows(c, r, x, y, w, h, o) {
  const cols = Math.max(2, Math.floor(w / o.cw)), rows = Math.max(1, Math.floor(h / o.rh)); const gw = w / cols, gh = h / rows;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const lit = r() < o.p; const wx = x + i * gw + gw * .16, wy = y + j * gh + gh * .2, ww = gw * .68, wh = gh * .56;
    if (lit) { const col = pick(r, o.cols || ['#ffd98a', '#ffb86b', '#ffe9b8', '#9fe8ff', '#ffc9de']); c.save(); c.shadowColor = col; c.shadowBlur = o.glow || 14; c.fillStyle = col; c.fillRect(wx, wy, ww, wh); c.restore(); if (o.detail) { c.fillStyle = 'rgba(60,30,40,.35)'; c.fillRect(wx, wy, ww * (r() < .5 ? .35 : 0), wh); c.fillStyle = 'rgba(20,10,30,.5)'; c.fillRect(wx + ww / 2 - 1.5, wy, 3, wh); } }
    else { c.fillStyle = o.dark || '#0c0e24'; c.fillRect(wx, wy, ww, wh); if (o.detail) { c.fillStyle = 'rgba(140,120,255,.10)'; c.beginPath(); c.moveTo(wx, wy + wh); c.lineTo(wx + ww * .6, wy); c.lineTo(wx + ww, wy); c.lineTo(wx + ww * .4, wy + wh); c.fill(); } }
  }
}
function makeFar() {
  const w = 2160, h = 700, c0 = mk(w, h), c = c0.getContext('2d'), r = rng(11); let x = 0;
  while (x < w) { const bw = 70 + r() * 150, bh = 160 + r() * r() * 480; c.fillStyle = pick(r, ['#2b1560', '#311a66', '#26145a']); c.fillRect(x, h - bh, bw + 1, bh); windows(c, r, x + 6, h - bh + 10, bw - 12, bh - 20, { cw: 16, rh: 22, p: .28, glow: 4, cols: ['#ffd98a', '#ff9ec7', '#9fe8ff'], dark: '#231055' }); if (r() < .3) { c.fillStyle = '#ff4b4b'; c.fillRect(x + bw / 2 - 2, h - bh - 14, 4, 14); glowDot(c, x + bw / 2, h - bh - 14, 14, 'rgba(255,60,60,.9)'); } x += bw; }
  return c0;
}
function makeTower() { // 架空の赤白の電波塔
  const c0 = mk(360, 900), c = c0.getContext('2d'); c.translate(180, 0); c.lineCap = 'round';
  const half = (y) => 6 + Math.pow(y / 900, 2.2) * 150;
  for (let i = 0; i < 30; i++) { const y0 = 60 + i * 28, y1 = y0 + 28; c.strokeStyle = (Math.floor(i / 4) % 2) ? '#ffe9e0' : '#ff4a3a'; c.lineWidth = 4; c.beginPath(); c.moveTo(-half(y0), y0); c.lineTo(-half(y1), y1); c.moveTo(half(y0), y0); c.lineTo(half(y1), y1); c.stroke(); c.lineWidth = 2; c.beginPath(); c.moveTo(-half(y0), y0); c.lineTo(half(y1), y1); c.moveTo(half(y0), y0); c.lineTo(-half(y1), y1); c.moveTo(-half(y1), y1); c.lineTo(half(y1), y1); c.stroke(); }
  c.strokeStyle = '#ffe9e0'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 60); c.stroke();
  c.fillStyle = '#ffe9c0'; c.fillRect(-34, 330, 68, 26); c.fillRect(-20, 200, 40, 14);
  for (const [y, rad] of [[4, 20], [200, 30], [340, 60], [600, 50]]) glowDot(c, 0, y, rad * 2, 'rgba(255,110,70,.8)');
  return c0;
}
function makeMid(seed) {
  const w = 4320, h = 1250, c0 = mk(w, h), c = c0.getContext('2d'), r = rng(seed); let x = 0;
  while (x < w) {
    let bw = 240 + r() * 260; if (x + bw > w - 150) bw = w - x; const bh = 760 + r() * 430, top = h - bh;
    const col = pick(r, ['#241552', '#2a1858', '#1e1a55', '#30184f']); c.fillStyle = col; c.fillRect(x, top, bw + 1, bh);
    const gg = c.createLinearGradient(0, top, 0, h); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(1, 'rgba(255,90,170,.20)'); c.fillStyle = gg; c.fillRect(x, top, bw + 1, bh);
    windows(c, r, x + 18, top + 40, bw - 36, bh - 60, { cw: 46, rh: 62, p: .34, glow: 8, dark: '#150c3c' });
    c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(x, top, bw, 6);
    const k = r();
    if (k < .5) { // 屋上ネオン看板
      const txt = pick(r, ['ホテル', 'サウナ', 'ビール', 'カメラ', '生命', 'テレビ', '銀行', 'ウヰスキー', 'デパート', 'HOTEL', 'RADIO']); const col2 = pick(r, NEON); const sz = Math.min(110, (bw - 60) / [...txt].length);
      c.strokeStyle = '#3a2a66'; c.lineWidth = 5; for (let i = 0; i < 4; i++) { const px = x + 30 + i * (bw - 60) / 3; c.beginPath(); c.moveTo(px, top); c.lineTo(px, top - sz - 30); c.stroke(); }
      c.fillStyle = 'rgba(14,8,40,.9)'; c.fillRect(x + 20, top - sz - 44, bw - 40, sz + 24); c.strokeStyle = col2; c.lineWidth = 3; c.save(); c.shadowColor = col2; c.shadowBlur = 16; c.strokeRect(x + 20, top - sz - 44, bw - 40, sz + 24); c.restore();
      neon(c, txt, x + bw / 2, top - sz / 2 - 30, sz * .86, col2, { font: pick(r, ['Dela', 'Rock', 'Reggae']) });
    } else if (k < .75) { c.fillStyle = '#1a1040'; c.fillRect(x + bw * .3, top - 70, 90, 70); c.beginPath(); c.ellipse(x + bw * .3 + 45, top - 70, 45, 14, 0, 0, TAU); c.fill(); c.strokeStyle = '#1a1040'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + bw * .75, top); c.lineTo(x + bw * .75, top - 150); c.stroke(); for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x + bw * .75 - 34 + i * 4, top - 140 + i * 22); c.lineTo(x + bw * .75 + 34 - i * 4, top - 140 + i * 22); c.stroke(); } }
    if (r() < .55) { const txt = pick(r, ['証券', '歯科', '英会話', '囲碁', '麻雀', '金融', 'ダンス', '写真', '洋裁', '珠算']); const col2 = pick(r, NEON); const sx = x + (r() < .5 ? 34 : bw - 34); c.fillStyle = 'rgba(14,8,40,.9)'; rr(c, sx - 26, top + 80, 52, [...txt].length * 50 + 24, 6); c.fill(); neon(c, txt, sx, top + 118, 40, col2, { vertical: true, pitch: 50, font: 'Rock' }); }
    x += bw;
  }
  return c0;
}
// 手前の商店街(歩道込み)。高さ1156 = 建物1100 + 歩道56
function makeNear(seed) {
  const w = 8640, h = 1156, GY = 1100, c0 = mk(w, h), c = c0.getContext('2d'), r = rng(seed);
  const shops = ['kissa', 'snack', 'pachinko', 'ramen', 'record', 'tabako', 'bar', 'shutter', 'cinema', 'sake', 'denki'];
  let x = 0, last = '', n = 0;
  c.fillStyle = '#3b3358'; c.fillRect(0, GY, w, 56);
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2; for (let i = 0; i < w; i += 90) { c.beginPath(); c.moveTo(i, GY); c.lineTo(i - 20, h); c.stroke(); }
  c.fillStyle = '#8d86b0'; c.fillRect(0, h - 10, w, 10);
  while (x < w) {
    let bw = 380 + r() * 300; if (x + bw > w - 300) bw = w - x;
    let kind; do { kind = pick(r, shops); } while (kind === last); last = kind;
    const low = r() < .28; const bh = low ? 360 + r() * 60 : 560 + r() * 380, top = GY - bh, gf = 250;
    const wall = pick(r, ['#2a2350', '#33264f', '#22305a', '#3a2444', '#263457', '#40304f', '#2b2a5c']);
    c.fillStyle = wall; c.fillRect(x, top, bw, bh);
    const gg = c.createLinearGradient(0, top, 0, GY); gg.addColorStop(0, 'rgba(10,0,40,.35)'); gg.addColorStop(.7, 'rgba(0,0,0,0)'); gg.addColorStop(1, 'rgba(255,120,190,.22)'); c.fillStyle = gg; c.fillRect(x, top, bw, bh);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x + bw - 6, top, 6, bh);
    if (low) { // 看板建築風: 瓦屋根
      c.fillStyle = '#1c1838'; c.beginPath(); c.moveTo(x - 12, top + 8); c.lineTo(x + 30, top - 46); c.lineTo(x + bw - 30, top - 46); c.lineTo(x + bw + 12, top + 8); c.closePath(); c.fill(); c.strokeStyle = 'rgba(150,140,220,.25)'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(x - 6 + i * 6, top - i * 10); c.lineTo(x + bw + 6 - i * 6, top - i * 10); c.stroke(); }
      windows(c, r, x + 30, top + 26, bw - 60, bh - gf - 30, { cw: 120, rh: 90, p: .6, detail: true, cols: ['#ffd98a', '#ffc27a'] });
    } else {
      c.fillStyle = 'rgba(255,255,255,.10)'; c.fillRect(x, top, bw, 8);
      const style = r(); const o = style < .5 ? { cw: 92, rh: 150, p: .45, detail: true } : { cw: 150, rh: 150, p: .5, detail: true };
      windows(c, r, x + 26, top + 36, bw - 52, bh - gf - 50, o);
      if (style > .72) { c.strokeStyle = 'rgba(190,180,255,.35)'; c.lineWidth = 3; const rows = Math.floor((bh - gf - 50) / 150); for (let j = 1; j <= rows; j++) { const yy = top + 36 + j * ((bh - gf - 50) / rows) - 14; c.beginPath(); c.moveTo(x + 14, yy); c.lineTo(x + bw - 14, yy); c.stroke(); for (let i = x + 16; i < x + bw - 14; i += 14) { c.beginPath(); c.moveTo(i, yy); c.lineTo(i, yy + 26); c.stroke(); } } }
      if (r() < .5) { c.fillStyle = '#1a1040'; c.fillRect(x + bw * .2, top - 56, 70, 56); c.strokeStyle = '#1a1040'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + bw * .7, top); c.lineTo(x + bw * .7, top - 120); c.moveTo(x + bw * .7 - 30, top - 100); c.lineTo(x + bw * .7 + 30, top - 100); c.moveTo(x + bw * .7 - 22, top - 80); c.lineTo(x + bw * .7 + 22, top - 80); c.stroke(); }
      // 袖看板(縦ネオン)
      const txt = pick(r, ['純喫茶', 'スナック', 'ビリヤード', '麻雀', 'バー', 'サウナ', 'クラブ', '歌謡酒場', 'ダンスホール', '名曲喫茶', '中華', '旅館', 'ホテル', '質', '寿司']); const col2 = pick(r, NEON); const n2 = [...txt].length; const sz = Math.min(70, (bh - gf - 90) / n2 / 1.12); const sx = x + (n % 2 ? 52 : bw - 52);
      c.fillStyle = 'rgba(12,6,34,.94)'; rr(c, sx - sz * .72, top + 44, sz * 1.44, n2 * sz * 1.12 + 34, 10); c.fill(); c.save(); c.shadowColor = col2; c.shadowBlur = 18; c.strokeStyle = col2; c.lineWidth = 4; rr(c, sx - sz * .72, top + 44, sz * 1.44, n2 * sz * 1.12 + 34, 10); c.stroke(); c.restore();
      neon(c, txt, sx, top + 44 + 17 + sz * .56, sz, col2, { vertical: true, pitch: sz * 1.12, font: pick(r, ['Dela', 'Rock', 'Reggae', 'Kaisei']) });
    }
    shop(c, r, kind, x, GY - gf, bw, gf);
    x += bw; n++;
  }
  // 電柱と電線、街灯、小物
  const poles = []; for (let px = 420; px < w; px += 1080) poles.push(px);
  c.strokeStyle = 'rgba(8,6,24,.85)'; c.lineWidth = 2.5;
  for (let k = 0; k < 3; k++) for (let i = 0; i < poles.length; i++) { const a = poles[i], b = i + 1 < poles.length ? poles[i + 1] : w + poles[0]; const y0 = 150 + k * 34; c.beginPath(); c.moveTo(a, y0); c.quadraticCurveTo((a + b) / 2, y0 + 70 + k * 10, b, y0); c.stroke(); if (i === 0) { c.beginPath(); c.moveTo(a - 1080 + (w % 1080 ? 0 : 0), y0); c.moveTo(0, y0 + 52 + k * 8); c.quadraticCurveTo(a / 2, y0 + 62 + k * 9, a, y0); c.stroke(); } }
  for (const px of poles) { c.fillStyle = '#0b0920'; c.fillRect(px - 9, 110, 18, GY - 110 + 20); c.fillRect(px - 70, 140, 140, 9); c.fillRect(px - 54, 208, 108, 8); c.fillStyle = '#17142e'; rr(c, px + 12, 250, 44, 70, 8); c.fill(); c.fillStyle = '#ffe680'; c.fillRect(px - 9, GY - 190, 18, 60); c.fillStyle = '#0b0920'; for (let i = 0; i < 3; i++) c.fillRect(px - 9, GY - 180 + i * 20, 18, 8);
    // 電柱の街灯
    c.strokeStyle = '#0b0920'; c.lineWidth = 6; c.beginPath(); c.moveTo(px, 470); c.lineTo(px - 80, 450); c.stroke(); c.fillStyle = '#eaffff'; c.beginPath(); c.ellipse(px - 84, 458, 22, 9, 0, 0, TAU); c.fill(); glowDot(c, px - 84, 470, 150, 'rgba(190,255,250,.55)'); }
  for (let px = 960; px < w; px += 1080) { // すずらん灯
    c.strokeStyle = '#6c5fa8'; c.lineWidth = 8; c.beginPath(); c.moveTo(px, GY + 10); c.lineTo(px, GY - 420); c.stroke(); c.lineWidth = 5; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(px, GY - 400); c.quadraticCurveTo(px + s * 40, GY - 450, px + s * 60, GY - 400); c.stroke(); }
    for (const [dx, dy] of [[-60, -388], [60, -388], [0, -436]]) { glowDot(c, px + dx, GY + dy, 120, 'rgba(255,214,150,.6)'); c.fillStyle = '#fff4d6'; c.beginPath(); c.arc(px + dx, GY + dy, 19, 0, TAU); c.fill(); }
    c.fillStyle = '#ff5fa2'; c.fillRect(px - 26, GY - 370, 52, 16);
  }
  const r2 = rng(seed + 5);
  for (let px = 200; px < w; px += 620 + r2() * 500) { const k = r2(); if (k < .3) vending(c, px, GY); else if (k < .5) postbox(c, px, GY); else if (k < .68) phone(c, px, GY); else if (k < .86) bicycle(c, px, GY); else plant(c, px, GY); }
  return c0;
}
function awning(c, x, y, w, c1, c2) { const n = Math.round(w / 34); const sw = w / n; for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? c1 : c2; c.beginPath(); c.moveTo(x + i * sw, y); c.lineTo(x + (i + 1) * sw, y); c.lineTo(x + (i + 1) * sw + 4, y + 44); c.arc(x + (i + .5) * sw + 4, y + 44, sw / 2, 0, Math.PI); c.closePath(); c.fill(); } c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x, y, w, 6); }
function litBox(c, x, y, w, h, bg, txt, col, font, sz) { c.save(); c.shadowColor = bg; c.shadowBlur = 26; c.fillStyle = bg; rr(c, x, y, w, h, 6); c.fill(); c.restore(); c.fillStyle = col; c.font = `${sz || h * .62}px ${font || 'Dela'}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, x + w / 2, y + h / 2 + 2); }
function warmWin(c, x, y, w, h, c1, c2) { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c1); g.addColorStop(1, c2); c.save(); c.shadowColor = c2; c.shadowBlur = 30; c.fillStyle = g; c.fillRect(x, y, w, h); c.restore(); c.strokeStyle = 'rgba(40,16,20,.75)'; c.lineWidth = 5; c.strokeRect(x, y, w, h); }
function door(c, x, y, w, h, col, glass) { c.fillStyle = col; rr(c, x, y, w, h, 4); c.fill(); if (glass) { c.save(); c.shadowColor = glass; c.shadowBlur = 18; c.fillStyle = glass; rr(c, x + w * .2, y + h * .1, w * .6, h * .38, 4); c.fill(); c.restore(); } c.fillStyle = '#e8d090'; c.beginPath(); c.arc(x + w * .84, y + h * .56, 5, 0, TAU); c.fill(); }
function shop(c, r, kind, x, y, w, h) {
  const m = 26, gx = x + m, gw = w - m * 2, by = y + h;
  if (kind === 'kissa') { c.fillStyle = '#4a2c22'; c.fillRect(x, y, w, h); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 2; for (let j = y + 20; j < by; j += 22) { c.beginPath(); c.moveTo(x, j); c.lineTo(x + w, j); c.stroke(); }
    warmWin(c, gx, y + 78, gw * .6, 120, '#ffe2a0', '#ff9d4a'); c.fillStyle = 'rgba(120,40,30,.55)'; c.fillRect(gx, y + 78, gw * .6, 34); c.strokeStyle = 'rgba(40,16,20,.75)'; c.lineWidth = 4; c.beginPath(); c.moveTo(gx + gw * .3, y + 78); c.lineTo(gx + gw * .3, y + 198); c.stroke();
    door(c, gx + gw * .68, y + 70, gw * .26, h - 70, '#6b3a26', '#ffcf7a'); awning(c, x + 8, y + 8, w - 16, '#b3262f', '#f1e2c2');
    litBox(c, gx, y - 62, gw * .62, 56, '#fff0c8', pick(r, ['純喫茶 ルビー', '珈琲 ポエム', '喫茶 白鳥']), '#8a1c2a', 'Kaisei', 34); neon(c, 'COFFEE', gx + gw * .3, y + 150, 34, '#3df0ff', { font: 'Pacifico' });
  } else if (kind === 'snack') { c.fillStyle = '#2a1640'; c.fillRect(x, y, w, h); door(c, gx + 30, y + 60, 110, h - 60, '#4a1f5a', '#ff8ad0'); c.fillStyle = '#4a1f5a'; c.fillRect(gx + 14, y + 36, 142, 20);
    const nm = pick(r, ['夢', '純', '蘭', 'あかね', '小夜']); litBox(c, gx + 180, y + 50, gw - 190, 70, '#ff8ad0', 'スナック ' + nm, '#3a0a3a', 'Yusei', 36); warmWin(c, gx + 200, y + 150, gw - 230, 40, '#ffb0e0', '#c05ad0'); neon(c, '♪', gx + gw - 30, y + 20, 44, '#b47bff');
  } else if (kind === 'pachinko') { c.fillStyle = '#1a1030'; c.fillRect(x, y, w, h); warmWin(c, gx, y + 70, gw, h - 70, '#fffbe0', '#ffd24a'); c.fillStyle = 'rgba(160,60,20,.5)'; for (let i = 1; i < 6; i++) c.fillRect(gx + i * gw / 6 - 3, y + 70, 6, h - 70);
    c.fillStyle = '#ffd400'; c.fillRect(x + 6, y - 78, w - 12, 132); c.fillStyle = '#e01a2a'; c.font = `92px Dela`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('パチンコ', x + w / 2, y - 10); for (let i = x + 18; i < x + w - 10; i += 26) { for (const yy of [y - 68, y + 44]) { glowDot(c, i, yy, 16, 'rgba(255,255,220,.9)'); c.fillStyle = (Math.round(i / 26) % 2) ? '#fff' : '#ff6a3a'; c.beginPath(); c.arc(i, yy, 6, 0, TAU); c.fill(); } }
  } else if (kind === 'ramen' || kind === 'sake') { c.fillStyle = '#3a2a22'; c.fillRect(x, y, w, h); warmWin(c, gx, y + 96, gw, h - 96, '#ffdf9a', '#f09a40'); c.strokeStyle = 'rgba(70,30,14,.8)'; c.lineWidth = 4; for (let i = gx + 14; i < gx + gw; i += 18) { c.beginPath(); c.moveTo(i, y + 96); c.lineTo(i, by); c.stroke(); } c.lineWidth = 9; c.beginPath(); c.moveTo(gx + gw / 2, y + 96); c.lineTo(gx + gw / 2, by); c.stroke();
    const t = kind === 'ramen' ? 'ラーメン' : 'やきとり'; const nc = kind === 'ramen' ? '#c8202a' : '#27407a'; const n = 4, pw = gw / n; for (let i = 0; i < n; i++) { c.fillStyle = nc; c.fillRect(gx + i * pw + 3, y + 62, pw - 6, 92); c.fillStyle = '#fff6e0'; c.font = `${Math.min(70, pw * .7)}px Dela`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t[i], gx + (i + .5) * pw, y + 108); } c.fillStyle = '#20140e'; c.fillRect(gx - 8, y + 54, gw + 16, 10);
    const lx = x + w - 34; glowDot(c, lx, y + 20, 110, 'rgba(255,90,40,.6)'); c.fillStyle = '#e8321e'; c.beginPath(); c.ellipse(lx, y + 20, 30, 44, 0, 0, TAU); c.fill(); c.fillStyle = '#1a0d08'; c.fillRect(lx - 16, y - 30, 32, 8); c.fillRect(lx - 16, y + 62, 32, 8); c.fillStyle = '#1a0d08'; c.font = '34px Dela'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(kind === 'ramen' ? '麺' : '酒', lx, y + 22);
    litBox(c, gx, y - 58, gw * .7, 50, '#fff0c8', kind === 'ramen' ? '中華そば 来々軒' : '大衆酒場 よしだ', '#20140e', 'Yusei', 32);
  } else if (kind === 'record') { c.fillStyle = '#1e2a52'; c.fillRect(x, y, w, h); warmWin(c, gx, y + 70, gw * .64, 130, '#e8f6ff', '#8fd0ff'); const cols = ['#ff5fa2', '#ffc04d', '#5dff9b', '#b47bff', '#ff4b4b', '#3df0ff']; for (let i = 0; i < 5; i++) { const sx = gx + 12 + i * (gw * .64 - 24) / 5; c.fillStyle = cols[i]; c.fillRect(sx, y + 104, 50, 50); c.fillStyle = '#111'; c.beginPath(); c.arc(sx + 25, y + 129, 17, 0, TAU); c.fill(); c.fillStyle = cols[(i + 2) % 6]; c.beginPath(); c.arc(sx + 25, y + 129, 6, 0, TAU); c.fill(); }
    door(c, gx + gw * .72, y + 66, gw * .24, h - 66, '#27407a', '#bfe6ff'); neon(c, 'レコード', x + w / 2 - 30, y + 8, 60, '#3df0ff', { font: 'Rock' }); neon(c, '♫', x + w - 50, y + 4, 56, '#ff3d9a');
  } else if (kind === 'tabako') { c.fillStyle = '#4a3a34'; c.fillRect(x, y, w, h); warmWin(c, gx + 10, y + 96, gw * .45, 84, '#fff0c0', '#ffc070'); c.fillStyle = '#6a5a50'; c.fillRect(gx, y + 180, gw * .45 + 20, 14); c.fillStyle = '#3a2c28'; c.fillRect(gx + 10, y + 194, gw * .45, h - 194);
    litBox(c, gx, y + 24, gw * .5, 60, '#d81e2c', 'たばこ', '#fff', 'Dela', 40); c.fillStyle = '#7a7a86'; c.fillRect(gx + gw * .58, y + 40, gw * .4, h - 40); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 3; for (let j = y + 52; j < by; j += 16) { c.beginPath(); c.moveTo(gx + gw * .58, j); c.lineTo(gx + gw * .98, j); c.stroke(); }
  } else if (kind === 'bar') { c.fillStyle = '#16122e'; c.fillRect(x, y, w, h); door(c, gx + gw * .6, y + 56, 112, h - 56, '#2a1a3a', '#ffb060'); glowDot(c, gx + gw * .6 + 56, y + 40, 90, 'rgba(255,190,110,.6)');
    neon(c, 'BAR', gx + gw * .28, y + 70, 92, '#ff3d9a', { font: 'Monoton', glow: .5 }); const gx2 = gx + gw * .28, gy2 = y + 170; c.save(); c.shadowColor = '#3df0ff'; c.shadowBlur = 18; c.strokeStyle = '#aef8ff'; c.lineWidth = 5; c.beginPath(); c.moveTo(gx2 - 40, gy2 - 30); c.lineTo(gx2 + 40, gy2 - 30); c.lineTo(gx2, gy2 + 10); c.closePath(); c.moveTo(gx2, gy2 + 10); c.lineTo(gx2, gy2 + 50); c.moveTo(gx2 - 24, gy2 + 50); c.lineTo(gx2 + 24, gy2 + 50); c.stroke(); c.stroke(); c.restore(); glowDot(c, gx2 + 14, gy2 - 20, 20, 'rgba(255,80,80,.9)');
  } else if (kind === 'shutter') { c.fillStyle = '#34304a'; c.fillRect(x, y, w, h); c.fillStyle = '#5a5870'; c.fillRect(gx, y + 60, gw, h - 60); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 3; for (let j = y + 72; j < by; j += 14) { c.beginPath(); c.moveTo(gx, j); c.lineTo(gx + gw, j); c.stroke(); } c.fillStyle = '#c9c0a8'; c.fillRect(gx, y - 4, gw, 58); c.fillStyle = '#3a3050'; c.font = '40px ZenA'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(pick(r, ['山田金物店', '文具 はとや', '丸福洋品店']), x + w / 2, y + 26);
  } else if (kind === 'cinema') { c.fillStyle = '#2a1430'; c.fillRect(x, y, w, h); const pc = ['#e84a5f', '#2a9d8f', '#e9c46a']; for (let i = 0; i < 3; i++) { const px = gx + i * gw / 3 + 8, pw = gw / 3 - 16; c.save(); c.shadowColor = '#fff2cc'; c.shadowBlur = 14; c.fillStyle = pc[i]; c.fillRect(px, y + 84, pw, h - 110); c.restore(); c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(px + pw / 2, y + 130, pw * .22, 0, TAU); c.fill(); c.fillStyle = 'rgba(20,10,30,.8)'; c.fillRect(px + 8, y + h - 66, pw - 16, 10); c.fillRect(px + 8, y + h - 50, pw * .6, 8); }
    c.fillStyle = '#fff6d8'; c.fillRect(x + 6, y - 70, w - 12, 130); c.fillStyle = '#b01c2c'; c.font = '74px Dela'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('映 画', x + w / 2, y - 22); c.fillStyle = '#20182c'; c.font = '30px Kaisei'; c.fillText('本日 オールナイト', x + w / 2, y + 36); for (let i = x + 16; i < x + w - 8; i += 24) { glowDot(c, i, y - 62, 14, 'rgba(255,240,170,.9)'); glowDot(c, i, y + 54, 14, 'rgba(255,240,170,.9)'); }
  } else { c.fillStyle = '#263457'; c.fillRect(x, y, w, h); warmWin(c, gx, y + 74, gw, h - 100, '#f4fbff', '#a8dcff'); c.fillStyle = '#1a2440'; for (let i = 0; i < 4; i++) { const tx = gx + 14 + i * (gw - 20) / 4; rr(c, tx, y + 150, 62, 50, 6); c.fill(); } c.fillStyle = '#9fe8ff'; for (let i = 0; i < 4; i++) { const tx = gx + 14 + i * (gw - 20) / 4; c.fillRect(tx + 6, y + 156, 38, 30); }
    litBox(c, gx, y - 2, gw, 62, '#2aa7ff', '電化の店 ミナト電器', '#fff', 'Rock', 34); }
  // 店先の地面への照り返し
  const lg = c.createLinearGradient(0, by - 4, 0, by + 56); lg.addColorStop(0, 'rgba(255,200,140,.30)'); lg.addColorStop(1, 'rgba(255,200,140,0)'); c.fillStyle = lg; c.fillRect(x + 20, by, w - 40, 56);
}
function vending(c, x, gy) { glowDot(c, x + 45, gy - 90, 190, 'rgba(200,235,255,.45)'); c.fillStyle = '#e9f4ff'; rr(c, x, gy - 180, 90, 184, 6); c.fill(); c.fillStyle = '#d0202c'; c.fillRect(x, gy - 180, 90, 34); c.fillStyle = '#fff'; c.font = '20px Dela'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ジュース', x + 45, gy - 162); const cs = ['#ff7a3a', '#3ac0ff', '#ffd23a', '#5ad06a']; for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) { c.fillStyle = cs[(i + j) % 4]; c.fillRect(x + 9 + i * 19, gy - 136 + j * 36, 14, 26); } c.fillStyle = '#263457'; c.fillRect(x + 10, gy - 44, 70, 26); }
function postbox(c, x, gy) { c.fillStyle = '#d8281e'; rr(c, x, gy - 150, 64, 154, 10); c.fill(); c.beginPath(); c.ellipse(x + 32, gy - 150, 38, 16, 0, 0, TAU); c.fill(); c.fillStyle = '#8a140e'; c.fillRect(x + 10, gy - 112, 44, 9); c.fillRect(x - 4, gy - 16, 72, 20); c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x + 6, gy - 140, 8, 120); }
function phone(c, x, gy) { glowDot(c, x + 55, gy - 150, 210, 'rgba(190,255,220,.4)'); c.fillStyle = 'rgba(200,255,225,.75)'; c.fillRect(x, gy - 270, 110, 270); c.fillStyle = '#c8281e'; c.fillRect(x - 6, gy - 290, 122, 30); c.fillStyle = '#fff'; c.font = '22px Dela'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('電 話', x + 55, gy - 275); c.strokeStyle = '#6a7a80'; c.lineWidth = 5; c.strokeRect(x, gy - 270, 110, 270); c.beginPath(); c.moveTo(x + 55, gy - 270); c.lineTo(x + 55, gy); c.moveTo(x, gy - 130); c.lineTo(x + 110, gy - 130); c.stroke(); c.fillStyle = '#3aa05a'; rr(c, x + 62, gy - 210, 36, 56, 5); c.fill(); }
function bicycle(c, x, gy) { c.strokeStyle = '#0e0c22'; c.lineWidth = 5; for (const dx of [0, 96]) { c.beginPath(); c.arc(x + dx, gy - 34, 34, 0, TAU); c.stroke(); } c.beginPath(); c.moveTo(x, gy - 34); c.lineTo(x + 34, gy - 84); c.lineTo(x + 84, gy - 84); c.lineTo(x + 96, gy - 34); c.moveTo(x + 34, gy - 84); c.lineTo(x + 52, gy - 34); c.lineTo(x + 84, gy - 84); c.lineTo(x + 78, gy - 110); c.lineTo(x + 94, gy - 114); c.moveTo(x + 26, gy - 96); c.lineTo(x + 44, gy - 96); c.stroke(); }
function plant(c, x, gy) { c.fillStyle = '#7a4a38'; c.fillRect(x, gy - 40, 50, 44); c.fillStyle = '#1e5a48'; for (let i = 0; i < 7; i++) { c.beginPath(); c.ellipse(x + 25 + Math.cos(i * 1.3) * 22, gy - 66 - (i % 3) * 18, 20, 12, i, 0, TAU); c.fill(); } }
function makeRefl(near) { // 濡れた路面への映り込み
  const c0 = mk(near.width, 564), c = c0.getContext('2d'); c.filter = 'blur(5px)'; c.save(); c.translate(0, 564); c.scale(1, -0.62); c.drawImage(near, 0, -1100 + 910); c.restore(); c.filter = 'none';
  const g = c.createLinearGradient(0, 0, 0, 564); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.85)'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = g; c.fillRect(0, 0, near.width, 564); return c0;
}
function blurCopy(src, px) { const c0 = mk(src.width, src.height), c = c0.getContext('2d'); c.filter = `blur(${px}px) brightness(1.15) saturate(1.25)`; c.drawImage(src, 0, 0); return c0; }

window.init = async function () {
  S.sky = makeSky({ x: 300, y: 300, r: 66 }); S.skyB = makeSky(null); S.far = makeFar(); S.mid = makeMid(21); S.tower = makeTower();
  S.nearA = makeNear(101); S.nearB = makeNear(207); S.reflA = makeRefl(S.nearA); S.reflB = makeRefl(S.nearB);
  S.nearAb = blurCopy(S.nearA, 7); S.nearBb = blurCopy(S.nearB, 7); S.midb = blurCopy(S.mid, 6);
  S.bike = mk(1900, 1500); S.tmp = mk(W, H);
  // 走行距離の積分(フレーム毎)
  S.cam = [0]; S.bikeD = [0];
  for (let f = 1; f <= 1800; f++) { const t = f / FPS; const vb = V * sstep(5.6, 4 * BAR, t); const vc = vb * (1 - sstep(26 * BAR, 26 * BAR + 3.6, t)); S.cam.push(S.cam[f - 1] + vc / FPS); S.bikeD.push(S.bikeD[f - 1] + vb / FPS); }
  S.scan = mk(W, H); { const c = S.scan.getContext('2d'); c.fillStyle = 'rgba(0,0,0,.16)'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 2); const g = c.createRadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1250); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,10,.62)'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
};

// ---------- 描画部品 ----------
function tile(c, img, off, y, alpha) { const w = img.width; let x = -mod(off, w); if (alpha != null) c.globalAlpha = alpha; c.drawImage(img, Math.round(x), y); if (x + w < W + 1400) c.drawImage(img, Math.round(x + w), y); if (x > -1400 + 0 && x > 0) c.drawImage(img, Math.round(x - w), y); c.globalAlpha = 1; }
function neonTint(f, scroll) { const i = Math.floor(scroll / 700), u = sstep(0, 1, mod(scroll, 700) / 700); const a = NEON[Math.floor(hash(i) * 5)], b = NEON[Math.floor(hash(i + 1) * 5)]; return mixHex(a, b, u); }
function drawBike(c, x, y, s, t, f, o = {}) {
  const b = S.bike, bc = b.getContext('2d'); const ox = 130 * s, oy = (420) * s; const bw = Math.ceil((BIKE.WB + 2 * BIKE.R + 260) * s), bh = Math.ceil(470 * s);
  bc.setTransform(1, 0, 0, 1, 0, 0); bc.clearRect(0, 0, bw + 4, bh + 4); bc.globalCompositeOperation = 'source-over';
  bc.setTransform(s, 0, 0, s, ox, oy);
  const rot = S.bikeD[f] / (BIKE.R * BS); const moving = S.bikeD[f] > 2;
  drawBikeSide(bc, { rot, t, bob: moving ? Math.sin(t * 23) * 0.9 + Math.sin(t * 7.3) * 1.2 : 0, lightOn: o.lightOn, body: '#d8243a', body2: '#7c1024' });
  bc.setTransform(1, 0, 0, 1, 0, 0); bc.globalCompositeOperation = 'source-atop';
  if (o.dark) { bc.fillStyle = `rgba(8,4,24,${o.dark})`; bc.fillRect(0, 0, bw, bh); }
  if (o.tint) { const g = bc.createLinearGradient(0, 0, bw, bh * .6); g.addColorStop(0, o.tint); g.addColorStop(.6, 'rgba(0,0,0,0)'); bc.globalAlpha = o.tintA || .3; bc.fillStyle = g; bc.fillRect(0, 0, bw, bh); bc.globalAlpha = 1; }
  if (o.tint2) { const g = bc.createLinearGradient(0, 0, 0, bh); g.addColorStop(0, o.tint2); g.addColorStop(.75, 'rgba(0,0,0,0)'); bc.globalAlpha = o.tint2A || .3; bc.fillStyle = g; bc.fillRect(0, 0, bw, bh); bc.globalAlpha = 1; }
  // 影
  c.save(); c.fillStyle = 'rgba(0,0,10,.5)'; c.beginPath(); c.ellipse(x + 155 * s, y + 6 * s, 215 * s, 15 * s, 0, 0, TAU); c.fill(); c.restore();
  if (o.lightOn) { // ヘッドライトの光
    const hx = x + 297 * s, hy = y - 184 * s; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(hx, 0, hx + 760 * s, 0); g.addColorStop(0, 'rgba(255,240,190,.42)'); g.addColorStop(1, 'rgba(255,240,190,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(hx, hy - 12 * s); c.lineTo(hx + 760 * s, hy - 70 * s); c.lineTo(hx + 760 * s, y + 30 * s); c.lineTo(hx + 120 * s, y + 10 * s); c.closePath(); c.fill();
    const g2 = c.createRadialGradient(hx + 420 * s, y, 0, hx + 420 * s, y, 330 * s); g2.addColorStop(0, 'rgba(255,236,180,.30)'); g2.addColorStop(1, 'rgba(255,236,180,0)'); c.translate(0, y); c.scale(1, .16); c.translate(0, -y); c.fillStyle = g2; c.fillRect(hx, y - 400 * s, 900 * s, 800 * s); c.restore(); }
  c.drawImage(b, 0, 0, bw, bh, x - ox, y - oy, bw, bh);
  if (o.lightOn) { glowDot(c, x + 300 * s, y - 184 * s, 120 * s, 'rgba(255,244,200,.95)'); glowDot(c, x + 300 * s, y - 184 * s, 34 * s, 'rgba(255,255,255,1)'); }
  glowDot(c, x - 32 * s, y - 148 * s, 60 * s, 'rgba(255,40,40,.85)', o.lightOn ? 1 : .45);
}
function rain(c, f, amt) {
  c.save(); c.strokeStyle = 'rgba(200,220,255,.34)'; c.lineWidth = 2; c.beginPath();
  for (let i = 0; i < amt; i++) { const x = hash(i * 3.1 + f * 17.7) * (W + 300) - 100, y = hash(i * 7.3 + f * 5.1) * H, l = 40 + hash(i) * 50; c.moveTo(x, y); c.lineTo(x - l * .32, y + l); }
  c.stroke(); c.strokeStyle = 'rgba(220,235,255,.4)'; c.lineWidth = 1.5; c.beginPath();
  for (let i = 0; i < 26; i++) { const x = hash(i * 9.1 + f * 3.3) * W, y = ROADTOP + 30 + hash(i * 2.3 + f * 1.7) * 520, rx = 8 + hash(i + f) * 14; c.moveTo(x + rx, y); c.ellipse(x, y, rx, rx * .28, 0, 0, TAU); }
  c.stroke(); c.restore();
}
function drawStreet(c, t, f, o) {
  const sc = S.cam[f] + (o.off || 0); const near = o.blur ? o.nearB : o.near;
  c.drawImage(S.sky, 0, 0);
  for (let i = 0; i < 14; i++) { const a = .5 + .5 * Math.sin(t * (2 + hash(i) * 4) + i); c.fillStyle = `rgba(255,255,255,${a * .8})`; c.fillRect(hash(i * 3) * W, hash(i * 5) * 420, 3, 3); }
  tile(c, S.far, sc * .10, BASE - 700 - 330);
  tile(c, o.blur ? S.midb : S.mid, sc * .42 + 900, BASE - 1250 - 20);
  const hz = c.createLinearGradient(0, 500, 0, BASE); hz.addColorStop(0, 'rgba(255,90,170,0)'); hz.addColorStop(1, 'rgba(255,90,170,.20)'); c.fillStyle = hz; c.fillRect(-400, 500, W + 800, BASE - 500);
  tile(c, near, sc, BASE - 1100);
  // 路面
  const rg = c.createLinearGradient(0, ROADTOP, 0, H); rg.addColorStop(0, '#1d1a3a'); rg.addColorStop(1, '#090818'); c.fillStyle = rg; c.fillRect(-400, ROADTOP, W + 800, H - ROADTOP + 300);
  c.save(); c.globalCompositeOperation = 'lighter'; tile(c, o.refl, sc, ROADTOP, o.rain ? .8 : .55); c.restore();
  c.fillStyle = 'rgba(6,4,20,.33)'; for (let i = 0; i < 46; i++) { const y = ROADTOP + 8 + i * 12.5 + hash(i) * 6; const ww = 200 + hash(i * 3) * 500; const x = mod(hash(i * 7) * 3000 - sc * (1 + i * .012), W + 900) - 500; c.fillRect(x, y, ww, 3 + hash(i * 2) * 4); }
  // センターライン
  c.fillStyle = 'rgba(255,236,170,.72)'; const ly = 1770; for (let k = -1; k < 6; k++) { const x = k * 420 - mod(sc * 1.22, 420); c.beginPath(); c.moveTo(x, ly); c.lineTo(x + 230, ly); c.lineTo(x + 222, ly + 16); c.lineTo(x - 8, ly + 16); c.closePath(); c.fill(); }
  const tint = neonTint(f, sc);
  // 路面に落ちるネオンの色
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .12; const ng = c.createLinearGradient(0, ROADTOP, 0, ROADTOP + 380); ng.addColorStop(0, tint); ng.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = ng; c.fillRect(-400, ROADTOP, W + 800, 380); c.restore();
  drawBike(c, o.bx, BIKEY, BS, t, f, { lightOn: o.lightOn, tint, tintA: .30, tint2: '#ff3d9a', tint2A: .10, dark: .12 });
  if (!o.noFg) { c.fillStyle = 'rgba(5,3,16,.93)'; for (let k = 0; k < 3; k++) { const x = mod(k * 2400 + 1500 - sc * 2.1, 7200) - 400; if (x > -200 && x < W + 600) { c.fillRect(x, -200, 70, H + 400); c.fillRect(x - 130, 240, 330, 22); } } }
  if (o.rain) rain(c, f, 150);
}
function drawBridge(c, t, u, f) {
  c.drawImage(S.skyB, 0, 0);
  const mx = 760, my = 400, mr = 150; glowDot(c, mx, my, mr * 4, 'rgba(255,226,190,.30)'); c.fillStyle = '#fff1d2'; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill(); c.fillStyle = 'rgba(214,176,150,.32)'; for (const [dx, dy, s] of [[-.3, -.2, .22], [.25, .1, .3], [-.1, .45, .16], [.4, -.4, .12], [-.5, .25, .1]]) { c.beginPath(); c.arc(mx + dx * mr, my + dy * mr, mr * s, 0, TAU); c.fill(); }
  const cg = c.createLinearGradient(0, my + 40, 0, my + 140); cg.addColorStop(0, 'rgba(90,40,130,0)'); cg.addColorStop(.5, 'rgba(90,40,130,.75)'); cg.addColorStop(1, 'rgba(90,40,130,0)'); c.fillStyle = cg; c.fillRect(300, my + 40, 780, 100);
  const HZ = 1150; const s1 = 300 + u * 22, s2 = 900 + u * 55;
  c.save(); c.translate(0, HZ); c.scale(.62, .62); tile(c, S.far, s1 / .62, -700 - 250); c.drawImage(S.tower, (250 - u * 16) / .62, -900); c.scale(.9, .9); tile(c, S.mid, s2 / .56, -1250); c.restore();
  // 海
  const wg = c.createLinearGradient(0, HZ, 0, H); wg.addColorStop(0, '#3a1a66'); wg.addColorStop(.3, '#1a1048'); wg.addColorStop(1, '#070620'); c.fillStyle = wg; c.fillRect(0, HZ, W, H - HZ);
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .33; c.translate(0, HZ); c.scale(.56, -.34); tile(c, S.midb, s2 / .56, -1250); c.restore();
  c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 150; i++) { const k = Math.floor(f / 3) + i * 13; const y = HZ + 10 + Math.pow(hash(i * 1.7), 1.4) * 700; const x = hash(k * .37 + i) * W; const moon = Math.abs(x - mx) < 90 + (y - HZ) * .18; c.fillStyle = moon ? 'rgba(255,236,200,.75)' : pick(rng(i), ['rgba(255,80,160,.5)', 'rgba(80,230,255,.4)', 'rgba(255,190,90,.5)']); const ww = (14 + hash(i) * 50) * (.5 + (y - HZ) / 500); c.fillRect(x, y, ww, 2.5 + (y - HZ) / 260); } c.restore();
  // 橋
  const DY = 1470, sp = 620, sc = u * sp + 4000, bs = .7;
  c.fillStyle = '#0d0a26'; for (let k = -1; k < 3; k++) { const x = k * 900 - mod(sc, 900) + 500; c.beginPath(); c.moveTo(x - 60, DY + 60); c.lineTo(x + 60, DY + 60); c.lineTo(x + 44, H); c.lineTo(x - 44, H); c.closePath(); c.fill(); c.fillRect(x - 110, DY + 60, 220, 46); }
  for (let k = -1; k < 5; k++) { const x = k * 450 - mod(sc, 450) + 200; // 照明柱(奥側)
    c.strokeStyle = '#2a2350'; c.lineWidth = 7; c.beginPath(); c.moveTo(x, DY - 20); c.lineTo(x, DY - 330); c.quadraticCurveTo(x, DY - 380, x + 60, DY - 384); c.stroke(); glowDot(c, x + 66, DY - 376, 190, 'rgba(255,170,80,.55)'); c.fillStyle = '#ffe2b0'; c.beginPath(); c.ellipse(x + 66, DY - 380, 20, 8, 0, 0, TAU); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter'; const lg = c.createRadialGradient(x + 66, DY, 0, x + 66, DY, 210); lg.addColorStop(0, 'rgba(255,170,80,.4)'); lg.addColorStop(1, 'rgba(255,170,80,0)'); c.translate(0, DY); c.scale(1, .12); c.translate(0, -DY); c.fillStyle = lg; c.fillRect(x - 150, DY - 220, 440, 440); c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,170,80,.16)'; c.fillRect(x + 56, DY + 120, 20, 330); c.restore(); }
  c.fillStyle = '#3a3360'; c.fillRect(0, DY - 46, W, 10); for (let k = -1; k < 20; k++) { const x = k * 60 - mod(sc, 60); c.fillRect(x, DY - 40, 5, 40); }
  const dg = c.createLinearGradient(0, DY, 0, DY + 64); dg.addColorStop(0, '#4a4270'); dg.addColorStop(.18, '#221c48'); dg.addColorStop(1, '#120e30'); c.fillStyle = dg; c.fillRect(0, DY, W, 64);
  c.fillStyle = 'rgba(0,0,0,.3)'; for (let k = -1; k < 12; k++) { const x = k * 112 - mod(sc, 112); c.fillRect(x, DY + 14, 5, 50); }
  { const gx = 2600 - (sc - 4000); if (gx > -700 && gx < W + 100) { c.fillStyle = '#2a2350'; c.fillRect(gx, DY - 560, 14, 560); c.fillRect(gx, DY - 560, 640, 12); c.fillStyle = '#12703a'; rr(c, gx + 60, DY - 548, 520, 170, 10); c.fill(); c.strokeStyle = '#e8fff0'; c.lineWidth = 5; rr(c, gx + 68, DY - 540, 504, 154, 8); c.stroke(); c.fillStyle = '#f2fff6'; c.font = '62px Rock'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('↑ 都心  港', gx + 320, DY - 492); c.font = '34px Rock'; c.fillText('湾岸道路  DOWNTOWN', gx + 320, DY - 420); } }
  drawBike(c, 540 - 155 * bs, DY + 2, bs, t, f, { lightOn: true, tint: '#ffaa50', tintA: .35, dark: .3 });
}
function drawTunnel(c, t, u, f) {
  const sp = 1700, sc = u * sp, LP = 560, s = 1.7, BY = 1610;
  c.fillStyle = '#1c0e06'; c.fillRect(0, 0, W, H);
  const wg = c.createLinearGradient(0, 300, 0, 1340); wg.addColorStop(0, '#5a2c0c'); wg.addColorStop(.5, '#8a4a16'); wg.addColorStop(1, '#6a3410'); c.fillStyle = wg; c.fillRect(0, 300, W, 1040);
  c.fillStyle = '#b06a22'; c.fillRect(0, 900, W, 440); c.fillStyle = '#2a7a4a'; c.fillRect(0, 880, W, 26); c.fillStyle = '#e8d8b0'; c.fillRect(0, 906, W, 8);
  c.strokeStyle = 'rgba(40,16,4,.4)'; c.lineWidth = 4; for (let k = -1; k < 8; k++) { const x = k * 200 - mod(sc, 200); c.beginPath(); c.moveTo(x, 914); c.lineTo(x, 1340); c.stroke(); } c.beginPath(); c.moveTo(0, 1120); c.lineTo(W, 1120); c.stroke();
  c.lineWidth = 6; c.strokeStyle = 'rgba(30,12,2,.35)'; for (let k = -1; k < 4; k++) { const x = k * 800 - mod(sc, 800); c.beginPath(); c.moveTo(x, 300); c.lineTo(x, 880); c.stroke(); }
  c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 16; i++) { const y = 420 + hash(i * 3.1) * 880, ww = 300 + hash(i * 1.7) * 700, x = W + 400 - mod(sc * (1.1 + hash(i) * .5) + hash(i * 9) * 4000, W + 1800); c.fillStyle = `rgba(255,200,120,${.05 + hash(i * 5) * .08})`; c.fillRect(x, y, ww, 3 + hash(i * 2) * 5); } c.restore();
  c.fillStyle = '#120803'; c.fillRect(0, 0, W, 300); c.fillStyle = '#2a1608'; c.fillRect(0, 236, W, 14); c.fillRect(0, 266, W, 10);
  let pulse = 0;
  for (let k = -1; k < 4; k++) { const x = k * LP - mod(sc, LP) + 200; const d = Math.abs(x - 480) / LP; pulse = Math.max(pulse, 1 - clamp(d * 1.6));
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, 330, 0, x, 330, 640); g.addColorStop(0, 'rgba(255,170,60,.75)'); g.addColorStop(.4, 'rgba(255,130,30,.22)'); g.addColorStop(1, 'rgba(255,120,20,0)'); c.fillStyle = g; c.fillRect(x - 640, 0, 1280, 980);
    c.fillStyle = 'rgba(255,170,70,.20)'; c.beginPath(); c.ellipse(x, 1700, 210, 190, 0, 0, TAU); c.fill(); c.restore();
    c.fillStyle = '#fff0c0'; rr(c, x - 150, 312, 300, 30, 12); c.fill(); }
  { const x = 3300 - sc * 1; if (x > -500 && x < W + 100) { glowDot(c, x + 150, 700, 330, 'rgba(120,255,170,.45)'); c.fillStyle = '#1f9a52'; rr(c, x, 640, 300, 120, 8); c.fill(); c.fillStyle = '#f0fff4'; c.font = '60px Rock'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('非常口 →', x + 150, 702); } }
  { const x = 9800 - sc * 1; if (x > -500 && x < W + 100) { glowDot(c, x + 60, 700, 200, 'rgba(255,90,60,.5)'); c.fillStyle = '#d82a1e'; rr(c, x, 640, 120, 120, 8); c.fill(); c.fillStyle = '#fff'; c.font = '40px Rock'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('消火', x + 60, 680); c.fillText('栓', x + 60, 728); } }
  c.fillStyle = '#3a1e0c'; c.fillRect(0, 1340, W, 30); const rg = c.createLinearGradient(0, 1370, 0, H); rg.addColorStop(0, '#2a1608'); rg.addColorStop(1, '#0c0603'); c.fillStyle = rg; c.fillRect(0, 1370, W, H - 1370);
  c.fillStyle = 'rgba(255,220,150,.7)'; for (let k = -1; k < 5; k++) { const x = k * 520 - mod(sc * 1.25, 520); c.beginPath(); c.moveTo(x, 1800); c.lineTo(x + 280, 1800); c.lineTo(x + 270, 1820); c.lineTo(x - 10, 1820); c.closePath(); c.fill(); }
  drawBike(c, 540 - 155 * s, BY, s, t, f, { lightOn: true, tint: '#ff9a30', tintA: .25 + pulse * .4, tint2: '#ffb050', tint2A: .2 + pulse * .35, dark: .42 - pulse * .3 });
  const ex = sstep(3 * BAR, 4 * BAR, u); if (ex > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(W, 0, W - 1500 * ex, 0); g.addColorStop(0, `rgba(210,225,255,${ex})`); g.addColorStop(1, 'rgba(210,225,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore(); }
}
function titleCard(c, t) {
  const a = sstep(1.0, 2.0, t) * (1 - sstep(6.6, 7.6, t)); if (a <= 0) return; c.save(); c.globalAlpha = a;
  const fl = (t < 2.4 && hash(Math.floor(t * 30)) < .35) ? .35 : 1; c.globalAlpha = a * fl;
  neon(c, 'MIDNIGHT', W / 2, 350, 132, '#3df0ff', { font: 'Monoton', glow: .35, core: .75 });
  neon(c, 'CRUISE', W / 2, 500, 132, '#3df0ff', { font: 'Monoton', glow: .35, core: .75 });
  c.globalAlpha = a; c.font = '128px Dela'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  c.strokeStyle = '#2a0a4a'; c.lineWidth = 26; c.strokeText('真夜中クルーズ', W / 2, 680); c.save(); c.shadowColor = '#ff3d9a'; c.shadowBlur = 40; c.strokeStyle = '#ff3d9a'; c.lineWidth = 10; c.strokeText('真夜中クルーズ', W / 2, 680); c.restore(); c.fillStyle = '#fff4fa'; c.fillText('真夜中クルーズ', W / 2, 680);
  c.font = '46px Kaisei'; c.fillStyle = '#ffe9b0'; c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowBlur = 12; c.fillText('― 昭和五十九年  夏 ―', W / 2, 800); c.restore();
}
function osd(c, t, f) {
  c.save(); c.font = '64px VT'; c.textBaseline = 'top'; c.fillStyle = 'rgba(255,255,255,.88)'; c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowBlur = 6; c.textAlign = 'left';
  c.fillText('PLAY', 64, 96); c.beginPath(); c.moveTo(186, 106); c.lineTo(186, 150); c.lineTo(222, 128); c.closePath(); c.fill();
  c.textAlign = 'right'; const s = Math.floor(t); c.fillText(`SP  0:00:${String(s).padStart(2, '0')}`, W - 64, 96);
  c.textAlign = 'left'; c.fillStyle = 'rgba(255,214,120,.9)'; c.font = '58px VT'; c.fillText('AUG. 15 1984', 64, H - 250); c.fillText(`PM 11:${String(47 + Math.floor(t / 20)).padStart(2, '0')}`, 64, H - 196); c.restore();
}
function post(c, t, f) {
  // カット直後のVHSトラッキング乱れ
  let g = 0; for (const ct of CUTS) if (t >= ct && t < ct + .2) g = 1 - (t - ct) / .2;
  if (g > 0) { const tc = S.tmp.getContext('2d'); tc.drawImage(cv, 0, 0); for (let i = 0; i < 16; i++) { const y = hash(i * 3.3 + f) * H, hh = 20 + hash(i * 5 + f) * 110, dx = (hash(i * 7.7 + f) - .5) * 220 * g; c.drawImage(S.tmp, 0, y, W, hh, dx, y, W, hh); } const by = mod(f * 97, H); c.fillStyle = `rgba(255,255,255,${.22 * g})`; c.fillRect(0, by, W, 46); for (let i = 0; i < 220; i++) { c.fillStyle = `rgba(255,255,255,${hash(i + f * 3) * .7})`; c.fillRect(hash(i * 1.3 + f) * W, by + hash(i * 2.9 + f) * 46, 14 + hash(i) * 50, 3); } }
  // 画面下端のヘッドスイッチングノイズ
  for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(255,255,255,${hash(i * 1.9 + f * 7.3) * .35})`; c.fillRect(hash(i * 3.7 + f * 1.1) * W, H - 20 + hash(i + f) * 14, 30 + hash(i * 5) * 160, 3); }
  c.drawImage(S.scan, 0, 0);
  const fo = sstep(58.3, 59.8, t); if (fo > 0) { c.fillStyle = `rgba(0,0,0,${fo})`; c.fillRect(0, 0, W, H); }
  const fi = 1 - sstep(0, .9, t); if (fi > 0) { c.fillStyle = `rgba(0,0,0,${fi})`; c.fillRect(0, 0, W, H); }
}
function zoomed(c, z, fx, fy, tx, ty, fn) { c.save(); c.translate(tx, ty); c.scale(z, z); c.translate(-fx, -fy); fn(); c.restore(); }

window.renderFrame = function (f) {
  const t = f / FPS, c = ctx, b = t / BAR; c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
  const bx0 = 540 - 155 * BS; const lightOn = t > 2.3 || (t > 1.9 && hash(f) < .5);
  if (b < 4) { const z = lerp(1.22, 1.0, sstep(0, 8.4, t)); zoomed(c, z, 540, 1320, 540, 1320, () => drawStreet(c, t, f, { near: S.nearA, refl: S.reflA, bx: bx0, lightOn, off: 1500, noFg: t < 7 })); titleCard(c, t); }
  else if (b < 8) { const z = lerp(1.0, 1.08, (b - 4) / 4); zoomed(c, z, 540, 1400, 540, 1400, () => drawStreet(c, t, f, { near: S.nearA, refl: S.reflA, bx: bx0, lightOn: true, off: 1500 })); lyricV(c, 'ネオンが滲む、\n午前零時。', t, 4 * BAR + .7, 8 * BAR - .3, { x: 960, y: 300, size: 70 }); }
  else if (b < 12) { const z = lerp(2.15, 2.4, (b - 8) / 4); zoomed(c, z, bx0 + 215 * BS, BIKEY - 235 * BS, 540, 1130, () => drawStreet(c, t, f, { near: S.nearA, nearB: S.nearAb, blur: true, refl: S.reflA, bx: bx0, lightOn: true, off: 1500, noFg: true })); lyricV(c, '行き先は、\n決めていない。', t, 8 * BAR + .7, 12 * BAR - .3, { x: 960, y: 250, size: 70 }); }
  else if (b < 16) { const u = t - 12 * BAR, z = lerp(1.0, 1.22, sstep(0, 4 * BAR, u)); zoomed(c, z, 540, 1380, 540, 1380, () => drawBridge(c, t, u, f)); lyricV(c, '街の灯が、\nうしろへ流れてゆく。', t, 12 * BAR + .7, 16 * BAR - .3, { x: 250, y: 235, size: 58, glow: 'rgba(120,120,255,.9)' }); }
  else if (b < 20) { drawTunnel(c, t, t - 16 * BAR, f); lyricV(c, 'オレンジの光が、\n胸をすり抜ける。', t, 16 * BAR + .7, 20 * BAR - .6, { x: 960, y: 420, size: 70, glow: 'rgba(255,150,40,.9)', back: 'rgba(30,10,0,.5)' }); }
  else if (b < 23) { const z = lerp(1.1, 1.0, sstep(0, 1, (b - 20) / 3)); zoomed(c, z, 540, 1400, 540, 1400, () => drawStreet(c, t, f, { near: S.nearB, refl: S.reflB, bx: bx0, lightOn: true, rain: true })); lyricV(c, 'あの頃の歌が、\nまだ聴こえる。', t, 20 * BAR + .7, 23 * BAR - .2, { x: 960, y: 300, size: 70 }); }
  else if (b < 26) { const z = lerp(2.5, 2.2, (b - 23) / 3); zoomed(c, z, bx0 + 255 * BS, BIKEY - 120 * BS, 500, 1250, () => drawStreet(c, t, f, { near: S.nearB, nearB: S.nearBb, blur: true, refl: S.reflB, bx: bx0, lightOn: true, noFg: true })); rain(c, f, 110); }
  else { const bx = bx0 + (S.bikeD[f] - S.cam[f]) - (S.bikeD[Math.round(26 * BAR * FPS)] - S.cam[Math.round(26 * BAR * FPS)]); drawStreet(c, t, f, { near: S.nearB, refl: S.reflB, bx, lightOn: true, rain: true }); lyricV(c, '真夜中は、\n終わらない。', t, 26 * BAR + .9, 59.6, { x: 620, y: 420, size: 84 }); }
  osd(c, t, f); post(c, t, f);
};
