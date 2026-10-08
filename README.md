# 인프케어 (INPE CARE) 홈페이지

반려동물 가정 전문 소파 · 매트리스 청소와 파보 · 칼리시 바이러스 방역 — 주식회사 인프

- 정식 도메인: https://inpe.kr/
- 미리보기(GitHub Pages): https://zzangusz-art.github.io/inpecare/ (검색 제외 처리)

## 구조
- `*.html` — 빌드 결과물 (직접 수정하지 말고 `_build/`에서 수정 후 `python _build/build.py`)
- `assets/` — css · js · 이미지 · 15초 쇼릴 영상
- `assets/js/config.js` — 상담 DB 주소 · 연락처 · 광고 픽셀 설정
- `apps-script/` — 구글 시트 + 메일 알림 수신 코드와 설정 가이드
- `_reel/` — 쇼릴 영상 렌더러 (`npm i puppeteer-core@23`, Windows 글꼴의 NotoSansKR-VF.ttf 복사 필요)
- `_dev/` — 로컬 미리보기 서버 · E2E 점검 스크립트
- `배포가이드.md` · `project.md`
