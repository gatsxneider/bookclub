import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createReviewSchema } from '@/lib/server/validations';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('club_id');
    const scheduleId = searchParams.get('schedule_id');
    const userId = searchParams.get('user_id');

    const supabase = createServerSupabaseClient();

    let query = supabase
      .from('reviews')
      .select(`
        *,
        author:profiles (*),
        schedule:club_schedules (*),
        club:clubs (*, book:books (*))
      `)
      .order('created_at', { ascending: false });

    if (clubId) {
      query = query.eq('club_id', clubId);
    }
    if (scheduleId) {
      query = query.eq('schedule_id', scheduleId);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: reviews, error } = await query;
    if (error) {
      console.warn('Reviews fetch error:', error);
      return NextResponse.json({ reviews: [] });
    }

    return NextResponse.json({ reviews: reviews || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createReviewSchema.parse(body);

    const supabase = createServerSupabaseClient();
    const userId = body.user_id || '00000000-0000-0000-0000-000000000001';

    // 1. 프로필 없으면 기본 생성 (개인식별정보 배제)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      await supabase.from('profiles').insert({
        id: userId,
        nickname: body.nickname || '지우',
        manner_temperature: 36.5,
      });
    }

    // 2. 독후감 등록
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        schedule_id: validated.schedule_id || null,
        club_id: validated.club_id || null,
        user_id: userId,
        title: validated.title,
        content: validated.content,
        quote: validated.quote || null,
        rating: validated.rating,
        is_public: validated.is_public,
      })
      .select(`
        *,
        author:profiles (*),
        schedule:club_schedules (*)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
