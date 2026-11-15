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
  for (const s of [-1, 1]) { c.strokeStyle = jn; c.lineWidth = 40; c.beginPath(); c.moveTo(s * 40, -300); c.lineTo(s * 78, -216); c.stroke(); c.lineWidth = 32; c.beginPath(); c.moveTo(s * 78, -216); c.lineTo(s * 74, -128); c.stroke(); c.fillStyle = S('#2a1a12'); rr(c, s * 74 - 20, -136, 40, 34, 8); c.fill(); }
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
