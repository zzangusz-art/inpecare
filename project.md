# 인프케어(INPE CARE) 홈페이지 리뉴얼 — project.md

## 한 줄 요약
inpe.kr을 반려견 가정 타깃 **인프케어**로 리뉴얼. 15초 쇼릴 히어로 + 스크롤 시퀀스, 반려동물 소변청소·파보/칼리시 방역 키워드 페이지, AEO/GEO/SEO 구조화, 상담 DB가 실제로 쌓이는 신청 구조까지.

## 2026-10-07 — 1차 제작 (Claude 세션)

### 기존 사이트 진단 (DB가 안 들어오던 원인)
1. **모든 "상담 신청" 버튼이 `tel:` 링크** — 웹 신청서가 아예 없었음. PC 방문자는 버튼을 눌러도 아무 일도 안 일어남.
2. 제휴 폼은 **브라우저에서 슬랙 웹훅으로 직접 전송** → CORS에 막혀 실패하는데 `finally`로 "접수되었습니다"를 띄움(성공 위장). 웹훅 URL도 공개 JS(`inpe-v6.js`)에 노출.
3. "실시간 예약 현황"·"최근 상담 324명"은 하드코딩된 고정 데이터.
4. 브랜드명 "인프"가 MBTI INFP(인프)와 겹침 → 검색·AI 답변에서 엔티티 혼동.
5. SEO 기본(JSON-LD·llms.txt·sitemap)은 있었으나 반려동물 키워드 페이지 없음, AggregateRating 중복·수치 불일치(284 vs 500+).

### 결정 사항
- 브랜드: **인프케어 (INPE CARE)**, 운영사 주식회사 인프. 모든 title·JSON-LD·llms.txt에 병기, FAQ·푸터에 "MBTI INFP와 무관" 명시.
- 타깃: 반려견(강아지) 가정의 소파·매트리스 의뢰. 키워드 페이지 2개 분리: `pet-urine.html`(소변청소), `pet-virus.html`(파보·칼리시).
- DB: **Google Apps Script 웹앱 → 구글 시트 + 메일(+슬랙은 서버에서)**. 성공은 서버 응답(접수번호) 확인 후에만 표시. 실패 시 문자/전화 폴백 + 기기에 보관 후 다음 방문 때 자동 재전송.
- 광고 유입(utm, 네이버 n_query/n_keyword, gclid, referrer, 첫 랜딩)을 리드와 같이 저장.
- 실시간 접수 현황·접수 토스트는 **시트의 실제 데이터만**(이름·주소 마스킹). 엔드포인트 없으면 운영 사이트에선 섹션 숨김, 로컬 미리보기에서만 예시 데이터.
- JSON-LD에서 AggregateRating 제거(자사 후기 기반 별점 마크업은 구글 정책상 리스크). 화면 문구로는 4.97 유지.
- 기존 템플릿 파트너 로고(ADVANCE, SHANGRIA, PlutoLabs 등)는 실제 파트너가 아닌 템플릿 더미로 판단해 **제외**.
- 기존 후기 14개는 이름 가운데 글자만 가려 유지(김○연). 얼굴 사진(AI 생성)은 쓰지 않음.
- 폰트 Noto Sans KR 단일. 이모지·그라데이션 남발 없이 실사진 중심 에디토리얼 톤.

### 산출물
- 페이지 6: index / pet-urine / pet-virus / price / about / privacy (+ 구 URL 6개 리다이렉트)
- 영상: `assets/video/` 1080p(5.0MB) · 720p(2.6MB) · 모바일 720×1520(2.3MB), 15초 30fps, 16:10·19.5:9 화면 크롭 세이프 영역 적용
- UI 기법: 스크롤 시퀀스(히어로 챕터 + 6단계 공정 캔버스), 아코디언, 모달 4종, 드로어 2종, 토스트, 스켈레톤, 탭, 비포/애프터 슬라이더, 플립 카드, 라이트박스, 계산기, 멀티스텝 폼, 카운터, 마퀴
- 검증: 헤드리스 크롬 E2E 40/40, Apps Script 목업 12/12, 링크·ID·에셋 검사 통과

### 구조
- 수정은 `_build/`(partials, pages, build.py 안의 FAQ·후기·사진 데이터) → `python _build/build.py`
- 화면 FAQ와 FAQPage JSON-LD는 build.py의 같은 데이터에서 생성(불일치 방지)
- 설정은 `assets/js/config.js` 한 곳

## 2026-10-08 — 범백 제외 + GitHub Pages 배포
- GitHub 저장소: https://github.com/zzangusz-art/inpecare (public, main 브랜치 루트 → GitHub Pages)
- 미리보기 주소: https://zzangusz-art.github.io/inpecare/ — github.io에서 열릴 때만 noindex 자동 부착(inpe.kr 정식 이전 시 중복 색인 방지)
- 저장소 제외: `_research/`(기존 사이트 수집본, 노출된 슬랙 웹훅 포함), 렌더 node_modules · 폰트 · 스크린샷
- 배포 점검: `node _dev/remote-check.js <주소>` 20/20 통과
- 요청에 따라 범백(고양이 범백혈구감소증) 관련 문구 전부 제거: 제목 · 설명 · FAQ · 구조화 데이터 · 계산기 · 신청서 선택지 · 범백 후기 1건 · 방역 페이지 표 · 영상 6장면("파보 · 칼리시")

## 미완료 · 확인 필요 (우선순위 순)
1. **Apps Script 배포 후 `config.js`에 URL 입력** — 안 하면 신청이 저장되지 않음(문자 폴백만 동작)
2. **기존 슬랙 웹훅 폐기** — 공개 JS에 노출된 상태
3. 수치 근거 확인: 4.97점 / 500개+ 리뷰 / 2,400건+ / 99% 방역 성공률 / 5년+ / 2020 설립 / 24시간 출동 / 재발 시 무료 재방역 / KC 인증 — 기존 사이트 문구 그대로 옮김. 표시광고법상 근거 자료 보관 필요. (가맹 제안서의 "7년 현장"과 사이트의 "5년+"도 불일치)
4. 후기 14건 실제 후기 근거 보관 (기존 사이트에서 이관)
5. 통신판매업 신고번호 — 온라인 결제(카페24 상품) 운영 시 푸터 표기 의무. 번호 받아서 푸터에 추가
6. "인프케어" 동명 업체·상표 확인(KIPRIS·네이버) — 이번 세션에서 확인 못함
7. 히어로 3챕터·방역 페이지 일부 이미지는 기존 사이트의 AI 생성 스톡(readdy) — 실제 방역 현장 사진 확보 시 교체 권장
8. 네이버 전환 스크립트(wcs.cnv) 방식은 네이버 광고 관리 화면의 최신 가이드와 대조 필요
9. 카페24 FTP 영상 업로드 한도 확인

## 참고 출처 (바이러스 생존·소독 관련 문구 근거)
- 매사추세츠주 Parvovirus cleaning and disinfection: https://www.mass.gov/doc/parvovirus-cleaning-and-disinfection/download
- Mar Vista Animal Medical Center: https://www.marvistavet.com/the-virus-in-the-environment-disinfection.pml
