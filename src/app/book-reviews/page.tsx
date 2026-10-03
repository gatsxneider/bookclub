'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/presentation/components/Navbar';
import BookSearchModal from '@/presentation/components/BookSearchModal';
import CreateClubModal from '@/presentation/components/CreateClubModal';
import AuthModal from '@/presentation/components/AuthModal';
import Footer from '@/presentation/components/Footer';
import { Review } from '@/domain/entities';

import { useAuth } from '@/presentation/context/AuthContext';
import { checkCanEmpathize, MAX_EMPATHY_COUNT } from '@/domain/rules/empathy';

function BookReviewsFeedContent() {
  const searchParams = useSearchParams();
  const clubId = searchParams.get('club_id') || searchParams.get('clubId');
  const scheduleId = searchParams.get('schedule_id') || searchParams.get('scheduleId');
  const { user, loading: authLoading } = useAuth();

  const isClubOrScheduleFeed = Boolean(clubId || scheduleId);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubName, setClubName] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [empathizingReviewId, setEmpathizingReviewId] = useState<string | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        let url = '/api/reviews';
        const params = new URLSearchParams();

        if (clubId) params.append('club_id', clubId);
        if (scheduleId) params.append('schedule_id', scheduleId);

        // 상단 '내 독후감 피드' (clubId, scheduleId가 없는 경우)에는 본인 독후감만 조회
        if (!isClubOrScheduleFeed) {
          if (!user?.id) {
            setReviews([]);
            setLoading(false);
            return;
          }
          params.append('user_id', user.id);
        }

        if (user?.id) {
          params.append('viewer_id', user.id);
        }

        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.reviews && Array.isArray(data.reviews)) {
            setReviews(data.reviews);
            if (data.reviews.length > 0 && data.reviews[0].club?.name) {
              setClubName(data.reviews[0].club.name);
            }
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
  }, [clubId, scheduleId, user?.id, isClubOrScheduleFeed]);

  const handleEmpathize = async (reviewId: string, authorId: string, currentMyCount: number) => {
    if (!user?.id) {
      setIsAuthOpen(true);
      return;
    }

    const check = checkCanEmpathize(authorId, user.id, currentMyCount);
    if (!check.allowed) {
      if (check.reason === 'self_review') {
        alert('본인이 작성한 독후감에는 공감할 수 없습니다.');
        return;
      }
      if (check.reason === 'max_reached') {
        alert(`한 독후감당 최대 ${MAX_EMPATHY_COUNT}회까지만 공감할 수 있습니다.`);
        return;
      }
      return;
    }

    setEmpathizingReviewId(reviewId);
    try {
      const res = await fetch('/api/reviews/empathy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: reviewId,
          user_id: user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '공감 반영에 실패했습니다.');
        return;
      }

      // 낙관적 업데이트
      setReviews((prev) =>
        prev.map((r) => {
          if (r.id === reviewId) {
            const newCount = data.my_empathy_count ?? (r.my_empathy_count || 0) + 1;
            return {
              ...r,
              my_empathy_count: newCount,
            };
          }
          return r;
        })
      );
    } catch (err) {
      console.error('Empathy error:', err);
      alert('공감 처리 중 오류가 발생했습니다.');
    } finally {
      setEmpathizingReviewId(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNewClub={() => setIsCreateOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="w-full pt-24 pb-16 flex-1">
        <div className="max-w-4xl mx-auto px-gutter flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-surface-container pb-4">
            <div>
              <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                <span className="material-symbols-outlined text-[18px]">
                  {isClubOrScheduleFeed ? 'groups' : 'spa'}
                </span>
                <span>
                  {clubId
                    ? `독서클럽 피드 • ${clubName || '전체 멤버 서평'}`
                    : scheduleId
                    ? '단원 독후감 모아보기'
                    : '온기 있는 나의 기록'}
                </span>
              </div>
              <h1 className="font-headline-md text-2xl font-bold text-on-surface mt-1">
                {clubId
                  ? '클럽 독후감 전체 모아보기'
                  : scheduleId
                  ? '단원 독후감 모아보기'
                  : '내 독후감 피드'}
              </h1>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {clubId
                  ? '해당 독서클럽의 모든 멤버들이 단원별로 정성껏 남긴 감상과 발제문들을 모아봅니다.'
                  : scheduleId
                  ? '이 단원에 대해 멤버들이 남긴 다양한 생각과 감상을 살펴봅니다.'
                  : '내가 단원별 독서 일정을 함께하며 정성스럽게 기록한 감상과 발제문들을 모아봅니다.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {clubId && (
                <Link
                  href={`/clubs/${clubId}`}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  <span>클럽으로 돌아가기</span>
                </Link>
              )}

              {reviews.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold shadow-xs">
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                  <span>총 {reviews.length}편의 서평 기록</span>
                </div>
              )}
            </div>
          </div>

          {loading || authLoading ? (
            <div className="py-24 text-center text-primary flex flex-col items-center justify-center gap-3">
              <span className="material-symbols-outlined animate-spin text-[32px]">progress_activity</span>
              <span className="text-sm font-medium">
                {isClubOrScheduleFeed ? '클럽 멤버들의 독후감을 불러오는 중입니다...' : '내가 작성한 독후감을 불러오는 중입니다...'}
              </span>
            </div>
          ) : !isClubOrScheduleFeed && !user ? (
            /* 상단 '내 독후감 피드' 진입 시 비로그인 상태 안내 */
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
            /* 독후감이 없는 경우 빈 상태 카드 */
            <div className="py-20 text-center bg-surface-container-lowest rounded-3xl p-8 border border-surface-container flex flex-col items-center justify-center gap-3 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-primary-fixed/40 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[28px]">
                  {isClubOrScheduleFeed ? 'auto_stories' : 'edit_note'}
                </span>
              </div>
              <h3 className="font-title-md text-base font-bold text-on-surface">
                {isClubOrScheduleFeed ? '아직 등록된 클럽 독후감이 없습니다' : '아직 작성한 독후감이 없습니다'}
              </h3>
              <p className="text-xs text-on-surface-variant max-w-sm">
                {isClubOrScheduleFeed
                  ? '이 독서클럽의 첫 번째 독후감을 작성하여 멤버들과 생각을 나눠보세요.'
                  : '참여 중인 독서클럽의 단원 일정을 읽고 따뜻한 감상을 남겨보세요.'}
              </p>
              {clubId ? (
                <Link
                  href={`/clubs/${clubId}`}
                  className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary-container transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                  <span>클럽 단원 일정 확인하기</span>
                </Link>
              ) : (
                <Link
                  href="/my-clubs"
                  className="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-on-primary text-xs font-bold shadow-md hover:bg-primary-container transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">auto_stories</span>
                  <span>내 서재 & 클럽 바로가기</span>
                </Link>
              )}
            </div>
          ) : (
            /* 독후감 피드 목록 */
            <div className="flex flex-col gap-4">
              {reviews.map((rev) => {
                const authorNickname = rev.author?.nickname || (rev.user_id === user?.id ? user.nickname : '독서가');
                const authorInitial = authorNickname ? authorNickname.charAt(0) : '독';
                const bookTitle = rev.book?.title || rev.club?.book?.title;
                const bookThumbnail = rev.book?.thumbnail || rev.club?.book?.thumbnail;

                return (
                  <article
                    key={rev.id}
                    className="bg-surface-container-lowest rounded-2xl p-6 sm:p-7 shadow-sm border border-surface-container flex flex-col gap-3.5 hover:shadow-md transition-shadow"
                  >
                    {/* 1. 상단 영역: 도서 & 단원 정보 (좌측) + 별점 평점 (우측) */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {bookTitle && (
                          <span className="flex items-center gap-1.5 font-semibold text-xs text-on-surface">
                            {bookThumbnail ? (
                              <img
                                src={bookThumbnail}
                                alt={bookTitle}
                                className="w-4 h-5.5 rounded-xs object-cover shadow-2xs shrink-0 border border-surface-container"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="material-symbols-outlined text-[16px] text-primary">menu_book</span>
                            )}
                            <span className="font-bold">{bookTitle}</span>
                          </span>
                        )}
                        {rev.schedule && (
                          <>
                            {bookTitle && <span className="text-on-surface-variant/40">•</span>}
                            <span className="inline-flex items-center gap-1 text-[11px] text-secondary font-medium bg-secondary-fixed/30 px-2.5 py-0.5 rounded-full">
                              <span className="material-symbols-outlined text-[13px]">auto_stories</span>
                              <span>
                                {rev.schedule.chapter_title || '단원 일정'}
                                {rev.schedule.page_range ? ` (${rev.schedule.page_range})` : ''}
                                {rev.schedule.target_date ? ` · ${rev.schedule.target_date}` : ''}
                              </span>
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold ml-auto sm:ml-0">
                        <span className="material-symbols-outlined text-[16px] fill-amber-400 text-amber-400">star</span>
                        <span>{rev.rating || 5}.0</span>
                      </div>
                    </div>

                    {/* 2. 본문 영역: 제목, 인용구, 본문 */}
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

                    {/* 3. 하단 영역: 독서회명 & 멤버(작성자) 정보 (좌측) + 공감하기/댓글 (우측) */}
                    <div className="pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant flex-wrap gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {rev.club && (
                          <Link
                            href={`/clubs/${rev.club_id || rev.club.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full transition-colors"
                          >
                            <span className="material-symbols-outlined text-[14px]">eco</span>
                            <span>{rev.club.name}</span>
                          </Link>
                        )}
                        <div className="flex items-center gap-2">
                          {rev.author?.avatar_url ? (
                            <img
                              src={rev.author.avatar_url}
                              alt={authorNickname}
                              className="w-7 h-7 rounded-full object-cover shadow-sm border border-primary/20 shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = '/avatars/avatar_cat.png';
                              }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-primary text-xs shadow-sm shrink-0">
                              {authorInitial}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-on-surface">
                              {authorNickname}
                            </span>
                            <span className="text-[11px] text-on-surface-variant">
                              {rev.created_at?.split('T')[0]}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-auto">
                        {!isClubOrScheduleFeed ? (
                          /* 1. 상단 '내 독후감 피드'로 들어왔을 때: '공감하기' 버튼이 위치한 곳에 총 공감 건수 표시 */
                          <div
                            data-testid="my-review-likes"
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-[16px] text-rose-500 fill-rose-500">
                              favorite
                            </span>
                            <span>받은 공감 {rev.likes_count || 0}개</span>
                          </div>
                        ) : rev.user_id === user?.id ? null : (
                          /* 2. 클럽/단원 모아보기에서 다른 사람의 독후감인 경우: 5회까지 공감 가능 버튼 */
                          <button
                            type="button"
                            disabled={empathizingReviewId === rev.id || (rev.my_empathy_count || 0) >= MAX_EMPATHY_COUNT}
                            onClick={() => handleEmpathize(rev.id, rev.user_id, rev.my_empathy_count || 0)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                              (rev.my_empathy_count || 0) >= MAX_EMPATHY_COUNT
                                ? 'bg-rose-100 text-rose-600 cursor-default opacity-90'
                                : (rev.my_empathy_count || 0) > 0
                                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 hover:scale-105 active:scale-95 shadow-xs'
                                : 'text-on-surface-variant hover:text-rose-500 hover:bg-rose-50/60'
                            }`}
                            title={
                              (rev.my_empathy_count || 0) >= MAX_EMPATHY_COUNT
                                ? '최대 5회 공감 완료'
                                : (rev.my_empathy_count || 0) > 0
                                ? `공감하기 (내 공감 ${rev.my_empathy_count}/5회)`
                                : '공감하기 (최대 5회)'
                            }
                          >
                            <span
                              className={`material-symbols-outlined text-[16px] transition-transform ${
                                (rev.my_empathy_count || 0) > 0
                                  ? 'text-rose-500 fill-rose-500 scale-110'
                                  : 'text-on-surface-variant'
                              }`}
                            >
                              {(rev.my_empathy_count || 0) > 0 ? 'favorite' : 'favorite_border'}
                            </span>
                            <span>
                              {(rev.my_empathy_count || 0) >= MAX_EMPATHY_COUNT
                                ? '공감완료 (5/5)'
                                : (rev.my_empathy_count || 0) > 0
                                ? `공감 ${rev.my_empathy_count}/5`
                                : '공감하기'}
                            </span>
                          </button>
                        )}

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
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

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
