'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import CozyLogo from './CozyLogo';
import UserProfileModal from './UserProfileModal';
import NoteBoxModal from './NoteBoxModal';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenNewClub?: () => void;
  onOpenAuth: () => void;
}

function NavLinksInner({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const hasClubOrScheduleFilter = Boolean(
    searchParams?.get('clubId') ||
    searchParams?.get('club_id') ||
    searchParams?.get('scheduleId') ||
    searchParams?.get('schedule_id')
  );

  const navLinks = [
    { label: '홈', href: '/' },
    { label: '내 서재 & 클럽', href: '/my-clubs' },
    { label: '내 독후감 피드', href: '/book-reviews' },
    { label: '도서 탐색', href: '/explore' },
  ];

  return (
    <nav className="hidden lg:flex items-center gap-1.5 shrink-0">
      {navLinks.map((link) => {
        let isActive = pathname === link.href;
        // '클럽 독후감 전체 모아보기' 등 특정 클럽/단원 피드 조회 중일 때는 상단 '내 독후감 피드' 탭 하이라이트 제외
        if (link.href === '/book-reviews' && hasClubOrScheduleFilter) {
          isActive = false;
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3.5 py-2 rounded-full font-title-sm text-sm whitespace-nowrap transition-all ${
              isActive
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-[0_2px_8px_-2px_rgba(45,40,37,0.08)]'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavLinksFallback({ pathname }: { pathname: string }) {
  const navLinks = [
    { label: '홈', href: '/' },
    { label: '내 서재 & 클럽', href: '/my-clubs' },
    { label: '내 독후감 피드', href: '/book-reviews' },
    { label: '도서 탐색', href: '/explore' },
  ];

  return (
    <nav className="hidden lg:flex items-center gap-1.5 shrink-0">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3.5 py-2 rounded-full font-title-sm text-sm whitespace-nowrap transition-all ${
              isActive
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-[0_2px_8px_-2px_rgba(45,40,37,0.08)]'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function Navbar({
  onOpenSearch,
  onOpenAuth,
}: NavbarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNoteBoxOpen, setIsNoteBoxOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // 안읽은 쪽지 개수 가져오기
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch(`/api/messages?userId=${user.id}&box=unread_count`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(Number(data.unreadCount) || 0);
      }
    } catch (err) {
      console.warn('Unread note count check error:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    // 30초마다 안읽은 쪽지 폴링
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(45,40,37,0.05)] border-b border-surface-container">
        <div className="h-20 max-w-7xl mx-auto px-gutter flex items-center justify-between gap-gutter">
          {/* Logo */}
          <div className="flex items-center gap-space-md shrink-0">
            <Link href="/" className="flex items-center group">
              <CozyLogo variant="horizontal" size="md" />
            </Link>
          </div>

          {/* Navigation Tabs */}
          <Suspense fallback={<NavLinksFallback pathname={pathname} />}>
            <NavLinksInner pathname={pathname} />
          </Suspense>

          {/* Search Trigger Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-[240px] lg:max-w-[280px] xl:max-w-xs mx-space-xs">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full bg-surface-container-low text-on-surface-variant flex items-center gap-2 pl-3.5 pr-3 py-1.5 rounded-full hover:bg-surface-container hover:ring-2 hover:ring-primary/20 transition-all text-xs sm:text-sm text-left shadow-[0_1px_3px_rgba(45,40,37,0.03)]"
            >
              <span className="material-symbols-outlined text-[17px] shrink-0">search</span>
              <span className="truncate">도서명, 작가, 클럽 검색...</span>
            </button>
          </div>

          {/* User & Action Buttons */}
          <div className="flex items-center gap-space-sm shrink-0">
            <button
              type="button"
              onClick={onOpenSearch}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
              aria-label="도서 검색"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>

            {/* 로그인 상태에 따른 버튼 전환 영역 */}
            {user ? (
              /* 로그인 후: 닉네임 + 쪽지함 아이콘 + 로그아웃 버튼 */
              <div className="flex items-center gap-2 pl-1">
                {/* 1. 회원 정보 (프로필 버튼) */}
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-container transition-all text-left group"
                  title="클릭하여 프로필 아바타 및 레벨 확인"
                  aria-label="내 프로필 관리"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/30 group-hover:ring-primary shadow-sm bg-surface-container shrink-0 transition-all">
                    <img
                      src={user.avatar_url || '/images/avatar.png'}
                      alt={user.nickname}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== `${window.location.origin}/images/avatar.png`) {
                          target.src = '/images/avatar.png';
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1">
                      <span className="font-title-sm text-xs text-on-surface leading-tight font-bold group-hover:text-primary transition-colors">
                        {user.nickname} 님
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[9px] font-extrabold">
                        Lv.{user.level || 1}
                      </span>
                    </div>
                    <span className="font-label-sm text-[10px] text-primary font-medium tracking-tight">
                      감성 온도 {user.manner_temperature ?? 20.0}℃
                    </span>
                  </div>
                </button>

                {/* 2. 쪽지함 아이콘 (회원정보와 로그아웃 사이에 위치) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNoteBoxOpen(true)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all relative group ${
                      unreadCount > 0
                        ? 'bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 ring-2 ring-amber-500/40 animate-note-sparkle'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface border border-surface-container'
                    }`}
                    title={
                      unreadCount > 0
                        ? `쪽지함 (읽지 않은 쪽지 ${unreadCount}개)`
                        : '쪽지함'
                    }
                    aria-label="쪽지함 열기"
                  >
                    <span className="material-symbols-outlined text-[19px] group-hover:scale-110 transition-transform">
                      {unreadCount > 0 ? 'mark_email_unread' : 'mail'}
                    </span>

                    {/* 안 읽은 쪽지가 있을 때 반짝이는 뱃지 & 글로우 */}
                    {unreadCount > 0 && (
                      <>
                        <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md animate-bounce ring-2 ring-surface">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      </>
                    )}
                  </button>
                </div>

                {/* 3. 로그아웃 버튼 */}
                <button
                  type="button"
                  onClick={signOut}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high hover:text-on-surface transition-all border border-surface-container ml-0.5"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              /* 로그인 전: 로그인 버튼만 표시 */
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary hover:text-on-secondary text-xs font-bold transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>로그인</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* User Profile & Avatar Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* 쪽지함 Modal */}
      <NoteBoxModal
        isOpen={isNoteBoxOpen}
        onClose={() => {
          setIsNoteBoxOpen(false);
          fetchUnreadCount();
        }}
        onUnreadCountChange={(count) => setUnreadCount(count)}
      />
    </>
  );
}

