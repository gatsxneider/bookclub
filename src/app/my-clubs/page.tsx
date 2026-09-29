'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BookSearchModal from '@/components/BookSearchModal';
import CreateClubModal from '@/components/CreateClubModal';
import AuthModal from '@/components/AuthModal';
import UserProfileModal from '@/components/UserProfileModal';
import { Review } from '@/types/database';
import { useAuth, calculateUserLevel } from '@/context/AuthContext';

// 독서 레벨 정보 매핑
const LEVEL_CONFIG: Record<number, { title: string; badge: string; desc: string }> = {
  1: {
    title: '씨앗 독서가',
    badge: '씨앗 독서가 🌱 (Lv.1)',
    desc: '첫 번째 완독의 기쁨을 시작한 독서가',
  },
  2: {
    title: '새싹 독서가',
    badge: '새싹 독서가 🌿 (Lv.2)',
    desc: '문장의 온기를 찾아가는 2회 완독가',
  },
  3: {
    title: '나무 독서가',
    badge: '나무 독서가 🌳 (Lv.3)',
    desc: '서재의 깊이를 더해가는 3회 완독가',
  },
  4: {
    title: '숲속 독서가',
    badge: '숲속 독서가 🌲 (Lv.4)',
    desc: '다양한 책의 숲을 누비는 4회 완독가',
  },
  5: {
    title: '마스터 독서가',
    badge: '마스터 독서가 👑 (Lv.5)',
    desc: '5회 이상 완독을 달성한 최고의 독서 마스터',
  },
};

interface ClubScheduleItem {
  id: string;
  seq: number;
  title: string;
  pages: string;
  targetDate: string;
  submitted: boolean;
  reviewTitle?: string;
}

interface UserClubView {
  clubId: string;
  clubName: string;
  bookTitle: string;
  bookThumbnail: string;
  leader: string;
  membersCount: number;
  schedules: ClubScheduleItem[];
}

