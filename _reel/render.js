// 인프케어 쇼릴 렌더: node render.js <w> <h> <out.mp4>  |  미리보기: node render.js <w> <h> --stills=0.8,2.1,...
const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const [, , W = '1920', H = '1080', out = 'out.mp4'] = process.argv;
const ROOT = path.resolve(__dirname, '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf' };

const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--force-color-profile=srgb'] });
  const page = await browser.newPage();
  await page.setViewport({ width: +W, height: +H, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('PAGE ERROR', e.message));
  page.on('console', m => console.log('PAGE', m.text()));
  await page.goto(`http://127.0.0.1:${port}/_reel/reel.html?w=${W}&h=${H}`);
  await page.waitForFunction('window.READY === true', { timeout: 90000 });

  const grab = async t => {
    const d = await page.evaluate(t => { window.render(t); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, t);
    return Buffer.from(d.split(',')[1], 'base64');
  };

  if (out.startsWith('--stills=')) {
    const dir = path.join(__dirname, 'stills'); fs.mkdirSync(dir, { recursive: true });
    for (const s of out.slice(9).split(',')) fs.writeFileSync(path.join(dir, `${W}x${H}_${s}.jpg`), await grab(+s));
    console.log('stills done');
  } else {
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-',
      '-vf', 'scale=in_range=pc:out_range=tv,format=yuv420p', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', process.env.CRF || '23', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
      '-movflags', '+faststart', '-an', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = 0; f < 450; f++) {
      const buf = await grab(f / 30);
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (f % 90 === 0) console.log(`frame ${f}/450  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
    console.log('encoded', out, ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
  await browser.close(); server.close();
})().catch(e => { console.error(e); process.exit(1); });
