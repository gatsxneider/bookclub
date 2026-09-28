'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import BookSearchModal from '@/components/BookSearchModal';
import CreateClubModal from '@/components/CreateClubModal';
import AuthModal from '@/components/AuthModal';
import { Review } from '@/types/database';

function BookReviewsFeedContent() {
  const searchParams = useSearchParams();
  const clubId = searchParams.get('club_id') || searchParams.get('clubId');
  const scheduleId = searchParams.get('schedule_id') || searchParams.get('scheduleId');

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        let url = '/api/reviews';
        const params = new URLSearchParams();
        if (clubId) params.append('club_id', clubId);
        if (scheduleId) params.append('schedule_id', scheduleId);
        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.reviews && data.reviews.length > 0) {
            setReviews(data.reviews);
            return;
          }
        }
      } catch (err) {
        console.warn('Reviews fetch error:', err);
      } finally {
        setLoading(false);
      }

      // 기본 폴백 데이터 (데이터가 비어있을 때 피드 예시)
      setReviews([
        {
          id: 'rev-1',
          user_id: '1',
          title: '불편함 속에서 길어 올린 가장 다정한 온기 — 4단원을 읽고',
          content:
            '혼자 늦은 밤 편의점 파라솔 테이블에 앉아 캔맥주와 참치김밥을 먹는 사람들의 고단함. 독고 씨가 그들에게 무심한 듯 건네는 따뜻한 배려가 가슴을 뭉클하게 했습니다. 우리 사회에 필요한 것은 어쩌면 대단한 정답이 아니라 서로의 어깨를 토닥이는 작은 관심일 것입니다.',
          quote: '“결국 삶은 관계였고 관계는 소통이었다. 행복은 혼자 누릴 수 있는 것이 아니었다.”',
          rating: 5,
          is_public: true,
          created_at: '2026-09-24',
          author: { id: '1', nickname: '지우' },
          club: { id: 'c1', name: '고요한 숲속 심야 독서회', leader_id: '1', status: 'active', max_members: 6 },
          schedule: { id: 's1', club_id: 'c1', sequence: 4, chapter_title: '제4장. 네 잎 클로버의 기적', page_range: 'p.199 ~ p.262', target_date: '2026-10-01' },
        },
        {
          id: 'rev-2',
          user_id: '2',
          title: '산만함의 시대, 나를 되찾는 몰입의 연습 — 도둑맞은 집중력 1단원',
          content:
            '끝없이 알림을 울려대는 스마트폰과 알고리즘 속에서 우리의 깊은 생각의 힘이 어떻게 잠식당하는지 깊이 깨달았습니다. 함께 책을 읽는 이 시간만큼은 온전히 화면을 끄고 종이책의 질감에 집중해봅니다.',
          quote: '“집중력 위기는 개인의 실패가 아니라 현대 사회 시스템이 설계한 결과다.”',
          rating: 5,
          is_public: true,
          created_at: '2026-09-20',
          author: { id: '2', nickname: '도윤' },
          club: { id: 'c2', name: '따스한 차 한 잔과 인문학', leader_id: '2', status: 'active', max_members: 8 },
          schedule: { id: 's2', club_id: 'c2', sequence: 1, chapter_title: '1부. 너무 빨리 흘러가는 세상과 우리의 뇌', page_range: 'p.1 ~ p.80', target_date: '2026-09-20' },
        },
        {
          id: 'rev-3',
          user_id: '3',
          title: '참참참 세트와 편의점 야간의 공기',
          content:
            '산해진미 도시락을 먹으며 밤을 버티던 이들의 마음이 풀려가는 과정이 소설이라기보다 실제 우리 동네 이야기처럼 다가왔습니다. 작가의 따뜻한 시선이 활자 너머로 전해집니다.',
          quote: '“밥 딜런의 외할머니가 그랬어. 행복은 이미 누리고 있는 것을 좋아하는 것이라고.”',
          rating: 4,
          is_public: true,
          created_at: '2026-09-17',
          author: { id: '3', nickname: '민서' },
          club: { id: 'c1', name: '고요한 숲속 심야 독서회', leader_id: '1', status: 'active', max_members: 6 },
          schedule: { id: 's3', club_id: 'c1', sequence: 3, chapter_title: '제3장. 삼각김밥의 용도', page_range: 'p.133 ~ p.198', target_date: '2026-09-24' },
        },
      ]);
    };

    fetchReviews();
  }, [clubId, scheduleId]);

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNewClub={() => setIsCreateOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="w-full pt-24 pb-16 flex-1">
        <div className="max-w-4xl mx-auto px-gutter flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 text-primary text-xs font-semibold">
              <span className="material-symbols-outlined text-[18px]">spa</span>
              <span>온기 있는 문장의 나눔</span>
            </div>
            <h1 className="font-headline-md text-2xl font-bold text-on-surface mt-1">
              {clubId || scheduleId ? '클럽 독후감 전체 모아보기' : '독후감 피드'}
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              클럽 멤버들이 단원별 독서 일정을 함께하며 기록한 따뜻한 감상과 발제문들을 나눕니다.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {reviews.map((rev) => (
              <article
                key={rev.id}
                className="bg-surface-container-lowest rounded-2xl p-6 sm:p-7 shadow-sm border border-surface-container flex flex-col gap-3.5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-primary text-xs shadow-sm">
                      {rev.author?.nickname?.[0] || '지'}
                    </div>
                    <span className="text-xs font-bold text-on-surface">
                      {rev.author?.nickname || '멤버'}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      {rev.created_at?.split('T')[0]}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-secondary text-xs">
                    <span>★</span>
                    <span className="font-bold">{rev.rating || 5}.0</span>
                  </div>
                </div>

                <h2 className="font-headline-sm text-lg font-bold text-on-surface">
                  {rev.title}
                </h2>

                {rev.quote && (
                  <blockquote className="bg-surface-container-low p-3.5 rounded-xl border-l-4 border-primary text-xs italic text-on-surface leading-relaxed">
                    {rev.quote}
                  </blockquote>
                )}

                <p className="font-body-reading text-sm text-on-surface-variant leading-relaxed">
                  {rev.content}
                </p>

                <div className="pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-primary">
                      <span className="material-symbols-outlined text-[15px]">eco</span>
                      <span>{rev.club?.name || '독서클럽'}</span>
                    </span>
                    {rev.schedule && (
                      <>
                        <span className="text-on-surface-variant/40">•</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-secondary font-medium bg-secondary-fixed/30 px-2.5 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-[13px]">event</span>
                          <span>
                            {rev.schedule.target_date ? `단원 독서 일정: ${rev.schedule.target_date}` : '상시 모임'}
                            {rev.schedule.page_range ? ` (${rev.schedule.page_range})` : ''}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-auto">
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-secondary transition-colors"
                      onClick={() => alert('공감했습니다 ❤️')}
                    >
                      <span className="material-symbols-outlined text-[16px]">favorite_border</span>
                      <span>공감하기</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                      onClick={() => alert('댓글 기능이 준비 중입니다.')}
                    >
                      <span className="material-symbols-outlined text-[16px]">chat_bubble_outline</span>
                      <span>댓글</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      <BookSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectBook={() => {}}
      />
      <CreateClubModal
        isOpen={isCreateOpen}
        book={null}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {}}
      />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function BookReviewsFeedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="flex items-center gap-2 text-primary font-medium text-sm">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <span>독후감 피드를 불러오는 중...</span>
          </div>
        </div>
      }
    >
      <BookReviewsFeedContent />
    </Suspense>
  );
}
