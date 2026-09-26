---
name: kakao-book-search
description: >-
  카카오 공식 도서 검색 API(Kakao Developers REST API)를 사용하여 도서명, 저자, ISBN, 출판사 등으로 책의 상세 정보와 표지 썸네일 이미지를 검색하고 로컬로 다운로드할 수 있는 스킬입니다. 사용자가 책 정보, 책 표지 이미지, 저자/출판사/가격/줄거리 조회를 요청할 때 사용합니다.
---

# 카카오 도서 검색 스킬 (Kakao Book Search)

카카오 공식 도서 검색 API(`https://dapi.kakao.com/v3/search/book`)를 활용하여 도서의 상세 메타데이터(제목, 저자, 출판사, 출판일, 가격, 줄거리, ISBN)와 **표지 이미지(thumbnail)**를 조회하고 다운로드합니다.

---

## 🔒 보안 규칙 (Security Guidelines)

1. **API Key 보안 관리**:
   - `KAKAO_REST_API_KEY`는 소스 코드나 대화 내용에 노출하지 않고 프로젝트 루트의 `.env` 파일 또는 시스템 환경 변수로만 안전하게 관리합니다.
   - `.gitignore`에 `.env`가 등록되어 Git 저장소에 키가 커밋되지 않도록 방지합니다.
   - 키가 설정되지 않은 경우 안전하게 에러를 반환하고 사용자에게 설정을 안내합니다.
2. **HTTPS 통신**: API 호출 및 썸네일 이미지 다운로드는 오직 HTTPS 프로토콜만 허용합니다.
3. **경로 순회(Path Traversal) 방지**: 이미지 저장 시 파일명에서 특수문자를 살균(sanitize)하여 안전한 경로에만 저장합니다.

---

## 🚀 사용 방법

### 1. `.env` 파일에 API 키 등록 (권장)
프로젝트 루트 디렉터리에 `.env` 파일을 생성하고 카카오 REST API 키를 입력합니다. (템플릿: `.env.example`)

```env
# .env
KAKAO_REST_API_KEY=your_kakao_rest_api_key_here
```

*또는 터미널 세션 환경변수로 직접 주입할 수도 있습니다:*
- **PowerShell (Windows)**: `$env:KAKAO_REST_API_KEY="발급받은_키"`
- **Bash / Linux**: `export KAKAO_REST_API_KEY="발급받은_키"`

---

### 2. 스크립트 실행

#### Node.js 사용 시:
```bash
# 기본 검색 (마크다운 출력)
node .agents/skills/kakao-book-search/scripts/search_book.js --query "클린코드"

# 제목 대상 검색 및 표지 이미지 로컬 다운로드
node .agents/skills/kakao-book-search/scripts/search_book.js --query "리팩터링" --target title --download-images --size 5

# JSON 형식으로 출력
node .agents/skills/kakao-book-search/scripts/search_book.js --query "인공지능" --format json
```

#### Python 3 사용 시:
```bash
# 기본 검색 및 표지 이미지 다운로드
python .agents/skills/kakao-book-search/scripts/search_book.py --query "도메인 주도 설계" -d

# 표(테이블) 형식으로 출력
python .agents/skills/kakao-book-search/scripts/search_book.py --query "파이썬" --format table --size 5
```

---

## 🛠️ CLI 옵션 목록

| 옵션 | 단축키 | 기본값 | 설명 |
| :--- | :---: | :---: | :--- |
| `--query` | `-q` | (필수) | 검색할 도서명, 저자 또는 ISBN |
| `--target` | `-t` | 전체 | 검색 대상 필드 제한 (`title`, `isbn`, `publisher`, `person`) |
| `--sort` | `-s` | `accuracy` | 정렬 방식 (`accuracy`: 정확도순, `latest`: 발간일순) |
| `--page` | `-p` | `1` | 결과 페이지 번호 (1 ~ 50) |
| `--size` | - | `10` | 한 번에 가져올 도서 개수 (1 ~ 50) |
| `--format` | `-f` | `markdown` | 출력 포맷 (`markdown`, `table`, `json`) |
| `--download-images` | `-d` | `false` | 도서 표지 이미지를 로컬 `downloaded_covers/` 폴더에 다운로드 |

---

## 📖 참고 문서
- [API 상세 레퍼런스](./references/api_reference.md)
