'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/presentation/components/Navbar';
import CategoryFilter from '@/presentation/components/CategoryFilter';
import BookCard from '@/presentation/components/BookCard';
import BookSearchModal from '@/presentation/components/BookSearchModal';
import CreateClubModal from '@/presentation/components/CreateClubModal';
import BookDetailModal from '@/presentation/components/BookDetailModal';
import ClubSearchModal from '@/presentation/components/ClubSearchModal';
import AuthModal from '@/presentation/components/AuthModal';
import Footer from '@/presentation/components/Footer';
import { Book } from '@/domain/entities';
import { filterCuratedBooks } from '@/domain/rules/bookSearch';
import curatedBooksData from '@/shared/data/curatedBooks.json';
import { useAuth } from '@/presentation/context/AuthContext';
import { useClubs } from '@/presentation/hooks/useClubs';
import {
  isUserClubMember,
  isClubCompleted,
  getNearestUpcomingSchedule,
} from '@/domain/rules/scheduleCalculator';
import { Button } from '@/presentation/components/ui/Button';
import { Icon } from '@/presentation/components/ui/Icon';
import { Tabs } from '@/presentation/components/ui/Tabs';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { clubs, refetch: refetchClubs } = useClubs();

  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState('01. 소설 / 문학');
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);
  const [activeClubTab, setActiveClubTab] = useState<'active' | 'completed'>('active');

  // 모달 상태
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isClubSearchOpen, setIsClubSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const [selectedBookForClub, setSelectedBookForClub] = useState<Book | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);

  // 카테고리 도서 목록
  useEffect(() => {
    const books = filterCuratedBooks(curatedBooksData, selectedCategory);
    setDisplayedBooks(books);
  }, [selectedCategory]);

  const handleOpenCreateClub = (book?: Book | null) => {
    const targetBook = book || selectedBookForClub || displayedBooks[0] || null;
    setSelectedBookForClub(targetBook);

    if (!user) {
      setPendingAction('create_club');
      setIsAuthOpen(true);
    } else {
      setIsCreateOpen(true);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthOpen(false);
    if (pendingAction === 'create_club') {
      setPendingAction(null);
      setIsCreateOpen(true);
    }
  };

  const handleClubCreated = (clubId: string) => {
    if (clubId) {
      router.push(`/clubs/${clubId}`);
    } else {
      refetchClubs();
    }
  };

  // 내 참여 클럽 필터링
  const myClubs = user ? clubs.filter((c) => isUserClubMember(c, user.id)) : [];
  const activeClubs = myClubs.filter((c) => !isClubCompleted(c));
  const completedClubs = myClubs.filter((c) => isClubCompleted(c));

  const nearestSchedule = getNearestUpcomingSchedule(
    activeClubs.length > 0 ? activeClubs : myClubs,
    new Date(),
    user?.id
  );

  const displayedClubs = activeClubTab === 'active' ? activeClubs : completedClubs;

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* 1. Global Navigation Bar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNewClub={() => handleOpenCreateClub(null)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* 2. Main Content */}
      <main id="main-content" tabIndex={-1} className="w-full pt-20 lg:pt-24 pb-mobile-nav flex-1 outline-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col gap-8">
          {/* Top Banner / Warm Greeting */}
          <section aria-labelledby="banner-heading" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-container/20 via-surface-container-low to-secondary-container/15 p-6 sm:p-10 border border-surface-container shadow-xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex flex-col gap-2.5 max-w-xl text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold w-fit mx-auto md:mx-0">
                  <Icon name="spa" className="text-[16px]" />
                  다정한 사람들의 온기 있는 서재
                </span>
                <h1 id="banner-heading" className="font-headline-lg text-2xl sm:text-3xl lg:text-4xl font-bold text-on-surface leading-tight break-keep">
                  함께 읽고 따뜻하게 기록하는 <span className="text-primary font-extrabold">코지 독서 클럽</span>
                </h1>
                <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed break-keep">
                  좋아하는 책으로 클럽을 개설하고, 챕터별 일정을 나누며 멤버들과 다정한 독후감과 공감을 나눠보세요.
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    icon="group_add"
                    onClick={() => handleOpenCreateClub(null)}
                  >
                    새 독서클럽 만들기
                  </Button>
                  <Button
                    variant="tonal"
                    size="lg"
                    icon="explore"
                    onClick={() => setIsClubSearchOpen(true)}
                  >
                    클럽 둘러보기
                  </Button>
                </div>
              </div>

              {/* D-day 알림 카드 또는 코지 배너 */}
              {user && nearestSchedule.clubId && nearestSchedule.dDay !== '상시 토론' ? (
                <div className="w-full md:w-80 p-5 rounded-2xl bg-surface-container-lowest border border-primary/20 shadow-md flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      <Icon name="alarm" className="text-[18px]" />
                      다가오는 독서 일정
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 text-xs font-black">
                      {nearestSchedule.dDay}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-on-surface line-clamp-1">
                    독서 모임 참여 중
                  </h3>
                  <p className="text-xs text-on-surface-variant line-clamp-1">
                    목표일까지 독후감을 기록해보세요.
                  </p>
                  <Link
                    href={`/clubs/${nearestSchedule.clubId}`}
                    className="mt-1 text-center py-2 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container transition-colors"
                  >
                    독서클럽 이동하기 →
                  </Link>
                </div>
              ) : null}
            </div>
          </section>

          {/* 3. 나의 독서 클럽 섹션 (로그인 시) */}
          {user && (
            <section aria-labelledby="my-clubs-heading" className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 id="my-clubs-heading" className="font-headline-sm text-xl sm:text-2xl font-bold text-on-surface">
                    내가 참여 중인 독서 모임
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    총 {myClubs.length}개의 모임에서 책을 함께 읽고 있습니다.
                  </p>
                </div>

                <Tabs
                  label="내 클럽 상태"
                  value={activeClubTab}
                  onChange={(val) => setActiveClubTab(val)}
                  items={[
                    { value: 'active', label: `진행중 (${activeClubs.length})` },
                    { value: 'completed', label: `완독 (${completedClubs.length})` },
                  ]}
                />
              </div>

              {displayedClubs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedClubs.map((club) => (
                    <Link
                      key={club.id}
                      href={`/clubs/${club.id}`}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-lowest border border-surface-container hover:shadow-md hover:border-primary/30 transition-all group"
                    >
                      <div className="w-14 h-20 rounded-xl overflow-hidden bg-surface-container shrink-0 shadow-xs">
                        <img
                          src={club.book?.thumbnail || '/images/book-placeholder.png'}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.currentTarget.src = '/images/book-placeholder.png';
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 inline-block mb-1">
                          {club.status === 'completed' ? '완독 완료' : '진행중'}
                        </span>
                        <h3 className="font-bold text-sm text-on-surface truncate group-hover:text-primary transition-colors">
                          {club.name}
                        </h3>
                        <p className="text-xs text-on-surface-variant truncate mt-0.5">
                          {club.book?.title}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[11px] text-on-surface-variant">
                          <span>멤버 {(club.members || []).filter((m) => m.status === 'approved').length}명</span>
                          <span>·</span>
                          <span>일정 {(club.schedules || []).length}개</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-surface-container-low border border-surface-container text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
                  <Icon name="auto_stories" className="text-3xl text-on-surface-variant/40" />
                  <span>
                    {activeClubTab === 'active'
                      ? '현재 진행 중인 모임이 없습니다. 새로운 모임을 개설하거나 참여해보세요!'
                      : '아직 완독한 모임이 없습니다.'}
                  </span>
                </div>
              )}
            </section>
          )}

          {/* 4. 추천 도서 큐레이션 및 카테고리 섹션 */}
          <section aria-labelledby="curated-heading" className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h2 id="curated-heading" className="font-headline-sm text-xl sm:text-2xl font-bold text-on-surface">
                  함께 읽기 좋은 추천 도서
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  분야별 베스트셀러와 추천작으로 모임을 시작해보세요.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon="search"
                onClick={() => setIsSearchOpen(true)}
                className="text-xs"
              >
                직접 도서 검색
              </Button>
            </div>

            {/* 카테고리 필터 바 */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
            />

            {/* 도서 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
              {displayedBooks.map((book) => (
                <BookCard
                  key={book.isbn}
                  book={book}
                  onSelectBook={(b) => handleOpenCreateClub(b)}
                  onOpenDetail={(b) => {
                    setSelectedBookForDetail(b);
                    setIsDetailOpen(true);
                  }}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Modals */}
      <BookSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectBook={(b) => handleOpenCreateClub(b)}
      />

      <CreateClubModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        selectedBook={selectedBookForClub}
        onSuccess={handleClubCreated}
      />

      <ClubSearchModal
        isOpen={isClubSearchOpen}
        onClose={() => setIsClubSearchOpen(false)}
        onOpenCreateClub={() => handleOpenCreateClub(null)}
      />

      <BookDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        book={selectedBookForDetail}
        onOpenCreateClub={(b) => handleOpenCreateClub(b)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
