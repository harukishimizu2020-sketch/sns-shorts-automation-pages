// 共通ヘルパー: 乱数・補間・ネオン文字・縦書き・バイク(横/後ろ)描画
'use strict';
const W = 1080, H = 1920, FPS = 30;
const TAU = Math.PI * 2;
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hash(n) { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mod = (a, n) => ((a % n) + n) % n;
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
function rr(c, x, y, w, h, rad) { c.beginPath(); c.roundRect(x, y, w, h, rad); }
function mixHex(a, b, t) { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const f = (s) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, t)); return `rgb(${f(16)},${f(8)},${f(0)})`; }

// 横書き/縦書きテキスト。縦書きは句読点と長音を処理する
function vtext(c, str, x, y, size, pitch) {
  pitch = pitch || size * 1.08; c.textAlign = 'center'; c.textBaseline = 'middle';
  let yy = y;
  for (const ch of str) {
    if (ch === ' ') { yy += pitch * 0.5; continue; }
    if (ch === 'ー' || ch === '―' || ch === '…') { c.save(); c.translate(x, yy); c.rotate(Math.PI / 2); c.fillText(ch, 0, 0); c.restore(); }
    else if (ch === '、' || ch === '。') { c.fillText(ch, x + size * 0.62, yy - size * 0.58); }
    else if ('ャュョッァィゥェォ'.includes(ch)) { c.fillText(ch, x + size * 0.1, yy - size * 0.08); }
    else c.fillText(ch, x, yy);
    yy += pitch;
  }
  return yy;
}
function neon(c, str, x, y, size, color, o = {}) {
  c.save(); c.font = `${o.weight || ''} ${size}px ${o.font || 'Dela'}`; c.textAlign = o.align || 'center'; c.textBaseline = 'middle';
  const draw = () => o.vertical ? vtext(c, str, x, y, size, o.pitch) : c.fillText(str, x, y);
  c.shadowColor = color; c.shadowBlur = size * (o.glow || 0.7); c.fillStyle = color; draw(); draw();
  c.shadowBlur = size * 0.15; c.fillStyle = mixHex(color, '#ffffff', o.core == null ? 0.6 : o.core); draw();
  c.restore();
}
function glowDot(c, x, y, r, color, a = 1) {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
}

