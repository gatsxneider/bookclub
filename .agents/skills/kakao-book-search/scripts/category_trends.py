import sys
import os
from datetime import datetime, timedelta

sys.path.append(os.path.abspath('.agents/skills/kakao-book-search/scripts'))
import search_book

# UTF-8 보정
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 카테고리별 대표 검색 키워드 및 도서 후보군
categories = {
    "경제": ["경제", "재테크", "주식", "트렌드 코리아", "부동산", "환율", "투자", "머니"],
    "IT": ["AI", "인공지능", "코딩", "파이썬", "안티그래비티", "바이브 코딩", "프롬프트", "데이터"],
    "취미": ["요리", "여행", "러닝", "베이킹", "식물", "그림", "드로잉", "운동"]
}

now = datetime(2026, 9, 23)
three_months_ago = now - timedelta(days=92) # 2026-06-23

print(f"기준일: {now.strftime('%Y-%m-%d')} (최근 3개월: {three_months_ago.strftime('%Y-%m-%d')} 이후)\n")

for cat_name, keywords in categories.items():
    print(f"=== [{cat_name} 카테고리 도서 검색 중...] ===")
    seen_titles = set()
    cat_books = []
    
    for kw in keywords:
        try:
            res = search_book.search_books(kw, sort='accuracy', size=20)
            for b in res.get('documents', []):
                title = b.get('title', '').strip()
                dt_str = b.get('datetime', '')[:10]
                
                # 중복 및 3개월 날짜 필터링
                clean_title = title.split('(')[0].split(':')[0].strip()
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
        except Exception as e:
            print(f"검색 오류 ({kw}): {e}", file=sys.stderr)
            
    # 발간일순 & 정확도 가중으로 상위 10개 정렬
    cat_books.sort(key=lambda x: x.get('datetime', ''), reverse=True)
    top10 = cat_books[:10]
    
    print(f"\n## 📌 {cat_name} 분야 Top 10 도서 (최근 3개월)\n")
    for idx, b in enumerate(top10, 1):
        authors = ', '.join(b.get('authors', [])) or '저자 미상'
        date = b.get('datetime', '')[:10]
        price = f"{b.get('price', 0):,}원"
        sale_price = f"{b.get('sale_price', 0):,}원" if b.get('sale_price', 0) > 0 else '정가'
        thumb = b.get('thumbnail', '')
        print(f"#### {idx}. [{b.get('title')}]({b.get('url', '#')})")
        if thumb:
            print(f"![{b.get('title')}]({thumb})")
        print(f"- **저자**: {authors} | **출판사**: {b.get('publisher', '-')}")
        print(f"- **출판일**: {date} | **가격**: {price} (할인가: {sale_price})")
        print(f"- **ISBN**: `{b.get('isbn', '-')}`")
        if b.get('contents'):
            print(f"- **소개**: {b.get('contents', '').strip()[:140]}...")
        print()
    print("=" * 60 + "\n")
