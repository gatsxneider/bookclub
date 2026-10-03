import { describe, it, expect } from 'vitest';
import { normalizeKakaoBook, filterCuratedBooks, getAllCuratedBooks, pickRandomUnreadBook } from '../bookSearch';
import curatedData from '@/shared/data/curatedBooks.json';

describe('bookSearch', () => {
  it('카카오 API 원시 응답을 Book 모델 인터페이스로 정규화해야 한다', () => {
    const raw = {
      title: '불편한 편의점',
      authors: ['김호연'],
      publisher: '나무옆의자',
      isbn: '9791161571188',
      thumbnail: 'https://example.com/cover.jpg',
      contents: '서울역 노숙자 독고 씨의 이야기',
      price: 14000,
      sale_price: 12600,
    };

    const book = normalizeKakaoBook(raw, '01. 소설 / 문학');
    expect(book.title).toBe('불편한 편의점');
    expect(book.authors).toEqual(['김호연']);
    expect(book.isbn).toBe('9791161571188');
    expect(book.category).toBe('01. 소설 / 문학');
  });

  it('12개 카테고리 데이터에서 카테고리별 도서 목록을 필터링할 수 있어야 한다', () => {
    const novelBooks = filterCuratedBooks(curatedData, '01. 소설 / 문학');
    expect(novelBooks.length).toBe(10);
    expect(novelBooks[0].title).toBeDefined();

    const allBooks = filterCuratedBooks(curatedData, '전체');
    expect(allBooks.length).toBeGreaterThanOrEqual(10);
  });

  it('getAllCuratedBooks 및 pickRandomUnreadBook은 읽지 않은 도서를 정상 추천해야 한다', () => {
    const all = getAllCuratedBooks(curatedData);
    expect(all.length).toBeGreaterThan(0);

    const firstIsbn = all[0].isbn;
    const recommended = pickRandomUnreadBook(curatedData, new Set([firstIsbn]));
    expect(recommended).toBeDefined();
    if (all.length > 1) {
      expect(recommended?.isbn).not.toBe(firstIsbn);
    }
  });
});