// ---------- バイク(横向き・右向き)。原点=後輪接地点, 単位px(scale前) ----------
const BIKE = { R: 62, WB: 310 };
function drawBikeSide(c, o) {
  const R = BIKE.R, WB = BIKE.WB, rot = o.rot || 0, sil = o.sil; // sil: シルエット色(逆光用)
  const body = o.body || '#d8243a', body2 = o.body2 || '#8e1226';
  const chrome = (x0, y0, x1, y1) => { if (sil) return sil; const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, '#f4f7ff'); g.addColorStop(.45, '#8f9bb8'); g.addColorStop(.55, '#39405a'); g.addColorStop(1, '#c6cfe6'); return g; };
  const S = (col) => sil || col;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  const bob = o.bob || 0;
  // 車輪
  const wheel = (cx) => {
    c.save(); c.translate(cx, -R);
    c.fillStyle = S('#0b0b12'); c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
    if (!sil) {
      c.fillStyle = '#23233a'; c.beginPath(); c.arc(0, 0, R - 16, 0, TAU); c.fill();
      c.strokeStyle = '#c9d2ea'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, R - 17, 0, TAU); c.stroke();
      c.strokeStyle = 'rgba(210,220,245,.55)'; c.lineWidth = 1.6;
      for (let i = 0; i < 20; i++) { const a = rot + i * TAU / 20; c.beginPath(); c.moveTo(Math.cos(a) * 9, Math.sin(a) * 9); c.lineTo(Math.cos(a + .25) * (R - 19), Math.sin(a + .25) * (R - 19)); c.stroke(); }
      c.fillStyle = '#8089a5'; c.beginPath(); c.arc(0, 0, 24, 0, TAU); c.fill();
      c.fillStyle = '#23233a'; c.beginPath(); c.arc(0, 0, 18, 0, TAU); c.fill();
      c.fillStyle = '#dfe6fa'; c.beginPath(); c.arc(0, 0, 10, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, R - 5, -2.4, -1.2); c.stroke();
    } else { // 逆光でもスポークの隙間を抜く
      c.globalCompositeOperation = 'destination-out'; c.fillStyle = 'rgba(0,0,0,.8)';
      for (let i = 0; i < 10; i++) { const a = rot + i * TAU / 10; c.beginPath(); c.moveTo(Math.cos(a) * 14, Math.sin(a) * 14); c.arc(0, 0, R - 18, a + .06, a + TAU / 10 - .06); c.closePath(); c.fill(); }
    }
    c.restore();
  };
  wheel(0); wheel(WB);
  c.translate(0, bob);
  // スイングアーム・リアショック
  c.strokeStyle = S('#5c6480'); c.lineWidth = 9; c.beginPath(); c.moveTo(118, -74); c.lineTo(0, -R - bob); c.stroke();
  c.strokeStyle = chrome(0, -150, 40, -70); c.lineWidth = 8; c.beginPath(); c.moveTo(40, -150); c.lineTo(8, -74); c.stroke();
  if (!sil) { c.strokeStyle = '#20222e'; c.lineWidth = 2; for (let i = 0; i < 7; i++) { const t = .15 + i * .1; c.beginPath(); c.moveTo(lerp(40, 8, t) - 6, lerp(-150, -74, t) - 2); c.lineTo(lerp(40, 8, t) + 6, lerp(-150, -74, t) + 2); c.stroke(); } }
  // リアフェンダー
  c.strokeStyle = chrome(-60, -140, 60, -100); c.lineWidth = 7; c.beginPath(); c.arc(0, -R - bob, R + 9, -2.75, -0.75); c.stroke();
  // フレーム
  c.strokeStyle = S('#15151f'); c.lineWidth = 9;
  c.beginPath(); c.moveTo(250, -188); c.lineTo(214, -74); c.lineTo(118, -66); c.lineTo(100, -140); c.stroke();
  c.beginPath(); c.moveTo(250, -188); c.lineTo(110, -150); c.lineTo(20, -150); c.stroke();
  // エンジン
  c.fillStyle = S('#3a3f55'); rr(c, 116, -108, 104, 50, 12); c.fill();
  c.fillStyle = S('#565d7a'); c.beginPath(); c.moveTo(146, -106); c.lineTo(160, -150); c.lineTo(212, -142); c.lineTo(204, -100); c.closePath(); c.fill();
  if (!sil) {
    c.strokeStyle = '#1c1f2d'; c.lineWidth = 2.2; for (let i = 0; i < 6; i++) { const t = i / 6; c.beginPath(); c.moveTo(lerp(148, 159, t), lerp(-110, -146, t)); c.lineTo(lerp(205, 212, t), lerp(-104, -139, t)); c.stroke(); }
    c.fillStyle = chrome(130, -100, 170, -60); c.beginPath(); c.arc(150, -82, 21, 0, TAU); c.fill();
    c.fillStyle = '#2a2e42'; c.beginPath(); c.arc(150, -82, 8, 0, TAU); c.fill();
    c.fillStyle = '#9aa4c2'; c.beginPath(); c.arc(196, -80, 13, 0, TAU); c.fill();
  }
  // サイドカバー
  c.fillStyle = S(body2); c.beginPath(); c.moveTo(96, -150); c.lineTo(140, -150); c.lineTo(128, -112); c.lineTo(104, -112); c.closePath(); c.fill();
  // マフラー
  c.strokeStyle = chrome(100, -90, 110, -50); c.lineWidth = 11; c.beginPath(); c.moveTo(206, -118); c.quadraticCurveTo(236, -92, 214, -62); c.lineTo(126, -56); c.stroke();
  c.fillStyle = chrome(0, -92, 10, -52); c.beginPath(); c.moveTo(130, -64); c.lineTo(-52, -92); c.quadraticCurveTo(-62, -80, -52, -66); c.lineTo(130, -48); c.closePath(); c.fill();
  // フロントフォーク・フェンダー
  c.strokeStyle = chrome(250, -200, 320, -60); c.lineWidth = 10; c.beginPath(); c.moveTo(256, -204); c.lineTo(WB, -R - bob); c.stroke();
  c.strokeStyle = S(body); c.lineWidth = 8; c.beginPath(); c.arc(WB, -R - bob, R + 8, -2.5, -0.9); c.stroke();
  // タンク
  const tg = c.createLinearGradient(0, -196, 0, -138); tg.addColorStop(0, mixHex(body, '#ffffff', .35)); tg.addColorStop(.35, body); tg.addColorStop(1, body2);
  c.fillStyle = S(tg); c.beginPath(); c.moveTo(126, -150); c.quadraticCurveTo(130, -192, 190, -194); c.quadraticCurveTo(244, -192, 248, -168); c.quadraticCurveTo(240, -142, 200, -140); c.lineTo(132, -142); c.closePath(); c.fill();
  if (!sil) { c.strokeStyle = o.stripe || '#ffe9b0'; c.lineWidth = 4; c.beginPath(); c.moveTo(140, -160); c.quadraticCurveTo(190, -170, 240, -164); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; c.beginPath(); c.moveTo(150, -186); c.quadraticCurveTo(190, -191, 222, -186); c.stroke(); }
  // シート・テール
  c.fillStyle = S('#1a1218'); c.beginPath(); c.moveTo(22, -150); c.quadraticCurveTo(20, -172, 44, -172); c.lineTo(120, -166); c.quadraticCurveTo(134, -160, 132, -146); c.lineTo(30, -144); c.closePath(); c.fill();
  c.fillStyle = S(body); c.beginPath(); c.moveTo(-28, -156); c.lineTo(26, -170); c.lineTo(30, -144); c.lineTo(-18, -140); c.closePath(); c.fill();
  c.fillStyle = sil || '#ff2a2a'; rr(c, -36, -156, 12, 16, 3); c.fill();
  if (!sil) { c.fillStyle = '#ffb030'; c.beginPath(); c.arc(-14, -128, 6, 0, TAU); c.fill(); c.beginPath(); c.arc(262, -158, 6, 0, TAU); c.fill(); }
  // ヘッドライト・メーター・ハンドル・ミラー
  c.fillStyle = chrome(262, -206, 300, -160); c.beginPath(); c.arc(282, -184, 23, 0, TAU); c.fill();
  if (!sil) { c.fillStyle = o.lightOn ? '#fff6d0' : '#8f98b0'; c.beginPath(); c.ellipse(297, -184, 9, 21, 0, 0, TAU); c.fill(); }
  c.fillStyle = S('#20222e'); c.beginPath(); c.arc(262, -214, 11, 0, TAU); c.fill();
  c.strokeStyle = chrome(230, -230, 260, -200); c.lineWidth = 6; c.beginPath(); c.moveTo(254, -204); c.lineTo(244, -222); c.lineTo(232, -220); c.stroke();
  c.strokeStyle = S('#9aa4c2'); c.lineWidth = 3.5; c.beginPath(); c.moveTo(246, -222); c.lineTo(236, -256); c.stroke();
  c.fillStyle = S('#c6cfe6'); c.beginPath(); c.ellipse(232, -262, 15, 9, -0.3, 0, TAU); c.fill();
  // ----- ライダー -----
  if (o.rider !== false) {
    const jk = S(o.jacket || '#15151d'), jn = S(o.jeans || '#2b3b6b');
    const lean = Math.sin((o.t || 0) * 1.7) * 2;
    c.save(); c.translate(0, lean * .4);
    // マフラー(スカーフ)
    const st = o.t || 0, sc = S(o.scarf || '#f4e9d0');
    c.strokeStyle = sc; c.lineWidth = 15; c.beginPath(); c.moveTo(150, -300);
    for (let i = 1; i <= 8; i++) { const u = i / 8; c.lineTo(150 - u * 130, -300 + Math.sin(st * 9 - u * 5) * (6 + u * 16) - u * 14); }
    c.stroke();
    // 脚
    c.strokeStyle = jn; c.lineWidth = 34; c.beginPath(); c.moveTo(74, -178); c.lineTo(176, -168); c.stroke();
    c.lineWidth = 27; c.beginPath(); c.moveTo(176, -166); c.lineTo(128, -92); c.stroke();
    c.fillStyle = S('#2a1a12'); c.beginPath(); c.moveTo(108, -104); c.lineTo(146, -96); c.lineTo(168, -70); c.lineTo(112, -66); c.closePath(); c.fill();
    // 胴
    c.fillStyle = jk; c.beginPath(); c.moveTo(48, -176); c.quadraticCurveTo(70, -270, 128, -312); c.quadraticCurveTo(170, -318, 182, -286); c.quadraticCurveTo(150, -230, 122, -168); c.closePath(); c.fill();
    // 腕
    c.strokeStyle = jk; c.lineWidth = 27; c.beginPath(); c.moveTo(158, -290); c.lineTo(200, -236); c.stroke();
    c.lineWidth = 22; c.beginPath(); c.moveTo(200, -236); c.lineTo(236, -224); c.stroke();
    c.fillStyle = S('#3a2a20'); c.beginPath(); c.arc(240, -223, 12, 0, TAU); c.fill();
    if (o.wave) { const wv = o.wave, ex = lerp(200, 196, wv), ey = lerp(-236, -350, wv), hx = lerp(236, 222, wv), hy = lerp(-224, -410, wv); c.strokeStyle = jk; c.lineWidth = 27; c.beginPath(); c.moveTo(158, -292); c.lineTo(ex, ey); c.stroke(); c.lineWidth = 22; c.beginPath(); c.moveTo(ex, ey); c.lineTo(hx, hy); c.stroke(); c.fillStyle = S('#3a2a20'); c.beginPath(); c.arc(hx, hy, 12, 0, TAU); c.fill(); if (wv > .5) { c.strokeStyle = S('#3a2a20'); c.lineWidth = 7; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx - 9, hy - 26); c.moveTo(hx, hy); c.lineTo(hx + 11, hy - 24); c.stroke(); } }
    if (!sil) { c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 4; c.beginPath(); c.moveTo(72, -250); c.quadraticCurveTo(96, -296, 134, -310); c.stroke(); }
    // ヘルメット(ジェット型)
    c.fillStyle = S(o.helmet || '#f2ede0'); c.beginPath(); c.arc(170, -338, 36, 0, TAU); c.fill();
    if (!sil) {
      c.save(); c.beginPath(); c.arc(170, -338, 36, 0, TAU); c.clip();
      c.fillStyle = '#e8c9a8'; c.beginPath(); c.ellipse(199, -326, 15, 19, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(16,20,38,.92)'; c.beginPath(); c.ellipse(200, -337, 15, 8, 0.1, 0, TAU); c.fill();
      c.fillStyle = 'rgba(120,220,255,.5)'; c.beginPath(); c.ellipse(203, -340, 6, 2.5, 0.1, 0, TAU); c.fill(); c.restore();
      c.strokeStyle = o.helmetStripe || '#d8243a'; c.lineWidth = 6; c.beginPath(); c.arc(170, -338, 33, -2.9, -0.9); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(156, -356, 12, 6, -0.6, 0, TAU); c.fill();
    }
    c.restore();
  }
  c.restore();
}

