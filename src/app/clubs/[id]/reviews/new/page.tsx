'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ReviewEditor from '@/components/ReviewEditor';
import AuthModal from '@/components/AuthModal';
import { ClubSchedule, Club } from '@/types/database';
import { useAuth } from '@/context/AuthContext';

function NewReviewContent({ clubId }: { clubId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialScheduleId = searchParams.get('scheduleId') || '';
  const { user } = useAuth();

  const [club, setClub] = useState<Club | null>(null);
  const [schedules, setSchedules] = useState<ClubSchedule[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const fetchClubAndSchedules = async () => {
      try {
        const clubRes = await fetch(`/api/clubs/${clubId}`);
        if (clubRes.ok) {
          const clubData = await clubRes.json();
          if (clubData.club) {
            setClub(clubData.club);
            if (clubData.club.schedules) {
              setSchedules(clubData.club.schedules);
              return;
            }
          }
        }

        const res = await fetch(`/api/clubs/${clubId}/schedules`);
        if (res.ok) {
          const data = await res.json();
          if (data.schedules && data.schedules.length > 0) {
            setSchedules(data.schedules);
          }
        }
      } catch (err) {
        console.warn('Fetch error:', err);
      }
    };

    fetchClubAndSchedules();
  }, [clubId]);

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
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewData,
          club_id: clubId,
          user_id: user.id,
          nickname: user.nickname,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '독후감 저장 실패');
      }

      alert('독후감이 성공적으로 발행되었습니다! 🌿');
      router.push(`/clubs/${clubId}`);
    } catch (err: any) {
      alert(err.message || '독후감 발행 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar
        onOpenSearch={() => {}}
        onOpenNewClub={() => {}}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="w-full pt-24 pb-16 flex-1">
        <div className="max-w-4xl mx-auto px-gutter">
          <ReviewEditor
            schedules={schedules}
            selectedScheduleId={initialScheduleId}
            bookTitle={club?.book?.title || '선정 도서'}
            clubName={club?.name || '코지 북클럽'}
            authorNickname={user?.nickname || '회원'}
            initialTitle="불편함 속에서 길어 올린 가장 다정한 온기 — 4단원을 읽고"
            initialContent={`밤 11시, 편의점의 노란 불빛 아래 서 있는 독고 씨를 보며 문득 나의 일상을 돌아보게 되었습니다.
그는 기억을 잃었지만 사람을 향한 다정함과 예의는 결코 잃지 않았습니다.

따뜻한 옥수수수염차 한 병을 건네는 그 손길에서, 거창한 말이 아니라 조용한 배려가 한 사람의 얼어붙은 겨울을 녹일 수 있음을 배웁니다.`}
            initialQuote="“결국 삶은 관계였고 관계는 소통이었다. 행복은 혼자 누릴 수 있는 것이 아니었다.”"
            initialRating={5}
            onSubmit={handleSubmit}
          />
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
