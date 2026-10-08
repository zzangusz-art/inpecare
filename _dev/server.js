// 로컬 미리보기 + 가짜 접수 엔드포인트 (Apps Script 동작 흉내)
// 실행: node _dev/server.js  →  http://127.0.0.1:5178
// 테스트 시 브라우저 콘솔: INPE_CONFIG.LEAD_ENDPOINT = location.origin + '/__mock/lead'
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = +process.env.PORT || 5178;
const LOG = path.join(__dirname, 'mock-leads.json');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml' };
const leads = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : [];

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/__mock/lead') {
    if (req.method === 'POST') {
      let b = ''; req.on('data', c => b += c); req.on('end', () => {
        try {
          const d = JSON.parse(b);
          if (!d.name || !d.phone) throw new Error('필수값 누락');
          const id = 'IC' + Date.now().toString().slice(-8);
          const photos = (d.photos || []).map(p => ({ name: p.name, kb: Math.round(p.data.length * 0.75 / 1024) }));
          leads.unshift({ id, at: new Date().toISOString(), ...d, photos });
          fs.writeFileSync(LOG, JSON.stringify(leads, null, 1));
          console.log('LEAD', id, d.form, d.name, d.phone, d.items, 'photos:', photos);
          res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, id }));
        } catch (e) { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: e.message })); }
      });
      return;
    }
    const rows = leads.slice(0, 10).map(l => ({ id: l.id, t: '방금', name: (l.name || '')[0] + '○○', area: [l.region, (l.area || '').split(' ')[0]].filter(Boolean).join(' '), svc: (l.items || []).join(' · ') + (l.pet && l.pet.length ? ' · ' + l.pet[0] : ''), st: '접수' }));
    res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ ok: true, rows }));
  }
  let p = path.join(ROOT, decodeURIComponent(u.pathname));
  if (u.pathname.endsWith('/')) p = path.join(p, 'index.html');
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end('404'); }
  const stat = fs.statSync(p), type = MIME[path.extname(p).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;
  if (range && type === 'video/mp4') {
    const [s, e] = range.replace('bytes=', '').split('-'); const start = +s, end = e ? +e : stat.size - 1;
    res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Content-Type': type });
    return fs.createReadStream(p, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
  fs.createReadStream(p).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log('인프케어 미리보기: http://127.0.0.1:' + PORT));
