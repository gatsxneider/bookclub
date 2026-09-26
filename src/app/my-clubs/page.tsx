'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BookSearchModal from '@/components/BookSearchModal';
import CreateClubModal from '@/components/CreateClubModal';
import AuthModal from '@/components/AuthModal';
import { Review } from '@/types/database';

export default function MyClubsPage() {
  const [activeTab, setActiveTab] = useState<'current' | 'completed' | 'my-reviews'>('current');
  const [myReviews, setMyReviews] = useState<Review[]>([]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // 기본 독서 일정 및 작성 여부 데이터
  const readingScheduleStatus = [
    {
      clubId: 'cozy-default-club',
      clubName: '고요한 숲속 심야 독서회',
      bookTitle: '불편한 편의점',
      bookThumbnail:
        'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5871383%3Ftimestamp%3D20240904121510',
      leader: '달빛책방지기',
      membersCount: 6,
      schedules: [
        {
          id: 'sched-1',
          seq: 1,
          title: '제1장. 2020 가을, 산해진미 도시락',
          pages: 'p.1 ~ p.65',
          targetDate: '2026-09-10',
          submitted: true,
          reviewTitle: '노숙인 독고 씨와의 첫 만남과 온기',
        },
        {
          id: 'sched-2',
          seq: 2,
          title: '제2장. 제이에스 오브 제이에스',
          pages: 'p.66 ~ p.132',
          targetDate: '2026-09-17',
          submitted: true,
          reviewTitle: '진상 손님을 대하는 따뜻한 시선',
        },
        {
          id: 'sched-3',
          seq: 3,
          title: '제3장. 삼각김밥의 용도',
          pages: 'p.133 ~ p.198',
          targetDate: '2026-09-24',
          submitted: true,
          reviewTitle: '참참참 세트가 주는 소박한 위안',
        },
        {
          id: 'sched-4',
          seq: 4,
          title: '제4장. 네 잎 클로버의 기적',
          pages: 'p.199 ~ p.262',
          targetDate: '2026-10-01',
          submitted: false,
        },
        {
          id: 'sched-5',
          seq: 5,
          title: '제5장. 불편한 편의점의 에필로그',
          pages: 'p.263 ~ p.310',
          targetDate: '2026-10-15',
          submitted: false,
        },
      ],
    },
    {
      clubId: 'cozy-second-club',
      clubName: '따스한 차 한 잔과 인문학',
      bookTitle: '도둑맞은 집중력',
      bookThumbnail:
        'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F6298533%3Ftimestamp%3D20240904122115',
      leader: '유진',
      membersCount: 8,
      schedules: [
        {
          id: 's2-1',
          seq: 1,
          title: '1부. 너무 빨리 흘러가는 세상과 우리의 뇌',
          pages: 'p.1 ~ p.80',
          targetDate: '2026-09-20',
          submitted: true,
          reviewTitle: '산만함의 원인은 내 의지박약이 아니었다',
        },
        {
          id: 's2-2',
          seq: 2,
          title: '2부. 몰입을 방해하는 감시 자본주의',
          pages: 'p.81 ~ p.175',
          targetDate: '2026-10-05',
          submitted: false,
        },
      ],
    },
  ];

  // 완독한 책 목록
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

  // 독후감 목록
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/reviews');
        if (res.ok) {
          const data = await res.json();
          if (data.reviews && data.reviews.length > 0) {
            setMyReviews(data.reviews);
            return;
          }
        }
      } catch {}

      // 기본 독후감 데이터
      setMyReviews([
        {
          id: 'rev-1',
          user_id: '00000000-0000-0000-0000-000000000001',
          title: '참참참 세트가 주는 소박한 위안 — 불편한 편의점 3단원',
          content:
            '혼자 늦은 밤 편의점 파라솔 테이블에 앉아 캔맥주와 참치김밥을 먹는 사람들의 고단함. 독고 씨가 그들에게 무심한 듯 건네는 따뜻한 배려가 가슴을 뭉클하게 했습니다.',
          quote: '“밥 딜런의 외할머니가 그랬어. 행복은 이미 누리고 있는 것을 좋아하는 것이라고.”',
          rating: 5,
          is_public: true,
          created_at: '2026-09-24',
        },
        {
          id: 'rev-2',
          user_id: '00000000-0000-0000-0000-000000000001',
          title: '산만함의 원인은 내 의지박약이 아니었다 — 도둑맞은 집중력 1단원',
          content:
            '끝없이 알림을 울려대는 스마트폰과 알고리즘 속에서 우리의 깊은 생각의 힘이 어떻게 잠식당하는지 깊이 깨달았습니다. 함께 책을 읽는 이 시간만큼은 온전히 화면을 끄고 종이책의 질감에 집중해봅니다.',
          quote: '“집중력 위기는 개인의 실패가 아니라 현대 사회 시스템이 설계한 결과다.”',
          rating: 5,
          is_public: true,
          created_at: '2026-09-20',
        },
        {
          id: 'rev-3',
          user_id: '00000000-0000-0000-0000-000000000001',
          title: '어른이 된다는 것의 의미 — 어린 왕자를 완독하며',
          content:
            '가장 중요한 것은 눈에 보이지 않고 오직 마음으로 보아야 한다는 여우의 말을 다시금 곱씹어봅니다. 길들인다는 것은 책임을 진다는 것임을 배웠습니다.',
          quote: '“사막이 아름다운 것은 어딘가에 우물을 숨기고 있기 때문이야.”',
          rating: 5,
          is_public: true,
          created_at: '2026-08-20',
        },
      ]);
    };

    fetchReviews();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNewClub={() => setIsCreateOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="w-full pt-24 pb-16 flex-1">
        <div className="max-w-7xl mx-auto px-gutter flex flex-col gap-6">
          {/* Top Banner / My Profile Status */}
          <section className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm border border-surface-container flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary text-2xl font-bold shadow-sm">
                지
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="font-headline-md text-xl sm:text-2xl font-bold text-on-surface">
                    지우 님의 따뜻한 서재
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold">
                    책나무 레벨 3 🌿
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  달빛서재 • "조용한 문장 속에서 하루의 피로를 씻어냅니다."
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 border-t md:border-t-0 md:border-l border-surface-container pt-4 md:pt-0 md:pl-6 text-center">
              <div className="flex flex-col">
                <span className="text-xs text-on-surface-variant">참여 클럽</span>
                <span className="text-xl font-bold text-primary mt-0.5">2개</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-on-surface-variant">작성한 독후감</span>
                <span className="text-xl font-bold text-secondary mt-0.5">
                  {myReviews.length}편
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-on-surface-variant">완독한 책</span>
                <span className="text-xl font-bold text-on-surface mt-0.5">3권</span>
              </div>
            </div>
          </section>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-surface-container pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('current')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'current'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              독서 진행 일정 & 독후감 체크리스트
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my-reviews')}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
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
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
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
              {readingScheduleStatus.map((club) => (
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
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* TAB 2: 내가 쓴 독후감 모아보기 */}
          {activeTab === 'my-reviews' && (
            <div className="flex flex-col gap-4">
              {myReviews.map((rev) => (
                <article
                  key={rev.id}
                  className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-primary font-bold">
                      {rev.created_at?.split('T')[0] || '2026-09-26'} 기록
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
              ))}
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
