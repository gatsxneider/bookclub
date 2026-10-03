import { Book } from '@/domain/entities';

export function normalizeKakaoBook(raw: any, category?: string): Book {
  const isbn = typeof raw.isbn === 'string' ? raw.isbn.trim().split(' ').pop() || raw.isbn : String(raw.isbn || '');
  const authors = Array.isArray(raw.authors)
    ? raw.authors
    : typeof raw.authors === 'string'
    ? raw.authors.split(',').map((a: string) => a.trim())
    : [];

  return {
    isbn,
    title: raw.title || '',
    authors,
    publisher: raw.publisher || '',
    thumbnail: raw.thumbnail || raw.thumbnail_url || '',
    contents: raw.contents || '',
    price: raw.price ? Number(raw.price) : undefined,
    sale_price: raw.sale_price ? Number(raw.sale_price) : undefined,
    category: category || raw.category || '',
    url: raw.url || '',
    status: raw.status || '정상판매',
    datetime: raw.datetime || '',
  };
}

export function filterCuratedBooks(
  curatedData: Record<string, any[]>,
  selectedCategory: string
): Book[] {
  if (selectedCategory === '전체') {
    const allBooks: Book[] = [];
    Object.entries(curatedData).forEach(([cat, list]) => {
      list.forEach((item) => {
        allBooks.push(normalizeKakaoBook(item, cat));
      });
    });
    return allBooks;
  }

  const categoryList = curatedData[selectedCategory] || [];
  return categoryList.map((item) => normalizeKakaoBook(item, selectedCategory));
}

/**
 * 큐레이션 데이터 전체에서 중복 없는 도서 목록 추출
 */
export function getAllCuratedBooks(curatedData: Record<string, any[]>): Book[] {
  const allBooks: Book[] = [];
  const seenIsbns = new Set<string>();

  Object.entries(curatedData).forEach(([cat, list]) => {
    (list || []).forEach((item) => {
      const normalized = normalizeKakaoBook(item, cat);
      if (normalized.isbn && !seenIsbns.has(normalized.isbn)) {
        seenIsbns.add(normalized.isbn);
        allBooks.push(normalized);
      }
    });
  });

  return allBooks;
}

/**
 * 회원이 읽지 않은(참여/완독하지 않은) 도서 중 랜덤으로 1권 추천
 */
export function pickRandomUnreadBook(
  curatedData: Record<string, any[]>,
  readIsbns: Set<string> | string[] = new Set()
): Book | null {
  const allBooks = getAllCuratedBooks(curatedData);
  if (allBooks.length === 0) return null;

  const isbnSet = readIsbns instanceof Set ? readIsbns : new Set(readIsbns);
  const unreadBooks = allBooks.filter((b) => !isbnSet.has(b.isbn));

  const candidatePool = unreadBooks.length > 0 ? unreadBooks : allBooks;
  const randomIndex = Math.floor(Math.random() * candidatePool.length);
  return candidatePool[randomIndex] || allBooks[0];
}
