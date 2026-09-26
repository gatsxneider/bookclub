'use client';

import React from 'react';

export interface CozyLogoProps {
  /**
   * 로고 표시 형태:
   * - 'full': 아이콘 + 영문 로고 + 한글 서브타이틀 (세로형 메인)
   * - 'horizontal': 아이콘 + 텍스트 (가로형 네비게이션바용)
   * - 'icon': 아이콘 단독
   */
  variant?: 'full' | 'horizontal' | 'icon';
  /**
   * 크기 프리셋 또는 사용자 정의 픽셀 크기
   * - sm: 헤더/버튼용 소형
   * - md: 기본 네비바용
   * - lg: 섹션 타이틀/카드용
   * - xl: 메인 히어로 배너용 대형
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  /**
   * 상시 은은한 애니메이션(김 피어오름, 잎 스웨이) 활성화 여부 (기본값: true)
   */
  animated?: boolean;
  /**
   * 한글 서브타이틀 표시 여부 ('full' 및 'horizontal'에서 적용 가능)
   */
  showSubtitle?: boolean;
  /**
   * 추가 Tailwind 클래스
   */
  className?: string;
}

export default function CozyLogo({
  variant = 'horizontal',
  size = 'md',
  animated = true,
  showSubtitle = true,
  className = '',
}: CozyLogoProps) {
  // 아이콘 크기 매핑 (가로/세로 기준 픽셀)
  const getIconPixelSize = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'sm':
        return 32;
      case 'md':
        return variant === 'full' ? 140 : 44;
      case 'lg':
        return variant === 'full' ? 190 : 60;
      case 'xl':
        return variant === 'full' ? 240 : 80;
      default:
        return 44;
    }
  };

  const iconSize = getIconPixelSize();

  // SVG 심볼 마크 (책, 찻잔, 김, 새싹, 나무)
  const IconSymbol = (
    <svg
      viewBox="0 0 340 280"
      width={iconSize}
      height={(iconSize * 280) / 340}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-300 group-hover:scale-[1.03] select-none"
      aria-label="코지 북클럽 심볼 로고"
      role="img"
    >
      <defs>
        {/* 김(Steam) 그라데이션 */}
        <linearGradient id="cozySteamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#4a6b53" stopOpacity="0.8" />
          <stop offset="35%" stopColor="#8c5844" />
          <stop offset="100%" stopColor="#ba5e45" />
        </linearGradient>
        {/* 새싹 잎 그라데이션 */}
        <linearGradient id="cozySproutGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ba5e45" />
          <stop offset="100%" stopColor="#cb6c52" />
        </linearGradient>
      </defs>

      {/* 1. 오른쪽 배경의 작은 나무 (Trunk & Foliage) */}
      <g className="transition-all duration-300">
        {/* 나무 기둥 (Wood Trunk) */}
        <path
          d="M265 240 L265 160 C265 158 274 168 277 175 M265 180 L273 173"
          stroke="#ba5e45"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 나무 잎 수관 (Tree Canopy Line) */}
        <path
          d="M265 145 C275 142 284 148 286 158 C294 160 298 168 296 177 C302 184 300 195 292 201 C295 210 288 221 278 223 C270 224 265 221 265 220"
          stroke="#4a6b53"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      {/* 2. 펼쳐진 책 (Open Book) */}
      <g className={`transition-all duration-300 ${animated ? 'animate-cozy-float' : ''}`}>
        {/* 바깥쪽 책 커버 및 두께 라인 */}
        <path
          d="M48 115 C48 95 65 85 96 85 C124 85 142 96 148 102 M40 125 V198 C40 224 75 238 135 238 C144 238 148 236 148 236 M40 125 C40 115 48 108 60 108"
          stroke="#4a6b53"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 메인 책 펼침 라인 (좌우 페이지 및 하단 베이스) */}
        <path
          d="M48 105 C48 92 62 82 92 82 C125 82 145 96 150 102 C155 96 175 82 208 82 C238 82 252 92 252 105 V198 C252 226 210 238 150 238 C90 238 48 226 48 198 Z"
          stroke="#4a6b53"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* 책 안쪽 페이지 라인 (Left Inner Page) */}
        <path
          d="M58 98 C58 90 70 88 94 88 C122 88 140 98 146 104 V216 C138 214 120 210 94 210 C70 210 58 214 58 216 V98 Z"
          stroke="#4a6b53"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.9"
        />
        {/* 책 안쪽 페이지 라인 (Right Inner Page) */}
        <path
          d="M242 98 C242 90 230 88 206 88 C178 88 160 98 154 104 V216 C162 214 180 210 206 210 C230 210 242 214 242 216 V98 Z"
          stroke="#4a6b53"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.9"
        />
      </g>

      {/* 3. 모락모락 피어나는 김 & 새싹 (Steam Stem & Sprout Leaf) */}
      <g className={animated ? 'animate-cozy-sprout' : ''}>
        {/* 피어오르는 김 줄기 (S-curve Steam) */}
        <path
          d="M150 185 C158 170 142 145 152 120 C160 100 148 76 150 56"
          stroke="url(#cozySteamGrad)"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animated ? 'animate-cozy-steam' : ''}
          fill="none"
        />

        {/* 꼭대기 새싹 오른쪽 큰 잎 (Right Leaf) */}
        <path
          d="M150 56 C152 35 174 24 196 28 C198 48 176 66 150 56 Z"
          stroke="#ba5e45"
          strokeWidth="7.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M155 52 C168 44 182 36 190 32"
          stroke="#ba5e45"
          strokeWidth="5"
          strokeLinecap="round"
        />

        {/* 꼭대기 새싹 왼쪽 작은 잎 (Left Leaf) */}
        <path
          d="M150 68 C136 55 116 58 112 72 C124 86 142 78 150 68 Z"
          stroke="#ba5e45"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M146 70 C136 70 124 72 118 70"
          stroke="#ba5e45"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </g>

      {/* 4. 따뜻한 커피/티 잔 (Mug Cup) */}
      <g className="transition-transform duration-200">
        {/* 찻잔 손잡이 (Handle) */}
        <path
          d="M188 190 C206 190 208 214 184 218"
          stroke="#4a6b53"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* 찻잔 몸체 (Cup Body) */}
        <path
          d="M112 182 H188 C188 182 186 236 150 236 C114 236 112 182 112 182 Z"
          stroke="#4a6b53"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="#fcf9f4"
        />
      </g>
    </svg>
  );

  // Variant: 'icon' (아이콘 전용)
  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {IconSymbol}
      </div>
    );
  }

  // Variant: 'horizontal' (헤더 / 네비바 가로형)
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-3 group select-none ${className}`}>
        {IconSymbol}
        <div className="flex flex-col justify-center">
          <span className="font-headline-sm text-lg md:text-xl font-bold tracking-tight text-primary transition-colors group-hover:text-primary-container">
            Cozy Book Club
          </span>
          {showSubtitle && (
            <span className="font-label-sm text-[11px] md:text-xs text-on-surface-variant font-medium tracking-normal -mt-0.5">
              숲속의 북클럽 <span className="opacity-50">|</span> 코지 북클럽
            </span>
          )}
        </div>
      </div>
    );
  }

  // Variant: 'full' (중앙 정렬 메인 풀 로고)
  return (
    <div
      className={`flex flex-col items-center justify-center text-center group select-none ${
        animated ? 'animate-cozy-fade-up' : ''
      } ${className}`}
    >
      <div className="mb-4 drop-shadow-sm flex items-center justify-center">{IconSymbol}</div>

      <h1 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#222823] font-serif transition-colors">
        Cozy Book Club
      </h1>

      {showSubtitle && (
        <p className="mt-2 text-sm sm:text-base md:text-lg text-on-surface-variant font-medium tracking-wide">
          숲속의 북클럽 <span className="text-primary/40 mx-1.5">|</span> 코지 북클럽
        </p>
      )}
    </div>
  );
}
