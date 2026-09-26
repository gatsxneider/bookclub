import sys
import os
import json

sys.path.append(os.path.abspath('.agents/skills/kakao-book-search/scripts'))
import search_book

# 1. 경제 도서 목록
econ_queries = [
    "머니 트렌드 2027",
    "부동산 트렌드 2027",
    "김대종 2027 머니트랜드",
    "나는 왜 항상 고점에 사서 저점에 파는가",
    "마켓 트렌드 2027: 스토리 액팅의 시대",
    "크레딧 투자 핸드북",
    "2026 머니 트렌드 리포트",
    "돈의 심리학",
    "월급쟁이 부자로 은퇴하라",
    "ETF 투자 무작정 따라하기"
]

# 2. IT / AI / 테크 도서 목록
it_queries = [
    "바이브 코딩을 위한 안티그래비티 2.0 with 스킬, 멀티 에이전트, MCP,  하네스",
    "요즘 AI 루프 엔지니어링, 클로드 코드, 스킬, MCP, 훅, 컨텍스트, 하네스",
    "비전공자도 이해할 수 있는 LLM 수업",
    "밑바닥부터 시작하는 딥러닝 6",
    "클로드 코드 제대로 시작하기",
    "LLM을 활용한 데이터 분석",
    "요즘 교사를 위한 웹앱 만들기 with 바이브 코딩",
    "말하는 대로 제미나이 × 3D 바이브 코딩",
    "AI격차",
    "Do it! 바이브 코딩 + 안티그래비티"
]

# 3. 취미 / 실용 / 라이프스타일 도서 목록
hobby_queries = [
    "박준면의 낯가리는 레시피",
    "칭찬 받는 폰카 사진 레시피",
    "알보의 왕 노크의 식물노트",
    "털몽치의 매일 들고 싶은 코바늘 가방",
    "아띠랑스공방의 사계절 손뜨개 인형",
    "요령이 한눈에 보이는 마쓰코의 자수교실",
    "문전박대가 취미입니다만",
    "위스키학개론",
    "고양이는 이렇게 말했다",
    "퇴근 후, 오일파스텔 드로잉 세트"
]

def fetch_book_info(q):
    res = search_book.search_books(q, sort='accuracy', size=3)
    docs = res.get('documents', [])
    if docs:
        return docs[0]
    return None

final_data = {"경제": [], "IT": [], "취미": []}

for q in econ_queries:
    b = fetch_book_info(q)
    if b: final_data["경제"].append(b)

for q in it_queries:
    b = fetch_book_info(q)
    if b: final_data["IT"].append(b)

for q in hobby_queries:
    b = fetch_book_info(q)
    if b: final_data["취미"].append(b)

with open('final_curated_books.json', 'w', encoding='utf-8') as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)

print("최종 집계 완료:")
for k, v in final_data.items():
    print(f"- {k}: {len(v)}권")
