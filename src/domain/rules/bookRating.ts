export interface BookRatingSummary {
  average: number;
  count: number;
}

export interface RawRatingItem {
  isbn?: string | null;
  rating?: number | null;
}

/**
 * 도서별 회원 평점 데이터를 집계하여 ISBN별 평균 평점과 리뷰 수를 계산합니다.
 * @param items 각 리뷰 또는 완독 평점 항목 배열
 * @returns ISBN을 키로 하고 평균 평점(소수점 첫째자리 반올림)과 개수를 가진 객체
 */
export function calculateBookRatings(
  items: RawRatingItem[]
): Record<string, BookRatingSummary> {
  const map: Record<string, { total: number; count: number }> = {};

  for (const item of items) {
    if (!item.isbn) continue;
    const rating = typeof item.rating === 'number' ? item.rating : Number(item.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) continue;

    const key = item.isbn.trim();
    if (!key) continue;

    if (!map[key]) {
      map[key] = { total: 0, count: 0 };
    }
    map[key].total += rating;
    map[key].count += 1;
  }

  const result: Record<string, BookRatingSummary> = {};
  for (const [isbn, data] of Object.entries(map)) {
    if (data.count > 0) {
      const average = Math.round((data.total / data.count) * 10) / 10;
      result[isbn] = {
        average,
        count: data.count,
      };
    }
  }

  return result;
}
