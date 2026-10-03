import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/infrastructure/supabase/serverClient';

// Vercel Serverless Function 실행 옵션
export const maxDuration = 60; // 최대 60초 허용
export const dynamic = 'force-dynamic';

// 12개 카테고리별 대표 베스트셀러 도서 검색어 목록 (각 10권)
const CATEGORY_BESTSELLERS: Record<string, string[]> = {
  '01. 소설 / 문학': [
    '소년이 온다',
    '채식주의자',
    '불편한 편의점',
    '모순 양귀자',
    '작별하지 않는다',
    '달러구트 꿈 백화점',
    '아버지의 해방일지',
    '구의 증명',
    '아몬드 손원평',
    '흰 한강'
  ],
  '02. 시 / 에세이': [
    '꽃을 보듯 너를 본다',
    '기분이 태도가 되지 않게',
    '나로서 충분히 괜찮은 사람',
    '언어의 온도',
    '모든 순간이 너였다',
    '보이지 않는 곳에서 애쓰고 있는 당신을 위한 책',
    '내가 확실하게 아는 것들',
    '서른 살이 심리학에게 묻다',
    '1cm+',
    '어떤 하루 신준모'
  ],
  '03. 경제 / 경영': [
    '세이노의 가르침',
    '돈의 속성',
    '부의 추월차선',
    '부자 아빠 가난한 아빠',
    '역행자',
    '원칙 레이 달리오',
    '부자의 언어',
    '트렌드 코리아 2025',
    '월급쟁이 부자로 은퇴하라',
    '넥서스 유발 하라리'
  ],
  '04. 자기계발': [
    '데일 카네기 인간관계론',
    '아주 작은 습관의 힘',
    '타이탄의 도구들',
    '그릿',
    '원씽',
    '시작의 기술',
    '퓨처 셀프',
    '미움받을 용기',
    '도둑맞은 집중력',
    '마인드셋'
  ],
  '05. IT / 모바일 / 과학': [
    '코스모스 칼 세이건',
    '물고기는 존재하지 않는다',
    '클린 코드',
    '이기적 유전자',
    '침묵의 봄',
    '혼자 공부하는 파이썬',
    'Do it! 점프 투 파이썬',
    '거의 모든 것의 역사',
    '모두의 딥러닝',
    '면접을 위한 CS 전공지식 노트'
  ],
  '06. 인문 / 철학 / 심리': [
    '사피엔스',
    '마흔에 읽는 쇼펜하우어',
    '총 균 쇠',
    '정의란 무엇인가',
    '죽음의 수용소에서',
    '호모 데우스',
    '생각에 관한 생각',
    '군주론',
    '인간실격',
    '자유론'
  ],
  '07. 사회 / 정치 / 법률': [
    '공정하다는 착각',
    '지리의 힘',
    'EBS 다큐프라임 자본주의',
    '국가란 무엇인가',
    '팩트풀니스',
    '축적의 시간',
    '돈으로 살 수 없는 것들',
    '세습 중산층 사회',
    '클루지',
    '21세기 자본'
  ],
  '08. 취미 / 실용 / 라이프': [
    '백종원이 추천하는 집밥 메뉴 52',
    '방구석 미술관',
    '내 몸 혁명',
    '당뇨코드',
    '달리기 몰입의 즐거움',
    '하루 5분 미술관',
    '와인 상식 사전',
    '식물상담소',
    '오늘부터 미니멀 라이프',
    '진짜 기본 베이킹책'
  ],
  '09. 여행 / 지리': [
    '여행의 이유',
    '끌림 이병률',
    '바람이 분다 당신이 좋다',
    '먼 북소리',
    '나의 문화유산답사기 1',
    '인생수업 법륜',
    '리얼 제주',
    '산티아고 순례길',
    '이지 유럽',
    '걸어서 세계 속으로'
  ],
  '10. 예술 / 대중문화': [
    '방구석 미술관',
    '방구석 미술관 2',
    '난생 처음 한번 공부하는 미술 이야기',
    '서양미술사 곰브리치',
    '클래식은 처음이라',
    '영화는 두 번 시작된다',
    '사진학 강의',
    '클래식이 알고 싶다',
    '현대미술의 결정적 순간들',
    '쇼팽을 위하여'
  ],
  '11. 청소년 / 어린이': [
    '아몬드',
    '시간을 파는 상점',
    '마당을 나온 암탉',
    '자전거 도둑 박완서',
    '흔한남매 1',
    '이상한 과자 가게 전천당 1',
    '만복이네 떡집',
    '마법천자문 1',
    '모모',
    '나의 라임오렌지나무'
  ],
  '12. 어학 / 수험서 / 자격증': [
    '해커스 토익 기출 보카',
    'ETS 토익 정기시험 기출문제집 1000 LC',
    'ETS 토익 정기시험 기출문제집 1000 RC',
    '영어회화 100일의 기적',
    '시원스쿨 기초영어회화',
    '큰별쌤 최태성의 별별한국사 한국사능력검정시험 심화',
    '에듀윌 공인중개사 1차 기본서',
    '시나공 정보처리기사 실기',
    'JLPT 한권으로 끝내기 N3',
    '해커스 토익 스타트 RC'
  ]
};

