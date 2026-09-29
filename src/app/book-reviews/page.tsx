'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BookSearchModal from '@/components/BookSearchModal';
import CreateClubModal from '@/components/CreateClubModal';
import AuthModal from '@/components/AuthModal';
import { Review } from '@/types/database';
import { useAuth } from '@/context/AuthContext';

function BookReviewsFeedContent() {
  const searchParams = useSearchParams();
  const clubId = searchParams.get('club_id') || searchParams.get('clubId');
  const scheduleId = searchParams.get('schedule_id') || searchParams.get('scheduleId');
  const { user } = useAuth();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const fetchReviews = async () => {
      const currentUserId = user?.id || '00000000-0000-0000-0000-000000000001';
      setLoading(true);
      try {
        let url = '/api/reviews';
        const params = new URLSearchParams();
        if (clubId) params.append('club_id', clubId);
        if (scheduleId) params.append('schedule_id', scheduleId);
        // 내 독후감만 조회하도록 user_id 파라미터 적용
        params.append('user_id', currentUserId);

        url += `?${params.toString()}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.reviews && Array.isArray(data.reviews)) {
            setReviews(data.reviews);
            return;
          }
        }
        setReviews([]);
      } catch (err) {
        console.warn('Reviews fetch error:', err);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [clubId, scheduleId, user?.id]);

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNewClub={() => setIsCreateOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="w-full pt-24 pb-16 flex-1">
        <div className="max-w-4xl mx-auto px-gutter flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-surface-container pb-4">
            <div>
              <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                <span className="material-symbols-outlined text-[18px]">spa</span>
                <span>온기 있는 나의 기록</span>
              </div>
              <h1 className="font-headline-md text-2xl font-bold text-on-surface mt-1">
                {clubId || scheduleId ? '단원 독후감 모아보기' : '내 독후감 피드'}
              </h1>
              <p className="text-xs text-on-surface-variant mt-0.5">
                내가 단원별 독서 일정을 함께하며 정성스럽게 기록한 감상과 발제문들을 모아봅니다.
              </p>
            </div>

            {reviews.length > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold shadow-xs">
                <span className="material-symbols-outlined text-[16px]">menu_book</span>
                <span>총 {reviews.length}편의 서평 기록</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="py-24 text-center text-primary flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined animate-spin text-[32px]">progress_activity</span>
              <span className="text-sm font-medium">내가 작성한 독후감을 불러오는 중입니다...</span>
            </div>
          ) : !user ? (
            <div className="py-20 text-center bg-surface-container-lowest rounded-3xl p-8 border border-surface-container flex flex-col items-center justify-center gap-3 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[28px]">lock</span>
              </div>
              <h3 className="font-title-md text-base font-bold text-on-surface">로그인이 필요합니다</h3>
              <p className="text-xs text-on-surface-variant max-w-sm">
                로그인하시면 내가 작성한 단원별 서평과 독후감을 모아보고 관리할 수 있습니다.
              </p>
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary-container transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>로그인하기</span>
              </button>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-20 text-center bg-surface-container-lowest rounded-3xl p-8 border border-surface-container flex flex-col items-center justify-center gap-3 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-primary-fixed/40 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[28px]">edit_note</span>
              </div>
              <h3 className="font-title-md text-base font-bold text-on-surface">아직 작성한 독후감이 없습니다</h3>
              <p className="text-xs text-on-surface-variant max-w-sm">
                참여 중인 독서클럽의 단원 일정을 읽고 따뜻한 감상을 남겨보세요.
              </p>
              <Link
                href="/my-clubs"
                className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary-container transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">auto_stories</span>
                <span>내 서재 & 클럽 바로가기</span>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((rev) => (
                <article
                  key={rev.id}
                  className="bg-surface-container-lowest rounded-2xl p-6 sm:p-7 shadow-sm border border-surface-container flex flex-col gap-3.5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-primary text-xs shadow-sm">
                        {rev.author?.nickname?.[0] || user.nickname?.[0] || '지'}
                      </div>
                      <span className="text-xs font-bold text-on-surface">
                        {rev.author?.nickname || user.nickname || '나'}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {rev.created_at?.split('T')[0]}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <span className="material-symbols-outlined text-[16px] fill-amber-400 text-amber-400">star</span>
                      <span>{rev.rating || 5}.0</span>
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
                          <span className="material-symbols-outlined text-[13px]">auto_stories</span>
                          <span>
                            {rev.schedule.chapter_title || (rev.schedule.target_date ? `단원 일정: ${rev.schedule.target_date}` : '단원 일정')}
                            {rev.schedule.page_range ? ` (${rev.schedule.page_range})` : ''}
                            {rev.schedule.target_date ? ` · ${rev.schedule.target_date}` : ''}
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
