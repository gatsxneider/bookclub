'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ReviewEditor from '@/components/ReviewEditor';
import { ClubSchedule } from '@/types/database';

export default function NewReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clubId = params.id;
  const initialScheduleId = searchParams.get('scheduleId') || '';

  const [schedules, setSchedules] = useState<ClubSchedule[]>([]);

  const defaultSchedules: ClubSchedule[] = [
    {
      id: 'sched-1',
      club_id: clubId,
      sequence: 1,
      chapter_title: '제1장. 2020 가을, 산해진미 도시락',
      page_range: 'p.1 ~ p.65',
    },
    {
      id: 'sched-2',
      club_id: clubId,
      sequence: 2,
      chapter_title: '제2장. 제이에스 오브 제이에스',
      page_range: 'p.66 ~ p.132',
    },
    {
      id: 'sched-3',
      club_id: clubId,
      sequence: 3,
      chapter_title: '제3장. 삼각김밥의 용도',
      page_range: 'p.133 ~ p.198',
    },
    {
      id: 'sched-4',
      club_id: clubId,
      sequence: 4,
      chapter_title: '제4장. 네 잎 클로버의 기적',
      page_range: 'p.199 ~ p.262',
    },
    {
      id: 'sched-5',
      club_id: clubId,
      sequence: 5,
      chapter_title: '제5장. 불편한 편의점의 에필로그',
      page_range: 'p.263 ~ p.310',
    },
  ];

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await fetch(`/api/clubs/${clubId}/schedules`);
        if (res.ok) {
          const data = await res.json();
          if (data.schedules && data.schedules.length > 0) {
            setSchedules(data.schedules);
            return;
          }
        }
      } catch {}
      setSchedules(defaultSchedules);
    };

    fetchSchedules();
  }, [clubId]);

  const handleSubmit = async (reviewData: {
    schedule_id?: string;
    title: string;
    content: string;
    quote?: string;
    rating: number;
    is_public: boolean;
  }) => {
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewData,
          club_id: clubId,
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
        onOpenAuth={() => {}}
      />

      <main className="w-full pt-24 pb-16 flex-1">
        <div className="max-w-4xl mx-auto px-gutter">
          <ReviewEditor
            schedules={schedules}
            selectedScheduleId={initialScheduleId}
            bookTitle="불편한 편의점"
            clubName="고요한 숲속 심야 독서회"
            authorNickname="지우"
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
    </div>
  );
}
