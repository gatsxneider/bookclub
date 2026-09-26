'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CozyLogo from './CozyLogo';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenNewClub: () => void;
  onOpenAuth: () => void;
  currentUser?: {
    nickname: string;
    avatar_url?: string;
  } | null;
}

export default function Navbar({
  onOpenSearch,
  onOpenNewClub,
  onOpenAuth,
  currentUser = { nickname: '지우 님' },
}: NavbarProps) {
  const pathname = usePathname();

  const navLinks = [
    { label: '홈', href: '/' },
    { label: '내 서재 & 클럽', href: '/my-clubs' },
    { label: '도서 탐색', href: '/explore' },
    { label: '독후감 피드', href: '/book-reviews' },
  ];

  return (
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

        {/* Search Trigger Bar (컴팩트 조정) */}
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

          {/* Profile pill */}
          <div
            onClick={onOpenAuth}
            className="flex items-center gap-2 pl-1 cursor-pointer group"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-primary/20 shadow-sm group-hover:scale-105 transition-transform bg-surface-container">
                <img
                  src={currentUser?.avatar_url || '/images/avatar.png'}
                  alt={currentUser?.nickname || '사용자 프로필'}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-surface flex items-center justify-center"></span>
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-title-sm text-xs text-on-surface leading-tight font-semibold">
                {currentUser ? currentUser.nickname : '로그인'}
              </span>
              <span className="font-label-sm text-[10px] text-secondary font-medium tracking-tight">
                책나무 레벨 3
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
