import sys
import os
import json
from datetime import datetime, timedelta

sys.path.append(os.path.abspath('.agents/skills/kakao-book-search/scripts'))
import search_book

categories = {
    "경제": [
        "경제", "재테크", "주식", "부동산", "ETF", "투자", "머니", "트렌드", "금리", "자산", "연금", "배당"
    ],
    "IT": [
        "바이브 코딩", "AI", "인공지능", "클로드 코드", "안티그래비티", "파이썬", "LLM", "딥러닝", "프롬프트", "데이터 분석"
    ],
    "취미": [
        "러닝", "달리기", "마라톤", "요리", "레시피", "베이킹", "식물", "가드닝", "드로잉", "그림", 
        "캠핑", "커피", "와인", "위스키", "뜨개질", "골프", "등산", "피아노", "기타", "사진", "반려견", "고양이", "필라테스", "수영"
    ]
}

now = datetime(2026, 9, 23)
three_months_ago = now - timedelta(days=92) # 2026-06-23

results = {}

for cat_name, keywords in categories.items():
    seen_titles = set()
    cat_books = []
    
    for kw in keywords:
        for sort_type in ['accuracy', 'latest']:
            try:
                res = search_book.search_books(kw, sort=sort_type, size=30)
                for b in res.get('documents', []):
                    title = b.get('title', '').strip()
                    dt_str = b.get('datetime', '')[:10]
                    
                    clean_title = title.split('(')[0].split(':')[0].strip().replace(' ', '')
                    if clean_title in seen_titles:
                        continue
                        
                    if dt_str:
                        try:
                            b_dt = datetime.strptime(dt_str, '%Y-%m-%d')
                            if b_dt >= three_months_ago:
                                seen_titles.add(clean_title)
                                cat_books.append(b)
                        except Exception:
                            pass
            except Exception:
                pass
            
    # 발간일 최신순 정렬
    cat_books.sort(key=lambda x: x.get('datetime', ''), reverse=True)
    results[cat_name] = cat_books[:10]

with open('category_top10.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("결과 확인:")
for k, v in results.items():
    print(f"- {k}: {len(v)}권")
