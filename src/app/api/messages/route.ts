import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createMessageSchema } from '@/lib/server/validations';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || searchParams.get('user_id');
    const box = searchParams.get('box') || 'inbox'; // 'inbox' | 'sent' | 'unread_count'

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // 1. 읽지 않은 쪽지 개수만 반환
    if (box === 'unread_count') {
      const { count, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('receiver_deleted', false)
        .eq('is_read', false);

      if (error) {
        console.warn('Unread count fetch error:', error);
        return NextResponse.json({ unreadCount: 0 });
      }

      return NextResponse.json({ unreadCount: count || 0 });
    }

    // 2. 보낸 쪽지함
    if (box === 'sent') {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          receiver:receiver_id (
            id, nickname, avatar_url, manner_temperature, completed_count
          ),
          club:related_club_id (
            id, name, isbn, leader_id, status,
            book:books (*)
          ),
          schedule:related_schedule_id (
            id, sequence, chapter_title, target_date
          )
        `)
        .eq('sender_id', userId)
        .eq('sender_deleted', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Sent messages fetch error:', error);
        return NextResponse.json({ messages: [] });
      }

      return NextResponse.json({ messages: messages || [] });
    }

    // 3. 받은 쪽지함 (기본)
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (
          id, nickname, avatar_url, manner_temperature, completed_count
        ),
        club:related_club_id (
          id, name, isbn, leader_id, status,
          book:books (*)
        ),
        schedule:related_schedule_id (
          id, sequence, chapter_title, target_date
        )
      `)
      .eq('receiver_id', userId)
      .eq('receiver_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Inbox messages fetch error:', error);
      return NextResponse.json({ messages: [] });
    }

    return NextResponse.json({ messages: messages || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '쪽지 목록 조회 실패' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createMessageSchema.parse(body);
    const supabase = createServerSupabaseClient();

    let targetReceiverId = validated.receiver_id;

    // 닉네임으로 수신자 지정한 경우
    if (!targetReceiverId && validated.receiver_nickname) {
      const trimmedNick = validated.receiver_nickname.trim();
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, nickname')
        .ilike('nickname', trimmedNick)
        .maybeSingle();

      if (!profile) {
        return NextResponse.json(
          { error: `'${trimmedNick}' 닉네임을 가진 회원을 찾을 수 없습니다.` },
          { status: 404 }
        );
      }
      targetReceiverId = profile.id;
    }

    if (!targetReceiverId) {
      return NextResponse.json({ error: '쪽지를 받을 회원을 지정해주세요.' }, { status: 400 });
    }

    // 자기 자신에게 쪽지 보내기 방지 (일반 쪽지일 때)
    if (validated.type === 'general' && validated.sender_id && validated.sender_id === targetReceiverId) {
      return NextResponse.json({ error: '자기 자신에게는 쪽지를 보낼 수 없습니다.' }, { status: 400 });
    }

    const actionStatus = validated.type === 'club_join_request' ? 'pending' : null;

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: validated.sender_id || null,
        receiver_id: targetReceiverId,
        title: validated.title,
        content: validated.content,
        type: validated.type,
        related_club_id: validated.related_club_id || null,
        related_schedule_id: validated.related_schedule_id || null,
        action_status: actionStatus,
        is_read: false,
        sender_deleted: false,
        receiver_deleted: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '쪽지 전송 실패' }, { status: 400 });
  }
}