async function searchBook(query: string, kakaoKey: string) {
  const url = `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(query)}&size=1`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${kakaoKey}`
      },
      next: { revalidate: 0 }
    });

    if (!res.ok) {
      console.error(`[Cron] Kakao API search failed for "${query}": ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    return data.documents && data.documents.length > 0 ? data.documents[0] : null;
  } catch (error) {
    console.error(`[Cron] Error searching book "${query}":`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  // 1. 보안 검증: Vercel Cron Secret 및 Authorization 헤더 확인
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // CRON_SECRET이 설정되어 있다면 반드시 일치해야 함 (외부 무단 접근 및 악의적 호출 차단)
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized: Invalid or missing CRON_SECRET token' },
      { status: 401 }
    );
  }

  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  if (!kakaoKey) {
    return NextResponse.json(
      { error: 'Server configuration error: KAKAO_REST_API_KEY is not defined' },
      { status: 500 }
    );
  }

  try {
    const supabase = createAdminSupabaseClient();
    const booksToUpsert: Array<{
      isbn: string;
      title: string;
      authors: string[];
      publisher: string;
      thumbnail: string;
      contents: string;
      price?: number;
      sale_price?: number;
      category: string;
      rank: number;
      url?: string;
      datetime?: string;
      updated_at: string;
    }> = [];

    for (const [category, queries] of Object.entries(CATEGORY_BESTSELLERS)) {
      for (let i = 0; i < queries.length; i++) {
        const query = queries[i];
        const doc = await searchBook(query, kakaoKey);
        if (doc) {
          const rawIsbn = doc.isbn ? doc.isbn.split(' ').pop() || doc.isbn : '';
          booksToUpsert.push({
            isbn: rawIsbn,
            title: doc.title || query,
            authors: Array.isArray(doc.authors) ? doc.authors : [],
            publisher: doc.publisher || '',
            thumbnail: doc.thumbnail || '',
            contents: doc.contents || '',
            price: doc.price || 0,
            sale_price: doc.sale_price || doc.price || 0,
            category: category,
            rank: i + 1,
            url: doc.url || '',
            datetime: doc.datetime || '',
            updated_at: new Date().toISOString()
          });
        }
        // Kakao API Rate Limiting 완화 (30ms 딜레이)
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
    }

    // Supabase curated_books 또는 books 테이블에 Upsert
    const { error: dbError } = await supabase
      .from('curated_books')
      .upsert(booksToUpsert, { onConflict: 'isbn,category' });

    if (dbError) {
      console.error('[Cron] DB Upsert error:', dbError);
      return NextResponse.json(
        {
          error: 'Database operation failed',
          details: dbError.message,
          collectedCount: booksToUpsert.length
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category top 10 bestsellers updated successfully',
      totalCount: booksToUpsert.length,
      updatedAt: new Date().toISOString()
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Cron] Unhandled exception:', errorMessage);
    return NextResponse.json(
      { error: 'Internal Server Error', message: errorMessage },
      { status: 500 }
    );
  }
}
