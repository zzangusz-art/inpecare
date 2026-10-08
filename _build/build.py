# -*- coding: utf-8 -*-
"""인프케어 정적 사이트 빌드
- _build/partials + _build/pages → 루트의 *.html
- FAQ/후기/사진 데이터는 여기 한 곳에서 관리 → 화면 HTML과 JSON-LD가 같은 원본에서 생성됨
- 실행: python _build/build.py
"""
import json, re, html, os, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, '_build')
VER = datetime.datetime.now().strftime('%Y%m%d%H%M')
TODAY = datetime.date.today().isoformat()
SITE = 'https://inpe.kr/'

def rd(p):
    with open(os.path.join(B, p), encoding='utf-8') as f:
        return f.read()

def strip(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', s))).strip()

# ---------------------------------------------------------------- FAQ
FAQ = {
'home': [
 ('인프케어는 어떤 서비스인가요?', '<p>인프케어(INPE CARE)는 주식회사 인프가 운영하는 <strong>반려동물 가정 전문 소파 · 매트리스 청소와 바이러스 방역 서비스</strong>입니다. 강아지 · 고양이 소변 얼룩과 냄새 제거, 털 · 비듬 · 진드기 관리, 파보 · 칼리시 감염 이후 생활 공간 방역을 한 번의 방문으로 처리하며, 서울 · 인천 · 경기는 출장비가 없습니다.</p>'),
 ('강아지 소변 냄새, 청소하면 정말 없어지나요?', '<p>말라붙은 소변은 물에 녹지 않는 요산 결정으로 섬유 안쪽에 남아 있어 표면만 닦으면 냄새가 다시 납니다. 인프케어는 습식 세정으로 오염을 분해 · 추출하고 고온 스팀과 오존 · 음이온 탈취로 마무리합니다.</p><p>오염이 매트리스 폼 깊숙이 스며든 경우 한 번에 완전히 사라지지 않을 수 있어, 사진으로 상태를 먼저 확인하고 예상 결과를 그대로 안내드립니다.</p>'),
 ('소파 · 매트리스 청소 비용은 얼마인가요?', '<p>매트리스는 건식 2만~9만원, 습건식 + 스팀 5만~13만원입니다. 소파는 건식 2만~7만원, 습건식 + 스팀 4만~14만원이며 카우치형은 1만원이 추가됩니다. 반려동물 소변 오염에는 습건식 + 스팀 가격이 적용됩니다. 사이즈별 금액은 <a href="price.html">가격표</a>에서 확인하실 수 있습니다.</p>'),
 ('파보 · 칼리시 바이러스 방역은 언제 받아야 하나요?', '<p>완치 판정 후 아이가 생활 공간으로 돌아오기 전, 여러 아이를 키우는 집에서 한 아이가 확진되었을 때, 감염 이력이 있는 집에 새 아이를 입양하기 전에 권합니다. 파보바이러스는 실내에서 수개월 이상 남을 수 있는 것으로 알려져 있습니다. 진단과 치료는 동물병원 수의사와 상담하세요.</p>'),
 ('청소 후 반려동물이 바로 사용해도 되나요?', '<p>건식은 시공 직후 바로 사용할 수 있습니다. 습건식 + 스팀은 3~5시간 건조 후 사용을 권장합니다. 방역은 약제가 마르고 환기가 끝난 뒤 들어오도록 시공 당일 안내드립니다.</p>'),
 ('사용하는 약제는 안전한가요?', '<p>환경부 승인 항바이러스 성능 인증 제품과 KC 인증 친환경 약제를 사용합니다. 반려동물과 영유아가 있는 가정도 이용하실 수 있으며, 인증서는 이 페이지의 ‘인증서 보기’에서 확인하실 수 있습니다.</p>'),
 ('출장비가 따로 있나요?', '<p>서울 · 인천 · 경기 수도권은 출장비가 무료입니다. 도서 · 산간 지역은 상담 시 별도로 안내드립니다.</p>'),
 ('방역 후 인증서를 받을 수 있나요?', '<p>네. 방역 완료 후 공기질 · 바이러스 체크리스트와 방역 완료 인증서를 전달해 드립니다. 같은 문제가 재발하면 무료로 재방역합니다(조건은 상담 시 안내).</p>'),
 ('예약은 어떻게 하나요?', '<p>이 페이지의 무료 견적 신청서를 남기시거나 0507-1314-5792로 전화 · 문자 주세요. 오염 부위 사진을 함께 보내주시면 방문 전에 금액을 확정해 드립니다. 상담 시간은 평일 09:00–18:00입니다.</p>'),
 ('인프케어는 MBTI ‘인프(INFP)’와 관련이 있나요?', '<p>아니요. 인프케어(INPE CARE)는 주식회사 인프(INPE)의 반려동물 홈케어 · 방역 서비스 브랜드로, 성격유형 검사 MBTI의 INFP(인프)와는 관련이 없습니다.</p>'),
],
'urine': [
 ('오래된 소변 자국도 지워지나요?', '<p>대부분 얼룩과 냄새가 크게 줄어듭니다. 다만 오래 방치되어 섬유 자체가 변색된 경우 색이 완전히 돌아오지 않을 수 있습니다. 사진을 보내주시면 예상 결과를 미리 안내드립니다.</p>'),
 ('매트리스 속까지 스며들었는데 가능한가요?', '<p>습식 세정과 고온 스팀으로 깊은 곳까지 처리하고 하부를 함께 확인합니다. 폼 내부 깊숙이 고인 경우 1회 시공으로 냄새가 완전히 사라지지 않을 수 있어, 상태에 따라 추가 공정 여부를 시공 전에 안내드립니다.</p>'),
 ('고양이 소변도 같은 방법으로 청소하나요?', '<p>같은 공정이 적용됩니다. 고양이 소변은 농도가 진해 냄새가 강한 편이라 습건식 + 스팀을 기본으로 진행합니다.</p>'),
 ('청소 후 같은 자리에 또 실수하지 않을까요?', '<p>반려견은 남아 있는 냄새를 따라 같은 자리에 실수하는 경향이 있습니다. 오염을 빼낸 뒤 탈취하면 재실수 가능성을 줄이는 데 도움이 됩니다. 배변 습관이나 건강 문제는 수의사 · 훈련사와 상담하세요.</p>'),
 ('반려동물 소변 청소 비용은 얼마인가요?', '<p>습건식 + 스팀 기준으로 매트리스는 유아용 5만원, 싱글 6만원, 퀸 8만원, 킹 9만원이고, 소파는 1인용 4만원, 3인용 8만원, 6인용 13만원입니다. 수도권 출장비는 무료입니다.</p>'),
],
'virus': [
 ('방역하면 바이러스가 완전히 없어지나요?', '<p>항바이러스 성능 인증 제품을 충분한 접촉 시간을 두고 도포해 생활 공간의 바이러스 위험을 크게 낮춥니다. 다만 어떤 방역도 100%를 장담할 수는 없어, 수의사 안내에 따른 접종 · 관리와 함께 진행하시길 권합니다. 같은 문제가 재발하면 무료로 재방역합니다.</p>'),
 ('방역 약제가 반려동물에게 안전한가요?', '<p>환경부 승인 항바이러스 성능 인증 제품과 KC 인증 친환경 약제를 사용합니다. 약제가 마르고 환기가 끝난 뒤 반려동물이 들어오도록 안내드립니다.</p>'),
 ('방역 후 언제 집에 들어가도 되나요?', '<p>약제가 마르고 환기가 끝나면 들어오실 수 있습니다. 공간 크기와 환기 조건에 따라 달라 시공 당일 정확한 시간을 안내드립니다.</p>'),
 ('아이가 아직 치료 중인데 방역할 수 있나요?', '<p>입원 중이거나 격리 중인 기간에 방역하면 효율적입니다. 완치 판정 일정에 맞춰 예약을 조율해 드립니다.</p>'),
 ('반려동물 방역 비용은 얼마인가요?', '<p>반려동물 방역은 10평형 기준 149,000원부터이며 평형별로 달라집니다. 월 정기 방역은 99,000원부터입니다. 패브릭 청소와 함께 신청하시면 방문 1회로 처리합니다.</p>'),
],
'price': [
 ('매트리스 청소 비용은 얼마인가요?', '<p>사이즈와 케어 방식에 따라 다릅니다. 건식은 유아용 2만원, 싱글 · 슈퍼싱글 3만원, 퀸 4만원, 킹 5만원, 라지킹 6만원, 패밀리(싱글+퀸) 9만원입니다. 습건식 + 스팀은 유아용 5만원, 싱글 6만원, 슈퍼싱글 7만원, 퀸 8만원, 킹 9만원, 라지킹 10만원, 패밀리 13만원입니다.</p>'),
 ('소파 청소 비용은 얼마인가요?', '<p>인용수와 케어 방식에 따라 다릅니다. 건식은 1인용 2만원, 2인용 3만원, 3인용 4만원, 4인용 5만원, 5인용 6만원, 6인용 7만원입니다. 습건식 + 스팀은 1인용 4만원, 2인용 7만원, 3인용 8만원, 4인용 9만원, 5인용 11만원, 6인용 13만원이며 카우치형은 1만원이 추가됩니다. 7인용 이상은 전화로 안내드립니다.</p>'),
 ('건식과 습건식 + 스팀은 무엇이 다른가요?', '<p>건식은 UV 살균과 고성능 흡입으로 진드기 · 먼지 · 각질을 제거하는 방식으로 시공 직후 바로 사용할 수 있습니다. 습건식 + 스팀은 건식 공정에 물세척과 고온 스팀 살균을 더한 방식으로, 얼룩 · 냄새 · 반려동물 오염 제거에 효과적이며 3~5시간 건조 후 사용을 권장합니다.</p>'),
 ('반려동물 배변 오염도 처리할 수 있나요?', '<p>가능합니다. 반려동물 배변 · 구토 · 소변 오염은 습건식 + 스팀 방식으로 처리하며 고온 스팀 살균과 전문 탈취 공정을 함께 진행합니다. 파보 · 칼리시 등 감염병 이후 환경 방역도 함께 신청하실 수 있습니다.</p>'),
 ('서비스 가능 지역은 어디인가요?', '<p>인천 남동구 본사를 기점으로 인천 전 지역, 서울 전 지역, 경기 부천 · 김포 · 시흥 · 광명 · 안산 · 수원 · 성남 · 용인 · 고양 · 의정부 등 수도권 전역에 방문합니다.</p>'),
 ('출장비가 따로 있나요?', '<p>수도권(서울 · 인천 · 경기)은 출장비가 무료입니다. 도서 · 산간 지역은 별도 문의가 필요합니다.</p>'),
 ('어떤 사이즈인지 헷갈리면 어떻게 하나요?', '<p>사진과 오염 상태를 보내주시면 방문 전에 정확한 금액을 안내해 드립니다. 전화 0507-1314-5792 또는 온라인 견적 신청서를 이용해 주세요.</p>'),
],
}

def faq_html(key, open_first=True):
    out = []
    for i, (q, a) in enumerate(FAQ[key]):
        exp = 'true' if (open_first and i == 0) else 'false'
        out.append(f'<div class="acc__item"><button class="acc__btn" type="button" aria-expanded="{exp}"><span><span class="q">Q</span>{html.escape(q)}</span><span class="acc__icon" aria-hidden="true"></span></button><div class="acc__panel"><div><div class="acc__body">{a}</div></div></div></div>')
    return '\n'.join(out)

def faq_ld(key, url):
    return {'@type': 'FAQPage', '@id': url + '#faq', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': strip(a)}} for q, a in FAQ[key]]}

# ---------------------------------------------------------------- 후기 (기존 inpe.kr 후기, 이름 가운데 글자 가림)
REVIEWS = [
 ('pet', '윤○영', '주부', '소파 · 반려동물 냄새', '소파 습식 클렌징 후 반려동물 털 냄새가 완전히 제거됐어요. 아이들도 소파에서 마음 편히 뒹굴 수 있게 됐고, 색상도 처음처럼 선명하게 살아났습니다.'),
 ('pet', '김○연', '강아지 견주', '파보 회복 후 방역', '강아지가 파보바이러스에 감염됐다가 회복 후 집 전체 방역을 맡겼어요. 재감염 걱정 없이 지낼 수 있어서 너무 다행입니다. 전문적이고 꼼꼼한 방역이었어요.'),
 ('pet', '이○은', '고양이 집사', '칼리시 방역', '고양이 칼리시바이러스로 고생하다가 완치 후 집 전체 바이러스 방역을 받았습니다. 전문 약품으로 구석구석 처리해줘서 재발 없이 건강하게 지내고 있어요.'),
 ('pet', '정○규', '강아지 견주', '홍역 회복 후 방역', '강아지 홍역 완치 후 집 방역 신청했는데 가구 사이사이, 공조 시스템까지 꼼꼼히 처리해줬어요. 재발 없이 2마리 모두 건강하게 지내고 있습니다!'),
 ('pet', '박○준', '펫샵 운영', '펫샵 정기 방역', '펫샵 운영 중인데 파보·홍역 예방 방역을 정기적으로 받고 있어요. 강아지들이 건강하게 지낼 수 있고 고객 신뢰도 높아졌습니다. 필수 서비스라고 생각해요.'),
 ('pet', '최○진', '동물병원 원장', '입원실 정기 방역', '동물병원에서 입원실 정기 방역을 맡기고 있는데 정말 믿음직합니다. 칼리시·파보 등 각종 바이러스 제거에 특화된 약품을 써준다고 해서 더욱 안심돼요.'),
 ('pet', '한○라', '동물카페 운영', '펫카페 정기 방역', '반려동물 카페 운영 중이라 위생이 생명인데, 정기 방역 덕분에 손님들이 “여기는 다르다”고 느끼신다고 해요. 파보·칼리시 예방 방역 꼭 받으세요!'),
 ('fabric', '이○란', '3세 아이 엄마', '매트리스 UV 살균', '매트리스에서 먼지 냄새가 심했는데 UV 살균 후 완전히 사라졌어요. 진드기도 99.9% 제거된다고 하니 아이 알레르기가 줄었는지 확실히 느껴집니다.'),
 ('fabric', '박○우', '자영업', '소파 클렌징', '오래된 소파를 버리려다가 패브릭 클렌징 받았는데 새 소파처럼 됐어요! 얼룩도 다 제거됐고 냄새도 없어졌습니다. 비용 대비 너무 만족스럽습니다.'),
 ('fabric', '강○연', '요양원 시설장', '요양원 매트리스', '요양원 매트리스 전체 UV 살균을 맡겼는데 어르신들 피부 트러블이 눈에 띄게 줄었어요. 약품 없이 UV로만 처리한다고 해서 더 안심됩니다. 정기 계약 중입니다.'),
 ('fabric', '최○수', '카페 운영', '카펫 스팀', '카펫 스팀 클렌징을 받았는데 5년 된 카펫이 처음처럼 깨끗해졌어요. 작업 후 바로 사용 가능한 것도 좋고 냄새도 전혀 없습니다. 강력 추천해요!'),
 ('fabric', '한○현', '직장인', '커튼 건식 세척', '커튼 건식 세척 서비스를 받았는데 집에서 직접 세탁하면 형태가 망가질 것 같아 걱정했는데 깨끗하고 형태도 그대로였어요. 앞으로 정기 이용할 예정입니다.'),
 ('fabric', '정○아', '직장인', '침대 탈취 · 살균', '침대 탈취·살균 케어 후 숙면 질이 확실히 달라졌어요. 기존에 먼지 알레르기로 새벽에 자주 깼는데 지금은 아침까지 푹 자게 됐습니다. 정말 감사해요.'),
]
def reviews_html(only=None):
    out = []
    for i, (cat, name, role, tag, text) in enumerate(REVIEWS):
        if only and tag.find(only) < 0 and only != cat:
            continue
        av = 'avatar avatar--o' if i % 3 == 0 else 'avatar'
        out.append(f'<article class="review" data-cat="{cat}"><span class="review__tag">{tag}</span><p>“{html.escape(text)}”</p><footer><span class="{av}" aria-hidden="true">{name[0]}</span><span><b>{name}</b><small>{role}</small></span></footer></article>')
    return '\n'.join(out)

STAR = '<svg viewBox="0 0 24 24"><use href="#i-star"/></svg>'

# ---------------------------------------------------------------- 현장 사진
PCARDS = [
 ('sofa-02', 'dust-pad-01', '화이트 패브릭 소파', '이 소파에서 나온 필터'),
 ('mattress-01', 'dust-pad-02', '그레이 매트리스', '이 매트리스에서 나온 필터'),
 ('sofa-03', 'dust-pad-03', 'ㄱ자 패브릭 소파', '이 소파에서 나온 필터'),
 ('mattress-03', 'dust-pad-06', '패턴 매트리스', '이 매트리스에서 나온 필터'),
]
def pcards_html():
    out = []
    for f, b, cf, cb in PCARDS:
        out.append(f'<div class="pcard rv" tabindex="0" role="button" aria-label="{cf} 사진, 눌러서 흡입 필터 보기"><div class="pcard__in"><div class="pcard__f"><img src="assets/img/real/thumb/{f}.webp" alt="인프케어 시공 {cf}" loading="lazy"><span class="pcard__label">{cf}<em>FRONT</em></span></div><div class="pcard__b"><img src="assets/img/real/thumb/{b}.webp" alt="{cb}: 흡입된 먼지와 털" loading="lazy"><span class="pcard__label">{cb}<em>FILTER</em></span></div></div></div>')
    return '\n'.join(out)

GALLERY = [
 ('sofa-01', '거실 모듈 소파 시공'), ('dust-bin-01', '흡입기 집진통에 모인 오염물'), ('mattress-02', '화이트 매트리스 시공'),
 ('dust-pad-04', '소파 흡입 필터'), ('sofa-under-01', '소파 하부 · 틈새 청소'), ('dust-hand', '필터에 걸러진 먼지와 털'),
 ('sofa-04', '서재 소파 시공'), ('dust-pad-05', '매트리스 흡입 필터'), ('tech-mattress', '매트리스 스팀 클렌징'),
 ('dust-bin-02', '집진통 오염물'), ('fabric-macro', '패브릭 표면 클로즈업'), ('team-back', '인프케어 현장팀'),
]
def gallery_html():
    return '\n'.join(f'<a href="assets/img/real/{n}.jpg" data-lb="field" data-cap="{c}"><img class="sk-img" src="assets/img/real/thumb/{n}.webp" alt="{c}" loading="lazy" width="300" height="300"></a>' for n, c in GALLERY)

CAREERS = [
 ('방역 전문가', '시공팀 · 정규직', '전문 방역 시공 및 고객 서비스 담당. KC 인증 약품 사용법 및 안전 시공 교육 제공. 방역 경력 · 자격증 우대.'),
 ('시공 관리자', '시공팀 · 정규직', '패브릭케어 및 방역 시공 팀 관리. 품질 기준 수립 및 현장 교육 담당. 관리 경험 · 현장 경력 우대.'),
 ('고객 서비스 매니저', '고객지원팀 · 정규직', '고객 만족도 관리 및 VOC 처리. 서비스 품질 개선 및 고객 피드백 분석.'),
 ('마케팅 매니저', '마케팅팀 · 계약직', '브랜드 마케팅 및 콘텐츠 기획. SNS 채널 운영 및 퍼포먼스 마케팅.'),
 ('인테리어 컨설턴트', '영업팀 · 정규직', '고객 상담 및 인테리어 견적 컨설팅. AI 시스템을 활용한 견적 설명 및 제안.'),
 ('AI 개발자', '기술팀 · 정규직', 'AI 기반 인테리어 견적 시스템 개발 및 고도화. Python · PyTorch, 3년 이상.'),
]
def careers_html():
    return '\n'.join(f'<div class="acc__item"><button class="acc__btn" type="button" aria-expanded="false"><span>{t} <small class="muted" style="font-weight:500;font-size:14px;margin-left:8px">{d}</small></span><span class="acc__icon" aria-hidden="true"></span></button><div class="acc__panel"><div><div class="acc__body"><p>{x}</p><p><a class="link-arrow" href="mailto:apso11@naver.com?subject=%5B%EC%B1%84%EC%9A%A9%EC%A7%80%EC%9B%90%5D%20{t}">이 포지션 지원하기</a></p></div></div></div></div>' for t, d, x in CAREERS)

# ---------------------------------------------------------------- JSON-LD 공통
ORG = {
 '@type': 'Organization', '@id': SITE + '#org', 'name': '주식회사 인프', 'legalName': '주식회사 인프',
 'alternateName': ['인프케어', 'INPE CARE', 'INPE', '인프'], 'url': SITE, 'logo': SITE + 'assets/img/logo-512.png',
 'email': 'info@inpe.kr', 'telephone': '+82-507-1314-5792', 'taxID': '868-06-01765', 'foundingDate': '2020',
 'founder': {'@type': 'Person', 'name': '이은수'}, 'sameAs': ['https://blog.naver.com/apso11'],
 'contactPoint': [{'@type': 'ContactPoint', 'contactType': 'customer service', 'telephone': '+82-507-1314-5792', 'email': 'info@inpe.kr', 'areaServed': 'KR', 'availableLanguage': ['Korean']}],
}
OFFERS = [
 ('매트리스 청소 (건식)', 20000, 60000), ('매트리스 청소 (습건식+스팀)', 50000, 130000),
 ('소파 청소 (건식)', 20000, 70000), ('소파 청소 (습건식+스팀)', 40000, 140000),
 ('반려동물 바이러스 방역 (10평형 기준~)', 149000, None), ('월 정기 방역', 99000, None),
]
BIZ = {
 '@type': 'LocalBusiness', '@id': SITE + '#business', 'name': '인프케어 (INPE CARE)', 'alternateName': ['인프케어', 'INPE CARE', '인프 홈케어'],
 'description': '인프케어는 주식회사 인프가 운영하는 반려동물 가정 전문 소파·매트리스 청소와 바이러스 방역 서비스입니다. 강아지·고양이 소변 얼룩과 냄새 제거, 털·진드기 관리, 파보·칼리시 감염 후 생활 공간 방역을 제공합니다.',
 'url': SITE, 'image': [SITE + 'assets/img/og-inpecare.jpg', SITE + 'assets/img/real/team-back.jpg'], 'logo': SITE + 'assets/img/logo-512.png',
 'telephone': '+82-507-1314-5792', 'email': 'info@inpe.kr', 'priceRange': '₩20,000~₩149,000',
 'parentOrganization': {'@id': SITE + '#org'},
 'address': {'@type': 'PostalAddress', 'streetAddress': '인주대로 770-1, 3층 하나빌딩', 'addressLocality': '남동구', 'addressRegion': '인천광역시', 'postalCode': '21565', 'addressCountry': 'KR'},
 'geo': {'@type': 'GeoCoordinates', 'latitude': 37.4449, 'longitude': 126.7018},
 'openingHoursSpecification': [{'@type': 'OpeningHoursSpecification', 'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], 'opens': '09:00', 'closes': '18:00'}],
 'areaServed': [{'@type': 'AdministrativeArea', 'name': n} for n in ['서울특별시', '인천광역시', '경기도']],
 'knowsAbout': ['반려동물 소변 청소', '강아지 소변 냄새 제거', '고양이 소변 매트리스 청소', '파보바이러스 방역', '칼리시바이러스 방역', '반려견 소파 청소', '매트리스 청소', '소파 청소', 'UV 살균', '패브릭 홈케어', '소독 방역'],
 'hasOfferCatalog': {'@type': 'OfferCatalog', 'name': '인프케어 서비스 가격', 'itemListElement': [
   {'@type': 'Offer', 'priceCurrency': 'KRW', 'itemOffered': {'@type': 'Service', 'name': n},
    **({'priceSpecification': {'@type': 'PriceSpecification', 'minPrice': lo, 'maxPrice': hi, 'priceCurrency': 'KRW'}} if hi else {'price': lo})} for n, lo, hi in OFFERS]},
}
WEBSITE = {'@type': 'WebSite', '@id': SITE + '#website', 'url': SITE, 'name': '인프케어 INPE CARE', 'alternateName': '인프케어', 'inLanguage': 'ko-KR', 'publisher': {'@id': SITE + '#org'}}

def crumbs(path, name):
    items = [{'@type': 'ListItem', 'position': 1, 'name': '홈', 'item': SITE}]
    if path:
        items.append({'@type': 'ListItem', 'position': 2, 'name': name, 'item': SITE + path})
    return {'@type': 'BreadcrumbList', '@id': SITE + path + '#breadcrumb', 'itemListElement': items}

def webpage(path, title, desc, extra=None):
    d = {'@type': 'WebPage', '@id': SITE + path + '#webpage', 'url': SITE + path, 'name': title, 'description': desc, 'inLanguage': 'ko-KR',
         'isPartOf': {'@id': SITE + '#website'}, 'about': {'@id': SITE + '#business'}, 'breadcrumb': {'@id': SITE + path + '#breadcrumb'}, 'dateModified': TODAY}
    if extra:
        d.update(extra)
    return d

def service(path, name, stype, desc, price):
    return {'@type': 'Service', '@id': SITE + path + '#service', 'name': name, 'serviceType': stype, 'description': desc, 'provider': {'@id': SITE + '#business'},
            'areaServed': [{'@type': 'AdministrativeArea', 'name': n} for n in ['서울특별시', '인천광역시', '경기도']],
            'offers': {'@type': 'Offer', 'priceCurrency': 'KRW', 'price': price, 'url': SITE + path}}

# ---------------------------------------------------------------- 페이지 정의
PAGES = [
 dict(src='index.html', out='index.html', path='', page='home', name='홈',
      title='인프케어 | 반려동물 소파·매트리스 청소 · 소변 냄새 제거 · 파보·칼리시 방역',
      og='인프케어 — 반려견 소파·매트리스 청소, 소변 냄새 제거, 파보·칼리시 방역',
      desc='인프케어(INPE CARE)는 반려동물 가정 전문 소파·매트리스 청소 서비스입니다. 강아지·고양이 소변 얼룩과 냄새 제거, 파보·칼리시 바이러스 방역. 사이즈별 가격 공개, 서울·인천·경기 출장비 무료.',
      kw='인프케어, 반려동물 청소, 반려동물 소변청소, 강아지 소변 냄새 제거, 고양이 소변 매트리스, 파보바이러스 방역, 칼리시바이러스 방역, 반려견 소파 청소, 매트리스 청소, 소파 청소, 인천 매트리스 청소',
      faq='home'),
 dict(src='pet-urine.html', out='pet-urine.html', path='pet-urine.html', page='urine', name='반려동물 소변 청소',
      title='반려동물 소변 청소 · 강아지 고양이 오줌 냄새 제거 | 인프케어',
      og='반려동물 소변 청소 — 냄새의 원인까지 빼냅니다 | 인프케어',
      desc='강아지·고양이 소변이 스며든 소파와 매트리스, 표면만 닦으면 요산 결정 때문에 냄새가 다시 납니다. 인프케어는 습식 세정·고온 스팀·전문 탈취로 처리합니다. 매트리스 5만원~, 소파 4만원~, 수도권 출장비 무료.',
      kw='반려동물 소변청소, 강아지 소변 냄새 제거, 강아지 오줌 매트리스, 고양이 소변 냄새, 고양이 오줌 소파, 소파 소변 얼룩, 매트리스 소변 청소, 반려동물 청소, 인프케어',
      faq='urine'),
 dict(src='pet-virus.html', out='pet-virus.html', path='pet-virus.html', page='virus', name='파보 · 칼리시 방역',
      title='파보·칼리시 바이러스 방역 · 반려동물 감염 후 집 소독 | 인프케어',
      og='파보·칼리시 바이러스 방역 | 인프케어',
      desc='파보바이러스는 일반 소독제로 잘 사라지지 않고 실내에 수개월 남을 수 있습니다. 인프케어는 환경부 승인 항바이러스 성능 인증 제품으로 반려동물 생활 공간을 방역하고 완료 인증서를 드립니다. 149,000원~.',
      kw='파보바이러스 방역, 파보 집 소독, 칼리시바이러스 방역, 반려동물 바이러스 방역, 강아지 파보 완치 후 소독, 고양이 칼리시 소독, 펫샵 방역, 인프케어',
      faq='virus'),
 dict(src='price.html', out='price.html', path='price.html', page='price', name='가격표',
      title='소파·매트리스 청소 가격표 · 사이즈별 공개 · 견적 계산기 | 인프케어',
      og='소파·매트리스 청소 가격표 — 사이즈별 전부 공개 | 인프케어',
      desc='매트리스 청소 2만원~, 소파 청소 2만원~. 건식·습건식+스팀 사이즈별 가격을 모두 공개하고, 반려동물 상황까지 넣어 바로 계산할 수 있습니다. 서울·인천·경기 출장비 무료.',
      kw='매트리스 청소 가격, 소파 청소 가격, 매트리스 청소 비용, 소파 청소 비용, 반려동물 소파 청소 가격, 인천 소파 청소, 인프케어 가격',
      faq='price'),
 dict(src='about.html', out='about.html', path='about.html', page='about', name='회사 소개',
      title='회사 소개 · 주식회사 인프 | 인프케어 INPE CARE',
      og='주식회사 인프 — 인프케어 운영사',
      desc='인프케어를 운영하는 주식회사 인프 소개. 2020년 설립, 누적 시공 2,400건, 평균 만족도 4.97점. 반려동물 홈케어·방역, 전문 소독 방역, AI 인테리어 견적, 제휴·채용 안내.',
      kw='주식회사 인프, 인프케어, INPE, 인프 방역, 인프 제휴, 인프 채용', faq=None),
 dict(src='privacy.html', out='privacy.html', path='privacy.html', page='privacy', name='개인정보처리방침',
      title='개인정보처리방침 | 인프케어', og='개인정보처리방침 | 인프케어',
      desc='주식회사 인프(인프케어)의 개인정보처리방침. 수집 항목, 이용 목적, 보유 기간, 처리 위탁, 개인정보 보호책임자 안내.',
      kw='인프케어 개인정보처리방침', faq=None),
]

def build():
    head, header, footer = rd('partials/head.html'), rd('partials/header.html'), rd('partials/footer.html')
    qf, calc = rd('partials/quote-form.html'), rd('partials/calc.html')
    stars = STAR * 5
    reps_common = {
        '{{calc}}': calc, '{{quote_form_inline}}': qf.replace('{{fid}}', 'qi'),
        '{{pcards}}': pcards_html(), '{{gallery}}': gallery_html(), '{{reviews}}': reviews_html(), '{{stars}}': stars,
        '{{reviews_virus}}': '\n'.join(reviews_html().split('\n')[1:7]), '{{careers}}': careers_html(),
        '{{faq_home}}': faq_html('home'), '{{faq_urine}}': faq_html('urine'), '{{faq_virus}}': faq_html('virus'), '{{faq_price}}': faq_html('price'),
    }
    report = []
    for p in PAGES:
        url = SITE + p['path']
        graph = [ORG, BIZ, WEBSITE, webpage(p['path'], p['title'], p['desc']), crumbs(p['path'], p['name'])]
        if p['faq']:
            graph.append(faq_ld(p['faq'], url))
        if p['page'] == 'home':
            graph.append({'@type': 'VideoObject', '@id': SITE + '#reel', 'name': '인프케어 현장 쇼릴 (15초)',
                          'description': '인프케어의 반려견 소파·매트리스 시공, 소변 얼룩 제거 전후, 흡입 필터, 파보·칼리시 방역을 담은 15초 영상',
                          'thumbnailUrl': SITE + 'assets/video/poster-desktop.jpg', 'uploadDate': TODAY + 'T09:00:00+09:00', 'duration': 'PT15S',
                          'contentUrl': SITE + 'assets/video/inpecare-reel-1080p.mp4', 'publisher': {'@id': SITE + '#org'}})
        if p['page'] == 'urine':
            graph.append(service(p['path'], '반려동물 소변 청소', '반려동물 소변 얼룩·냄새 제거 (소파·매트리스)', p['desc'], 40000))
            graph.append({'@type': 'HowTo', '@id': url + '#howto', 'name': '반려동물 소변 실수 직후 집에서 할 일', 'step': [
                {'@type': 'HowToStep', 'position': 1, 'name': '눌러서 흡수', 'text': '키친타월로 꾹 눌러 흡수합니다. 문지르면 오염이 넓게 퍼집니다.'},
                {'@type': 'HowToStep', 'position': 2, 'name': '물로 희석 후 다시 흡수', 'text': '미지근하거나 찬물을 조금 붓고 다시 눌러 흡수합니다. 2~3번 반복합니다.'},
                {'@type': 'HowToStep', 'position': 3, 'name': '자연 건조', 'text': '선풍기로 자연 건조합니다. 드라이기 고열은 피합니다.'},
                {'@type': 'HowToStep', 'position': 4, 'name': '사진 기록 후 상담', 'text': '오염 부위를 사진으로 남겨 전문 업체 상담 시 보여주면 견적과 공정을 정확히 잡을 수 있습니다.'}]})
        if p['page'] == 'virus':
            graph.append(service(p['path'], '반려동물 바이러스 방역 (파보·칼리시)', '반려동물 감염 후 생활 공간 방역', p['desc'], 149000))
        jsonld = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, indent=1)
        body = rd('pages/' + p['src'])
        for k, v in reps_common.items():
            body = body.replace(k, v)
        hd = head
        for k, v in {'{{title}}': html.escape(p['title']), '{{desc}}': html.escape(p['desc']), '{{keywords}}': html.escape(p['kw']),
                     '{{og_title}}': html.escape(p['og']), '{{path}}': p['path'], '{{page}}': p['page'], '{{jsonld}}': jsonld, '{{ver}}': VER,
                     '{{preload}}': '<link rel="preload" as="image" href="assets/img/real/sofa-01.jpg">' if p['page'] == 'home' else ''}.items():
            hd = hd.replace(k, v)
        hdr = header.replace('{{hdr_class}}', '' if p['page'] == 'home' else ' is-solid-always')
        ft = footer.replace('{{quote_form_drawer}}', qf.replace('{{fid}}', 'dq')).replace('{{ver}}', VER)
        out = hd + hdr + body + ft
        left = re.findall(r'\{\{[a-z_]+\}\}', out)
        if left:
            raise SystemExit(f"{p['out']}: 치환 안 된 자리표시자 {left}")
        with open(os.path.join(ROOT, p['out']), 'w', encoding='utf-8', newline='\n') as f:
            f.write(out)
        report.append((p['out'], len(out), len(p['title']), len(p['desc'])))

    # sitemap
    sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p, pri in zip(PAGES, ['1.0', '0.9', '0.9', '0.8', '0.6', '0.2']):
        sm.append(f'  <url><loc>{SITE}{p["path"]}</loc><lastmod>{TODAY}</lastmod><priority>{pri}</priority></url>')
    sm.append('</urlset>')
    with open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(sm) + '\n')

    # 기존 URL → 새 페이지 (Cafe24는 서버 301이 어려워 meta refresh + canonical)
    REDIR = {'fabric-care.html': 'index.html#services', 'disinfection.html': 'pet-virus.html', 'product.html': 'price.html',
             'ai-estimate.html': 'about.html#other-services', 'partners.html': 'about.html#partners', 'careers.html': 'about.html#careers'}
    os.makedirs(os.path.join(ROOT, 'redirects'), exist_ok=True)
    for old, new in REDIR.items():
        canon = SITE + new.split('#')[0]
        s = f'<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>인프케어로 이동합니다</title><link rel="canonical" href="{canon}"><meta name="robots" content="noindex,follow"><meta http-equiv="refresh" content="0; url=/{new}"><script>location.replace("/{new}")</script></head><body><p><a href="/{new}">인프케어 새 페이지로 이동</a></p></body></html>\n'
        with open(os.path.join(ROOT, 'redirects', old), 'w', encoding='utf-8', newline='\n') as f:
            f.write(s)

    for r in report:
        print('%-16s %7d bytes  title %2d자  desc %3d자' % r)

if __name__ == '__main__':
    build()
