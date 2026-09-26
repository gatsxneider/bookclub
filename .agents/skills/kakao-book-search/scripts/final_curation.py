import sys
import os
import json
from datetime import datetime, timedelta

sys.path.append(os.path.abspath('.agents/skills/kakao-book-search/scripts'))
import search_book

# 실제 대중적 베스트셀러 및 언급이 많은 키워드 목록
queries = {
    "경제": [
        "머니 트렌드 2027", "부동산 트렌드 2027", "김대종 2027 머니트랜드", 
        "나는 왜 항상 고점에 사서 저점에 파는가", "마켓 트렌드 2027", "크레딧 투자 핸드북",
        "2026 머니 트렌드 리포트", "부의 공식", "돈의 심리학", "월급쟁이 부자로 은퇴하라", 
        "배당주 투자", "자본주의", "ETF 투자 무작정 따라하기", "트렌드 코리아"
    ],
    "IT": [
        "바이브 코딩을 위한 안티그래비티 2.0", "요즘 AI 루프 엔지니어링", "비전공자도 이해할 수 있는 LLM 수업",
        "밑바닥부터 시작하는 딥러닝 6", "클로드 코드 제대로 시작하기", "LLM을 활용한 데이터 분석",
        "요즘 교사를 위한 웹앱 만들기 with 바이브 코딩", "말하는 대로 제미나이 × 3D 바이브 코딩",
        "AI격차", "Do it! 바이브 코딩 + 안티그래비티", "생성형 AI 프롬프트", "파이썬 데이터 분석"
    ],
    "취미": [
        "알보의 왕 노크의 식물노트", "달리기의 모든 것", "러닝 가이드", "홈베이킹 백과사전",
        "하루 한 장 어반스케치", "맛있는 원팬 요리", "처음 시작하는 캠핑", "홈 바리스타 핸드북",
        "위스키학개론", "오일파스텔 풍경화", "쉬운 뜨개질", "식물 집사 라이프", "퇴근 후 러닝"
    ]
}

now = datetime(2026, 9, 23)
three_months_ago = now - timedelta(days=92) # 2026-06-23

final_results = {}

for cat, q_list in queries.items():
    cur_books = []
    seen_isbns = set()
    seen_titles = set()
    
    for q in q_list:
        try:
            res = search_book.search_books(q, sort='accuracy', size=5)
            for b in res.get('documents', []):
                title = b.get('title', '').strip()
                isbn = b.get('isbn', '').strip()
                dt_str = b.get('datetime', '')[:10]
                
                # 수험서/자격증/잡지 제외 필터
                exclude_words = ['기출', '예상문제집', '기능사', 'CBT', '주택관리사', '공인중개사', '잡지', '月刊', 'NHK']
                if any(ew in title for ew in exclude_words):
                    continue
                
                clean_t = title.split('(')[0].split(':')[0].strip().replace(' ', '')
                if clean_t in seen_titles or (isbn and isbn in seen_isbns):
                    continue
                    
                # 최근 3~4개월 도서 우선
                if dt_str:
                    try:
                        b_dt = datetime.strptime(dt_str, '%Y-%m-%d')
                        # 2026년 5월 이후 도서 허용 (신간 및 최근 화제작)
                        if b_dt >= datetime(2026, 5, 1):
                            seen_titles.add(clean_t)
                            if isbn: seen_isbns.add(isbn)
                            cur_books.append(b)
                            if len(cur_books) == 10:
                                break
                    except Exception:
                        pass
            if len(cur_books) >= 10:
                break
        except Exception:
            pass
            
    # 날짜 최신순 정렬
    cur_books.sort(key=lambda x: x.get('datetime', ''), reverse=True)
    final_results[cat] = cur_books[:10]

with open('category_final_top10.json', 'w', encoding='utf-8') as f:
    json.dump(final_results, f, ensure_ascii=False, indent=2)

print("최종 정제 완료:")
for k, v in final_results.items():
    print(f"- {k}: {len(v)}권")
