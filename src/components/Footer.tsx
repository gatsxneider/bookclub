'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CozyLogo from './CozyLogo';

export default function Footer() {
  const [showPrivacyToast, setShowPrivacyToast] = useState(false);

  const handlePrivacyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPrivacyToast(true);
    setTimeout(() => setShowPrivacyToast(false), 3000);
  };

  return (
    <footer className="w-full bg-surface-container-low border-t border-surface-container text-on-surface-variant mt-auto">
      <div className="max-w-7xl mx-auto px-gutter py-10 md:py-12 flex flex-col gap-8">
        {/* Top: Logo & Slogan */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-surface-container">
          <div className="flex flex-col gap-2">
            <Link href="/" className="inline-block group w-fit">
              <CozyLogo variant="horizontal" size="sm" />
            </Link>
            <p className="text-xs text-on-surface-variant/80 max-w-md leading-relaxed">
              다정한 사람들의 온기 있는 서재, 코지 북클럽에서 추천 도서를 탐색하고 일정을 나누며 함께 독서와 독후감을 기록하세요. 🌿
            </p>
          </div>

          {/* Quick Nav Links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium">
            <Link href="/" className="hover:text-primary transition-colors">
              홈
            </Link>
            <Link href="/my-clubs" className="hover:text-primary transition-colors">
              내 서재 & 클럽
            </Link>
            <Link href="/book-reviews" className="hover:text-primary transition-colors">
              내 독후감 피드
            </Link>
            <Link href="/explore" className="hover:text-primary transition-colors">
              도서 탐색
            </Link>
          </div>
        </div>

        {/* Bottom: Legal, Privacy Policy Icon & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant/70">
          <div className="flex items-center gap-4 flex-wrap">
            {/* 개인정보처리방침 아이콘 및 버튼 영역 */}
            <div className="relative">
              <button
                type="button"
                onClick={handlePrivacyClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-highest hover:bg-surface-container text-on-surface hover:text-primary font-semibold transition-all border border-surface-container shadow-2xs group"
                title="개인정보처리방침"
                aria-label="개인정보처리방침"
              >
                <span className="material-symbols-outlined text-[17px] text-primary group-hover:scale-110 transition-transform">
                  shield_with_heart
                </span>
                <span>개인정보처리방침</span>
                <span className="material-symbols-outlined text-[14px] text-primary/70">
                  verified_user
                </span>
              </button>

              {/* 클릭 시 안내 토스트 */}
              {showPrivacyToast && (
                <div className="absolute bottom-full left-0 mb-2 whitespace-nowrap bg-on-surface text-surface text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-lg animate-fade-in z-20 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-amber-400">info</span>
                  <span>개인정보처리방침 상세 내용이 준비 중입니다.</span>
                </div>
              )}
            </div>

            <span className="hidden sm:inline opacity-30">|</span>

            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary/80">lock</span>
              <span>보안 안전 암호화 준수</span>
            </span>
          </div>

          <div className="text-center sm:text-right">
            <p>© 2026 Cozy Book Club. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
