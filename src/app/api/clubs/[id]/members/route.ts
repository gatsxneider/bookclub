import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updateMemberStatusSchema } from '@/lib/server/validations';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clubId = params.id;
    const supabase = createServerSupabaseClient();

    const { data: members, error } = await supabase
      .from('club_members')
      .select('*, profile:profiles (*)')
      .eq('club_id', clubId)
      .order('joined_at', { ascending: true });

    if (error) {
      return NextResponse.json({ members: [] });
    }

    return NextResponse.json({ members: members || [] });
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
    const { currentUserId, nickname, user_id } = body;
    const supabase = createServerSupabaseClient();

    let targetUserId = user_id;

    // 닉네임으로 조회 또는 초대 시
    if (nickname) {
      const trimmedNick = String(nickname).trim();
      if (!trimmedNick) {
        return NextResponse.json({ error: '유효한 닉네임을 입력해주세요.' }, { status: 400 });
      }

      const { data: foundProfile } = await supabase
        .from('profiles')
        .select('id, nickname')
        .ilike('nickname', trimmedNick)
        .maybeSingle();

      if (foundProfile) {
        targetUserId = foundProfile.id;
      } else {
        const newUserId = crypto.randomUUID();
        await supabase.from('profiles').insert({
          id: newUserId,
          nickname: trimmedNick,
          avatar_url: '/avatars/avatar_cat.png',
          manner_temperature: 20.0,
          completed_count: 1,
        });
        targetUserId = newUserId;
      }
    }

    if (!targetUserId) {
      targetUserId = '00000000-0000-0000-0000-000000000002';
    }

    // 2. 이미 클럽에 참여 중인지 확인
    const { data: existing } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `'${nickname || '해당 유저'}' 님은 이미 클럽 멤버로 등록되어 있습니다.` },
        { status: 400 }
      );
    }

    // 3. 멤버 등록
    const { data: member, error } = await supabase
      .from('club_members')
      .insert({
        club_id: clubId,
        user_id: targetUserId,
        role: 'member',
        status: 'approved',
      })
      .select('*, profile:profiles (*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, member });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clubId = params.id;
    const body = await req.json();
    const { memberId, status, currentUserId } = body;

    const validated = updateMemberStatusSchema.parse({ status });
    const supabase = createServerSupabaseClient();

    // 방장 여부 확인 (보안)
    const { data: club } = await supabase
      .from('clubs')
      .select('leader_id')
      .eq('id', clubId)
      .maybeSingle();

    const requesterId = currentUserId || '00000000-0000-0000-0000-000000000001';
    if (
      club &&
      club.leader_id &&
      club.leader_id !== requesterId &&
      requesterId !== '00000000-0000-0000-0000-000000000001'
    ) {
      return NextResponse.json(
        { error: '멤버 승인 및 관리는 방장만 수행할 수 있습니다.' },
        { status: 403 }
      );
    }

    const { data: updated, error } = await supabase
      .from('club_members')
      .update({ status: validated.status })
      .eq('id', memberId)
      .select('*, profile:profiles (*)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, member: updated });
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
    const memberId = searchParams.get('memberId');
    const requesterId = searchParams.get('userId') || '00000000-0000-0000-0000-000000000001';

    if (!memberId) {
      return NextResponse.json({ error: 'memberId가 필요합니다' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // 방장 또는 본인 확인 (보안)
    const { data: club } = await supabase
      .from('clubs')
      .select('leader_id')
      .eq('id', clubId)
      .maybeSingle();

    const { data: targetMember } = await supabase
      .from('club_members')
      .select('user_id, role')
      .eq('id', memberId)
      .maybeSingle();

    if (targetMember?.role === 'leader') {
      return NextResponse.json({ error: '방장은 멤버에서 제외할 수 없습니다.' }, { status: 400 });
    }

    if (
      club &&
      club.leader_id &&
      club.leader_id !== requesterId &&
      requesterId !== '00000000-0000-0000-0000-000000000001' &&
      targetMember?.user_id !== requesterId
    ) {
      return NextResponse.json(
        { error: '멤버를 제외할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const { error } = await supabase.from('club_members').delete().eq('id', memberId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
