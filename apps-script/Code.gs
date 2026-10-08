/**
 * 인프케어 상담 신청 수신 — Google Apps Script 웹앱
 * 홈페이지 신청서 → 구글 시트 저장 → 메일 알림 (+ 선택: 슬랙)
 * 설정 방법은 같은 폴더의 「설정가이드.md」 참고
 */
const CONFIG = {
  SHEET_NAME: '상담신청',
  NOTIFY_TO: 'apso11@naver.com',          // 알림 받을 메일. 여러 명이면 쉼표로: 'a@x.com,b@y.com'
  PHOTO_FOLDER_NAME: '인프케어_상담사진',   // 첨부 사진이 저장될 구글 드라이브 폴더
  FEED_SIZE: 10                            // 홈페이지 '실시간 접수 현황'에 보여줄 개수
};

const HEAD = ['접수일시', '접수번호', '상태', '폼', '이름', '연락처', '지역', '시구동', '품목', '반려동물 상황', '반려동물', '상세',
  '희망일', '희망시간', '예상금액', '메모', '사진', '회사명', '이메일',
  'utm_source', 'utm_medium', 'utm_campaign', '검색어(utm_term/n_query)', 'gclid', 'n_keyword', '유입 referrer', '첫 랜딩', '신청 페이지', '기기', '작성시간(초)'];

/* ---------------- 신청 접수 ---------------- */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.hp) return out_({ ok: true, id: '-' });                         // 스팸봇(숨김 필드 입력)
    if (!d.name || !d.phone) return out_({ ok: false, error: '필수값 누락' });
    const digits = String(d.phone).replace(/\D/g, '');
    if (!/^0\d{8,11}$/.test(digits)) return out_({ ok: false, error: '전화번호 형식 오류' });
    if (!d.agree) return out_({ ok: false, error: '개인정보 동의 필요' });

    const cache = CacheService.getScriptCache();                       // 같은 번호 2분 내 중복 제출 방지
    const prev = cache.get('p_' + digits);
    if (prev) return out_({ ok: true, id: prev, dup: true });

    lock.waitLock(20000);
    const sh = sheet_();
    const id = 'IC' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyMMdd') + '-' + String(sh.getLastRow()).padStart(4, '0');
    const photos = savePhotos_(d.photos || [], id, d.name);
    const a = d.attr || {};
    sh.appendRow([
      new Date(), id, '접수', d.form || 'quote', d.name, "'" + d.phone, d.region || '', d.area || '',
      (d.items || []).join(', '), (d.pet || []).join(', '), d.petType || '', d.detail || '',
      d.date || '', d.time || '', d.estimate || '', d.memo || '', photos.join('\n'), d.company || '', d.email || '',
      a.utm_source || '', a.utm_medium || '', a.utm_campaign || '', a.utm_term || a.n_query || '', a.gclid || '', a.n_keyword || '',
      a.referrer || '', a.landing || '', d.page || '', /Mobi|Android|iPhone/i.test(d.ua || '') ? '모바일' : 'PC', Math.round((d.dwell || 0) / 1000)
    ]);
    SpreadsheetApp.flush();
    cache.put('p_' + digits, id, 120);
    lock.releaseLock();

    try { notify_(id, d, photos); } catch (err) { console.error('알림 실패(접수는 저장됨)', err); }
    return out_({ ok: true, id: id });
  } catch (err) {
    console.error(err);
    return out_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e) { }
  }
}

/* ---------------- 실시간 접수 현황 (마스킹) ---------------- */
function doGet(e) {
  if (e && e.parameter && e.parameter.feed) {
    const sh = sheet_(), n = sh.getLastRow();
    if (n < 2) return out_({ ok: true, rows: [] });
    const start = Math.max(2, n - 60);
    const vals = sh.getRange(start, 1, n - start + 1, HEAD.length).getValues().reverse();
    const now = Date.now();
    const rows = vals
      .filter(r => r[3] !== 'partner' && String(r[2]).indexOf('숨김') < 0)
      .slice(0, CONFIG.FEED_SIZE)
      .map(r => ({
        id: r[1],
        t: ago_(now - new Date(r[0]).getTime()),
        name: String(r[4] || '').charAt(0) + '○○',
        area: [r[6], String(r[7] || '').split(' ')[0]].filter(String).join(' '),
        svc: [String(r[8] || ''), String(r[9] || '').split(',')[0]].filter(String).join(' · '),
        st: r[2] || '접수'
      }));
    return out_({ ok: true, rows: rows });
  }
  return out_({ ok: true, service: 'inpecare-leads' });
}

