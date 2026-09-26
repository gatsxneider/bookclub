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
import AuthModal from '@/components/AuthModal';
import CozyLogo from '@/components/CozyLogo';
import { Book, Club } from '@/types/database';
import { filterCuratedBooks } from '@/lib/core/bookSearch';
import curatedBooksData from '@/lib/constants/curatedBooks.json';

export default function HomePage() {
  const router = useRouter();

  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState('01. 소설 / 문학');
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [activeClubTab, setActiveClubTab] = useState<'active' | 'completed'>('active');

  // 모달 상태
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
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

  // 도서 선택 시 클럽 개설 모달 열기
  const handleSelectBook = (book: Book) => {
    setSelectedBookForClub(book);
    setIsCreateOpen(true);
  };

  // 모임 개설 완료 시 상세 페이지로 이동
  const handleClubCreated = (clubId: string) => {
    if (clubId) {
      router.push(`/clubs/${clubId}`);
    } else {
      fetchClubs();
    }
  };

  // 필터된 클럽
  const filteredClubs = clubs.filter((c) =>
    activeClubTab === 'active' ? c.status !== 'completed' : c.status === 'completed'
  );

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* 1. Global Navigation Bar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNewClub={() => {
          // 기본 추천도서 1권으로 모달 열기
          setSelectedBookForClub(displayedBooks[0] || null);
          setIsCreateOpen(true);
        }}
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
                {/* 지우 님 대형 프로필 아바타 */}
                <div className="relative shrink-0 group">
                  <div className="w-36 h-36 sm:w-44 sm:h-44 lg:w-48 lg:h-48 xl:w-52 xl:h-52 rounded-3xl sm:rounded-[2.25rem] overflow-hidden ring-4 sm:ring-6 ring-primary/20 shadow-2xl bg-surface-container transition-transform duration-300 group-hover:scale-[1.03]">
                    <img
                      src="/images/avatar.png"
                      alt="지우 님 프로필"
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 sm:border-[3px] border-surface">
                    <span className="material-symbols-outlined text-[18px] sm:text-[22px]">auto_stories</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-center sm:text-left flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-primary text-xs sm:text-sm font-semibold">
                    <span className="material-symbols-outlined text-[16px] sm:text-[18px]">local_cafe</span>
                    <span>다정한 사람들의 온기 있는 서재</span>
                  </div>
                  <h1 className="font-headline-md text-xl sm:text-2xl lg:text-3xl text-on-surface font-bold tracking-tight leading-snug">
                    안녕하세요 지우 님, 오늘도 마음을 살찌우는 따뜻한 문장 한 줄 어떠세요? 🌿
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
                    <span className="text-xs font-medium text-on-surface-variant">읽고 있는 책</span>
                  </div>
                  <span className="text-sm font-bold text-primary">2권</span>
                </div>

                {/* 2. 이번 달 작성 독후감 */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-container-lowest shadow-[0_1px_3px_rgba(45,40,37,0.03)] border border-surface-container hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="text-xs font-medium text-on-surface-variant">이번 달 독후감</span>
                  </div>
                  <span className="text-sm font-bold text-secondary">4편</span>
                </div>

                {/* 3. 모임 일정 */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-secondary-fixed/50 text-on-secondary-fixed shadow-[0_1px_3px_rgba(45,40,37,0.03)] border border-secondary-fixed hover:bg-secondary-fixed/80 transition-colors">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[16px]">schedule</span>
                    <span className="text-xs font-medium">오늘의 모임</span>
                  </div>
                  <span className="text-xs font-bold text-secondary px-2 py-0.5 rounded-full bg-surface/90 shadow-xs">
                    D-2
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
                  onClick={() => setIsSearchOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant hover:bg-primary hover:text-on-primary text-xs font-semibold transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[15px]">add_circle</span>
                  <span>+ 클럽 만들기</span>
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
                  진행중 <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">2</span>
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
                  완료된 클럽 <span className="ml-1 px-1.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[10px]">1</span>
                </button>
              </div>

              {/* Active Clubs List */}
              <div className="flex flex-col gap-4">
                {activeClubTab === 'active' ? (
                  <>
                    {/* Club Card 1: 불편한 편의점 */}
                    <article className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 border border-surface-container">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed-dim/40 text-on-primary-fixed-variant text-[11px] font-semibold">
                          <span className="material-symbols-outlined text-[13px]">eco</span>
                          <span>참여중 · D-3 토론</span>
                        </span>
                        <span className="text-[11px] text-secondary font-medium">격주 수요일 밤 10시</span>
                      </div>

                      <div className="flex flex-col">
                        <Link
                          href="/clubs/cozy-default-club"
                          className="font-title-md text-base font-bold text-on-surface hover:text-primary transition-colors cursor-pointer"
                        >
                          고요한 숲속 심야 독서회
                        </Link>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[15px] text-primary">person_outline</span>
                          <span>방장: 달빛책방지기 (김민서)</span>
                        </p>
                      </div>

                      {/* Book Thumbnail & Progress */}
                      <Link
                        href="/clubs/cozy-default-club"
                        className="flex gap-3 bg-surface-container-low p-3 rounded-xl items-center hover:bg-surface-container transition-colors"
                      >
                        <img
                          src="https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5871383%3Ftimestamp%3D20240904121510"
                          alt="불편한 편의점"
                          className="w-14 h-20 object-cover rounded-lg shadow-sm shrink-0"
                        />
                        <div className="flex flex-col flex-1 min-w-0 justify-between h-full py-0.5">
                          <div>
                            <h4 className="text-xs font-bold text-on-surface truncate">『불편한 편의점』</h4>
                            <p className="text-[11px] text-on-surface-variant truncate">김호연 저 · 나무옆의자</p>
                          </div>
                          <div className="flex flex-col gap-1 mt-2">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-primary font-medium">현재 4단원 진행중</span>
                              <span className="text-secondary font-bold">75%</span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: '75%' }} />
                            </div>
                          </div>
                        </div>
                      </Link>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          <div className="w-6 h-6 rounded-full bg-primary-fixed text-primary text-[10px] font-bold flex items-center justify-center border-2 border-surface">
                            달
                          </div>
                          <div className="w-6 h-6 rounded-full bg-secondary-fixed text-secondary text-[10px] font-bold flex items-center justify-center border-2 border-surface">
                            지
                          </div>
                          <div className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface text-[10px] font-bold flex items-center justify-center border-2 border-surface">
                            +4
                          </div>
                        </div>
                        <Link
                          href="/clubs/cozy-default-club"
                          className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                        >
                          <span>단원별 독후감 보기</span>
                          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                        </Link>
                      </div>
                    </article>

                    {/* Club Card 2: 도둑맞은 집중력 */}
                    <article className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 border border-surface-container">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[11px] font-semibold">
                          <span className="material-symbols-outlined text-[13px]">event_repeat</span>
                          <span>참여중 · 격주 일요일</span>
                        </span>
                        <span className="text-[11px] text-on-surface-variant font-medium">오후 3시 티타임</span>
                      </div>

                      <div className="flex flex-col">
                        <Link
                          href="/clubs/cozy-default-club"
                          className="font-title-md text-base font-bold text-on-surface hover:text-primary transition-colors cursor-pointer"
                        >
                          따스한 차 한 잔과 인문학
                        </Link>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[15px] text-primary">person_outline</span>
                          <span>방장: 유진</span>
                        </p>
                      </div>

                      <Link
                        href="/clubs/cozy-default-club"
                        className="flex gap-3 bg-surface-container-low p-3 rounded-xl items-center hover:bg-surface-container transition-colors"
                      >
                        <img
                          src="https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F6298533%3Ftimestamp%3D20240904122115"
                          alt="도둑맞은 집중력"
                          className="w-14 h-20 object-cover rounded-lg shadow-sm shrink-0"
                        />
                        <div className="flex flex-col flex-1 min-w-0 justify-between h-full py-0.5">
                          <div>
                            <h4 className="text-xs font-bold text-on-surface truncate">『도둑맞은 집중력』</h4>
                            <p className="text-[11px] text-on-surface-variant truncate">요한 하리 저 · 어크로스</p>
                          </div>
                          <div className="flex flex-col gap-1 mt-2">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-tertiary font-medium">2단원 생각 나누기 작성중</span>
                              <span className="text-tertiary font-bold">40%</span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                              <div className="h-full bg-secondary-container rounded-full transition-all duration-500" style={{ width: '40%' }} />
                            </div>
                          </div>
                        </div>
                      </Link>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          <div className="w-6 h-6 rounded-full bg-primary-fixed text-primary text-[10px] font-bold flex items-center justify-center border-2 border-surface">
                            유
                          </div>
                          <div className="w-6 h-6 rounded-full bg-surface-container-high text-on-surface text-[10px] font-bold flex items-center justify-center border-2 border-surface">
                            +7
                          </div>
                        </div>
                        <Link
                          href="/clubs/cozy-default-club"
                          className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                        >
                          <span>단원별 독후감 보기</span>
                          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                        </Link>
                      </div>
                    </article>
                  </>
                ) : (
                  /* Completed Archive Card */
                  <article className="bg-surface-container-low/70 rounded-2xl p-4 shadow-sm flex flex-col gap-3 border border-surface-container">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant text-[11px] font-semibold">
                        <span className="material-symbols-outlined text-[13px]">menu_book</span>
                        <span>완료 · 기념서가</span>
                      </span>
                      <span className="text-[11px] text-primary font-semibold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        <span>올클리어 배지 획득</span>
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <h3 className="font-title-md text-base font-bold text-on-surface">어린왕자 완독 챌린지</h3>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[15px] text-primary">military_tech</span>
                        <span>방장: 지우 (나)</span>
                      </p>
                    </div>

                    <div className="flex gap-3 bg-surface-container p-3 rounded-xl items-center">
                      <div className="w-14 h-20 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0 shadow-sm">
                        <span className="material-symbols-outlined text-[24px]">book</span>
                      </div>
                      <div className="flex flex-col flex-1 min-w-0 justify-between h-full py-0.5">
                        <div>
                          <h4 className="text-xs font-bold text-on-surface truncate">『어린 왕자』</h4>
                          <p className="text-[11px] text-on-surface-variant truncate">생텍쥐페리 저</p>
                        </div>
                        <div className="flex flex-col gap-1 mt-2">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-on-surface-variant">5개 단원 기록 완료</span>
                            <span className="text-primary font-bold">100%</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
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
                      서정적인 도서 탐색 & 카테고리별 추천 Top 10
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      취향이 머무는 12개 분야에서 가장 많이 언급된 도서를 둘러보세요
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

      <CreateClubModal
        isOpen={isCreateOpen}
        book={selectedBookForClub}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleClubCreated}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => {
          setIsAuthOpen(false);
          alert(`${u.nickname}님, 환영합니다!`);
        }}
      />
    </div>
  );
}
