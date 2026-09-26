import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClubSchema } from '@/lib/server/validations';
import curatedData from '@/lib/constants/curatedBooks.json';
import { normalizeKakaoBook } from '@/lib/core/bookSearch';

export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: clubs, error } = await supabase
      .from('clubs')
      .select(`
        *,
        books (*),
        leader:profiles!clubs_leader_id_fkey (*),
        members:club_members (*),
        schedules:club_schedules (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase clubs fetch error:', error);
      return NextResponse.json({ clubs: [] });
    }

    return NextResponse.json({ clubs: clubs || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createClubSchema.parse(body);

    const supabase = createServerSupabaseClient();

    // 1. 도서 정보가 books 테이블에 없으면 upsert
    let bookData = body.book;
    if (!bookData) {
      // 큐레이션 데이터에서 조회
      Object.values(curatedData).forEach((list: any[]) => {
        const found = list.find((b: any) => (b.isbn || '').includes(validated.isbn));
        if (found) bookData = normalizeKakaoBook(found);
      });
    }

    if (bookData) {
      await supabase.from('books').upsert({
        isbn: validated.isbn,
        title: bookData.title || validated.name,
        authors: Array.isArray(bookData.authors) ? bookData.authors.join(', ') : bookData.authors || '',
        publisher: bookData.publisher || '',
        thumbnail_url: bookData.thumbnail || bookData.thumbnail_url || '',
        contents: bookData.contents || '',
        price: bookData.price || 0,
        sale_price: bookData.sale_price || 0,
        category: bookData.category || '',
        url: bookData.url || '',
      });
    }

    // 2. 현재 로그인 사용자 또는 기본 데모 사용자 ID 확인
    const leaderId = body.user_id || '00000000-0000-0000-0000-000000000001';

    // 3. profiles 테이블에 해당 유저가 없으면 기본 생성
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', leaderId)
      .single();

    if (!profile) {
      await supabase.from('profiles').insert({
        id: leaderId,
        nickname: body.nickname || '달빛책방지기',
        email: body.email || 'leader@cozybook.club',
        manner_temperature: 36.5,
        role: 'user',
      });
    }

    // 4. 클럽 생성
    const { data: newClub, error: clubError } = await supabase
      .from('clubs')
      .insert({
        leader_id: leaderId,
        isbn: validated.isbn,
        name: validated.name,
        description: validated.description || '',
        status: 'active',
        max_members: validated.max_members,
        start_date: validated.start_date || new Date().toISOString().split('T')[0],
        end_date: validated.end_date || null,
      })
      .select()
      .single();

    if (clubError) {
      return NextResponse.json({ error: clubError.message }, { status: 400 });
    }

    // 5. 방장을 club_members에 승인 상태로 등록
    await supabase.from('club_members').insert({
      club_id: newClub.id,
      user_id: leaderId,
      role: 'leader',
      status: 'approved',
    });

    return NextResponse.json({ success: true, club: newClub });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
