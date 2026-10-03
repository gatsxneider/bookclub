import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/supabase/serverClient';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. 유저가 가입된 활성 클럽 조회
    const { data: userMemberships } = await supabase
      .from('club_members')
      .select('club_id, role, status, club:clubs(id, name, status)')
      .eq('user_id', userId)
      .eq('status', 'approved');

    if (!userMemberships || userMemberships.length === 0) {
      return NextResponse.json({ sentCount: 0 });
    }

    const clubIds = userMemberships.map((m: any) => m.club_id);

    // 2. target_date가 오늘 이전(마감/D-day 경과)인 일정들 조회
    const { data: pastSchedules } = await supabase
      .from('club_schedules')
      .select('id, club_id, sequence, chapter_title, target_date, club:clubs(id, name)')
      .in('club_id', clubIds)
      .not('target_date', 'is', null)
      .lt('target_date', todayStr);

    if (!pastSchedules || pastSchedules.length === 0) {
      return NextResponse.json({ sentCount: 0 });
    }

    // 3. 이미 해당 유저에게 보낸 D-day 쪽지가 있는지 확인
    const scheduleIds = pastSchedules.map((s) => s.id);
    const { data: existingMessages } = await supabase
      .from('messages')
      .select('related_schedule_id')
      .eq('receiver_id', userId)
      .eq('type', 'club_schedule_dday')
      .in('related_schedule_id', scheduleIds);

    const alreadyNotifiedScheduleIds = new Set(
      (existingMessages || []).map((m) => m.related_schedule_id)
    );

    const newMessagesToInsert = [];
    for (const schedule of pastSchedules) {
      if (!alreadyNotifiedScheduleIds.has(schedule.id)) {
        const clubName = (schedule.club as any)?.name || '독서클럽';
        newMessagesToInsert.push({
          sender_id: null, // 시스템 알림
          receiver_id: userId,
          title: `⏰ [D-day 알림] '${clubName}' [${schedule.sequence}단원] 일정 기한 안내`,
          content: `'${clubName}'의 [${schedule.sequence}단원: ${schedule.chapter_title}] 목표일(${schedule.target_date})이 지났습니다. 아직 기록하지 못한 독후감이 있다면 지금 바로 남겨보세요!`,
          type: 'club_schedule_dday',
          related_club_id: schedule.club_id,
          related_schedule_id: schedule.id,
          is_read: false,
        });
      }
    }

    if (newMessagesToInsert.length > 0) {
      await supabase.from('messages').insert(newMessagesToInsert);
    }

    return NextResponse.json({ sentCount: newMessagesToInsert.length });
  } catch (err: any) {
    console.warn('D-day check error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
