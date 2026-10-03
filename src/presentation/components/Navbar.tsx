'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import CozyLogo from './CozyLogo';
import UserProfileModal from './UserProfileModal';
import NoteBoxModal from './NoteBoxModal';
import MobileTabBar from './layout/MobileTabBar';
import { useAuth } from '@/presentation/context/AuthContext';
import { apiClient } from '@/presentation/lib/apiClient';
import { Icon } from './ui/Icon';
import { Button } from './ui/Button';

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
    <nav aria-label="주요 메뉴" className="hidden lg:flex items-center gap-1.5 shrink-0">
      {navLinks.map((link) => {
        let isActive = pathname === link.href;
        if (link.href === '/book-reviews' && hasClubOrScheduleFilter) {
          isActive = false;
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? 'page' : undefined}
            className={`px-4 py-2.5 rounded-full font-title-sm text-sm whitespace-nowrap transition-all ${
              isActive
                ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
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

  // 안읽은 쪽지 개수 조회
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const data = await apiClient.get<{ unreadCount: number }>('/api/messages', {
        box: 'unread_count',
      });
      setUnreadCount(Number(data.unreadCount) || 0);
    } catch {
      // 비로그인 또는 조회 실패 시 무시
    }
  }, [user]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-xl border-b border-surface-container shadow-sm">
        <div className="h-16 lg:h-20 max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/" className="flex items-center group" aria-label="코지 독서 클럽 홈으로 이동">
              <CozyLogo variant="horizontal" size="md" />
            </Link>
          </div>

          {/* Navigation Tabs (데스크톱) */}
          <Suspense fallback={<div className="hidden lg:flex h-10 w-80" />}>
            <NavLinksInner pathname={pathname} />
          </Suspense>

          {/* Search Trigger Bar (데스크톱/태블릿) */}
          <div className="hidden md:flex items-center flex-1 max-w-[220px] lg:max-w-[260px] xl:max-w-xs mx-2">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-full bg-surface-container-low text-on-surface-variant flex items-center gap-2 px-4 py-2 rounded-full hover:bg-surface-container hover:ring-2 hover:ring-primary/20 transition-all text-sm text-left shadow-sm"
              aria-label="도서, 작가, 클럽 검색 대화상자 열기"
            >
              <Icon name="search" className="text-[18px] text-primary" />
              <span className="truncate text-xs lg:text-sm">도서, 작가, 클럽 검색...</span>
            </button>
          </div>

          {/* User & Action Area */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenSearch}
              className="md:hidden tap-target rounded-full text-on-surface-variant hover:bg-surface-container-high"
              aria-label="도서 및 클럽 검색 대화상자 열기"
            >
              <Icon name="search" className="text-[22px]" />
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                {/* 1. 회원 정보 (프로필 버튼) */}
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-container transition-all group"
                  aria-label={`${user.nickname} 님 프로필 관리`}
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/40 group-hover:ring-primary shadow-sm bg-surface-container shrink-0">
                    <img
                      src={user.avatar_url || '/avatars/avatar_cat.png'}
                      alt={`${user.nickname} 프로필`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        e.currentTarget.src = '/avatars/avatar_cat.png';
                      }}
                    />
                  </div>
                  <div className="hidden sm:flex flex-col text-left pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors">
                        {user.nickname}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black">
                        Lv.{user.level || 1}
                      </span>
                    </div>
                    <span className="text-[11px] text-primary font-medium">
                      온도 {user.manner_temperature ?? 20.0}℃
                    </span>
                  </div>
                </button>

                {/* 2. 쪽지함 아이콘 */}
                <div className="hidden sm:block relative">
                  <button
                    type="button"
                    onClick={() => setIsNoteBoxOpen(true)}
                    className={`tap-target rounded-full transition-all relative group ${
                      unreadCount > 0
                        ? 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 ring-2 ring-amber-500/40'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface border border-surface-container'
                    }`}
                    aria-label={
                      unreadCount > 0
                        ? `쪽지함, 읽지 않은 쪽지 ${unreadCount}개`
                        : '쪽지함 열기'
                    }
                  >
                    <Icon name={unreadCount > 0 ? 'mark_email_unread' : 'mail'} className="text-[20px]" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md ring-2 ring-surface">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* 3. 로그아웃 버튼 */}
                <button
                  type="button"
                  onClick={signOut}
                  className="hidden sm:inline-flex px-3.5 py-2 rounded-full text-xs font-semibold text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high hover:text-on-surface transition-all border border-surface-container"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <Button
                variant="tonal"
                size="sm"
                icon="login"
                onClick={onOpenAuth}
              >
                로그인
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 모바일 전용 하단 내비게이션 바 */}
      <MobileTabBar
        unreadCount={unreadCount}
        onOpenNoteBox={() => setIsNoteBoxOpen(true)}
        onOpenAuth={onOpenAuth}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* NoteBox Modal */}
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