// ---------- バイク(後ろ姿)。原点=後輪接地点 ----------
function drawBikeRear(c, o) {
  const body = o.body || '#e8e0c8', t = o.t || 0, sil = o.sil; const S = (col) => sil || col;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  // タイヤ
  c.fillStyle = S('#0d0d14'); rr(c, -26, -150, 52, 150, 22); c.fill();
  if (!sil) { c.strokeStyle = 'rgba(255,255,255,.10)'; c.lineWidth = 3; for (let i = 0; i < 9; i++) { const y = -140 + mod(i * 17 + t * 300, 150); c.beginPath(); c.moveTo(-18, y); c.lineTo(18, y - 6); c.stroke(); } }
  // フェンダー・ナンバー
  c.fillStyle = S('#c9d2ea'); rr(c, -34, -196, 68, 74, 16); c.fill();
  c.fillStyle = S('#f4f1e4'); rr(c, -30, -150, 60, 34, 4); c.fill();
  if (!sil) { c.fillStyle = '#2c6b4f'; c.font = '700 20px Dela'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('58-07', 0, -132); }
  // マフラー2本
  for (const s of [-1, 1]) { const g = c.createLinearGradient(s * 52, -120, s * 80, -120); g.addColorStop(0, '#f4f7ff'); g.addColorStop(.5, '#6f7a98'); g.addColorStop(1, '#d5dcf0'); c.fillStyle = S(g); c.beginPath(); c.ellipse(s * 66, -104, 17, 20, 0, 0, TAU); c.fill(); c.fillStyle = S('#16161f'); c.beginPath(); c.ellipse(s * 66, -104, 9, 11, 0, 0, TAU); c.fill(); }
  // リアショック
  c.strokeStyle = S('#aab4d0'); c.lineWidth = 9; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 44, -210); c.lineTo(s * 40, -120); c.stroke(); }
  // テールカウル・テールランプ・ウインカー
  c.fillStyle = S(body); c.beginPath(); c.moveTo(-52, -206); c.quadraticCurveTo(-56, -262, 0, -266); c.quadraticCurveTo(56, -262, 52, -206); c.closePath(); c.fill();
  c.fillStyle = S('#1a1218'); rr(c, -46, -282, 92, 34, 14); c.fill();
  c.fillStyle = sil || (o.lightOn ? '#ff3030' : '#c22020'); rr(c, -24, -236, 48, 22, 6); c.fill();
  if (!sil) { c.fillStyle = '#ffb030'; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 74, -224, 10, 0, TAU); c.fill(); } c.strokeStyle = '#8f9bb8'; c.lineWidth = 5; c.beginPath(); c.moveTo(-70, -224); c.lineTo(70, -224); c.stroke(); }
  // ライダー
  const jk = S(o.jacket || '#2a5a6a'), jn = S(o.jeans || '#2b3b6b');
  // 脚
  for (const s of [-1, 1]) { if (o.footDown && s < 0) { c.strokeStyle = jn; c.lineWidth = 40; c.beginPath(); c.moveTo(-40, -300); c.lineTo(-96, -196); c.stroke(); c.lineWidth = 32; c.beginPath(); c.moveTo(-96, -196); c.lineTo(-116, -40); c.stroke(); c.fillStyle = S('#2a1a12'); rr(c, -142, -40, 54, 40, 8); c.fill(); continue; }
    c.strokeStyle = jn; c.lineWidth = 40; c.beginPath(); c.moveTo(s * 40, -300); c.lineTo(s * 78, -216); c.stroke(); c.lineWidth = 32; c.beginPath(); c.moveTo(s * 78, -216); c.lineTo(s * 74, -128); c.stroke(); c.fillStyle = S('#2a1a12'); rr(c, s * 74 - 20, -136, 40, 34, 8); c.fill(); }
  // ハンドル・ミラー
  c.strokeStyle = S('#aab4d0'); c.lineWidth = 7; c.beginPath(); c.moveTo(-150, -392); c.lineTo(150, -392); c.stroke();
  for (const s of [-1, 1]) { c.lineWidth = 4; c.beginPath(); c.moveTo(s * 128, -392); c.lineTo(s * 150, -452); c.stroke(); c.fillStyle = S('#dfe6fa'); c.beginPath(); c.ellipse(s * 154, -462, 24, 15, 0, 0, TAU); c.fill(); if (!sil) { c.fillStyle = o.mirror || '#ffb070'; c.beginPath(); c.ellipse(s * 154, -462, 19, 11, 0, 0, TAU); c.fill(); } }
  // 腕
  c.strokeStyle = S(o.sleeve || '#27456e'); for (const s of [-1, 1]) { c.lineWidth = 36; c.beginPath(); c.moveTo(s * 68, -476); c.lineTo(s * 118, -420); c.stroke(); c.lineWidth = 30; c.beginPath(); c.moveTo(s * 118, -420); c.lineTo(s * 140, -396); c.stroke(); c.fillStyle = S('#3a2a20'); c.beginPath(); c.arc(s * 142, -394, 17, 0, TAU); c.fill(); }
  // 胴
  c.fillStyle = jk; c.beginPath(); c.moveTo(-62, -286); c.quadraticCurveTo(-92, -420, -74, -498); c.quadraticCurveTo(0, -530, 74, -498); c.quadraticCurveTo(92, -420, 62, -286); c.closePath(); c.fill();
  if (!sil) { // スカジャン風: 切替袖・リブ・背中の刺繍
    c.save(); c.beginPath(); c.moveTo(-62, -286); c.quadraticCurveTo(-92, -420, -74, -498); c.quadraticCurveTo(0, -530, 74, -498); c.quadraticCurveTo(92, -420, 62, -286); c.closePath(); c.clip();
    c.fillStyle = o.sleeve || '#27456e'; c.beginPath(); c.moveTo(-100, -520); c.lineTo(-40, -520); c.quadraticCurveTo(-58, -440, -60, -280); c.lineTo(-100, -280); c.closePath(); c.fill(); c.beginPath(); c.moveTo(100, -520); c.lineTo(40, -520); c.quadraticCurveTo(58, -440, 60, -280); c.lineTo(100, -280); c.closePath(); c.fill();
    c.fillStyle = '#1c2f52'; c.fillRect(-100, -312, 200, 30); c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 2; for (let i = -60; i <= 60; i += 10) { c.beginPath(); c.moveTo(i, -310); c.lineTo(i, -286); c.stroke(); }
    c.fillStyle = '#ff7a3a'; c.beginPath(); c.arc(0, -410, 40, Math.PI, TAU); c.fill(); c.fillStyle = '#f0503a'; for (let i = 0; i < 3; i++) c.fillRect(-46 + i * 6, -404 + i * 13, 92 - i * 12, 7);
    c.strokeStyle = '#27456e'; c.lineWidth = 4; c.beginPath(); c.arc(0, -410, 50, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.moveTo(-100, -530); c.lineTo(100, -530); c.lineTo(100, -470); c.quadraticCurveTo(0, -500, -100, -470); c.closePath(); c.fill();
    c.restore();
  }
  // スカーフ
  const sc = S(o.scarf || '#ff5a4d'); c.strokeStyle = sc; c.lineWidth = 20; c.beginPath(); c.moveTo(-34, -512); c.lineTo(34, -512); c.stroke();
  c.lineWidth = 16; c.beginPath(); c.moveTo(30, -510); for (let i = 1; i <= 7; i++) { const u = i / 7; c.lineTo(30 + u * 70 + Math.sin(t * 8 - u * 4) * 10 * u, -510 + u * 60 + Math.cos(t * 9 - u * 5) * 12 * u); } c.stroke();
  // ヘルメット
  c.fillStyle = S(o.helmet || '#f2ede0'); c.beginPath(); c.arc(0, -562, 52, 0, TAU); c.fill();
  if (!sil) { c.strokeStyle = o.helmetStripe || '#ff5a4d'; c.lineWidth = 10; c.beginPath(); c.moveTo(0, -614); c.lineTo(0, -512); c.stroke(); c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-22, -588, 14, 8, -0.7, 0, TAU); c.fill(); }
  c.restore();
}

