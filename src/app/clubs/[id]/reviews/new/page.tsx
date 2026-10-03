'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/presentation/components/Navbar';
import ReviewEditor from '@/presentation/components/ReviewEditor';
import AuthModal from '@/presentation/components/AuthModal';
import { ClubSchedule, Club, Review } from '@/domain/entities';
import { useAuth } from '@/presentation/context/AuthContext';
import { apiClient } from '@/presentation/lib/apiClient';

function NewReviewContent({ clubId }: { clubId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialScheduleId = searchParams.get('scheduleId') || '';
  const { user, refreshProfile } = useAuth();

  const [club, setClub] = useState<Club | null>(null);
  const [schedules, setSchedules] = useState<ClubSchedule[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [fetchingReview, setFetchingReview] = useState(false);

  useEffect(() => {
    const fetchClubAndSchedules = async () => {
      try {
        const clubData = await apiClient.get<{ club: Club }>(`/api/clubs/${clubId}`).catch(() => null);
        if (clubData?.club) {
          setClub(clubData.club);
          if (clubData.club.schedules && clubData.club.schedules.length > 0) {
            setSchedules(clubData.club.schedules);
            return;
          }
        }

        const schedData = await apiClient.get<{ schedules: ClubSchedule[] }>(`/api/clubs/${clubId}/schedules`).catch(() => null);
        if (schedData?.schedules && schedData.schedules.length > 0) {
          setSchedules(schedData.schedules);
        }
      } catch (err) {
        console.warn('Fetch error:', err);
      }
    };

    fetchClubAndSchedules();
  }, [clubId]);

  // 기존에 작성한 독후감이 있는지 확인 (작성 완료 상태에서 수정 진입 시)
  useEffect(() => {
    const checkExistingReview = async () => {
      if (!user?.id) {
        setExistingReview(null);
        return;
      }
      setFetchingReview(true);
      try {
        const query: Record<string, string> = {
          club_id: clubId,
          user_id: user.id,
        };
        if (initialScheduleId) {
          query.schedule_id = initialScheduleId;
        }

        const data = await apiClient.get<{ reviews: Review[] }>('/api/reviews', query);
        if (data.reviews && data.reviews.length > 0) {
          // 해당 스케줄의 가장 최근 리뷰
          const myReview = initialScheduleId
            ? data.reviews.find((r: Review) => r.schedule_id === initialScheduleId) || data.reviews[0]
            : data.reviews[0];
          setExistingReview(myReview);
          return;
        }
        setExistingReview(null);
      } catch (err) {
        console.warn('Error checking existing review:', err);
        setExistingReview(null);
      } finally {
        setFetchingReview(false);
      }
    };

    checkExistingReview();
  }, [clubId, initialScheduleId, user?.id]);

  const handleSubmit = async (reviewData: {
    schedule_id?: string;
    title: string;
    content: string;
    quote?: string;
    rating: number;
    is_public: boolean;
  }) => {
    if (!user) {
      alert('독후감을 등록하려면 먼저 로그인해 주세요.');
      setIsAuthOpen(true);
      return;
    }

    try {
      if (existingReview?.id) {
        // 기존 독후감 수정 (PATCH) - JWT 자동 첨부
        await apiClient.patch<{
          success: boolean;
          review: Review;
          book_rating?: number;
        }>('/api/reviews', {
          id: existingReview.id,
          ...reviewData,
        });

        alert('독후감이 성공적으로 수정되었습니다! 🌿');
      } else {
        // 신규 독후감 등록 (POST) - JWT 자동 첨부
        const data = await apiClient.post<{
          success: boolean;
          review: Review;
          manner_temperature: number;
          temp_change: number;
          is_club_completed: boolean;
          level?: number;
        }>('/api/reviews', {
          ...reviewData,
          club_id: clubId,
        });

        // 매너 온도 및 완독 레벨 상태 즉시 동기화
        await refreshProfile();

        const tempNotice = data.temp_change
          ? `\n🌡️ 감성 온도가 +${data.temp_change}℃ 상승하여 ${data.manner_temperature}℃가 되었습니다!`
          : '';

        const completionNotice = data.is_club_completed
          ? `\n\n🎉 [완독 달성] 이 독서클럽의 모든 단원을 완독하셨습니다!\n독서 레벨이 Lv.${data.level || 2}로 상승했습니다! 👑`
          : '';

        alert(`독후감이 성공적으로 발행되었습니다! 🌿${tempNotice}${completionNotice}`);
      }

      router.push(`/clubs/${clubId}`);
    } catch (err: any) {
      alert(err.message || '독후감 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar
        onOpenSearch={() => {}}
        onOpenNewClub={() => {}}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main id="main-content" tabIndex={-1} className="w-full pt-20 sm:pt-24 pb-20 sm:pb-16 flex-1 pb-mobile-nav">
        <div className="max-w-4xl mx-auto px-gutter">
          {fetchingReview ? (
            <div className="py-20 text-center text-primary flex items-center justify-center gap-2">
              <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
              <span className="text-sm font-medium">독후감 정보를 불러오는 중...</span>
            </div>
          ) : (
            <ReviewEditor
              clubId={clubId}
              schedules={schedules}
              selectedScheduleId={initialScheduleId || (existingReview?.schedule_id || undefined)}
              bookTitle={club?.book?.title || '선정 도서'}
              clubName={club?.name || '코지 북클럽'}
              authorNickname={user?.nickname || '회원'}
              initialTitle={existingReview?.title || ''}
              initialContent={existingReview?.content || ''}
              initialQuote={existingReview?.quote || ''}
              initialRating={existingReview?.rating || 0}
              initialIsPublic={existingReview?.is_public ?? true}
              isEditMode={Boolean(existingReview?.id)}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function NewReviewPage({ params }: { params: { id: string } }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="flex items-center gap-2 text-primary font-medium text-sm">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <span>작성 에디터를 불러오는 중...</span>
          </div>
        </div>
      }
    >
      <NewReviewContent clubId={params.id} />
    </Suspense>
  );
}
