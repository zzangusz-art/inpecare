// 배포된 주소 점검: node _dev/remote-check.js https://zzangusz-art.github.io/inpecare/
const puppeteer = require('../_reel/node_modules/puppeteer-core');
const BASE = process.argv[2] || 'https://zzangusz-art.github.io/inpecare/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const res = []; const ok = (n, c, i = '') => res.push([c ? 'PASS' : 'FAIL', n, i]);
(async () => {
  const b = await puppeteer.launch({ protocolTimeout: 60000, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const errs = [];
  const mk = async (w, h, mobile) => {
    const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: !!mobile, hasTouch: !!mobile });
    p.on('pageerror', e => errs.push('pageerror ' + e.message));
    p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
    p.on('requestfailed', r => { const f = (r.failure() || {}).errorText || ''; if (!/ERR_ABORTED/.test(f)) errs.push('fail ' + r.url() + ' ' + f); });
    return p;
  };
  const d = await mk(1440, 900);
  await d.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 }); await sleep(3000);
  let s = await d.evaluate(() => { const v = document.querySelector('.reel video'); return { t: v.currentTime, src: v.currentSrc, robots: [...document.querySelectorAll('meta[name=robots]')].map(m => m.content), title: document.title, live: document.getElementById('live').hidden }; });
  ok('홈 로드 · 쇼릴 재생', s.t > 0.5, JSON.stringify({ t: s.t, src: s.src.split('/').pop() }));
  ok('github.io 검색 제외(noindex)', s.robots.some(x => /noindex/.test(x)), s.robots.join(' | '));
  ok('운영 모드: DB 미연결 시 실시간 현황 숨김', s.live === true);
  // 운영 모드 폼 제출 → 문자 폴백
  await d.click('.reel__skip'); await sleep(800);
  await d.evaluate(() => document.getElementById('quote').scrollIntoView()); await sleep(800);
  const q = '#quote ';
  await d.click(q + 'label[for=qi-i2]'); await d.click(q + '[data-next]'); await sleep(300); await d.click(q + '[data-next]'); await sleep(300);
  await d.select(q + '[name=region]', '인천'); await d.click(q + '[data-next]'); await sleep(300);
  await d.type(q + '[name=name]', '배포점검'); await d.type(q + '[name=phone]', '01000000000'); await d.click(q + '.consent label');
  await d.click(q + '[data-send]'); await sleep(1200);
  s = await d.evaluate(() => ({ t: (document.querySelector('.toast--err') || {}).textContent || '', sms: (document.querySelector('.toast--err a[href^="sms:"]') || {}).href || '' }));
  ok('DB 미연결 → 문자 폴백 안내', /서버가 연결되지/.test(s.t) && /050713145792/.test(s.sms), s.t.slice(0, 50));
  const pg = await mk(1440, 900);
  for (const p of ['pet-urine.html', 'pet-virus.html', 'price.html', 'about.html', 'privacy.html']) {
    const r = await pg.goto(BASE + p, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => null);
    const extra = await pg.evaluate(() => { try { return JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph'].length + ' ld nodes · ' + (/범백/.test(document.body.innerText) ? '범백 있음!' : '범백 없음'); } catch (e) { return 'LD ERR'; } });
    ok('페이지 ' + p, r && r.status() === 200 && !/ERR|범백 있음/.test(extra), (r ? r.status() : 'x') + ' ' + extra);
  }
  await pg.close();
  for (const p of ['llms.txt', 'sitemap.xml', 'robots.txt', 'assets/video/inpecare-reel-1080p.mp4', 'assets/video/inpecare-reel-720p.mp4', 'assets/video/inpecare-reel-mobile.mp4', 'assets/img/og-inpecare.jpg', 'assets/js/app.js', 'assets/css/style.css']) {
    const r = await fetch(BASE + p, { method: 'HEAD' }).catch(() => null);
    ok('파일 ' + p, r && r.status === 200, r ? r.status + ' ' + r.headers.get('content-type') + ' ' + Math.round((+r.headers.get('content-length') || 0) / 1024) + 'KB' : 'x');
  }
  const m = await mk(390, 844, true);
  await m.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 }); await sleep(3000);
  s = await m.evaluate(() => ({ src: document.querySelector('.reel video').currentSrc.split('/').pop(), t: document.querySelector('.reel video').currentTime, sw: document.documentElement.scrollWidth }));
  ok('모바일 세로 영상 재생 · 가로 넘침 없음', /mobile/.test(s.src) && s.t > 0.5 && s.sw <= 390, JSON.stringify(s));
  await m.screenshot({ path: __dirname + '/shots/remote_mobile.jpg', type: 'jpeg', quality: 70 });
  await b.close();
  const u = [...new Set(errs)];
  ok('404 · 스크립트 오류 없음', u.length === 0, u.slice(0, 6).join(' | '));
  res.forEach(r => console.log(r[0], r[1], r[2] ? '— ' + r[2] : ''));
  console.log('TOTAL', res.filter(r => r[0] === 'PASS').length + '/' + res.length);
})().catch(e => { console.error('CRASH', e); process.exit(1); });
