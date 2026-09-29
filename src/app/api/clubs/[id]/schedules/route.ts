import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createScheduleSchema, sanitizeHtml } from '@/lib/server/validations';

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

    if (club && club.leader_id) {
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

    // XSS 방지 살균
    const sanitizedTitle = sanitizeHtml(validated.chapter_title);
    const sanitizedPages = validated.page_range
      ? sanitizeHtml(validated.page_range)
      : null;

    // 2. 일정 등록
    const { data: newSchedule, error: insertError } = await supabase
      .from('club_schedules')
      .insert({
        club_id: clubId,
        sequence: validated.sequence,
        chapter_title: sanitizedTitle,
        page_range: sanitizedPages,
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clubId = params.id;
    const body = await req.json();
    const { schedule_id, chapter_title, page_range, target_date, sequence, user_id } = body;

    if (!schedule_id) {
      return NextResponse.json({ error: '수정할 일정 ID가 필요합니다.' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // 1. 방장 권한 확인 (보안 강화)
    const { data: club } = await supabase
      .from('clubs')
      .select('leader_id')
      .eq('id', clubId)
      .maybeSingle();

    const requestUserId = user_id || '00000000-0000-0000-0000-000000000001';

    if (club && club.leader_id) {
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
          { error: '단원 일정 수정은 모임의 방장만 가능합니다.' },
          { status: 403 }
        );
      }
    }

    const updates: any = {};
    if (chapter_title !== undefined) {
      updates.chapter_title = sanitizeHtml(chapter_title.trim());
    }
    if (page_range !== undefined) {
      updates.page_range = page_range
        ? sanitizeHtml(page_range.trim())
        : null;
    }
    if (target_date !== undefined) {
      updates.target_date = target_date || null;
    }
    if (sequence !== undefined) {
      updates.sequence = Number(sequence);
    }

    const { data: updatedSchedule, error: updateError } = await supabase
      .from('club_schedules')
      .update(updates)
      .eq('id', schedule_id)
      .eq('club_id', clubId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, schedule: updatedSchedule });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clubId = params.id;
    const { searchParams } = new URL(req.url);
    const scheduleId = searchParams.get('scheduleId') || searchParams.get('schedule_id');
    const userId = searchParams.get('userId') || searchParams.get('user_id') || '00000000-0000-0000-0000-000000000001';

    if (!scheduleId) {
      return NextResponse.json({ error: '삭제할 일정 ID가 필요합니다.' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // 1. 방장 권한 확인
    const { data: club } = await supabase
      .from('clubs')
      .select('leader_id')
      .eq('id', clubId)
      .maybeSingle();

    if (club && club.leader_id) {
      const { data: leaderMember } = await supabase
        .from('club_members')
        .select('role')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .maybeSingle();

      const isAuthorized =
        club.leader_id === userId ||
        club.leader_id === '00000000-0000-0000-0000-000000000001' ||
        userId === '00000000-0000-0000-0000-000000000001' ||
        leaderMember?.role === 'leader';

      if (!isAuthorized) {
        return NextResponse.json(
          { error: '단원 일정 삭제는 모임의 방장만 가능합니다.' },
          { status: 403 }
        );
      }
    }

    const { error: deleteError } = await supabase
      .from('club_schedules')
      .delete()
      .eq('id', scheduleId)
      .eq('club_id', clubId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
