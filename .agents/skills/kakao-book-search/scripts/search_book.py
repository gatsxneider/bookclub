#!/usr/bin/env python3
"""
카카오 도서 검색 API 클라이언트 (Python 표준 라이브러리 사용)
보안 가이드:
1. API 키는 환경 변수(KAKAO_REST_API_KEY)를 통해서만 안전하게 로드합니다.
2. 쿼리 파라미터는 urllib.parse.urlencode를 사용해 안전하게 인코딩합니다.
3. 이미지 다운로드 시 경로 순회(Path Traversal) 공격을 방지하고 HTTPS만 허용합니다.
"""

import sys
import os
import argparse
import json
import re
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime

# Windows 환경 콘솔 UTF-8 인코딩 보정
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def load_env():
    """외부 패키지 없이 .env 파일을 탐색하고 환경변수로 로드"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.abspath(os.path.join(os.getcwd(), '.env')),
        os.path.abspath(os.path.join(script_dir, '../../..', '.env')),
        os.path.abspath(os.path.join(os.getcwd(), '..', '.env')),
    ]
    for env_path in candidates:
        if os.path.isfile(env_path):
            try:
                with open(env_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith('#'):
                            continue
                        if '=' in line:
                            key, val = line.split('=', 1)
                            key, val = key.strip(), val.strip()
                            if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                                val = val[1:-1]
                            if key and key not in os.environ:
                                os.environ[key] = val
                break
            except Exception:
                pass

# 스크립트 시작 시 .env 자동 로드
load_env()

def sanitize_filename(filename: str) -> str:
    """경로 순회 공격 및 특수문자 제거를 위한 안전한 파일명 생성"""
    clean = re.sub(r'[^a-zA-Z0-9가-힣ㄱ-ㅎ_-]', '_', filename)
    return clean[:80]

def download_image(url: str, target_dir: str, filename: str) -> str | None:
    if not url or not url.startswith('https://'):
        return None
    try:
        os.makedirs(target_dir, exist_ok=True)
        safe_name = f"{sanitize_filename(filename)}.jpg"
        file_path = os.path.abspath(os.path.join(target_dir, safe_name))
        
        # Target 디렉토리 내부 경로인지 검증
        if not file_path.startswith(os.path.abspath(target_dir)):
            print(f"[경고] 보안 위반 경로 감지: {file_path}", file=sys.stderr)
            return None

        req = urllib.request.Request(url, headers={'User-Agent': 'KakaoBookSearchSkill/1.0'})
        with urllib.request.urlopen(req, timeout=10) as response, open(file_path, 'wb') as out_file:
            out_file.write(response.read())
        return file_path
    except Exception as e:
        print(f"[경고] 이미지 다운로드 실패 ({url}): {e}", file=sys.stderr)
        return None

def search_books(query: str, target: str = None, sort: str = 'accuracy', page: int = 1, size: int = 10):
    api_key = os.environ.get('KAKAO_REST_API_KEY')
    if not api_key:
        print("오류: KAKAO_REST_API_KEY 환경 변수가 설정되어 있지 않습니다.", file=sys.stderr)
        print("카카오 개발자 콘솔(https://developers.kakao.com)에서 발급받은 REST API 키를 환경변수로 지정하세요.", file=sys.stderr)
        sys.exit(1)

    params = {
        'query': query.strip(),
        'sort': 'latest' if sort == 'latest' else 'accuracy',
        'page': max(1, min(50, page)),
        'size': max(1, min(50, size)),
    }
    if target in ('title', 'isbn', 'publisher', 'person'):
        params['target'] = target

    url = f"https://dapi.kakao.com/v3/search/book?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(
        url,
        headers={
            'Authorization': f'KakaoAK {api_key}',
            'User-Agent': 'KakaoBookSearchSkill/1.0'
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status != 200:
                print(f"API 호출 실패 (HTTP {response.status})", file=sys.stderr)
                sys.exit(1)
            raw_data = response.read().decode('utf-8')
            return json.loads(raw_data)
    except urllib.error.HTTPError as e:
        print(f"HTTP 오류 ({e.code}): {e.read().decode('utf-8', errors='ignore')}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"요청 오류 발생: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="카카오 도서 검색 및 이미지 다운로드 도구")
    parser.add_argument('--query', '-q', required=True, help="검색할 도서명 또는 키워드")
    parser.add_argument('--target', '-t', choices=['title', 'isbn', 'publisher', 'person'], help="검색 필드 제한")
    parser.add_argument('--sort', '-s', choices=['accuracy', 'latest'], default='accuracy', help="정렬 방식")
    parser.add_argument('--page', '-p', type=int, default=1, help="페이지 번호 (1~50)")
    parser.add_argument('--size', type=int, default=10, help="가져올 결과 수 (1~50)")
    parser.add_argument('--format', '-f', choices=['markdown', 'table', 'json'], default='markdown', help="출력 포맷")
    parser.add_argument('--download-images', '-d', action='store_true', help="표지 이미지를 로컬 downloaded_covers 폴더에 저장")

    args = parser.parse_args()
    data = search_books(args.query, args.target, args.sort, args.page, args.size)

    books = data.get('documents', [])
    meta = data.get('meta', {})

    if not books:
        print(f"'{args.query}'에 대한 도서 검색 결과가 없습니다.")
        return

    download_paths = []
    if args.download_images:
        out_dir = os.path.abspath(os.path.join(os.getcwd(), 'downloaded_covers'))
        print(f"이미지 다운로드 디렉토리: {out_dir}\n")
        for idx, book in enumerate(books, 1):
            title = book.get('title', 'untitled')
            isbn = book.get('isbn', '').split(' ')[0]
            name = f"{idx}_{title}_{isbn}"
            path = download_image(book.get('thumbnail'), out_dir, name)
            download_paths.append(path)
    else:
        download_paths = [None] * len(books)

    if args.format == 'json':
        for idx, b in enumerate(books):
            b['local_cover_path'] = download_paths[idx]
        print(json.dumps({'meta': meta, 'documents': books}, ensure_ascii=False, indent=2))
    elif args.format == 'table':
        header = f"{'No.':<4} | {'제목':<30} | {'저자':<15} | {'출판사':<15} | {'정가':<10} | {'출판일':<10}"
        print(header)
        print("-" * len(header.encode('utf-8')))
        for idx, b in enumerate(books, 1):
            authors = ', '.join(b.get('authors', []))[:15]
            date = b.get('datetime', '')[:10]
            price = f"{b.get('price', 0):,}원"
            title = b.get('title', '')[:28]
            print(f"{idx:<4} | {title:<30} | {authors:<15} | {b.get('publisher','')[:15]:<15} | {price:<10} | {date:<10}")
    else:
        print(f"# 📚 도서 검색 결과: \"{args.query}\" (총 {meta.get('total_count', len(books))}건 검색됨)\n")
        for idx, (book, cover_path) in enumerate(zip(books, download_paths), 1):
            authors = ', '.join(book.get('authors', [])) or '저자 미상'
            translators = f" (번역: {', '.join(book.get('translators', []))})" if book.get('translators') else ''
            date = book.get('datetime', '')[:10]
            price = f"{book.get('price', 0):,}원" if book.get('price') else '-'
            sale_price = f"**{book.get('sale_price', 0):,}원**" if book.get('sale_price', 0) > 0 else '할인 없음'

            print(f"### {idx}. [{book.get('title')}]({book.get('url', '#')})")
            if book.get('thumbnail'):
                print(f"![{book.get('title')}]({book.get('thumbnail')})")
            print(f"- **저자**: {authors}{translators}")
            print(f"- **출판사**: {book.get('publisher', '-')}")
            print(f"- **출판일**: {date}")
            print(f"- **정가 / 판매가**: {price} / {sale_price}")
            print(f"- **ISBN**: `{book.get('isbn', '-')}`")
            if book.get('status'):
                print(f"- **도서 상태**: {book.get('status')}")
            if cover_path:
                print(f"- **로컬 표지 경로**: `{cover_path}`")
            if book.get('contents'):
                print(f"\n> **책 소개**: {book.get('contents', '').strip()}...\n")
            print("---\n")

if __name__ == '__main__':
    main()