// 字幕(縦書き・右寄せ)。a..b秒で表示、文字送りフェード
function lyricV(c, str, t, a, b, o = {}) {
  if (t < a || t > b) return; const size = o.size || 64, x = o.x || 950, y0 = o.y || 330;
  const fade = sstep(a, a + .5, t) * (1 - sstep(b - .6, b, t));
  c.save(); c.font = `${size}px ${o.font || 'Kaisei'}`; c.globalAlpha = fade;
  const lines = str.split('\n');
  { const n = Math.max(...lines.map(l => [...l].length)), bw = lines.length * size * 1.55 + 70, bh = n * size * 1.1 + (lines.length - 1) * size * 1.2 + 90, bx = x + size * .85 + 20 - bw, by = y0 - size * .5 - 50; c.save(); c.filter = 'blur(40px)'; c.fillStyle = o.back || 'rgba(8,4,30,.62)'; c.fillRect(bx, by, bw, bh); c.restore(); }
  lines.forEach((ln, li) => {
    const x1 = x - li * size * 1.55, y1 = y0 + li * size * 1.2;
    c.shadowColor = o.glow || 'rgba(255,80,170,.9)'; c.shadowBlur = 22; c.fillStyle = o.color || '#fff';
    c.lineWidth = 8; c.strokeStyle = o.stroke || 'rgba(10,6,30,.55)';
    const chars = [...ln]; let yy = y1; const pitch = size * 1.1;
    chars.forEach((ch, i) => { const ap = sstep(a + .15 + (li * 6 + i) * .07, a + .45 + (li * 6 + i) * .07, t); c.globalAlpha = fade * ap; c.save(); c.shadowBlur = 0; c.font = c.font; c.restore(); vtextStroke(c, ch, x1, yy, size); yy += (ch === ' ' ? pitch * .5 : pitch); });
  }); c.restore();
}
function vtextStroke(c, ch, x, y, size) {
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const put = (dx, dy, rot) => { c.save(); c.translate(x + dx, y + dy); if (rot) c.rotate(Math.PI / 2); c.strokeText(ch, 0, 0); c.fillText(ch, 0, 0); c.restore(); };
  if (ch === ' ') return; if (ch === 'ー' || ch === '…') put(0, 0, true); else if (ch === '、' || ch === '。') put(size * .62, -size * .58); else put(0, 0);
}

