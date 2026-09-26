import sys
import os
from datetime import datetime, timedelta

# kakao-book-search 모듈 로드
sys.path.append(os.path.abspath('.agents/skills/kakao-book-search/scripts'))
import search_book

# UTF-8 출력 보정
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

data = search_book.search_books('안티그래비티', sort='latest', size=50)
books = data.get('documents', [])

# 현재 기준일: 2026년 9월 23일
now = datetime(2026, 9, 23)
three_months_ago = now - timedelta(days=92) # 약 2026-06-23

print(f"기준일: {now.strftime('%Y-%m-%d')} (최근 3개월 시작일: {three_months_ago.strftime('%Y-%m-%d')})\n")

recent_books = []
for b in books:
    dt_str = b.get('datetime', '')[:10]
    if dt_str:
        try:
            b_dt = datetime.strptime(dt_str, '%Y-%m-%d')
            if b_dt >= three_months_ago:
                recent_books.append(b)
        except Exception:
            pass

print(f"총 검색 건수: {len(books)}건")
print(f"최근 3개월 내 출판 도서: {len(recent_books)}건\n")

if recent_books:
    print("=== [최근 3개월 내 출판 도서] ===")
    for idx, b in enumerate(recent_books, 1):
        print(f"### {idx}. {b.get('title')}")
        print(f"- 출판일: {b.get('datetime', '')[:10]}")
        print(f"- 저자: {', '.join(b.get('authors', []))}")
        print(f"- 출판사: {b.get('publisher', '')}")
        print(f"- 가격: {b.get('price', 0):,}원 (할인가: {b.get('sale_price', 0):,}원)")
        print(f"- ISBN: {b.get('isbn', '')}")
        print(f"- 표지 이미지: {b.get('thumbnail', '')}")
        print(f"- 책 소개: {b.get('contents', '').strip()}")
        print(f"- 상세 링크: {b.get('url', '')}\n")
else:
    print("최근 3개월 내에 출판된 도서가 없습니다.\n")

print("=== [전체 '안티그래비티' 도서 목록 (발간일순)] ===")
for idx, b in enumerate(books, 1):
    print(f"{idx}. {b.get('title')} | {b.get('datetime', '')[:10]} | {b.get('publisher', '')} | 저자: {', '.join(b.get('authors', []))}")
