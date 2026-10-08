// Apps Script Code.gs 로컬 검증 (구글 서비스 목업)
const fs = require('fs'), vm = require('vm');
const rows = []; const mails = []; const files = []; let cacheStore = {}; let validation = null;
const sheet = {
  appendRow: r => rows.push(r), getLastRow: () => rows.length, setFrozenRows() {}, setColumnWidth() {},
  getRange: (a, b, c, d) => typeof a === 'string' ? { setDataValidation: v => { validation = v; } } : ({
    setFontWeight() { return this; }, setBackground() { return this; }, setFontColor() { return this; },
    getValues: () => rows.slice(a - 1, a - 1 + c).map(r => r.slice(0, d))
  })
};
const ctx = {
  console, JSON, Date, String, Number, Math,
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => rows.length ? sheet : null, insertSheet: () => sheet, getUrl: () => 'https://docs.google.com/x' }), flush() {},
    newDataValidation: () => ({ requireValueInList() { return this; }, build() { return 'rule'; } }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  CacheService: { getScriptCache: () => ({ get: k => cacheStore[k] || null, put: (k, v) => { cacheStore[k] = v; } }) },
  Utilities: { formatDate: () => '261007', base64Decode: s => Buffer.from(s, 'base64'), newBlob: (b, t, n) => ({ b, t, n }) },
  DriveApp: { getFoldersByName: () => ({ hasNext: () => false }), createFolder: () => ({ createFile: blob => { files.push(blob.n); return { setDescription() { return { getUrl: () => 'https://drive/' + blob.n }; } }; } }), getRootFolder() {} },
  MailApp: { sendEmail: o => mails.push(o), getRemainingDailyQuota: () => 100 },
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
  UrlFetchApp: { fetch() {} },
  ContentService: { createTextOutput: s => ({ setMimeType() { return { getContent: () => s }; } }), MimeType: { JSON: 'json' } },
  Logger: { log: console.log }
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync('apps-script/Code.gs', 'utf8'), ctx);
const post = d => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(d) } }).getContent());
const png = 'data:image/jpeg;base64,' + Buffer.from('fakejpeg').toString('base64');
const r1 = post({ form: 'quote', name: '김테스트', phone: '010-1111-2222', items: ['매트리스', '소파'], pet: ['소변·배변 오염', '털·비듬·냄새'], region: '인천', area: '남동구 구월동', estimate: 160000, agree: true, photos: [{ name: 'a.jpg', type: 'image/jpeg', data: png }], attr: { utm_source: 'naver', n_query: '강아지 소변 매트리스' }, ua: 'iPhone' });
const r2 = post({ form: 'quote', name: '김테스트', phone: '010-1111-2222', items: ['매트리스'], agree: true });
const r3 = post({ form: 'quote', name: '이', phone: '123', agree: true });
const r4 = post({ form: 'quote', name: '박테스트', phone: '010-3333-4444', agree: false });
const r5 = post({ name: '봇', phone: '010', hp: 'spam' });
const r6 = post({ form: 'partner', name: '홍길동', company: '테스트상사', phone: '01055556666', items: ['투자 문의'], agree: true });
const feed = JSON.parse(ctx.doGet({ parameter: { feed: '1' } }).getContent());
const check = (n, c, i) => console.log(c ? 'PASS' : 'FAIL', n, i ? '— ' + i : '');
check('정상 접수 + 접수번호', r1.ok && /^IC261007-/.test(r1.id), JSON.stringify(r1));
check('헤더 + 데이터 행 저장', rows.length === 3 && rows[0][0] === '접수일시', 'rows=' + rows.length);
check('유입 키워드 저장', rows[1][22] === '강아지 소변 매트리스' && rows[1][19] === 'naver');
check('사진 드라이브 저장 + 링크', files.length === 1 && /drive/.test(rows[1][16]), files.join(','));
check('알림 메일 발송', mails.length === 2 && /김테스트/.test(mails[0].subject), mails.map(m => m.subject).join(' | '));
check('같은 번호 2분 내 중복 → 기존 번호 반환', r2.ok && r2.dup && r2.id === r1.id);
check('전화번호 오류 거부', !r3.ok, r3.error);
check('동의 없으면 거부', !r4.ok, r4.error);
check('스팸봇 조용히 무시(저장 안 함)', r5.ok && rows.length === 3);
check('제휴 문의 저장', r6.ok && rows[2][3] === 'partner' && rows[2][17] === '테스트상사');
check('피드: 마스킹 + 제휴 제외', feed.ok && feed.rows.length === 1 && feed.rows[0].name === '김○○' && feed.rows[0].area === '인천 남동구', JSON.stringify(feed.rows));
check('연락처 앞자리 0 보존(텍스트 저장)', rows[1][5] === "'010-1111-2222");
