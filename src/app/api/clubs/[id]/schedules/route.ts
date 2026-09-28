import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createScheduleSchema } from '@/lib/server/validations';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clubId = params.id;
    const supabase = createServerSupabaseClient();

    const { data: schedules, error } = await supabase
      .from('club_schedules')
      .select('*, reviews (count)')
      .eq('club_id', clubId)
      .order('sequence', { ascending: true });

    if (error) {
      return NextResponse.json({ schedules: [] });
    }

    const formatted = (schedules || []).map((s: any) => ({
      ...s,
      reviews_count: s.reviews?.[0]?.count || 0,
    }));

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

    // 클럽이 존재하고 방장 ID가 일치하는지 검증
    if (club && club.leader_id && club.leader_id !== requestUserId) {
      return NextResponse.json(
        { error: '단원 일정은 모임의 방장만 추가할 수 있습니다.' },
        { status: 403 }
      );
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
