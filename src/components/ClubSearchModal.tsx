'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Club } from '@/types/database';

interface ClubSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectClub?: (club: Club) => void;
}

const ITEMS_PER_PAGE = 10;

export default function ClubSearchModal({
  isOpen,
  onClose,
  onSelectClub,
}: ClubSearchModalProps) {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  // 모달 열릴 때 클럽 목록 불러오기
  useEffect(() => {
    if (!isOpen) return;

    const fetchAllClubs = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/clubs');
        if (res.ok) {
          const data = await res.json();
          if (data.clubs && Array.isArray(data.clubs)) {
            setClubs(data.clubs);
            return;
          }
        }
      } catch (err) {
        console.warn('독서클럽 목록 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllClubs();
  }, [isOpen]);

  // 검색 실행 핸들러
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchKeyword(searchInput.trim());
    setCurrentPage(1);
  };

  // 검색어 초기화
  const handleClearSearch = () => {
    setSearchInput('');
    setSearchKeyword('');
    setCurrentPage(1);
  };

  // 필터링된 클럽 목록
  const filteredClubs = useMemo(() => {
    return clubs.filter((club) => {
      // 1. 상태 필터
      if (statusFilter === 'active' && club.status === 'completed') return false;
      if (statusFilter === 'completed' && club.status !== 'completed') return false;

      // 2. 검색어 필터
      if (!searchKeyword) return true;
      const lowerQuery = searchKeyword.toLowerCase();

      const clubName = (club.name || '').toLowerCase();
      const clubDesc = (club.description || '').toLowerCase();
      const bookTitle = (club.book?.title || '').toLowerCase();
      const bookPublisher = (club.book?.publisher || '').toLowerCase();
      const leaderName = (club.leader?.nickname || '').toLowerCase();
      
      const authors = Array.isArray(club.book?.authors)
        ? club.book.authors.join(' ').toLowerCase()
        : (club.book?.authors || '').toLowerCase();

      return (
        clubName.includes(lowerQuery) ||
        clubDesc.includes(lowerQuery) ||
        bookTitle.includes(lowerQuery) ||
        bookPublisher.includes(lowerQuery) ||
        leaderName.includes(lowerQuery) ||
        authors.includes(lowerQuery)
      );
    });
  }, [clubs, searchKeyword, statusFilter]);

  // 페이지네이션 계산 (10개씩)
  const totalItems = filteredClubs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedClubs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredClubs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredClubs, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      const container = document.getElementById('club-list-container');
      if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClubClick = (club: Club) => {
    onClose();
    if (onSelectClub) {
      onSelectClub(club);
    } else {
      router.push(`/clubs/${club.id}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="club-search-title"
    >
      <div className="bg-surface rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden border border-outline-variant">
        {/* 1. Header */}
        <div className="p-5 border-b border-surface-container flex items-center justify-between bg-surface-container-low shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined text-[22px]">explore</span>
            </div>
            <div>
              <h2 id="club-search-title" className="font-headline-sm text-lg font-bold text-on-surface">
                독서 클럽 찾기
              </h2>
              <p className="text-xs text-on-surface-variant">
                함께 읽고 따뜻한 문장을 나눌 독서클럽을 찾아보세요
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* 2. Search & Filter Bar */}
        <div className="p-4 bg-surface-container-lowest border-b border-surface-container flex flex-col gap-3 shrink-0">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="클럽명, 도서명, 저자, 방장 닉네임으로 검색..."
                className="w-full bg-surface-container-low text-on-surface pl-10 pr-9 py-2.5 rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all placeholder:text-outline-variant"
                autoFocus
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:bg-primary-container transition-all disabled:opacity-50 whitespace-nowrap shadow-sm"
              aria-label="독서 클럽 검색"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>독서 클럽 검색</span>
            </button>
          </form>

          {/* Status Filter Tabs & Results Count */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1 bg-surface-container p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                전체
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('active');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  statusFilter === 'active'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                진행중
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('completed');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                  statusFilter === 'completed'
                    ? 'bg-surface-container-lowest text-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                완료됨
              </button>
            </div>

            <div className="text-on-surface-variant">
              <span>검색 결과: </span>
              <strong className="text-primary font-bold">{totalItems}</strong>
              <span>개 (10개씩 표시)</span>
            </div>
          </div>
        </div>

        {/* 3. Clubs List (10 items per page) */}
        <div id="club-list-container" className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[320px]">
          {loading ? (
            <div className="py-16 text-center text-on-surface-variant flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[36px] text-primary animate-spin">
                progress_activity
              </span>
              <p className="text-sm font-medium">독서클럽 목록을 불러오는 중입니다...</p>
            </div>
          ) : paginatedClubs.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[42px] text-outline">
                menu_book
              </span>
              <p className="text-sm font-semibold text-on-surface">검색 결과와 일치하는 독서클럽이 없습니다.</p>
              <p className="text-xs text-on-surface-variant">다른 검색어로 찾아보거나 필터를 변경해보세요.</p>
              {searchKeyword && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="mt-2 px-4 py-1.5 rounded-full bg-surface-container text-xs font-semibold text-primary hover:bg-surface-container-high transition-colors"
                >
                  검색 초기화
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paginatedClubs.map((club) => {
                const approvedMembersCount =
                  (club.members || []).filter((m) => m.status === 'approved').length || 1;
                const bookThumb =
                  club.book?.thumbnail ||
                  'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5871383%3Ftimestamp%3D20240904121510';
                const authorStr = Array.isArray(club.book?.authors)
                  ? club.book.authors.join(', ')
                  : club.book?.authors || '';

                return (
                  <div
                    key={club.id}
                    onClick={() => handleClubClick(club)}
                    className="group bg-surface-container-lowest hover:bg-surface-container-low rounded-xl p-3.5 border border-surface-container hover:border-primary/40 shadow-xs hover:shadow-md transition-all cursor-pointer flex gap-3.5 relative overflow-hidden"
                  >
                    {/* Left: Book Thumbnail */}
                    <div className="w-16 h-22 rounded-lg bg-surface-container shrink-0 overflow-hidden shadow-sm relative">
                      <img
                        src={bookThumb}
                        alt={club.book?.title || club.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5871383%3Ftimestamp%3D20240904121510';
                        }}
                      />
                    </div>

                    {/* Right: Club Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            club.status === 'completed'
                              ? 'bg-surface-container-high text-on-surface-variant'
                              : 'bg-primary-fixed text-on-primary-fixed'
                          }`}>
                            {club.status === 'completed' ? '완료' : '진행중'}
                          </span>
                          <span className="text-[11px] text-secondary font-medium truncate">
                            {approvedMembersCount}/{club.max_members || 6}명 참여
                          </span>
                        </div>

                        <h3 className="font-title-sm text-sm font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                          {club.name}
                        </h3>

                        <p className="text-xs text-on-surface-variant truncate mt-0.5">
                          『{club.book?.title || '선정 도서'}』
                          {authorStr ? ` · ${authorStr}` : ''}
                        </p>
                      </div>

                      <div className="pt-2 mt-1 border-t border-surface-container flex items-center justify-between text-[11px] text-on-surface-variant">
                        <span className="truncate flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-primary">person</span>
                          <span>{club.leader?.nickname || '방장'} 님</span>
                        </span>
                        <span className="text-primary font-semibold shrink-0 flex items-center gap-0.5">
                          <span>입장하기</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Pagination Footer (10 items per page) */}
        <div className="p-3 bg-surface-container-low border-t border-surface-container flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="text-xs text-on-surface-variant">
            <span>페이지 </span>
            <strong className="text-on-surface">{currentPage}</strong>
            <span> / {totalPages}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              aria-label="이전 페이지"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => {
                // 현재 페이지 주변 2개와 양 끝 1개만 표시
                return (
                  p === 1 ||
                  p === totalPages ||
                  (p >= currentPage - 1 && p <= currentPage + 1)
                );
              })
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <React.Fragment key={p}>
                    {prev && p - prev > 1 && (
                      <span className="px-1 text-xs text-on-surface-variant">...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => handlePageChange(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                        currentPage === p
                          ? 'bg-primary text-on-primary shadow-xs'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              aria-label="다음 페이지"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
