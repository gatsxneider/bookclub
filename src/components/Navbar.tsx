'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CozyLogo from './CozyLogo';
import UserProfileModal from './UserProfileModal';
import { useAuth } from '@/context/AuthContext';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenNewClub: () => void;
  onOpenAuth: () => void;
}

export default function Navbar({
  onOpenSearch,
  onOpenNewClub,
  onOpenAuth,
}: NavbarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const navLinks = [
    { label: '홈', href: '/' },
    { label: '내 서재 & 클럽', href: '/my-clubs' },
    { label: '도서 탐색', href: '/explore' },
    { label: '독후감 피드', href: '/book-reviews' },
  ];

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

            <button
              type="button"
              onClick={onOpenNewClub}
              className="inline-flex items-center gap-1 bg-primary text-on-primary font-title-sm text-xs px-4 py-2 rounded-full shadow-sm hover:bg-primary-container transition-all"
              aria-label="새 독서클럽"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>새 독서클럽</span>
            </button>

            {/* 로그인 상태에 따른 버튼 전환 영역 */}
            {user ? (
              /* 로그인 후: 닉네임과 로그아웃 버튼 표시 & 클릭 시 프로필 아바타/레벨 모달 오픈 */
              <div className="flex items-center gap-2 pl-1">
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
                      온도 {user.manner_temperature ?? 20.0}℃
                    </span>
                  </div>
                </button>

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
    </>
  );
}
