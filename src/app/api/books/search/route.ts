import { NextRequest, NextResponse } from 'next/server';
import { normalizeKakaoBook } from '@/lib/core/bookSearch';
import curatedData from '@/lib/constants/curatedBooks.json';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query')?.trim() || '';

    if (!query) {
      return NextResponse.json({ documents: [], total_count: 0 });
    }

    const apiKey = process.env.KAKAO_REST_API_KEY || 'd856f35d24b0386a87979522a0c5713e';

    // 1. 카카오 공식 도서 검색 API 호출
    try {
      const kakaoRes = await fetch(
        `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(query)}&size=20&target=title`,
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
        return NextResponse.json({
          documents,
          total_count: data.meta?.total_count || documents.length,
          source: 'kakao',
        });
      }
    } catch (e) {
      console.warn('카카오 API 연결 실패, 로컬 큐레이션 도서에서 폴백 검색을 수행합니다:', e);
    }

    // 2. 카카오 API 실패 시 또는 로컬 보완 폴백 검색
    const allCurated: any[] = [];
    Object.entries(curatedData).forEach(([cat, list]) => {
      list.forEach((b: any) => allCurated.push(normalizeKakaoBook(b, cat)));
    });

    const filtered = allCurated.filter(
      (b) =>
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.authors.some((a: string) => a.toLowerCase().includes(query.toLowerCase())) ||
        b.publisher.toLowerCase().includes(query.toLowerCase())
    );

    return NextResponse.json({
      documents: filtered.slice(0, 20),
      total_count: filtered.length,
      source: 'local_curated',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: '도서 검색 중 오류가 발생했습니다: ' + error.message },
      { status: 500 }
    );
  }
}
