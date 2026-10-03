'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../ui/cn';
import { Icon } from '../ui/Icon';
import { useAuth } from '@/presentation/context/AuthContext';

interface MobileTabBarProps {
  unreadCount?: number;
  onOpenNoteBox?: () => void;
  onOpenAuth?: () => void;
}

/**
 * 모바일 화면 하단 고정 내비게이션 바 (KWCAG 2.2 / WCAG 2.1 AA)
 * - 44px 이상의 터치 타깃 보장
 * - 현재 선택된 메뉴에 `aria-current="page"` 표시
 * - iOS 노치/안드로이드 네비게이션 바 대응 (safe-area-inset-bottom)
 * - lg(1024px) 이상 화면에서는 자동 숨김
 */
export function MobileTabBar({
  unreadCount = 0,
  onOpenNoteBox,
  onOpenAuth,
}: MobileTabBarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { label: '홈', href: '/', icon: 'cottage' },
    { label: '내 서재', href: '/my-clubs', icon: 'auto_stories' },
    { label: '독후감', href: '/book-reviews', icon: 'rate_review' },
    { label: '도서 탐색', href: '/explore', icon: 'explore' },
  ];

  return (
    <nav
      aria-label="모바일 주요 메뉴"
      className={cn(
        'lg:hidden fixed bottom-0 left-0 right-0 z-40',
        'bg-surface-container-lowest/95 backdrop-blur-md border-t border-surface-container',
        'pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(45,40,37,0.06)]'
      )}
    >
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full py-1 min-w-[56px] transition-colors',
                isActive
                  ? 'text-primary font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              <div
                className={cn(
                  'relative flex items-center justify-center w-10 h-7 rounded-full transition-all',
                  isActive && 'bg-primary-container/20 text-primary'
                )}
              >
                <Icon
                  name={item.icon}
                  filled={isActive}
                  className={cn('text-[22px]', isActive ? 'scale-110' : '')}
                />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* 쪽지함 또는 로그인 탭 */}
        {user ? (
          <button
            type="button"
            onClick={onOpenNoteBox}
            aria-label={
              unreadCount > 0
                ? `쪽지함, 읽지 않은 쪽지 ${unreadCount}개`
                : '쪽지함'
            }
            className="flex flex-col items-center justify-center flex-1 h-full py-1 min-w-[56px] text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <div className="relative flex items-center justify-center w-10 h-7 rounded-full">
              <Icon name="mail" className="text-[22px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 right-1 min-w-[16px] h-4 px-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight font-medium">쪽지함</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            aria-label="로그인 대화상자 열기"
            className="flex flex-col items-center justify-center flex-1 h-full py-1 min-w-[56px] text-secondary hover:text-on-secondary-fixed-variant transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-7 rounded-full bg-secondary-fixed/50">
              <Icon name="login" className="text-[20px]" />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight font-bold">로그인</span>
          </button>
        )}
      </div>
    </nav>
  );
}

export default MobileTabBar;