// ---------- 画風フィルタ(墨線+網点トーン) ----------
// 色の境界を検出して墨線を引き、暗部に45度の網点を打つ。o:{ink:[r,g,b], th, gain, step, strength, period, toneHi, toneLo, tone}
function inkFilter(c, x0, y0, w, h, o) {
  const img = c.getImageData(x0, y0, w, h), d = img.data, src = new Uint8ClampedArray(d);
  const ink = o.ink || [26, 20, 32], th = o.th == null ? 36 : o.th, gain = o.gain || .02, st = o.step || 2, str = o.strength == null ? 1 : o.strength;
  const P = o.period || 0, hi = o.toneHi || .6, lo = o.toneLo || .15, tone = o.tone == null ? .7 : o.tone, s4 = st * 4, row = w * 4 * st;
  for (let y = 0; y < h; y++) {
    const ya = y + st < h ? row : 0, yb = y - st >= 0 ? row : 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, a = x + st < w ? s4 : 0, b = x - st >= 0 ? s4 : 0;
      let r = src[i], g = src[i + 1], bl = src[i + 2];
      const dsum = Math.abs(src[i + a] - src[i - b]) + Math.abs(src[i + a + 1] - src[i - b + 1]) + Math.abs(src[i + a + 2] - src[i - b + 2]) + Math.abs(src[i + ya] - src[i - yb]) + Math.abs(src[i + ya + 1] - src[i - yb + 1]) + Math.abs(src[i + ya + 2] - src[i - yb + 2]);
      if (P) { const lum = (r * .3 + g * .59 + bl * .11) / 255; if (lum < hi) { const u = (x + x0 + y + y0) * .7071, v = (x + x0 - y - y0) * .7071, cu = u - Math.floor(u / P) * P - P / 2, cv = v - Math.floor(v / P) * P - P / 2; let k = (hi - lum) / (hi - lo); if (k > 1) k = 1; const rad = P * .62 * Math.sqrt(k); if (cu * cu + cv * cv < rad * rad * .25 * 1.6) { r *= tone; g *= tone; bl *= tone; } } }
      let e = (dsum - th) * gain; if (e > 0) { if (e > 1) e = 1; e *= str; r += (ink[0] - r) * e; g += (ink[1] - g) * e; bl += (ink[2] - bl) * e; }
      d[i] = r; d[i + 1] = g; d[i + 2] = bl;
    }
  }
  c.putImageData(img, x0, y0);
}
// 和紙の質感(乗算で重ねる)
function makePaper(seed, base) {
  const c0 = mk(W, H), c = c0.getContext('2d'), r = rng(seed); c.fillStyle = base || '#f3ead8'; c.fillRect(0, 0, W, H);
  const img = c.getImageData(0, 0, W, H), d = img.data; for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n * 1.1; } c.putImageData(img, 0, 0);
  c.strokeStyle = 'rgba(120,90,60,.10)'; c.lineWidth = 1; for (let i = 0; i < 900; i++) { const x = r() * W, y = r() * H, a = r() * TAU, l = 10 + r() * 50; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * l * .5 + (r() - .5) * 14, y + Math.sin(a) * l * .5 + (r() - .5) * 14, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
  return c0;
}
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
// 複数キーの色補間 stops:[[p,'#hex'],...]
function ramp(p, stops) { let i = 0; while (i < stops.length - 2 && p > stops[i + 1][0]) i++; const [p0, a] = stops[i], [p1, b] = stops[i + 1]; return mixHex(a, b, clamp((p - p0) / (p1 - p0))); }

