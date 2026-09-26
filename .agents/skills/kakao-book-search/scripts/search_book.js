import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';

/**
 * .env 파일에서 환경 변수를 안전하게 로드합니다.
 * 외부 의존성 없이 표준 모듈로 안전하게 파싱합니다.
 */
function loadEnv() {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../../../.env'),
    path.resolve(process.cwd(), '..', '.env'),
  ];

  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.substring(0, eqIdx).trim();
            let val = trimmed.substring(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (key && !(key in process.env)) {
              process.env[key] = val;
            }
          }
        }
        break; // 첫 번째로 발견된 .env 적용
      } catch {
        // 읽기 오류 무시
      }
    }
  }
}

// 스크립트 시작 시 .env 자동 로드
loadEnv();

/**
 * 카카오 도서 검색 API 클라이언트
 * 보안 가이드:
 * 1. API 키는 .env 또는 환경 변수(KAKAO_REST_API_KEY)를 통해서만 안전하게 로드합니다.
 * 2. URL 파라미터는 URLSearchParams를 사용하여 안전하게 인코딩합니다.
 * 3. 파일 저장 시 경로 순회(Path Traversal) 공격을 방지합니다.
 */

function printUsage() {
  console.log(`
사용법:
  node search_book.js [옵션]

옵션:
  --query, -q <검색어>       (필수) 검색할 도서명 또는 키워드
  --target, -t <필드>        (선택) 검색 필드 제한 (title, isbn, publisher, person)
  --sort, -s <정렬>          (선택) accuracy(정확도순, 기본값) 또는 latest(최신순)
  --page, -p <페이지>        (선택) 결과 페이지 번호 (기본값: 1, 1~50)
  --size <개수>              (선택) 한 페이지에 보여질 문서 수 (기본값: 10, 1~50)
  --format, -f <형식>        (선택) 출력 포맷: table, markdown, json (기본값: markdown)
  --download-images, -d      (선택) 검색된 도서의 표지 이미지를 로컬 images/ 폴더에 다운로드

환경 변수:
  KAKAO_REST_API_KEY         카카오 REST API 키 (필수)

예시:
  KAKAO_REST_API_KEY=your_key node search_book.js --query "클린코드" --size 5
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    query: '',
    target: '',
    sort: 'accuracy',
    page: 1,
    size: 10,
    format: 'markdown',
    downloadImages: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--query' || arg === '-q') {
      options.query = args[++i] || '';
    } else if (arg === '--target' || arg === '-t') {
      options.target = args[++i] || '';
    } else if (arg === '--sort' || arg === '-s') {
      options.sort = args[++i] || 'accuracy';
    } else if (arg === '--page' || arg === '-p') {
      options.page = parseInt(args[++i], 10) || 1;
    } else if (arg === '--size') {
      options.size = parseInt(args[++i], 10) || 10;
    } else if (arg === '--format' || arg === '-f') {
      options.format = args[++i] || 'markdown';
    } else if (arg === '--download-images' || arg === '-d') {
      options.downloadImages = true;
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
  }

  return options;
}

// 경로 순회(Path Traversal) 방지 안전한 파일명 생성
function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9가-힣ㄱ-ㅎ_-]/g, '_').substring(0, 80);
}

async function downloadImage(imageUrl, targetDir, filename) {
  if (!imageUrl || !imageUrl.startsWith('https://')) {
    return null;
  }

  try {
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'KakaoBookSearchAgent/1.0' },
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
    });

    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const safeFilename = `${sanitizeFilename(filename)}.jpg`;
    const filePath = path.join(targetDir, safeFilename);

    // 경로 검증: targetDir 내부로 한정
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(path.resolve(targetDir))) {
      throw new Error('보안 에러: 잘못된 파일 경로입니다.');
    }

    fs.writeFileSync(resolvedPath, buffer);
    return resolvedPath;
  } catch (err) {
    console.error(`[경고] 이미지 다운로드 실패 (${imageUrl}):`, err.message);
    return null;
  }
}

async function searchBooks(options) {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    console.error('오류: KAKAO_REST_API_KEY 환경 변수가 설정되지 않았습니다.');
    console.error('카카오 개발자 센터(https://developers.kakao.com)에서 REST API 키를 발급받아 설정해주세요.');
    process.exit(1);
  }

  if (!options.query || options.query.trim() === '') {
    console.error('오류: --query (-q) 검색어를 입력해야 합니다.');
    printUsage();
    process.exit(1);
  }

  const endpoint = new URL('https://dapi.kakao.com/v3/search/book');
  endpoint.searchParams.set('query', options.query.trim());
  endpoint.searchParams.set('sort', options.sort === 'latest' ? 'latest' : 'accuracy');
  endpoint.searchParams.set('page', String(Math.max(1, Math.min(50, options.page))));
  endpoint.searchParams.set('size', String(Math.max(1, Math.min(50, options.size))));

  if (['title', 'isbn', 'publisher', 'person'].includes(options.target)) {
    endpoint.searchParams.set('target', options.target);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

  try {
    const response = await fetch(endpoint.toString(), {
      method: 'GET',
      headers: {
        Authorization: `KakaoAK ${apiKey}`,
        'User-Agent': 'KakaoBookSearchSkill/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`카카오 API 오류 (HTTP ${response.status}): ${errorBody}`);
      process.exit(1);
    }

    const data = await response.json();
    const books = data.documents || [];
    const meta = data.meta || {};

    if (books.length === 0) {
      console.log(`'${options.query}'에 대한 검색 결과가 없습니다.`);
      return;
    }

    let imageDownloads = [];
    if (options.downloadImages) {
      const outputDir = path.resolve(process.cwd(), 'downloaded_covers');
      console.log(`이미지 다운로드 폴더: ${outputDir}`);
      imageDownloads = await Promise.all(
        books.map((book, idx) => {
          const name = `${idx + 1}_${book.title}_${book.isbn ? book.isbn.split(' ')[0] : ''}`;
          return downloadImage(book.thumbnail, outputDir, name);
        })
      );
    }

    if (options.format === 'json') {
      const output = books.map((book, idx) => ({
        ...book,
        local_cover_path: imageDownloads[idx] || null,
      }));
      console.log(JSON.stringify({ meta, documents: output }, null, 2));
    } else if (options.format === 'table') {
      console.table(
        books.map((b) => ({
          제목: b.title,
          저자: (b.authors || []).join(', '),
          출판사: b.publisher,
          정가: b.price?.toLocaleString() + '원',
          판매가: b.sale_price > 0 ? b.sale_price?.toLocaleString() + '원' : '할인없음',
          출판일: b.datetime ? b.datetime.substring(0, 10) : '-',
          ISBN: b.isbn,
        }))
      );
    } else {
      // 기본 포맷: Markdown
      console.log(`# 📚 도서 검색 결과: "${options.query}" (총 ${meta.total_count || books.length}건 검색됨)\n`);
      books.forEach((book, idx) => {
        const authors = (book.authors || []).join(', ') || '저자 미상';
        const translators = (book.translators || []).length > 0 ? ` (번역: ${book.translators.join(', ')})` : '';
        const date = book.datetime ? book.datetime.substring(0, 10) : '-';
        const price = book.price ? `${book.price.toLocaleString()}원` : '-';
        const salePrice = book.sale_price > 0 ? `**${book.sale_price.toLocaleString()}원**` : '할인 정보 없음';
        const localCover = imageDownloads[idx] ? `\n- **로컬 표지 경로**: \`${imageDownloads[idx]}\`` : '';

        console.log(`### ${idx + 1}. [${book.title}](${book.url || '#'})`);
        if (book.thumbnail) {
          console.log(`![${book.title}](${book.thumbnail})`);
        }
        console.log(`- **저자**: ${authors}${translators}`);
        console.log(`- **출판사**: ${book.publisher || '-'}`);
        console.log(`- **출판일**: ${date}`);
        console.log(`- **정가 / 판매가**: ${price} / ${salePrice}`);
        console.log(`- **ISBN**: \`${book.isbn || '-'}\``);
        if (book.status) console.log(`- **도서 상태**: ${book.status}`);
        if (localCover) console.log(localCover);
        if (book.contents) {
          console.log(`\n> **책 소개**: ${book.contents.trim()}...\n`);
        }
        console.log('---\n');
      });
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('오류: 요청 시간이 초과되었습니다 (10초).');
    } else {
      console.error('오류 발생:', error.message);
    }
    process.exit(1);
  }
}

const options = parseArgs();
searchBooks(options);
