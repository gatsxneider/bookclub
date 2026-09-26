import { Book } from '@/types/database';

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
