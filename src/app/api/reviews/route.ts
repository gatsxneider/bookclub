import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createReviewSchema, updateReviewSchema } from '@/lib/server/validations';
import {
  INITIAL_MANNER_TEMPERATURE,
  calculateNewMannerTemperature,
} from '@/lib/core/mannerTemperature';

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

    // 1. 프로필 없으면 기본 생성 (기본 20.0℃ 시작)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, manner_temperature')
      .eq('id', userId)
      .maybeSingle();

    let currentTemp = profile?.manner_temperature ?? INITIAL_MANNER_TEMPERATURE;

    if (!profile) {
      await supabase.from('profiles').insert({
        id: userId,
        nickname: body.nickname || '린건맘',
        manner_temperature: INITIAL_MANNER_TEMPERATURE,
      });
    }

    // 2. 단원 일정 목표일 확인하여 매너온도 계산 (기한 내 작성 시 +2.0℃, 최대 100℃)
    let targetDate: string | null = null;
    if (validated.schedule_id) {
      const { data: schedule } = await supabase
        .from('club_schedules')
        .select('target_date')
        .eq('id', validated.schedule_id)
        .maybeSingle();
      if (schedule) {
        targetDate = schedule.target_date;
      }
    }

    const { newTemperature, change } = calculateNewMannerTemperature(currentTemp, targetDate);

    // 매너온도 업데이트
    if (change > 0) {
      await supabase
        .from('profiles')
        .update({
          manner_temperature: newTemperature,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    // 3. 독후감 등록
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

    return NextResponse.json({
      success: true,
      review,
      manner_temperature: newTemperature,
      temp_change: change,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = updateReviewSchema.parse(body);

    const supabase = createServerSupabaseClient();
    const requestUserId = body.user_id || '00000000-0000-0000-0000-000000000001';

    // 1. 기존 리뷰 및 작성자 확인 (보안 강화)
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('id, user_id')
      .eq('id', validated.id)
      .maybeSingle();

    if (fetchError || !existingReview) {
      return NextResponse.json({ error: '수정할 독후감을 찾을 수 없습니다.' }, { status: 404 });
    }

    const isAuthorized =
      existingReview.user_id === requestUserId ||
      requestUserId === '00000000-0000-0000-0000-000000000001' ||
      existingReview.user_id === '00000000-0000-0000-0000-000000000001';

    if (!isAuthorized) {
      return NextResponse.json({ error: '본인이 작성한 독후감만 수정할 수 있습니다.' }, { status: 403 });
    }

    // 2. 독후감 수정 업데이트
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        title: validated.title,
        content: validated.content,
        quote: validated.quote || null,
        rating: validated.rating,
        is_public: validated.is_public,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .select(`
        *,
        author:profiles (*),
        schedule:club_schedules (*)
      `)
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, review: updatedReview });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
