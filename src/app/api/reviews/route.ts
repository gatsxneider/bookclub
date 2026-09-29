import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createReviewSchema, updateReviewSchema } from '@/lib/server/validations';
import {
  INITIAL_MANNER_TEMPERATURE,
  calculateNewMannerTemperature,
  calculateUserLevel,
} from '@/lib/core/mannerTemperature';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('club_id');
    const scheduleId = searchParams.get('schedule_id');
    const userId = searchParams.get('user_id');
    const viewerId = searchParams.get('viewer_id');

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

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ reviews: [] });
    }

    const effectiveViewerId = viewerId || userId;

    // viewerId가 있는 경우 사용자가 누른 공감 수(my_empathy_count) 조회
    let userEmpathiesMap: Record<string, number> = {};
    if (effectiveViewerId) {
      const reviewIds = reviews.map((r) => r.id);
      const { data: empathies } = await supabase
        .from('review_empathies')
        .select('review_id, count')
        .in('review_id', reviewIds)
        .eq('user_id', effectiveViewerId);

      if (empathies) {
        empathies.forEach((e) => {
          userEmpathiesMap[e.review_id] = e.count;
        });
      }
    }

    // 보안 및 프라이버시 처리:
    // 총 공감 건수(likes_count)는 본인의 독후감(rev.user_id === effectiveViewerId)에 한해서만 제공.
    // 타인의 독후감에는 likes_count를 숨겨서(undefined) 본인 외에는 알 수 없도록 보호.
    const processedReviews = reviews.map((rev) => {
      const isMyReview = Boolean(effectiveViewerId && rev.user_id === effectiveViewerId);
      return {
        ...rev,
        my_empathy_count: userEmpathiesMap[rev.id] || 0,
        likes_count: isMyReview ? (rev.likes_count || 0) : undefined,
      };
    });

    return NextResponse.json({ reviews: processedReviews });
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
      .select('id, manner_temperature, completed_count')
      .eq('id', userId)
      .maybeSingle();

    let currentTemp = profile?.manner_temperature != null
      ? Number(profile.manner_temperature)
      : INITIAL_MANNER_TEMPERATURE;

    if (!profile) {
      await supabase.from('profiles').insert({
        id: userId,
        nickname: body.nickname || '독서가',
        manner_temperature: INITIAL_MANNER_TEMPERATURE,
        completed_count: 1,
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

    // 4. 완독 여부 판별 및 독서 레벨(completed_count) 승급 + 개인별 도서 전체 평점 저장
    let isClubCompleted = false;
    let newCompletedCount = profile?.completed_count != null ? Number(profile.completed_count) : 1;
    let newLevel = calculateUserLevel(newCompletedCount);
    let bookRating: number | null = null;

    if (validated.club_id) {
      const { data: allSchedules } = await supabase
        .from('club_schedules')
        .select('id')
        .eq('club_id', validated.club_id);

      if (allSchedules && allSchedules.length > 0) {
        const { data: userReviews } = await supabase
          .from('reviews')
          .select('id, schedule_id, rating')
          .eq('club_id', validated.club_id)
          .eq('user_id', userId);

        const reviewedScheduleIds = new Set(
          (userReviews || []).map((r) => r.schedule_id).filter(Boolean)
        );
        if (validated.schedule_id) {
          reviewedScheduleIds.add(validated.schedule_id);
        }

        const allFinished = allSchedules.every((s) => reviewedScheduleIds.has(s.id));
        if (allFinished) {
          isClubCompleted = true;
          // 완독 달성 시 완독 횟수 1 증가 및 레벨 승급
          newCompletedCount = Math.max(newCompletedCount + 1, 2);
          newLevel = calculateUserLevel(newCompletedCount);

          await supabase
            .from('profiles')
            .update({
              completed_count: newCompletedCount,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

          // 개인별 전체 평점 계산: 단원별 평점의 평균 (소수점 첫째자리 반올림)
          const validRatings: number[] = [];
          (userReviews || []).forEach((r) => {
            if (r.id !== review.id && typeof r.rating === 'number') {
              validRatings.push(r.rating);
            }
          });
          if (typeof validated.rating === 'number') {
            validRatings.push(validated.rating);
          }

          if (validRatings.length > 0) {
            const sum = validRatings.reduce((acc, cur) => acc + cur, 0);
            bookRating = Math.round((sum / validRatings.length) * 10) / 10;
          } else {
            bookRating = validated.rating;
          }

          // club_members 테이블에 완독 여부 및 개인별 전체 평점 저장
          await supabase
            .from('club_members')
            .update({
              is_completed: true,
              book_rating: bookRating,
              completed_at: new Date().toISOString(),
            })
            .eq('club_id', validated.club_id)
            .eq('user_id', userId);

          // user_book_ratings 테이블에 저장 (향후 통계/마이페이지 등에서 독립적 활용 가능)
          const { data: clubInfo } = await supabase
            .from('clubs')
            .select('isbn')
            .eq('id', validated.club_id)
            .maybeSingle();

          await supabase
            .from('user_book_ratings')
            .upsert({
              user_id: userId,
              club_id: validated.club_id,
              isbn: clubInfo?.isbn || null,
              rating: bookRating,
              is_completed: true,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id, club_id' });
        }
      }
    }

    return NextResponse.json({
      success: true,
      review,
      manner_temperature: newTemperature,
      temp_change: change,
      is_club_completed: isClubCompleted,
      book_rating: bookRating,
      completed_count: newCompletedCount,
      level: newLevel,
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
      .select('id, user_id, club_id, schedule_id')
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

    // 3. 완독 상태인 경우 전체 평점(개인별) 재계산 및 갱신
    let updatedBookRating: number | null = null;
    const targetClubId = existingReview.club_id;
    const targetUserId = existingReview.user_id;

    if (targetClubId) {
      const { data: allSchedules } = await supabase
        .from('club_schedules')
        .select('id')
        .eq('club_id', targetClubId);

      if (allSchedules && allSchedules.length > 0) {
        const { data: userReviews } = await supabase
          .from('reviews')
          .select('id, schedule_id, rating')
          .eq('club_id', targetClubId)
          .eq('user_id', targetUserId);

        const reviewedScheduleIds = new Set(
          (userReviews || []).map((r) => r.schedule_id).filter(Boolean)
        );

        const allFinished = allSchedules.every((s) => reviewedScheduleIds.has(s.id));
        if (allFinished && userReviews && userReviews.length > 0) {
          const validRatings = userReviews
            .map((r) => (r.id === validated.id ? validated.rating : r.rating))
            .filter((r): r is number => typeof r === 'number');

          if (validRatings.length > 0) {
            const sum = validRatings.reduce((acc, cur) => acc + cur, 0);
            updatedBookRating = Math.round((sum / validRatings.length) * 10) / 10;

            await supabase
              .from('club_members')
              .update({
                book_rating: updatedBookRating,
              })
              .eq('club_id', targetClubId)
              .eq('user_id', targetUserId);

            await supabase
              .from('user_book_ratings')
              .update({
                rating: updatedBookRating,
                updated_at: new Date().toISOString(),
              })
              .eq('club_id', targetClubId)
              .eq('user_id', targetUserId);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      review: updatedReview,
      book_rating: updatedBookRating,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
