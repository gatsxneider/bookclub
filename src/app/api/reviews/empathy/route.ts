import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/supabase/serverClient';
import { checkCanEmpathize, MAX_EMPATHY_COUNT } from '@/domain/rules/empathy';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { review_id, user_id } = body;

    if (!review_id) {
      return NextResponse.json({ error: 'review_id가 필요합니다.' }, { status: 400 });
    }

    const currentUserId = user_id || req.headers.get('x-user-id');
    if (!currentUserId) {
      return NextResponse.json({ error: '로그인이 필요한 기능입니다.' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // 1. 독후감 존재 여부 및 작성자 확인
    const { data: review, error: reviewErr } = await supabase
      .from('reviews')
      .select('id, user_id, likes_count')
      .eq('id', review_id)
      .maybeSingle();

    if (reviewErr || !review) {
      return NextResponse.json({ error: '독후감을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 2. 기존 사용자의 공감 기록 확인
    const { data: existingEmpathy } = await supabase
      .from('review_empathies')
      .select('id, count')
      .eq('review_id', review_id)
      .eq('user_id', currentUserId)
      .maybeSingle();

    const currentCount = existingEmpathy?.count || 0;

    // 3. 비즈니스 룰 검증
    const check = checkCanEmpathize(review.user_id, currentUserId, currentCount);
    if (!check.allowed) {
      if (check.reason === 'self_review') {
        return NextResponse.json(
          { error: '본인이 작성한 독후감에는 공감할 수 없습니다.' },
          { status: 400 }
        );
      }
      if (check.reason === 'max_reached') {
        return NextResponse.json(
          { error: `한 독후감당 최대 ${MAX_EMPATHY_COUNT}회까지만 공감할 수 있습니다.` },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: '공감할 수 없습니다.' }, { status: 400 });
    }

    const newEmpathyCount = currentCount + 1;
    const newTotalLikes = (review.likes_count || 0) + 1;

    // 4. review_empathies 업서트 (upsert)
    if (existingEmpathy) {
      const { error: updateErr } = await supabase
        .from('review_empathies')
        .update({
          count: newEmpathyCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingEmpathy.id);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    } else {
      const { error: insertErr } = await supabase
        .from('review_empathies')
        .insert({
          review_id,
          user_id: currentUserId,
          count: newEmpathyCount,
        });

      if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    }

    // 5. reviews 테이블 likes_count 갱신
    await supabase
      .from('reviews')
      .update({
        likes_count: newTotalLikes,
      })
      .eq('id', review_id);

    return NextResponse.json({
      success: true,
      my_empathy_count: newEmpathyCount,
      message: `공감했습니다! (${newEmpathyCount}/${MAX_EMPATHY_COUNT})`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || '서버 오류' }, { status: 500 });
  }
}