/* ---------------- 내부 함수 ---------------- */
function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.SHEET_NAME);
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold').setBackground('#FF5A00').setFontColor('#ffffff');
    const rule = SpreadsheetApp.newDataValidation().requireValueInList(['접수', '상담 중', '방문 예정', '진행 중', '완료', '취소', '숨김'], true).build();
    sh.getRange('C2:C').setDataValidation(rule);
    sh.setColumnWidth(1, 150); sh.setColumnWidth(9, 220); sh.setColumnWidth(12, 320);
  }
  return sh;
}

function savePhotos_(photos, id, name) {
  if (!photos.length) return [];
  const it = DriveApp.getFoldersByName(CONFIG.PHOTO_FOLDER_NAME);
  const folder = it.hasNext() ? it.next() : DriveApp.createFolder(CONFIG.PHOTO_FOLDER_NAME);
  return photos.slice(0, 3).map((p, i) => {
    const b64 = String(p.data || '').split(',').pop();
    const blob = Utilities.newBlob(Utilities.base64Decode(b64), p.type || 'image/jpeg', id + '_' + (i + 1) + '.jpg');
    return folder.createFile(blob).setDescription(id + ' ' + (name || '')).getUrl();
  });
}

function notify_(id, d, photos) {
  const label = d.form === 'partner' ? '제휴 문의' : '상담 신청';
  const rows = [
    ['접수번호', id], ['이름', d.name], ['연락처', d.phone], ['회사명', d.company], ['품목', (d.items || []).join(', ')],
    ['반려동물 상황', (d.pet || []).join(', ')], ['반려동물', d.petType], ['지역', [d.region, d.area].filter(String).join(' ')],
    ['희망 일정', [d.date, d.time].filter(String).join(' ')], ['예상 금액', d.estimate ? Number(d.estimate).toLocaleString('ko-KR') + '원~' : ''],
    ['상세', d.detail], ['메모', d.memo], ['사진', photos.map((u, i) => '<a href="' + u + '">사진 ' + (i + 1) + '</a>').join(' ')],
    ['유입', [(d.attr || {}).utm_source, (d.attr || {}).utm_term || (d.attr || {}).n_query, (d.attr || {}).referrer].filter(String).join(' / ')]
  ].filter(r => r[1]);
  const html = '<h2 style="font-family:sans-serif">인프케어 새 ' + label + '</h2><table style="font-family:sans-serif;border-collapse:collapse">' +
    rows.map(r => '<tr><td style="padding:6px 12px;background:#f5f1ec;font-weight:bold">' + r[0] + '</td><td style="padding:6px 12px">' + r[1] + '</td></tr>').join('') +
    '</table><p style="font-family:sans-serif"><a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '">구글 시트에서 보기</a></p>';
  MailApp.sendEmail({ to: CONFIG.NOTIFY_TO, subject: '[인프케어] 새 ' + label + ' · ' + d.name + ' · ' + ((d.items || []).join(', ') || '') + ' · ' + (d.region || ''), htmlBody: html, name: '인프케어 홈페이지' });

  const hook = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK');   // 선택: 슬랙 알림 (URL은 서버에만 보관)
  if (hook) {
    UrlFetchApp.fetch(hook, {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      payload: JSON.stringify({ text: '📩 인프케어 새 ' + label + ' ' + id + '\n' + rows.filter(r => r[0] !== '사진').map(r => '*' + r[0] + '*: ' + r[1]).join('\n') })
    });
  }
}

function ago_(ms) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return '방금';
  if (m < 60) return m + '분 전';
  const h = Math.floor(m / 60);
  if (h < 24) return h + '시간 전';
  return Math.floor(h / 24) + '일 전';
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* ---------------- 설치 · 점검용 (편집기에서 직접 실행) ---------------- */
function setup() {
  sheet_();
  DriveApp.getRootFolder();   // 드라이브 권한 요청용
  MailApp.getRemainingDailyQuota();
  Logger.log('시트 준비 완료. 오늘 남은 메일 발송량: ' + MailApp.getRemainingDailyQuota());
}

function testPost() {
  const res = doPost({ postData: { contents: JSON.stringify({
    form: 'quote', name: '테스트', phone: '010-0000-0000', items: ['매트리스'], pet: ['소변·배변 오염'], petType: '강아지',
    region: '인천', area: '남동구 구월동', estimate: 80000, agree: true, attr: { utm_source: 'test' }, page: 'apps-script-test', ua: 'test'
  }) } });
  Logger.log(res.getContent());
}
