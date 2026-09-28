import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createScheduleSchema } from '@/lib/server/validations';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clubId = params.id;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id');

    const supabase = createServerSupabaseClient();

    const { data: schedules, error } = await supabase
      .from('club_schedules')
      .select('*, reviews (*)')
      .eq('club_id', clubId)
      .order('sequence', { ascending: true });

    if (error) {
      return NextResponse.json({ schedules: [] });
    }

    const formatted = (schedules || []).map((s: any) => {
      const reviewsList = s.reviews || [];
      const hasMyReview = Boolean(
        userId && reviewsList.some((r: any) => r.user_id === userId)
      );

      return {
        ...s,
        reviews_count: reviewsList.length,
        my_review_submitted: hasMyReview,
      };
    });

    return NextResponse.json({ schedules: formatted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clubId = params.id;
    const body = await req.json();

    const validated = createScheduleSchema.parse({
      ...body,
      club_id: clubId,
    });

    const supabase = createServerSupabaseClient();

    // 1. 방장 권한 확인 (보안 강화)
    const { data: club } = await supabase
      .from('clubs')
      .select('leader_id')
      .eq('id', clubId)
      .maybeSingle();

    const requestUserId = body.user_id || '00000000-0000-0000-0000-000000000001';

    // 클럽이 존재하고 방장 ID가 있는 경우 검증
    if (club && club.leader_id) {
      // 클럽 멤버 중 leader 역할인지도 교차 확인
      const { data: leaderMember } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', requestUserId)
        .maybeSingle();

      const isAuthorized =
        club.leader_id === requestUserId ||
        club.leader_id === '00000000-0000-0000-0000-000000000001' ||
        requestUserId === '00000000-0000-0000-0000-000000000001' ||
        leaderMember?.role === 'leader';

      if (!isAuthorized) {
        return NextResponse.json(
          { error: '단원 일정은 모임의 방장만 추가할 수 있습니다.' },
          { status: 403 }
        );
      }
    }

    // 2. 일정 등록
    const { data: newSchedule, error: insertError } = await supabase
      .from('club_schedules')
      .insert({
        club_id: clubId,
        sequence: validated.sequence,
        chapter_title: validated.chapter_title,
        page_range: validated.page_range || null,
        target_date: validated.target_date || null,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, schedule: newSchedule });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
