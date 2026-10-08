// 헤드리스 Chrome E2E 점검: node _dev/test.js  (미리보기 서버 5178 실행 중이어야 함)
const puppeteer = require('../_reel/node_modules/puppeteer-core');
const fs = require('fs'), path = require('path');
const BASE = 'http://127.0.0.1:5178/';
const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = []; const ok = (name, cond, info = '') => { results.push([cond ? 'PASS' : 'FAIL', name, info]); };

(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--no-sandbox'] });
  const errs = [];
  const mk = async (w, h, mobile) => {
    const pg = await browser.newPage();
    await pg.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: !!mobile, hasTouch: !!mobile });
    if (mobile) await pg.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
    pg.on('pageerror', e => errs.push('pageerror ' + e.message));
    pg.on('console', m => { if (m.type() === 'error' && !(m.text().includes('404') && m.location() && /__mock\/404/.test(m.location().url || ''))) errs.push('console ' + m.text() + ' @ ' + ((m.location() || {}).url || '')); });
    pg.on('requestfailed', r => { if (!/fonts\.g/.test(r.url())) errs.push('reqfail ' + r.url() + ' ' + (r.failure() || {}).errorText); });
    pg.on('response', r => { if (r.status() >= 400 && !/__mock\/404/.test(r.url())) errs.push('http ' + r.status() + ' ' + r.url()); });
    return pg;
  };
  const shot = (pg, n) => pg.screenshot({ path: path.join(OUT, n + '.jpg'), type: 'jpeg', quality: 70 });
  const scrollTo = async (pg, y) => { await pg.evaluate(y => window.scrollTo(0, y), y); await sleep(700); };

  /* ---------- 데스크톱 홈 ---------- */
  const d = await mk(1440, 900);
  await d.goto(BASE, { waitUntil: 'networkidle2' });
  await sleep(2500);
  let st = await d.evaluate(() => { const v = document.querySelector('.reel video'); return { t: v.currentTime, paused: v.paused, src: v.currentSrc, cls: document.querySelector('.reel').className }; });
  ok('쇼릴 자동재생', st.t > 0.5 && !st.paused, JSON.stringify(st));
  ok('데스크톱 720p 소스 선택', /720p/.test(st.src), st.src);
  ok('재생 중 본문 텍스트 숨김', !/is-done/.test(st.cls));
  await shot(d, '01_reel_playing');
  await sleep(4000); await shot(d, '02_reel_6s');
  await d.click('.reel__skip'); await sleep(1400);
  st = await d.evaluate(() => ({ on: [...document.querySelectorAll('.chapter')].map(c => c.classList.contains('is-on')), done: document.querySelector('.reel').classList.contains('is-done') }));
  ok('건너뛰기 → 1챕터 노출', st.done && st.on[0], JSON.stringify(st));
  await shot(d, '03_chapter1');
  const reel = await d.evaluate(() => { const r = document.querySelector('.reel'); return { top: r.offsetTop, total: r.offsetHeight - innerHeight }; });
  await scrollTo(d, reel.top + reel.total * 0.5); await shot(d, '04_chapter2');
  st = await d.evaluate(() => [...document.querySelectorAll('.chapter')].map(c => c.classList.contains('is-on')));
  ok('스크롤 50% → 2챕터', st[1], JSON.stringify(st));
  await scrollTo(d, reel.top + reel.total * 0.8); await shot(d, '05_chapter3');
  st = await d.evaluate(() => [...document.querySelectorAll('.chapter')].map(c => c.classList.contains('is-on')));
  ok('스크롤 80% → 3챕터', st[2], JSON.stringify(st));
  await scrollTo(d, reel.top + reel.total * 0.99); await shot(d, '06_reel_end_inset');
  st = await d.evaluate(() => document.querySelector('.reel__frame').style.getPropertyValue('--inset'));
  ok('히어로 끝 → 프레임 축소(inset)', parseFloat(st) > 10, st);

  // 섹션별 스크린샷
  for (const [id, n] of [['what', '07_answer'], ['problems', '08_problems'], ['services', '09_services'], ['proof', '10_proof']]) {
    await d.evaluate(id => document.getElementById(id).scrollIntoView(), id); await sleep(1300); await shot(d, n);
  }
  // 탭
  await d.evaluate(() => document.getElementById('services').scrollIntoView()); await sleep(400);
  await d.click('#tab-virus'); await sleep(500);
  st = await d.evaluate(() => ({ v: !document.getElementById('panel-virus').hidden, u: document.getElementById('panel-urine').hidden }));
  ok('탭 전환', st.v && st.u); await shot(d, '11_tab_virus');
  // 비포애프터 / 카드 플립 / 라이트박스
  await d.evaluate(() => document.querySelector('.pcards').scrollIntoView({ block: 'center' })); await sleep(600);
  await d.click('.pcard'); await sleep(900);
  ok('필터 카드 플립', await d.evaluate(() => document.querySelector('.pcard').classList.contains('is-flip')));
  await d.evaluate(() => document.querySelector('.gallery a').scrollIntoView({ block: 'center' })); await sleep(400);
  await d.click('.gallery a'); await sleep(700);
  ok('라이트박스 모달', await d.evaluate(() => document.getElementById('modal-lightbox').classList.contains('is-on')));
  await shot(d, '12_lightbox');
  await d.keyboard.press('ArrowRight'); await sleep(300);
  ok('라이트박스 키보드 이동', await d.evaluate(() => document.querySelector('.lb__count').textContent.startsWith('2')));
  await d.keyboard.press('Escape'); await sleep(500);
  ok('ESC로 모달 닫기', await d.evaluate(() => !document.getElementById('modal-lightbox').classList.contains('is-on') && !document.body.classList.contains('is-locked')));
  // 공정 시퀀스
  const seq = await d.evaluate(() => { const s = document.getElementById('process'); return { top: s.offsetTop, total: s.offsetHeight - innerHeight }; });
  for (const [p, n] of [[0.1, '13_seq_uv'], [0.42, '14_seq_wet'], [0.95, '15_seq_done']]) { await scrollTo(d, seq.top + seq.total * p); await shot(d, n); }
  st = await d.evaluate(() => [...document.querySelectorAll('.seq__step')].map(s => s.classList.contains('is-cur')).indexOf(true));
  ok('공정 시퀀스 마지막 단계 활성', st === 5, 'cur=' + st);
  // 계산기
  await d.evaluate(() => document.getElementById('calculator').scrollIntoView()); await sleep(900);
  await d.click('#cm-dry + label'); await sleep(200);
  let t1 = await d.evaluate(() => document.getElementById('calc-total').textContent);
  ok('계산기 퀸 건식 = 40,000', t1 === '40,000', t1);
  await d.click('label.toggle:has(input[name=pet_urine])'); await sleep(500);
  st = await d.evaluate(() => ({ wet: document.getElementById('cm-wet').checked, total: document.getElementById('calc-total').textContent, toast: !!document.querySelector('.toast') }));
  ok('소변 선택 → 습건식 자동 전환 + 토스트', st.wet && st.total === '80,000' && st.toast, JSON.stringify(st));
  await d.click('label.toggle:has(input[name=use_sofa])'); await d.select('select[name=sofa_size]', 's4c'); await d.click('label.toggle:has(input[name=pet_virus])'); await sleep(300);
  t1 = await d.evaluate(() => document.getElementById('calc-total').textContent);
  ok('퀸 습건식 80,000 + 4인 카우치 100,000 + 방역 149,000 = 329,000', t1 === '329,000', t1);
  await shot(d, '16_calc');
  // 견적 드로어 → 제출 (가짜 엔드포인트)
  await d.evaluate(() => { window.INPE_CONFIG.LEAD_ENDPOINT = location.origin + '/__mock/lead'; });
  await d.click('#calc-go'); await sleep(900);
  st = await d.evaluate(() => ({ open: document.getElementById('drawer-quote').classList.contains('is-on'), items: [...document.querySelectorAll('#drawer-quote [name=items]:checked')].map(i => i.value), pet: [...document.querySelectorAll('#drawer-quote [name=pet]:checked')].map(i => i.value), detail: document.querySelector('#drawer-quote [name=detail]').value }));
  ok('계산 결과 → 드로어 프리필', st.open && st.items.length === 3 && st.pet.length === 2, JSON.stringify(st));
  await shot(d, '17_drawer_step1');
  const dq = '#drawer-quote ';
  await d.click(dq + '[data-next]'); await sleep(400); await shot(d, '18_drawer_step2');
  await d.click(dq + '[data-next]'); await sleep(400);
  await d.click(dq + '[data-next]'); await sleep(300);
  ok('지역 미선택 시 다음 단계 차단', await d.evaluate(() => document.querySelector('#drawer-quote [name=region]').closest('.field').classList.contains('is-err')));
  await d.select(dq + '[name=region]', '인천'); await d.type(dq + '[name=area]', '남동구 구월동');
  await d.click(dq + '[data-next]'); await sleep(400);
  await d.click(dq + '[data-send]'); await sleep(300);
  ok('연락처 미입력 시 제출 차단', await d.evaluate(() => document.querySelector('#drawer-quote [name=phone]').closest('.field').classList.contains('is-err')));
  await d.type(dq + '[name=name]', '테스트'); await d.type(dq + '[name=phone]', '01012345678');
  ok('전화번호 자동 하이픈', (await d.evaluate(() => document.querySelector('#drawer-quote [name=phone]').value)) === '010-1234-5678');
  await d.click(dq + '.consent label'); await sleep(200); console.log('DBG agree', await d.evaluate(() => document.querySelector('#drawer-quote [name=agree]').checked)); await shot(d, '19_drawer_step4');
  await d.click(dq + '[data-send]'); await sleep(1500);
  st = await d.evaluate(() => ({ modal: document.getElementById('modal-done').classList.contains('is-on'), id: document.querySelector('[data-done-id]').textContent, drawer: document.getElementById('drawer-quote').classList.contains('is-on') }));
  ok('제출 성공 → 완료 모달 + 접수번호', st.modal && /^IC/.test(st.id) && !st.drawer, JSON.stringify(st));
  await shot(d, '20_done_modal');
  const leads = fs.existsSync(path.join(__dirname, 'mock-leads.json')) ? JSON.parse(fs.readFileSync(path.join(__dirname, 'mock-leads.json'), 'utf8')) : [{}];
  const L = leads[0]; console.log('DBG drawer', JSON.stringify(st), JSON.stringify(errs.slice(0,5)));
  ok('DB 저장 내용 (이름·연락처·품목·예상금액·유입정보)', L.name === '테스트' && L.phone === '010-1234-5678' && L.items.length === 3 && L.estimate === 329000 && L.attr && L.attr.landing, JSON.stringify({ items: L.items, pet: L.pet, est: L.estimate, attr: L.attr }));
  await d.keyboard.press('Escape'); await sleep(400);
  // 실패 경로: 인라인 폼
  await d.evaluate(() => { window.INPE_CONFIG.LEAD_ENDPOINT = location.origin + '/__mock/404'; localStorage.removeItem('inpe_outbox'); });
  await d.evaluate(() => document.getElementById('quote').scrollIntoView()); await sleep(700);
  const qi = '#quote ';
  await d.click(qi + 'label[for=qi-i2]'); await d.click(qi + '[data-next]'); await sleep(300); await d.click(qi + '[data-next]'); await sleep(300);
  await d.select(qi + '[name=region]', '서울'); await d.click(qi + '[data-next]'); await sleep(300);
  await d.type(qi + '[name=name]', '실패테스트'); await d.type(qi + '[name=phone]', '010-9999-8888'); await d.click(qi + '.consent label');
  await d.click(qi + '[data-send]'); await sleep(1500);
  st = await d.evaluate(() => ({ toast: [...document.querySelectorAll('.toast--err')].map(t => t.textContent.slice(0, 40)), outbox: JSON.parse(localStorage.getItem('inpe_outbox') || '[]').length, sms: !!document.querySelector('.toast--err a[href^="sms:"]') }));
  ok('전송 실패 → 에러 토스트 + 문자 버튼 + 아웃박스 보관', st.toast.length && st.sms && st.outbox === 1, JSON.stringify(st));
  await shot(d, '21_error_toast');
  // FAQ 아코디언
  await d.evaluate(() => document.getElementById('faq').scrollIntoView()); await sleep(600);
  await d.click('#faq .acc__item:nth-child(3) .acc__btn'); await sleep(600);
  st = await d.evaluate(() => [...document.querySelectorAll('#faq .acc__btn')].map(b => b.getAttribute('aria-expanded')));
  ok('FAQ 아코디언 단일 열림', st.filter(x => x === 'true').length === 1 && st[2] === 'true', JSON.stringify(st));
  await shot(d, '22_faq');
  // 라이브 보드 (로컬 = 예시 데이터 → 엔드포인트 설정 후 실데이터)
  ok('라이브 보드 렌더', await d.evaluate(() => document.querySelectorAll('#board .board__row:not(.board__row--head)').length >= 5));
  await d.evaluate(() => document.getElementById('reviews').scrollIntoView()); await sleep(900); await shot(d, '23_reviews');
  await d.click('#reviews .chip[data-cat=pet]'); await sleep(400);
  st = await d.evaluate(() => [...document.querySelectorAll('#reviews .review')].filter(r => !r.hidden).map(r => r.dataset.cat));
  ok('후기 필터 (반려동물)', st.length === 6 && st.every(c => c === 'pet'), st.join(','));
  // 인증서 모달
  await d.evaluate(() => document.querySelector('[data-open=modal-cert]').click()); await sleep(600);
  ok('인증서 모달', await d.evaluate(() => document.getElementById('modal-cert').classList.contains('is-on'))); await shot(d, '24_cert'); await d.keyboard.press('Escape');
  await d.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await sleep(800); await shot(d, '25_footer');
  // JSON-LD
  st = await d.evaluate(() => { try { const j = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent); return j['@graph'].map(n => n['@type']).join(','); } catch (e) { return 'ERR ' + e.message; } });
  ok('홈 JSON-LD 파싱', !/ERR/.test(st), st);

  /* ---------- 모바일 ---------- */
  const m = await mk(390, 844, true);
  await m.goto(BASE, { waitUntil: 'networkidle2' }); await sleep(2500);
  st = await m.evaluate(() => { const v = document.querySelector('.reel video'); return { src: v.currentSrc, t: v.currentTime, sw: document.documentElement.scrollWidth }; });
  ok('모바일 세로 영상 선택', /mobile/.test(st.src), st.src);
  ok('모바일 가로 스크롤 없음', st.sw <= 390, 'scrollWidth ' + st.sw);
  await shot(m, 'm01_reel');
  await m.click('.reel__skip'); await sleep(1300); await shot(m, 'm02_chapter1');
  await m.evaluate(() => document.getElementById('services').scrollIntoView()); await sleep(1200); await shot(m, 'm03_services');
  ok('모바일 하단 바 노출', await m.evaluate(() => getComputedStyle(document.querySelector('.mbar')).display !== 'none' && document.querySelector('.mbar').classList.contains('is-on')));
  await m.evaluate(() => document.getElementById('calculator').scrollIntoView()); await sleep(1200); await shot(m, 'm04_calc');
  const ms = await m.evaluate(() => { const s = document.getElementById('process'); return { top: s.offsetTop, total: s.offsetHeight - innerHeight }; });
  await m.evaluate(y => window.scrollTo(0, y), ms.top + ms.total * 0.5); await sleep(800); await shot(m, 'm05_seq');
  await m.evaluate(() => window.scrollTo(0, 0)); await sleep(500);
  await m.click('.hdr__menu'); await sleep(800); console.log('DBG menu', await m.evaluate(() => ({ hdr: document.querySelector('.hdr').className, open: document.getElementById('drawer-nav').className, top: document.elementFromPoint(375, 36).className }))); await shot(m, 'm06_nav_drawer');
  ok('모바일 메뉴 드로어', await m.evaluate(() => document.getElementById('drawer-nav').classList.contains('is-on')));

  /* ---------- 서브페이지 ---------- */
  for (const p of ['pet-urine', 'pet-virus', 'price', 'about', 'privacy']) {
    const s = await mk(1440, 900);
    await s.goto(BASE + p + '.html', { waitUntil: 'networkidle2' }); await sleep(900);
    await shot(s, 'p_' + p);
    const info = await s.evaluate(() => { let ld = 'none'; try { ld = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph'].map(n => n['@type']).join(','); } catch (e) { ld = 'ERR'; } return { h1: (document.querySelector('h1') || {}).textContent, ld, sw: document.documentElement.scrollWidth }; });
    ok('서브 ' + p + ' 로드 · JSON-LD', info.ld !== 'ERR' && info.h1, info.ld);
    if (p === 'about') {
      await s.evaluate(() => { window.INPE_CONFIG.LEAD_ENDPOINT = location.origin + '/__mock/lead'; document.getElementById('partners').scrollIntoView(); }); await sleep(600);
      await s.type('#pf-company', '테스트상사'); await s.type('#pf-name', '홍길동'); await s.type('#pf-phone', '01022223333'); await s.click('#partners .consent label');
      await s.click('#partners [type=submit]'); await sleep(1200);
      ok('제휴 문의 전송', await s.evaluate(() => !!document.querySelector('.toast--ok')));
      await shot(s, 'p_about_partner');
    }
    if (p === 'price') { await s.evaluate(() => document.getElementById('tables').scrollIntoView()); await sleep(800); await shot(s, 'p_price_tables'); }
    if (p === 'pet-urine') { await s.evaluate(() => document.getElementById('first-aid').scrollIntoView()); await sleep(800); await shot(s, 'p_urine_firstaid'); }
    await s.close();
  }
  // 구 URL 리다이렉트
  const r = await mk(1200, 800);
  await r.goto(BASE + 'redirects/disinfection.html', { waitUntil: 'networkidle2' }); await sleep(500);
  ok('구 URL 리다이렉트', /\/pet-virus\.html$/.test(r.url()), r.url());

  await browser.close();
  const uniqErr = [...new Set(errs)];
  ok('콘솔/네트워크 오류 없음', uniqErr.length === 0, uniqErr.slice(0, 8).join(' | '));
  for (const [s, n, i] of results) console.log(s, n, i ? ' — ' + String(i).slice(0, 220) : '');
  console.log('\nTOTAL', results.filter(r => r[0] === 'PASS').length + '/' + results.length);
})().catch(e => { console.error('TEST CRASH', e); process.exit(1); });