// ---------- レーサーレプリカ(赤白フルカウル・2スト250風)。原点=後輪接地点、右向き。ロゴは描かない ----------
const RR = { R: 60, WB: 290 };
function drawRacerSide(c, o) {
  const R = RR.R, WB = RR.WB, rot = o.rot || 0, t = o.t || 0, bob = o.bob || 0;
  const red = o.red || '#e2342b', white = o.white || '#f7f4ec', navy = o.navy || '#1c2550', sh = o.shade || 'rgba(40,40,90,.22)';
  const suit = o.suit || '#f4f1e8', suit2 = o.suit2 || '#2456a8', hel = o.helmet || '#f7f4ec';
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  const wheel = (cx, front) => {
    c.save(); c.translate(cx, -R);
    c.fillStyle = '#17171f'; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
    c.fillStyle = '#2a2a36'; c.beginPath(); c.arc(0, 0, R - 13, 0, TAU); c.fill();
    c.strokeStyle = red; c.lineWidth = 7; c.beginPath(); c.arc(0, 0, R - 16, 0, TAU); c.stroke();
    if (front) { c.strokeStyle = '#d9b24a'; c.lineWidth = 9; c.beginPath(); c.arc(0, 0, 27, 0, TAU); c.stroke(); c.fillStyle = '#2a2a36'; for (let i = 0; i < 10; i++) { const a = rot + i * TAU / 10; c.beginPath(); c.arc(Math.cos(a) * 27, Math.sin(a) * 27, 2.2, 0, TAU); c.fill(); } }
    else { c.strokeStyle = '#9aa0b0'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 20, 0, TAU); c.stroke(); }
    c.strokeStyle = red; c.lineWidth = 11; for (let i = 0; i < 3; i++) { const a = rot + i * TAU / 3; c.beginPath(); c.moveTo(Math.cos(a) * 8, Math.sin(a) * 8); c.lineTo(Math.cos(a + .18) * (R - 18), Math.sin(a + .18) * (R - 18)); c.stroke(); }
    c.fillStyle = red; c.beginPath(); c.arc(0, 0, 12, 0, TAU); c.fill(); c.fillStyle = '#c9ccd6'; c.beginPath(); c.arc(0, 0, 5, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.16)'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, R - 5, -2.5, -1.3); c.stroke();
    c.restore();
  };
  wheel(0, false); wheel(WB, true);
  c.translate(0, bob);
  // スイングアーム・チェーン
  c.strokeStyle = '#b9bdc9'; c.lineWidth = 12; c.beginPath(); c.moveTo(118, -90); c.lineTo(0, -R - bob); c.stroke();
  c.strokeStyle = '#3a3a46'; c.lineWidth = 3; c.beginPath(); c.moveTo(112, -76); c.lineTo(4, -48 - bob); c.stroke();
  // チャンバーとサイレンサー
  c.fillStyle = '#1b1b24'; c.beginPath(); c.moveTo(214, -58); c.quadraticCurveTo(160, -34, 96, -52); c.lineTo(60, -70); c.lineTo(66, -84); c.quadraticCurveTo(150, -70, 212, -78); c.closePath(); c.fill();
  c.strokeStyle = '#1b1b24'; c.lineWidth = 20; c.beginPath(); c.moveTo(66, -76); c.lineTo(-30, -112); c.stroke(); c.strokeStyle = '#c9ccd6'; c.lineWidth = 12; c.beginPath(); c.moveTo(-30, -112); c.lineTo(-40, -116); c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 4; c.beginPath(); c.moveTo(56, -84); c.lineTo(-24, -114); c.stroke();
  // フロントフォーク・フェンダー・キャリパー
  c.strokeStyle = '#c9ccd6'; c.lineWidth = 11; c.beginPath(); c.moveTo(254, -176); c.lineTo(WB, -R - bob); c.stroke();
  c.strokeStyle = '#d9b24a'; c.lineWidth = 12; c.beginPath(); c.moveTo(276, -104); c.lineTo(WB - 2, -R - 6 - bob); c.stroke();
  c.fillStyle = red; c.beginPath(); c.arc(WB, -R - bob, R + 10, -2.75, -1.0); c.arc(WB, -R - bob, R + 2, -1.0, -2.75, true); c.closePath(); c.fill();
  c.fillStyle = '#3a3a46'; rr(c, WB - 26, -R - 46 - bob, 20, 30, 5); c.fill();
  // アルミフレーム
  c.fillStyle = '#c3c7d2'; c.beginPath(); c.moveTo(252, -190); c.lineTo(262, -168); c.lineTo(132, -84); c.lineTo(104, -84); c.lineTo(108, -112); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.moveTo(250, -186); c.lineTo(254, -178); c.lineTo(116, -100); c.lineTo(112, -110); c.closePath(); c.fill();
  // ステップ
  c.fillStyle = '#b9bdc9'; c.beginPath(); c.moveTo(100, -120); c.lineTo(118, -116); c.lineTo(104, -86); c.lineTo(88, -90); c.closePath(); c.fill();
  // テールカウル
  c.fillStyle = white; c.beginPath(); c.moveTo(-44, -192); c.lineTo(58, -196); c.lineTo(96, -176); c.lineTo(140, -152); c.lineTo(112, -134); c.lineTo(36, -138); c.lineTo(-22, -166); c.closePath(); c.fill();
  c.fillStyle = red; for (let i = 0; i < 3; i++) { const x = -18 + i * 32; c.beginPath(); c.moveTo(x, -186); c.lineTo(x + 22, -187); c.lineTo(x + 34, -152); c.lineTo(x + 12, -154); c.closePath(); c.fill(); }
  c.fillStyle = sh; c.beginPath(); c.moveTo(-22, -166); c.lineTo(36, -138); c.lineTo(112, -134); c.lineTo(126, -143); c.lineTo(40, -150); c.lineTo(-30, -176); c.closePath(); c.fill();
  c.fillStyle = '#e02020'; c.beginPath(); c.moveTo(-46, -192); c.lineTo(-36, -193); c.lineTo(-22, -168); c.lineTo(-30, -170); c.closePath(); c.fill();
  c.fillStyle = '#17171f'; c.beginPath(); c.moveTo(-10, -160); c.lineTo(30, -140); c.lineTo(8, -128); c.lineTo(-34, -134); c.closePath(); c.fill();
  // シート
  c.fillStyle = navy; c.beginPath(); c.moveTo(56, -196); c.quadraticCurveTo(80, -176, 142, -162); c.lineTo(140, -150); c.lineTo(96, -174); c.lineTo(58, -190); c.closePath(); c.fill();
  // タンク
  c.fillStyle = white; c.beginPath(); c.moveTo(134, -152); c.quadraticCurveTo(142, -190, 190, -206); c.quadraticCurveTo(232, -210, 246, -192); c.lineTo(232, -160); c.lineTo(180, -146); c.closePath(); c.fill();
  c.fillStyle = red; c.beginPath(); c.moveTo(150, -180); c.quadraticCurveTo(170, -200, 198, -204); c.lineTo(214, -186); c.lineTo(168, -170); c.closePath(); c.fill();
  c.fillStyle = sh; c.beginPath(); c.moveTo(134, -152); c.lineTo(180, -146); c.lineTo(232, -160); c.lineTo(238, -172); c.lineTo(182, -158); c.lineTo(138, -164); c.closePath(); c.fill();
  // カウル(下)
  c.fillStyle = white; c.beginPath(); c.moveTo(236, -196); c.lineTo(300, -204); c.quadraticCurveTo(314, -192, 308, -172); c.quadraticCurveTo(268, -150, 262, -104); c.lineTo(254, -60); c.quadraticCurveTo(246, -34, 222, -32); c.lineTo(126, -32); c.quadraticCurveTo(104, -40, 108, -66); c.lineTo(124, -100); c.lineTo(168, -128); c.lineTo(206, -150); c.closePath(); c.fill();
  c.fillStyle = red; c.beginPath(); c.moveTo(150, -116); c.lineTo(214, -150); c.lineTo(250, -132); c.lineTo(244, -76); c.lineTo(226, -48); c.lineTo(150, -52); c.quadraticCurveTo(132, -84, 150, -116); c.closePath(); c.fill();
  c.fillStyle = white; c.beginPath(); c.moveTo(168, -100); c.lineTo(236, -112); c.lineTo(232, -92); c.lineTo(166, -80); c.closePath(); c.fill();
  c.fillStyle = red; c.beginPath(); c.moveTo(262, -196); c.lineTo(300, -202); c.quadraticCurveTo(310, -192, 306, -176); c.lineTo(276, -164); c.closePath(); c.fill();
  c.fillStyle = sh; c.beginPath(); c.moveTo(126, -32); c.lineTo(222, -32); c.quadraticCurveTo(246, -34, 254, -60); c.lineTo(240, -52); c.lineTo(132, -46); c.closePath(); c.fill();
  c.fillStyle = '#17171f'; c.beginPath(); c.moveTo(188, -144); c.lineTo(204, -150); c.lineTo(214, -142); c.lineTo(196, -134); c.closePath(); c.fill();
  // ヘッドライト・スクリーン・ミラー・ウインカー
  c.fillStyle = o.lightOn ? '#fff8d0' : '#dfe6f0'; c.beginPath(); c.moveTo(302, -202); c.quadraticCurveTo(316, -192, 310, -176); c.lineTo(302, -178); c.closePath(); c.fill();
  c.fillStyle = 'rgba(40,50,80,.72)'; c.beginPath(); c.moveTo(238, -198); c.quadraticCurveTo(252, -248, 274, -246); c.lineTo(300, -206); c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(254, -232); c.quadraticCurveTo(264, -244, 274, -242); c.lineTo(286, -224); c.closePath(); c.fill();
  c.strokeStyle = '#17171f'; c.lineWidth = 4; c.beginPath(); c.moveTo(262, -214); c.lineTo(272, -246); c.stroke(); c.fillStyle = white; c.beginPath(); c.ellipse(276, -252, 15, 9, -.2, 0, TAU); c.fill();
  c.fillStyle = '#f0a020'; c.beginPath(); c.ellipse(288, -172, 9, 6, -.5, 0, TAU); c.fill(); c.beginPath(); c.ellipse(-2, -150, 7, 5, 0, 0, TAU); c.fill();
  // ----- ライダー(前傾) -----
  if (o.rider !== false) {
    const lean = Math.sin(t * 1.5) * 1.5; c.save(); c.translate(0, lean * .4);
    c.strokeStyle = suit; c.lineWidth = 36; c.beginPath(); c.moveTo(92, -186); c.lineTo(182, -168); c.stroke();          // 太もも
    c.strokeStyle = suit2; c.lineWidth = 10; c.beginPath(); c.moveTo(96, -198); c.lineTo(180, -182); c.stroke();
    c.strokeStyle = suit; c.lineWidth = 28; c.beginPath(); c.moveTo(182, -164); c.lineTo(118, -110); c.stroke();        // すね
    c.fillStyle = '#17171f'; c.beginPath(); c.moveTo(100, -122); c.lineTo(132, -112); c.lineTo(124, -94); c.lineTo(88, -98); c.closePath(); c.fill();
    c.fillStyle = suit2; c.beginPath(); c.arc(186, -166, 10, 0, TAU); c.fill();
    if (o.upright) { // 体を起こした姿勢。wave=ヤエー(0..1), look=奥の景色を見る(0..1)
      const wv = o.wave || 0, lk = o.look || 0;
      c.fillStyle = suit; c.beginPath(); c.moveTo(62, -186); c.quadraticCurveTo(64, -262, 112, -308); c.quadraticCurveTo(150, -320, 178, -298); c.quadraticCurveTo(162, -236, 132, -176); c.closePath(); c.fill();
      c.fillStyle = suit2; c.beginPath(); c.moveTo(64, -200); c.quadraticCurveTo(70, -262, 112, -302); c.lineTo(124, -294); c.quadraticCurveTo(88, -256, 82, -196); c.closePath(); c.fill();
      c.fillStyle = sh; c.beginPath(); c.moveTo(132, -176); c.quadraticCurveTo(162, -236, 178, -298); c.lineTo(166, -292); c.quadraticCurveTo(150, -236, 120, -184); c.closePath(); c.fill();
      const ex = lerp(206, 198, wv), ey = lerp(-246, -334, wv), hx = lerp(242, 226, wv), hy = lerp(-206, -392, wv);
      c.strokeStyle = suit; c.lineWidth = 27; c.beginPath(); c.moveTo(156, -288); c.lineTo(ex, ey); c.stroke(); c.lineWidth = 22; c.beginPath(); c.moveTo(ex, ey); c.lineTo(hx, hy); c.stroke();
      c.fillStyle = suit2; c.beginPath(); c.arc(ex, ey, 8, 0, TAU); c.fill(); c.fillStyle = '#17171f'; c.beginPath(); c.arc(hx, hy, 12, 0, TAU); c.fill();
      if (wv > .5) { c.strokeStyle = '#17171f'; c.lineWidth = 7; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx - 9, hy - 26); c.moveTo(hx, hy); c.lineTo(hx + 11, hy - 24); c.stroke(); }
      c.save(); c.translate(172, -334); c.rotate(-.04 - lk * .1);
      c.fillStyle = hel; c.beginPath(); c.moveTo(-34, 4); c.quadraticCurveTo(-36, -34, 0, -36); c.quadraticCurveTo(36, -34, 38, 2); c.quadraticCurveTo(36, 30, 10, 32); c.lineTo(-22, 30); c.quadraticCurveTo(-34, 22, -34, 4); c.closePath(); c.fill();
      c.fillStyle = o.helA || '#2456a8'; c.beginPath(); c.moveTo(-34, -4); c.quadraticCurveTo(-30, -30, -4, -35); c.lineTo(2, -24); c.quadraticCurveTo(-18, -18, -24, 4); c.closePath(); c.fill();
      c.fillStyle = o.helB || '#f2c230'; c.beginPath(); c.moveTo(-22, 6); c.quadraticCurveTo(-16, -14, 4, -20); c.lineTo(8, -13); c.quadraticCurveTo(-8, -8, -13, 8); c.closePath(); c.fill();
      const vx = (x) => 37 - (37 - x) * (1 - lk * .82);
      c.fillStyle = '#141826'; c.beginPath(); c.moveTo(vx(6), -14); c.quadraticCurveTo(vx(30), -18, 37, -2); c.quadraticCurveTo(vx(34), 8, vx(12), 8); c.quadraticCurveTo(vx(4), 0, vx(6), -14); c.closePath(); c.fill();
      if (lk < .5) { c.fillStyle = 'rgba(140,220,255,.55)'; c.beginPath(); c.moveTo(vx(14), -10); c.quadraticCurveTo(vx(26), -13, vx(32), -5); c.lineTo(vx(20), -3); c.closePath(); c.fill(); }
      c.fillStyle = sh; c.beginPath(); c.moveTo(-22, 30); c.lineTo(10, 32); c.quadraticCurveTo(36, 30, 38, 2); c.quadraticCurveTo(30, 22, 8, 24); c.lineTo(-26, 22); c.closePath(); c.fill();
      c.restore();
    } else {
    c.fillStyle = suit; c.beginPath(); c.moveTo(66, -184); c.quadraticCurveTo(78, -242, 150, -262); c.quadraticCurveTo(196, -268, 214, -244); c.quadraticCurveTo(176, -214, 128, -176); c.closePath(); c.fill();   // 胴
    c.fillStyle = suit2; c.beginPath(); c.moveTo(70, -196); c.quadraticCurveTo(84, -238, 140, -258); c.lineTo(146, -246); c.quadraticCurveTo(100, -228, 86, -190); c.closePath(); c.fill();
    c.fillStyle = sh; c.beginPath(); c.moveTo(66, -184); c.lineTo(128, -176); c.quadraticCurveTo(176, -214, 214, -244); c.lineTo(206, -236); c.quadraticCurveTo(160, -206, 124, -188); c.closePath(); c.fill();
    c.strokeStyle = suit; c.lineWidth = 27; c.beginPath(); c.moveTo(190, -246); c.lineTo(212, -204); c.stroke(); c.lineWidth = 22; c.beginPath(); c.moveTo(212, -204); c.lineTo(240, -204); c.stroke();   // 腕
    c.fillStyle = suit2; c.beginPath(); c.arc(212, -203, 8, 0, TAU); c.fill(); c.fillStyle = '#17171f'; c.beginPath(); c.arc(244, -204, 11, 0, TAU); c.fill();
    // フルフェイス
    c.save(); c.translate(226, -262); c.rotate(.28);
    c.fillStyle = hel; c.beginPath(); c.moveTo(-34, 4); c.quadraticCurveTo(-36, -34, 0, -36); c.quadraticCurveTo(36, -34, 38, 2); c.quadraticCurveTo(36, 30, 10, 32); c.lineTo(-22, 30); c.quadraticCurveTo(-34, 22, -34, 4); c.closePath(); c.fill();
    c.fillStyle = o.helA || '#2456a8'; c.beginPath(); c.moveTo(-34, -4); c.quadraticCurveTo(-30, -30, -4, -35); c.lineTo(2, -24); c.quadraticCurveTo(-18, -18, -24, 4); c.closePath(); c.fill();
    c.fillStyle = o.helB || '#f2c230'; c.beginPath(); c.moveTo(-22, 6); c.quadraticCurveTo(-16, -14, 4, -20); c.lineTo(8, -13); c.quadraticCurveTo(-8, -8, -13, 8); c.closePath(); c.fill();
    c.fillStyle = '#141826'; c.beginPath(); c.moveTo(6, -14); c.quadraticCurveTo(30, -18, 37, -2); c.quadraticCurveTo(34, 8, 12, 8); c.quadraticCurveTo(4, 0, 6, -14); c.closePath(); c.fill();
    c.fillStyle = 'rgba(140,220,255,.55)'; c.beginPath(); c.moveTo(14, -10); c.quadraticCurveTo(26, -13, 32, -5); c.lineTo(20, -3); c.closePath(); c.fill();
    c.fillStyle = sh; c.beginPath(); c.moveTo(-22, 30); c.lineTo(10, 32); c.quadraticCurveTo(36, 30, 38, 2); c.quadraticCurveTo(30, 22, 8, 24); c.lineTo(-26, 22); c.closePath(); c.fill();
    c.restore(); }
    c.restore();
  }
  c.restore();
}
// 後ろ姿(伏せたライダー)。原点=後輪接地点
function drawRacerRear(c, o) {
  const red = o.red || '#e2342b', white = o.white || '#f7f4ec', navy = '#1c2550', suit = o.suit || '#f4f1e8', suit2 = o.suit2 || '#2456a8', sh = o.shade || 'rgba(40,40,90,.24)', t = o.t || 0;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  c.fillStyle = '#15151d'; rr(c, -36, -150, 72, 150, 30); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.10)'; c.lineWidth = 3; for (let i = 0; i < 9; i++) { const y = -142 + mod(i * 17 + t * 420, 150); c.beginPath(); c.moveTo(-26, y); c.lineTo(26, y - 5); c.stroke(); }
  c.fillStyle = '#17171f'; rr(c, -30, -206, 60, 66, 8); c.fill(); c.fillStyle = '#f4f1e4'; rr(c, -26, -182, 52, 30, 4); c.fill();
  for (const s of [-1, 1]) { c.fillStyle = '#1b1b24'; c.beginPath(); c.ellipse(s * 62, -176, 17, 19, 0, 0, TAU); c.fill(); c.fillStyle = '#c9ccd6'; c.beginPath(); c.ellipse(s * 62, -176, 10, 11, 0, 0, TAU); c.fill(); c.fillStyle = '#0c0c12'; c.beginPath(); c.ellipse(s * 62, -176, 6, 7, 0, 0, TAU); c.fill(); }
  // 脚(膝を張る)
  for (const s of [-1, 1]) { c.strokeStyle = suit; c.lineWidth = 42; c.beginPath(); c.moveTo(s * 40, -300); c.lineTo(s * 86, -246); c.stroke(); c.lineWidth = 32; c.beginPath(); c.moveTo(s * 86, -246); c.lineTo(s * 70, -168); c.stroke(); c.fillStyle = suit2; c.beginPath(); c.arc(s * 90, -250, 17, 0, TAU); c.fill(); c.fillStyle = '#17171f'; rr(c, s * 70 - 19, -182, 38, 44, 8); c.fill(); }
  // テールカウル
  c.fillStyle = white; c.beginPath(); c.moveTo(-58, -232); c.quadraticCurveTo(-64, -300, 0, -306); c.quadraticCurveTo(64, -300, 58, -232); c.quadraticCurveTo(0, -214, -58, -232); c.closePath(); c.fill();
  c.fillStyle = red; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 56, -238); c.quadraticCurveTo(s * 60, -286, s * 30, -300); c.lineTo(s * 22, -286); c.quadraticCurveTo(s * 40, -270, s * 38, -230); c.closePath(); c.fill(); }
  c.fillStyle = o.lightOn ? '#ff3a30' : '#c22020'; rr(c, -26, -252, 52, 18, 6); c.fill();
  c.fillStyle = '#f0a020'; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 74, -244, 8, 0, TAU); c.fill(); }
  c.fillStyle = navy; rr(c, -40, -322, 80, 30, 12); c.fill();
  // 腰・背中(前傾で短く見える)
  c.fillStyle = suit; c.beginPath(); c.moveTo(-64, -300); c.quadraticCurveTo(-84, -372, -66, -420); c.quadraticCurveTo(0, -446, 66, -420); c.quadraticCurveTo(84, -372, 64, -300); c.closePath(); c.fill();
  c.fillStyle = suit2; c.beginPath(); c.moveTo(-70, -410); c.quadraticCurveTo(0, -436, 70, -410); c.lineTo(72, -388); c.quadraticCurveTo(0, -412, -72, -388); c.closePath(); c.fill();
  c.fillStyle = suit2; c.fillRect(-9, -404, 18, 100);
  c.fillStyle = sh; c.beginPath(); c.moveTo(-64, -300); c.lineTo(64, -300); c.quadraticCurveTo(76, -330, 76, -350); c.quadraticCurveTo(0, -322, -76, -350); c.quadraticCurveTo(-76, -330, -64, -300); c.closePath(); c.fill();
  // カウル上部とミラー・腕
  c.fillStyle = white; c.beginPath(); c.moveTo(-96, -400); c.quadraticCurveTo(0, -452, 96, -400); c.lineTo(90, -384); c.quadraticCurveTo(0, -430, -90, -384); c.closePath(); c.fill();
  for (const s of [-1, 1]) { c.strokeStyle = '#17171f'; c.lineWidth = 4; c.beginPath(); c.moveTo(s * 96, -404); c.lineTo(s * 122, -436); c.stroke(); c.fillStyle = white; c.beginPath(); c.ellipse(s * 128, -444, 22, 14, 0, 0, TAU); c.fill(); c.fillStyle = o.mirror || '#8fb0d0'; c.beginPath(); c.ellipse(s * 128, -444, 17, 10, 0, 0, TAU); c.fill();
    c.strokeStyle = suit; c.lineWidth = 34; c.beginPath(); c.moveTo(s * 62, -410); c.lineTo(s * 96, -376); c.stroke(); c.fillStyle = suit2; c.beginPath(); c.arc(s * 98, -374, 15, 0, TAU); c.fill(); }
  // ヘルメット
  c.fillStyle = o.helmet || '#f7f4ec'; c.beginPath(); c.arc(0, -448, 46, 0, TAU); c.fill();
  c.fillStyle = o.helA || '#2456a8'; c.beginPath(); c.moveTo(-14, -493); c.lineTo(14, -493); c.lineTo(20, -404); c.lineTo(-20, -404); c.closePath(); c.fill();
  c.fillStyle = o.helB || '#f2c230'; c.fillRect(-6, -494, 12, 90);
  c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-24, -470, 10, 6, -.7, 0, TAU); c.fill();
  c.restore();
}
