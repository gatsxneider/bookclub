# 카카오 도서 검색 API 레퍼런스

카카오 개발자(Kakao Developers)의 도서 검색 REST API 명세 및 파라미터 안내입니다.

## 기본 정보
- **기본 URL**: `https://dapi.kakao.com/v3/search/book`
- **HTTP 메소드**: `GET`
- **인증 헤더**: `Authorization: KakaoAK ${KAKAO_REST_API_KEY}`

## 요청 파라미터 (Request Parameters)

| 파라미터 | 타입 | 필수 여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `query` | String | **필수** | 검색을 원하는 질의어 (도서명, 저자, ISBN 등) |
| `sort` | String | 선택 | 결과 문서 정렬 방식: `accuracy`(정확도순, 기본값) 또는 `latest`(발간일순) |
| `page` | Integer | 선택 | 결과 페이지 번호 (1 ~ 50, 기본값: 1) |
| `size` | Integer | 선택 | 한 페이지에 보여질 문서 수 (1 ~ 50, 기본값: 10) |
| `target` | String | 선택 | 검색 필드 제한: `title`(제목), `isbn`(ISBN), `publisher`(출판사), `person`(인명) |

## 응답 필드 (Response Fields)

### Meta
| 필드명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `total_count` | Integer | 검색된 전체 문서 수 |
| `pageable_count` | Integer | 중복을 제외한 검색 문서 수 |
| `is_end` | Boolean | 현재 페이지가 마지막 페이지인지 여부 |

### Document
| 필드명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `title` | String | 도서 제목 |
| `contents` | String | 도서 소개 / 줄거리 |
| `url` | String | Daum 도서 상세 페이지 URL |
| `isbn` | String | ISBN10 또는 ISBN13 (공백 구분) |
| `datetime` | String | 도서 출판일 (ISO 8601 형식: `YYYY-MM-DDThh:mm:ss.000+09:00`) |
| `authors` | Array[String] | 저자 목록 |
| `publisher` | String | 도서 출판사 |
| `translators` | Array[String] | 번역가 목록 |
| `price` | Integer | 도서 정가 |
| `sale_price` | Integer | 도서 판매가 (할인가) |
| `thumbnail` | String | **도서 표지 미리보기 이미지 URL (HTTPS)** |
| `status` | String | 도서 판매 상태 (정상, 품절, 절판 등) |

## 보안 준수 사항
1. **API Key 보호**: API Key는 절대 코드나 Git 저장소에 커밋하지 않고 `KAKAO_REST_API_KEY` 환경 변수로 관리합니다.
2. **HTTPS 통신**: 카카오 API 통신 및 이미지 다운로드는 반드시 안전한 `https://` 프로토콜을 사용합니다.
3. **입력값 검증**: 사용자 검색 쿼리 및 파일 저장 시 인젝션과 경로 순회(Path Traversal) 공격을 방어합니다.
