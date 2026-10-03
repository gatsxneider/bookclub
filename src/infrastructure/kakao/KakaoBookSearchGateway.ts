import { Book } from '@/domain/entities';
import { IBookSearchGateway } from '@/domain/repositories';
import { normalizeKakaoBook } from '@/domain/rules/bookSearch';
import curatedData from '@/shared/data/curatedBooks.json';

export class KakaoBookSearchGateway implements IBookSearchGateway {
  async search(query: string): Promise<{ documents: Book[]; total_count: number; source: string }> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { documents: [], total_count: 0, source: 'none' };
    }

    const apiKey = process.env.KAKAO_REST_API_KEY;

    // 1. 카카오 API 키가 설정되어 있으면 카카오 API 호출
    if (apiKey) {
      try {
        const kakaoRes = await fetch(
          `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(trimmed)}&size=20&target=title`,
          {
            headers: {
              Authorization: `KakaoAK ${apiKey}`,
            },
            next: { revalidate: 3600 },
          }
        );

        if (kakaoRes.ok) {
          const data = await kakaoRes.json();
          const documents = (data.documents || []).map((doc: any) => normalizeKakaoBook(doc));
          return {
            documents,
            total_count: data.meta?.total_count || documents.length,
            source: 'kakao',
          };
        }
      } catch (e) {
        console.warn('카카오 API 검색 실패, 로컬 큐레이션 도서 폴백 사용:', e);
      }
    }

    // 2. 로컬 큐레이션 도서 데이터에서 폴백 검색
    const allCurated: Book[] = [];
    Object.entries(curatedData).forEach(([cat, list]) => {
      (list as any[]).forEach((b: any) => allCurated.push(normalizeKakaoBook(b, cat)));
    });

    const lower = trimmed.toLowerCase();
    const filtered = allCurated.filter(
      (b) =>
        b.title.toLowerCase().includes(lower) ||
        b.authors.some((a: string) => a.toLowerCase().includes(lower)) ||
        b.publisher.toLowerCase().includes(lower)
    );

    return {
      documents: filtered.slice(0, 20),
      total_count: filtered.length,
      source: 'local_curated',
    };
  }
}