export default function MyClubsPage() {
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'current' | 'completed' | 'my-reviews'>('current');
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [userClubs, setUserClubs] = useState<UserClubView[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 기본 완독 기념 책 목록
  const completedBooks = [
    {
      title: '어린 왕자',
      author: '생텍쥐페리',
      cover:
        'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F543598%3Ftimestamp%3D20240904120800',
      completedDate: '2026년 8월 20일',
      reviewsWritten: 5,
      clubName: '어린왕자 완독 챌린지',
    },
    {
      title: '데미안',
      author: '헤르만 헤세',
      cover:
        'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F543600%3Ftimestamp%3D20240904120800',
      completedDate: '2026년 7월 15일',
      reviewsWritten: 8,
      clubName: '고전문학 산책회',
    },
    {
      title: '달러구트 꿈 백화점',
      author: '이미예',
      cover:
        'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5389650%3Ftimestamp%3D20240904121010',
      completedDate: '2026년 6월 10일',
      reviewsWritten: 6,
      clubName: '포근한 판타지 서재',
    },
  ];

  // 1. 내 독후감 목록 조회 (로그인 회원 ID 기준)
  useEffect(() => {
    const fetchReviews = async () => {
      if (!user?.id) {
        setMyReviews([]);
        return;
      }
      try {
        const res = await fetch(`/api/reviews?user_id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.reviews && Array.isArray(data.reviews)) {
            setMyReviews(data.reviews);
            return;
          }
        }
      } catch (err) {
        console.warn('My reviews fetch error:', err);
      }
      setMyReviews([]);
    };

    fetchReviews();
  }, [user?.id]);

  // 2. 참여 중인 클럽 및 일정 조회 (로그인 회원 참여 여부 기준)
  useEffect(() => {
    const fetchClubs = async () => {
      setLoadingClubs(true);
      try {
        const res = await fetch('/api/clubs');
        if (res.ok) {
          const data = await res.json();
          if (data.clubs && Array.isArray(data.clubs)) {
            // 로그인 상태이면 본인이 방장이거나 멤버로 참여한 클럽 필터링
            let filteredClubs = data.clubs;
            if (user?.id) {
              const myJoined = data.clubs.filter((club: any) => {
                const isLeader = club.leader_id === user.id || club.leader?.id === user.id;
                const isMember = (club.members || []).some(
                  (m: any) => m.user_id === user.id || m.profile?.id === user.id
                );
                return isLeader || isMember;
              });

              if (myJoined.length > 0) {
                filteredClubs = myJoined;
              }
            }

            const formatted: UserClubView[] = filteredClubs.map((club: any) => {
              const schedules: ClubScheduleItem[] = (club.schedules || []).map((s: any, idx: number) => {
                const userReview = (s.reviews || []).find(
                  (r: any) => r.user_id === user?.id || (myReviews || []).some((mr) => mr.schedule_id === s.id)
                );

                return {
                  id: s.id || `sched-${idx + 1}`,
                  seq: s.order_seq || s.sequence || idx + 1,
                  title: s.title || `제${idx + 1}장`,
                  pages: s.target_pages ? `p.${s.target_pages}` : `단원 ${idx + 1}`,
                  targetDate: s.due_date || s.target_date || '일정 조율 중',
                  submitted: !!userReview,
                  reviewTitle: userReview?.title,
                };
              });

              return {
                clubId: club.id,
                clubName: club.name || '코지 북클럽',
                bookTitle: club.book?.title || club.name,
                bookThumbnail:
                  club.book?.thumbnail_url ||
                  club.book?.cover_image_url ||
                  'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5871383%3Ftimestamp%3D20240904121510',
                leader: club.leader?.nickname || '방장',
                membersCount: club.members ? club.members.length : 1,
                schedules,
              };
            });

            setUserClubs(formatted);
            return;
          }
        }
      } catch (err) {
        console.warn('My clubs fetch error:', err);
      } finally {
        setLoadingClubs(false);
      }
    };

    fetchClubs();
  }, [user?.id, myReviews]);

  // 회원 레벨 및 프로필 정보 계산
  const completedCount = user?.completed_count ?? 1;
  const currentLevel = calculateUserLevel(completedCount);
  const levelInfo = LEVEL_CONFIG[currentLevel] || LEVEL_CONFIG[1];
  const mannerTemp = user?.manner_temperature != null ? Number(user.manner_temperature).toFixed(1) : '20.0';

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNewClub={() => setIsCreateOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="w-full pt-24 pb-16 flex-1">
        {authLoading ? (
          <div className="max-w-4xl mx-auto px-gutter py-24 text-center text-primary flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined animate-spin text-[32px]">progress_activity</span>
            <span className="text-sm font-medium">서재 정보를 불러오는 중입니다...</span>
          </div>
        ) : !user ? (
          /* 비로그인 상태 화면: 내 독후감 피드와 완전히 동일한 구성 */
          <div className="max-w-4xl mx-auto px-gutter flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-surface-container pb-4">
              <div>
                <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                  <span className="material-symbols-outlined text-[18px]">spa</span>
                  <span>온기 있는 나의 서재</span>
                </div>
                <h1 className="font-headline-md text-2xl font-bold text-on-surface mt-1">
                  내 서재 & 클럽
                </h1>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  참여 중인 독서 클럽의 일정과 단원별 독후감 작성 현황을 확인합니다.
                </p>
              </div>
            </div>

            <div className="py-20 text-center bg-surface-container-lowest rounded-3xl p-8 border border-surface-container flex flex-col items-center justify-center gap-3 shadow-sm">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[28px]">lock</span>
              </div>
              <h3 className="font-title-md text-base font-bold text-on-surface">로그인이 필요합니다</h3>
              <p className="text-xs text-on-surface-variant max-w-sm">
                로그인하시면 참여 중인 독서 클럽의 일정과 단원별 독후감 작성 현황을 확인하실 수 있습니다.
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
          </div>
        ) : (
          /* 로그인 회원 전용 서재 & 클럽 화면 */
          <div className="max-w-7xl mx-auto px-gutter flex flex-col gap-6">
            {/* Top Banner / My Profile Status */}
            <section className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm border border-surface-container flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {/* Profile Avatar */}
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.nickname || '프로필 아바타'}
                    className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-primary/20 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary text-2xl font-bold shadow-sm shrink-0">
                    {user.nickname ? user.nickname.charAt(0) : '독'}
                  </div>
                )}

                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-headline-md text-xl sm:text-2xl font-bold text-on-surface">
                      {user.nickname} 님의 따뜻한 서재
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold">
                      {levelInfo.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-medium text-primary">
                      <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                      <span>매너온도 {mannerTemp}℃</span>
                    </span>
                    <span>•</span>
                    <span className="text-on-surface-variant/80">{user.email}</span>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setIsProfileOpen(true)}
                      className="inline-flex items-center gap-0.5 text-xs text-secondary hover:underline font-medium"
                    >
                      <span className="material-symbols-outlined text-[13px]">manage_accounts</span>
                      <span>프로필 설정</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-surface-container pt-4 md:pt-0 md:pl-6 text-center">
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant">참여 클럽</span>
                  <span className="text-xl font-bold text-primary mt-0.5">
                    {userClubs.length}개
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant">작성한 독후감</span>
                  <span className="text-xl font-bold text-secondary mt-0.5">
                    {myReviews.length}편
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant">완독한 책</span>
                  <span className="text-xl font-bold text-on-surface mt-0.5">
                    {user.completed_count ?? 0}권
                  </span>
                </div>
              </div>
            </section>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-surface-container pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('current')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'current'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                독서 진행 일정 & 독후감 체크리스트 ({userClubs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('my-reviews')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'my-reviews'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                내가 쓴 독후감 모아보기 ({myReviews.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('completed')}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === 'completed'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                완독 기념서가 ({completedBooks.length}권)
              </button>
            </div>

            {/* TAB 1: 독서 진행 일정 & 독후감 작성 여부 */}
            {activeTab === 'current' && (
              <div className="flex flex-col gap-6">
                {userClubs.length > 0 ? (
                  userClubs.map((club) => (
                    <section
                      key={club.clubId}
                      className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container flex flex-col gap-4"
                    >
                      {/* Club Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
                        <div className="flex items-center gap-3">
                          <img
                            src={club.bookThumbnail}
                            alt={club.bookTitle}
                            className="w-12 h-16 rounded object-cover shadow-sm shrink-0"
                          />
                          <div className="flex flex-col">
                            <Link
                              href={`/clubs/${club.clubId}`}
                              className="font-headline-sm text-base font-bold text-on-surface hover:text-primary transition-colors"
                            >
                              {club.clubName}
                            </Link>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              선정도서: 《{club.bookTitle}》 • 방장: {club.leader} • 멤버 {club.membersCount}명
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/clubs/${club.clubId}`}
                          className="px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all self-start sm:self-auto flex items-center gap-1"
                        >
                          <span>클럽 서재 바로가기</span>
                          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                        </Link>
                      </div>

                      {/* Schedule Check List */}
                      <div className="flex flex-col gap-2">
                        <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">task_alt</span>
                          <span>단원별 독서 일정 및 나의 독후감 작성 현황</span>
                        </h4>

                        {club.schedules.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2 pt-1">
                            {club.schedules.map((s) => (
                              <div
                                key={s.id}
                                className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                                      s.submitted
                                        ? 'bg-primary text-on-primary'
                                        : 'bg-surface-container-high text-on-surface-variant'
                                    }`}
                                  >
                                    {s.submitted ? '✓' : s.seq}
                                  </span>
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-semibold text-on-surface">
                                        {s.title}
                                      </span>
                                      <span className="text-[11px] text-on-surface-variant">
                                        ({s.pages})
                                      </span>
                                    </div>
                                    <span className="text-[11px] text-on-surface-variant mt-0.5">
                                      목표일: {s.targetDate}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  {s.submitted ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold">
                                      <span className="material-symbols-outlined text-[14px]">check</span>
                                      <span>독후감 작성 완료</span>
                                    </span>
                                  ) : (
                                    <Link
                                      href={`/clubs/${club.clubId}/reviews/new?scheduleId=${s.id}`}
                                      className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-secondary text-on-secondary hover:bg-secondary-container text-xs font-semibold shadow-sm transition-all"
                                    >
                                      <span className="material-symbols-outlined text-[14px]">edit</span>
                                      <span>독후감 쓰기</span>
                                    </Link>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-on-surface-variant py-2">등록된 독서 일정이 없습니다.</p>
                        )}
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-surface-container flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-primary text-3xl">
                      📚
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="text-lg font-bold text-on-surface">참여 중인 독서 클럽이 없습니다</h3>
                      <p className="text-xs text-on-surface-variant">
                        새로운 독서 클럽을 직접 만들거나, 취향에 맞는 클럽에 참여해보세요.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setIsCreateOpen(true)}
                        className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary/90 transition-all"
                      >
                        새 독서클럽 만들기
                      </button>
                      <Link
                        href="/"
                        className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all"
                      >
                        독서클럽 탐색하기
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: 내가 쓴 독후감 모아보기 */}
            {activeTab === 'my-reviews' && (
              <div className="flex flex-col gap-4">
                {myReviews.length > 0 ? (
                  myReviews.map((rev) => (
                    <article
                      key={rev.id}
                      className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-primary font-bold">
                          {rev.created_at?.split('T')[0]} 기록
                        </span>
                        <div className="flex items-center gap-1 text-secondary text-xs">
                          <span>★</span>
                          <span className="font-bold">{rev.rating || 5}.0</span>
                        </div>
                      </div>

                      <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                        {rev.title}
                      </h3>

                      {rev.quote && (
                        <blockquote className="bg-surface-container-low p-3 rounded-lg border-l-4 border-primary text-xs italic text-on-surface leading-relaxed">
                          {rev.quote}
                        </blockquote>
                      )}

                      <p className="font-body-reading text-sm text-on-surface-variant leading-relaxed">
                        {rev.content}
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="bg-surface-container-lowest rounded-2xl p-12 text-center border border-surface-container flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-2xl">
                      ✍️
                    </div>
                    <h3 className="text-base font-bold text-on-surface">아직 작성된 독후감이 없습니다</h3>
                    <p className="text-xs text-on-surface-variant">
                      참여 중인 클럽의 단원별 일정에 맞춰 첫 번째 독서 기록을 남겨보세요.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: 완독 기념서가 */}
            {activeTab === 'completed' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedBooks.map((b, idx) => (
                  <article
                    key={idx}
                    className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex flex-col justify-between gap-3"
                  >
                    <div className="flex gap-4">
                      <img
                        src={b.cover}
                        alt={b.title}
                        className="w-16 h-24 rounded-lg object-cover shadow-sm shrink-0"
                      />
                      <div className="flex flex-col">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-semibold self-start mb-1">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          <span>완독 완료</span>
                        </span>
                        <h4 className="font-headline-sm text-sm font-bold text-on-surface">
                          『{b.title}』
                        </h4>
                        <p className="text-xs text-on-surface-variant">{b.author} 저</p>
                        <p className="text-[11px] text-on-surface-variant/80 mt-1">{b.clubName}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
                      <span>{b.completedDate}</span>
                      <span className="font-medium text-primary">총 {b.reviewsWritten}편의 기록</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
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
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
