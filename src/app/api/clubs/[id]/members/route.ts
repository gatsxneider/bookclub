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
    const userId = body.user_id || '00000000-0000-0000-0000-000000000002';
    const supabase = createServerSupabaseClient();

    // 1. 프로필 없으면 생성 (개인식별정보 배제: 닉네임만 보관)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) {
      await supabase.from('profiles').insert({
        id: userId,
        nickname: body.nickname || '새로운 독서가',
        manner_temperature: 36.5,
      });
    }

    // 2. 이미 신청/가입되어 있는지 확인
    const { data: existing } = await supabase
      .from('club_members')
      .select('*')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: '이미 클럽에 참여 중이거나 가입 승인 대기 중입니다.' },
        { status: 400 }
      );
    }

    // 3. 가입 신청
    const { data: member, error } = await supabase
      .from('club_members')
      .insert({
        club_id: clubId,
        user_id: userId,
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
    if (club && club.leader_id && club.leader_id !== requesterId) {
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
      .select('user_id')
      .eq('id', memberId)
      .maybeSingle();

    if (
      club &&
      club.leader_id !== requesterId &&
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
