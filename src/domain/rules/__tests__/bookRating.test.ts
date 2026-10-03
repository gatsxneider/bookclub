import { describe, it, expect } from 'vitest';
import { calculateBookRatings } from '../bookRating';

describe('calculateBookRatings', () => {
  it('도서별 평점들의 평균(소수점 1자리 반올림)과 개수를 정확하게 계산해야 한다', () => {
    const rawItems = [
      { isbn: '9788936434120', rating: 5 },
      { isbn: '9788936434120', rating: 4 },
      { isbn: '9788936434120', rating: 5 },
      { isbn: '9788954682152', rating: 3 },
      { isbn: '9788954682152', rating: 4 },
    ];

    const result = calculateBookRatings(rawItems);

    expect(result['9788936434120']).toBeDefined();
    expect(result['9788936434120'].average).toBe(4.7); // (5+4+5)/3 = 4.666... -> 4.7
    expect(result['9788936434120'].count).toBe(3);

    expect(result['9788954682152']).toBeDefined();
    expect(result['9788954682152'].average).toBe(3.5);
    expect(result['9788954682152'].count).toBe(2);
  });

  it('유효하지 않은 평점이나 ISBN이 없는 데이터는 제외해야 한다', () => {
    const rawItems = [
      { isbn: null, rating: 5 },
      { isbn: '9788936434120', rating: null },
      { isbn: '9788936434120', rating: 0 },
      { isbn: '9788936434120', rating: 6 },
      { isbn: '9788936434120', rating: 4 },
    ];

    const result = calculateBookRatings(rawItems);
    expect(result['9788936434120']).toBeDefined();
    expect(result['9788936434120'].average).toBe(4.0);
    expect(result['9788936434120'].count).toBe(1);
  });

  it('평점 데이터가 없으면 빈 객체를 반환해야 한다', () => {
    const result = calculateBookRatings([]);
    expect(result).toEqual({});
  });
});
