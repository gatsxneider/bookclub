import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id;
    const body = await req.json();
    const { action, userId } = body;
    const supabase = createServerSupabaseClient();

    // 1. 해당 메시지 조회
    const { data: message, error: fetchErr } = await supabase
      .from('messages')
      .select('*, club:related_club_id (*)')
      .eq('id', messageId)
      .single();

    if (fetchErr || !message) {
      return NextResponse.json({ error: '쪽지를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 2. 읽음 처리
    if (action === 'mark_read') {
      if (userId && message.receiver_id !== userId) {
        return NextResponse.json({ error: '쪽지 수신자만 읽음 처리할 수 있습니다.' }, { status: 403 });
      }

      const { data: updated, error: updateErr } = await supabase
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: updated });
    }

    // 3. 가입 승인 처리
    if (action === 'approve_join') {
      const clubId = message.related_club_id;
      const applicantId = message.sender_id;

      if (!clubId || !applicantId) {
        return NextResponse.json({ error: '가입 요청 정보가 올바르지 않습니다.' }, { status: 400 });
      }

      // 클럽 방장 권한 확인
      const { data: club } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', clubId)
        .maybeSingle();

      if (!club) {
        return NextResponse.json({ error: '해당 독서클럽을 찾을 수 없습니다.' }, { status: 404 });
      }

      // 1) 멤버 등록 / 상태 approved 변경
      const { data: existingMember } = await supabase
        .from('club_members')
        .select('id')
        .eq('club_id', clubId)
        .eq('user_id', applicantId)
        .maybeSingle();

      if (existingMember) {
        await supabase
          .from('club_members')
          .update({
            status: 'approved',
            role: 'member',
          })
          .eq('id', existingMember.id);
      } else {
        await supabase
          .from('club_members')
          .insert({
            club_id: clubId,
            user_id: applicantId,
            role: 'member',
            status: 'approved',
          });
      }

      // 2) 메시지 상태를 approved로 갱신 및 읽음 처리
      await supabase
        .from('messages')
        .update({
          action_status: 'approved',
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      // 3) 신청 회원에게 "승인 완료" 쪽지 자동 발송
      await supabase.from('messages').insert({
        sender_id: message.receiver_id, // 방장이 보낸 것으로 처리
        receiver_id: applicantId,
        title: `🎉 '${club.name}' 클럽 가입이 승인되었습니다!`,
        content: `축하합니다! 방장님께서 '${club.name}' 독서클럽 가입 요청을 승인하셨습니다. 지금 바로 클럽에서 멤버들과 함께 책을 읽고 독후감을 나눠보세요.`,
        type: 'club_join_approved',
        related_club_id: clubId,
        is_read: false,
      });

      return NextResponse.json({
        success: true,
        message: '클럽 가입 승인이 완료되었으며 회원에게 쪽지가 발송되었습니다.',
      });
    }

    // 4. 가입 거절 처리
    if (action === 'reject_join') {
      const clubId = message.related_club_id;
      const applicantId = message.sender_id;

      await supabase
        .from('messages')
        .update({
          action_status: 'rejected',
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (applicantId && clubId) {
        const { data: club } = await supabase.from('clubs').select('name').eq('id', clubId).maybeSingle();
        const clubTitle = club?.name || '독서클럽';
        await supabase.from('messages').insert({
          sender_id: message.receiver_id,
          receiver_id: applicantId,
          title: `'${clubTitle}' 가입 신청 안내`,
          content: `아쉽게도 '${clubTitle}' 가입 신청이 수락되지 않았습니다. 다른 멋진 독서클럽도 탐색해보세요!`,
          type: 'general',
          related_club_id: clubId,
          is_read: false,
        });
      }

      return NextResponse.json({ success: true, message: '가입 요청이 거절되었습니다.' });
    }

    return NextResponse.json({ error: '유효하지 않은 액션입니다.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '쪽지 처리 실패' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id');
    const box = searchParams.get('box') || 'inbox'; // 'inbox' | 'sent'
    const supabase = createServerSupabaseClient();

    const { data: message, error: fetchErr } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchErr || !message) {
      return NextResponse.json({ error: '삭제할 쪽지를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 받은 쪽지함 삭제 시 receiver_deleted = true
    // 보낸 쪽지함 삭제 시 sender_deleted = true
    const updates: any = {};
    if (box === 'inbox' || message.receiver_id === userId) {
      updates.receiver_deleted = true;
    }
    if (box === 'sent' || message.sender_id === userId) {
      updates.sender_deleted = true;
    }

    const { error: updateErr } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', messageId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '쪽지 삭제 실패' }, { status: 500 });
  }
}
