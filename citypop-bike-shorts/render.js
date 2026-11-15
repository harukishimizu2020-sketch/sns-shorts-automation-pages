// 使い方:
//   node render.js a still 1.0,9.5,20      -> out/still_a_*.png
//   node render.js a chunk 0 450 out/a_0.mp4 -> フレーム[0,450)を無劣化に近いmp4へ
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const FPS = 30;
(async () => {
  const [which, mode, ...rest] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exitCode = 1; });
  await page.goto('file://' + path.join(__dirname, 'page.html') + '?v=' + which);
  await page.evaluate(() => window.READY);
  const grab = (f) => page.evaluate(async (f) => {
    window.renderFrame(f);
    const blob = await new Promise(r => document.getElementById('cv').toBlob(r, 'image/jpeg', 0.97));
    const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; const CH = 0x8000;
    for (let i = 0; i < buf.length; i += CH) s += String.fromCharCode.apply(null, buf.subarray(i, i + CH));
    return btoa(s);
  }, f);
  if (mode === 'still') {
    for (const ts of rest[0].split(',')) {
      const f = Math.round(parseFloat(ts) * FPS);
      const b = Buffer.from(await grab(f), 'base64');
      fs.writeFileSync(path.join(__dirname, 'out', `still_${which}_${String(ts).padStart(5, '0')}.jpg`), b);
    }
  } else {
    const [s, e, out] = [parseInt(rest[0]), parseInt(rest[1]), rest[2]];
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '10', '-pix_fmt', 'yuv444p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = s; f < e; f++) {
      const b = Buffer.from(await grab(f), 'base64');
      if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - s) % 150 === 0) console.log(`${which} ${f}/${e} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close();
})();
