'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CategoryFilter from '@/components/CategoryFilter';
import BookCard from '@/components/BookCard';
import BookSearchModal from '@/components/BookSearchModal';
import CreateClubModal from '@/components/CreateClubModal';
import BookDetailModal from '@/components/BookDetailModal';
import ClubSearchModal from '@/components/ClubSearchModal';
import AuthModal from '@/components/AuthModal';
import CozyLogo from '@/components/CozyLogo';
import { Book, Club } from '@/types/database';
import { filterCuratedBooks } from '@/lib/core/bookSearch';
import curatedBooksData from '@/lib/constants/curatedBooks.json';
import { isUserClubMember, isClubCompleted, calculateClubTotalProgress } from '@/lib/core/scheduleCalculator';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();

  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState('01. 소설 / 문학');
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [activeClubTab, setActiveClubTab] = useState<'active' | 'completed'>('active');

  // 모달 상태 & 로그인 후 이어서 실행할 액션
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isClubSearchOpen, setIsClubSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const [selectedBookForClub, setSelectedBookForClub] = useState<Book | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);

  // 카테고리 변경 시 도서 목록 갱신
  useEffect(() => {
    const books = filterCuratedBooks(curatedBooksData, selectedCategory);
    setDisplayedBooks(books);
  }, [selectedCategory]);

  // 클럽 목록 가져오기
  const fetchClubs = async () => {
    try {
      const res = await fetch('/api/clubs');
      if (res.ok) {
        const data = await res.json();
        setClubs(data.clubs || []);
      }
    } catch (err) {
      console.warn('클럽 데이터 로드 오류:', err);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  // [새 독서클럽] 또는 [클럽 만들기] 클릭 핸들러 (미로그인 시 로그인 창 먼저 띄우기)
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

  // 도서 카드에서 클럽 개설 선택 시
  const handleSelectBook = (book: Book) => {
    handleOpenCreateClub(book);
  };

  // 로그인 성공 시 후속 액션 실행
  const handleAuthSuccess = () => {
    setIsAuthOpen(false);
    if (pendingAction === 'create_club') {
      setPendingAction(null);
      setIsCreateOpen(true);
    }
  };

  // 모임 개설 완료 시 상세 페이지로 이동
  const handleClubCreated = (clubId: string) => {
    if (clubId) {
      router.push(`/clubs/${clubId}`);
    } else {
      fetchClubs();
    }
  };

  // 내가 방장이거나 참여 중인 클럽만 필터링
  const myClubs = user ? clubs.filter((c) => isUserClubMember(c, user.id)) : [];
  const activeClubs = myClubs.filter((c) => !isClubCompleted(c));
  const completedClubs = myClubs.filter((c) => isClubCompleted(c));

  // 현재 활성화된 탭에 따른 클럽 목록
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
      <main className="w-full pt-24 pb-16 flex-1">
        <div className="max-w-7xl mx-auto px-gutter flex flex-col gap-6">
          {/* Top Banner / Warm Greeting */}
          <section className="w-full bg-surface-container-low rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden border border-surface-container">
            <div className="absolute -right-10 -bottom-10 w-52 h-52 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-0 right-1/4 w-36 h-36 bg-secondary/5 rounded-full blur-xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 relative z-10">
              {/* 좌측: 대형 프로필 아바타 & 따뜻한 인사말 */}
              <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 sm:gap-8 flex-1">
                <div className="relative shrink-0 group">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-3xl overflow-hidden ring-4 ring-primary/20 shadow-xl bg-surface-container transition-transform duration-300 group-hover:scale-[1.02]">
                    <img
                      src={user?.avatar_url || '/images/avatar.png'}
                      alt={user ? `${user.nickname} 님의 프로필` : '코지 북클럽 서재'}
                      className="w-full h-full object-cover object-center"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== `${window.location.origin}/images/avatar.png`) {
                          target.src = '/images/avatar.png';
                        }
                      }}
                    />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-surface">
                    <span className="material-symbols-outlined text-[18px] sm:text-[20px]">auto_stories</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-primary text-xs sm:text-sm font-semibold">
                    <span className="material-symbols-outlined text-[16px] sm:text-[18px]">local_cafe</span>
                    <span>다정한 사람들의 온기 있는 서재</span>
                  </div>
                  <h1 className="font-headline-md text-xl sm:text-2xl lg:text-3xl text-on-surface font-bold tracking-tight leading-snug">
                    {user ? (
                      <>안녕하세요 <span className="text-primary font-extrabold">{user.nickname}</span> 님, 오늘도 마음을 살찌우는 따뜻한 문장 한 줄 어떠세요? 🌿</>
                    ) : (
                      <>다정한 사람들과 함께 책을 읽고, 따뜻한 마음을 나누는 독서클럽에 오신 것을 환영합니다 🌿</>
                    )}
                  </h1>
                  <p className="font-body-reading text-sm sm:text-base text-on-surface-variant italic">
                    “책은 손에 쥐는 고요한 숲이며, 함께 읽을 때 그 숲은 더욱 푸르러집니다.”
                  </p>
                </div>
              </div>

              {/* 우측: 세로 정렬된 독서 활동 현황 위젯 */}
              <div className="flex flex-col gap-2 w-full lg:w-64 xl:w-72 shrink-0 bg-surface/70 backdrop-blur-sm p-3.5 sm:p-4 rounded-2xl border border-surface-container shadow-sm">
                <div className="flex items-center justify-between px-1 pb-1 border-b border-surface-container text-xs font-semibold text-on-surface-variant">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-primary">analytics</span>
                    나의 독서 활동
                  </span>
                  <span className="text-[11px] text-primary font-medium">실시간</span>
                </div>

                {/* 1. 읽고 있는 책 */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-lowest shadow-[0_1px_3px_rgba(45,40,37,0.03)] border border-surface-container hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-medium text-on-surface-variant">참여 중인 모임</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{myClubs.length}개</span>
                </div>

                {/* 2. 매너 온도 */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-lowest shadow-[0_1px_3px_rgba(45,40,37,0.03)] border border-surface-container hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="text-xs font-medium text-on-surface-variant">나의 매너온도</span>
                  </div>
                  <span className="text-sm font-bold text-secondary">{user?.manner_temperature ?? 20.0}℃</span>
                </div>

                {/* 3. 모임 일정 */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary-fixed/50 text-on-secondary-fixed shadow-[0_1px_3px_rgba(45,40,37,0.03)] border border-secondary-fixed hover:bg-secondary-fixed/80 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[16px]">schedule</span>
                    <span className="text-xs font-medium">단원 일정</span>
                  </div>
                  <span className="text-xs font-bold text-secondary px-2 py-0.5 rounded-full bg-surface/90 shadow-xs">
                    상시 토론
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Main 2-Column Split: Left (My Reading Clubs) + Right (12 Category Curations) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start w-full">
            {/* LEFT COLUMN: 나의 독서클럽 (~40%) */}
            <section className="lg:col-span-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[22px]">auto_stories</span>
                  <h2 className="font-headline-sm text-lg font-bold text-on-surface tracking-tight">
                    나의 독서클럽
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClubSearchOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant hover:bg-primary hover:text-on-primary text-xs font-semibold transition-all shadow-sm"
                  aria-label="독서 클럽 찾기"
                >
                  <span className="material-symbols-outlined text-[16px]">explore</span>
                  <span>독서 클럽 찾기</span>
                </button>
              </div>

              {/* Sub-tabs: 진행중 / 완료된 클럽 */}
              <div className="flex items-center gap-1 p-1 bg-surface-container rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveClubTab('active')}
                  className={`flex-1 py-1.5 text-center rounded-lg text-xs font-semibold transition-all ${
                    activeClubTab === 'active'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  진행중 클럽 <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">{activeClubs.length}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveClubTab('completed')}
                  className={`flex-1 py-1.5 text-center rounded-lg text-xs font-semibold transition-all ${
                    activeClubTab === 'completed'
                      ? 'bg-surface-container-lowest text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  완료된 클럽 <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeClubTab === 'completed'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-surface-container-high text-on-surface-variant'
                  }`}>{completedClubs.length}</span>
                </button>
              </div>

              {/* Active / Dynamic Clubs List */}
              <div className="flex flex-col gap-4">
                {displayedClubs.length > 0 ? (
                  displayedClubs.map((club) => {
                    const approvedCount = (club.members || []).filter((m) => m.status === 'approved').length || 1;
                    const schedCount = (club.schedules || []).length || 0;
                    const bookThumb = club.book?.thumbnail || 'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5871383%3Ftimestamp%3D20240904121510';
                    const authorStr = Array.isArray(club.book?.authors) ? club.book.authors.join(', ') : club.book?.authors || '';
                    const isCompleted = isClubCompleted(club);

                    const totalReviews = (club.schedules || []).reduce(
                      (sum, s) => sum + (s.reviews_count || (s.reviews?.length ?? 0)),
                      0
                    );
                    const { percentage: clubProgress } = calculateClubTotalProgress(
                      totalReviews,
                      approvedCount,
                      schedCount
                    );

                    return (
                      <article
                        key={club.id}
                        className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 border border-surface-container"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isCompleted 
                              ? 'bg-secondary-fixed/50 text-on-secondary-fixed' 
                              : 'bg-primary-fixed-dim/40 text-on-primary-fixed-variant'
                          }`}>
                            <span className="material-symbols-outlined text-[13px]">
                              {isCompleted ? 'check_circle' : 'eco'}
                            </span>
                            <span>{isCompleted ? '완료' : '진행중'} · 정원 {club.max_members}명</span>
                          </span>
                          <span className="text-[11px] text-secondary font-medium">
                            {club.end_date ? `완독 목표: ${club.end_date}` : '상시 모임'}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <Link
                            href={`/clubs/${club.id}`}
                            className="font-title-md text-base font-bold text-on-surface hover:text-primary transition-colors cursor-pointer"
                          >
                            {club.name}
                          </Link>
                          <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[15px] text-primary">person_outline</span>
                            <span>방장: <strong className="text-primary">{club.leader?.nickname || '방장'}</strong> 님</span>
                          </p>
                        </div>

                        {/* Book Thumbnail & Progress */}
                        <Link
                          href={`/clubs/${club.id}`}
                          className="flex gap-3 bg-surface-container-low p-3 rounded-xl items-center hover:bg-surface-container transition-colors"
                        >
                          <img
                            src={bookThumb}
                            alt={club.book?.title || club.name}
                            className="w-14 h-20 object-cover rounded-lg shadow-sm shrink-0 bg-surface-container"
                          />
                          <div className="flex flex-col flex-1 min-w-0 justify-between h-full py-0.5">
                            <div>
                              <h4 className="text-xs font-bold text-on-surface truncate">『{club.book?.title || club.name}』</h4>
                              <p className="text-[11px] text-on-surface-variant truncate">{authorStr} {club.book?.publisher ? `· ${club.book.publisher}` : ''}</p>
                            </div>
                            <div className="flex flex-col gap-1 mt-2">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-primary font-medium">{schedCount > 0 ? `총 ${schedCount}개 단원` : '단원 등록 준비중'}</span>
                                <span className="text-secondary font-bold">{approvedCount}명 참여 ({schedCount > 0 ? `${clubProgress}%` : '0%'})</span>
                              </div>
                              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all duration-500"
                                  style={{ width: `${schedCount > 0 ? clubProgress : 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </Link>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            <div className="w-6 h-6 rounded-full bg-primary-fixed text-primary text-[10px] font-bold flex items-center justify-center border-2 border-surface">
                              {club.leader?.nickname?.[0] || '방'}
                            </div>
                            {approvedCount > 1 && (
                              <div className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface text-[10px] font-bold flex items-center justify-center border-2 border-surface">
                                +{approvedCount - 1}
                              </div>
                            )}
                          </div>
                          <Link
                            href={`/clubs/${club.id}`}
                            className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                          >
                            <span>단원별 일정 보기</span>
                            <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                          </Link>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  /* 클럽이 없을 때 기본 카드 */
                  <article className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center gap-3 border border-surface-container py-10">
                    <span className="material-symbols-outlined text-[36px] text-primary">auto_stories</span>
                    <div>
                      <h3 className="font-bold text-sm text-on-surface">
                        {!user 
                          ? '로그인이 필요한 서비스입니다'
                          : activeClubTab === 'active' 
                            ? '현재 진행 중인 독서클럽이 없습니다' 
                            : '아직 완료된 독서클럽이 없습니다'}
                      </h3>
                      <p className="text-xs text-on-surface-variant mt-1">
                        {!user 
                          ? '로그인 후 내가 참여 중인 독서모임을 확인하고 새 모임을 시작해보세요!' 
                          : activeClubTab === 'active' 
                            ? '우측 추천 도서를 둘러보고 마음에 드는 책으로 첫 모임을 열거나 클럽을 찾아보세요!' 
                            : '모든 멤버와 함께 단원별 독후감을 완료하여 완독 클럽을 달성해보세요! 🌿'}
                      </p>
                    </div>
                    {!user ? (
                      <button
                        type="button"
                        onClick={() => setIsAuthOpen(true)}
                        className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold shadow-sm hover:bg-primary-container"
                      >
                        로그인하기
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenCreateClub(displayedBooks[0] || null)}
                          className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-semibold shadow-sm hover:bg-primary-container"
                        >
                          첫 독서클럽 만들기
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsClubSearchOpen(true)}
                          className="px-4 py-2 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold shadow-sm hover:bg-surface-container"
                        >
                          독서 클럽 찾기
                        </button>
                      </div>
                    )}
                  </article>
                )}
              </div>
            </section>

            {/* RIGHT COLUMN: 12개 카테고리별 도서 추천 & 탐색 (~60%) */}
            <section className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[24px]">recommend</span>
                  <div>
                    <h2 className="font-headline-sm text-lg font-bold text-on-surface tracking-tight">
                      카테고리별 추천도서 Top 10
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      취향이 머무는 12개 분야에서 가장 주목받고 있는 도서를 둘러보세요
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all self-start sm:self-auto border border-surface-container-high shadow-sm"
                >
                  <span className="material-symbols-outlined text-[15px]">search</span>
                  <span>직접 검색</span>
                </button>
              </div>

              {/* 12 Category Filter Chips */}
              <CategoryFilter
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />

              {/* Books Grid: Top 10 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {displayedBooks.map((book) => (
                  <BookCard
                    key={book.isbn}
                    book={book}
                    onSelectBook={handleSelectBook}
                    onViewDetail={(b) => {
                      setSelectedBookForDetail(b);
                      setIsDetailOpen(true);
                    }}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Modals */}
      <BookDetailModal
        isOpen={isDetailOpen}
        book={selectedBookForDetail}
        onClose={() => setIsDetailOpen(false)}
        onSelectForClub={handleSelectBook}
      />

      <BookSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectBook={handleSelectBook}
      />

      <ClubSearchModal
        isOpen={isClubSearchOpen}
        onClose={() => setIsClubSearchOpen(false)}
        onSelectClub={(club) => {
          setIsClubSearchOpen(false);
          router.push(`/clubs/${club.id}`);
        }}
      />

      <CreateClubModal
        isOpen={isCreateOpen}
        book={selectedBookForClub}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleClubCreated}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setPendingAction(null);
        }}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
