import sys
import os
import json
from datetime import datetime

sys.path.append(os.path.abspath('.agents/skills/kakao-book-search/scripts'))
import search_book

# 취미 키워드 대량 탐색
hobby_keywords = [
    "달리기", "마라톤", "러닝", "등산", "캠핑", "자전거", "골프", "테니스", "수영", 
    "요리", "집밥", "다이어트 요리", "베이킹", "제과", "디저트", "커피", "와인", "위스키", "칵테일",
    "가드닝", "식물", "반려식물", "드로잉", "수채화", "오일파스텔", "어반스케치", "그림 그리기",
    "뜨개질", "코바늘", "자수", "도예", "목공", "사진", "피아노", "기타", "우쿨렐레", "반려견", "고양이",
    "필라테스", "요가", "헬스", "스트레칭", "취미"
]

hobby_books = []
seen = set()

for kw in hobby_keywords:
    try:
        res = search_book.search_books(kw, sort='latest', size=30)
        for b in res.get('documents', []):
            title = b.get('title', '').strip()
            dt_str = b.get('datetime', '')[:10]
            
            # 수험서/잡지/문제집/어린이 학습만화 제외
            ex = ['기출', '문제집', '기능사', 'CBT', '자격증', '月刊', 'NHK', '만화', '코믹스', '스티커', '학습']
            if any(x in title for x in ex):
                continue
            
            # 유효한 한글 도서 및 저자 있는 도서
            if not b.get('authors') or not b.get('publisher'):
                continue
                
            clean_t = title.split('(')[0].split(':')[0].strip().replace(' ', '')
            if clean_t in seen:
                continue
                
            if dt_str:
                try:
                    b_dt = datetime.strptime(dt_str, '%Y-%m-%d')
                    if datetime(2026, 6, 1) <= b_dt <= datetime(2026, 10, 31):
                        seen.add(clean_t)
                        hobby_books.append(b)
                except Exception:
                    pass
    except Exception:
        pass

print(f"발견된 취미 도서 수: {len(hobby_books)}권")
hobby_books.sort(key=lambda x: x.get('datetime', ''), reverse=True)
for i, b in enumerate(hobby_books[:15], 1):
    print(f"{i}. {b['title']} ({b['datetime'][:10]}) - {', '.join(b.get('authors', []))} | {b.get('publisher')}")

with open('hobby_curated.json', 'w', encoding='utf-8') as f:
    json.dump(hobby_books[:10], f, ensure_ascii=False, indent=2)
