'use client';

import React, { useRef } from 'react';
import { IconButton } from './ui/Button';

export const CATEGORIES = [
  '01. 소설 / 문학',
  '02. 시 / 에세이',
  '03. 경제 / 경영',
  '04. 자기계발',
  '05. IT / 모바일 / 과학',
  '06. 인문 / 철학 / 심리',
  '07. 사회 / 정치 / 법률',
  '08. 취미 / 실용 / 라이프',
  '09. 여행 / 지리',
  '10. 예술 / 대중문화',
  '11. 청소년 / 어린이',
  '12. 어학 / 수험서 / 자격증',
];

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryFilter({
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex items-center w-full group">
      {/* 좌측 스크롤 버튼 */}
      <div className="hidden sm:block absolute left-0 z-10 -translate-x-1/2">
        <IconButton
          icon="chevron_left"
          label="이전 카테고리 보기"
          variant="outline"
          onClick={() => scroll('left')}
          className="shadow-md bg-surface-container-lowest text-on-surface hover:bg-surface-container"
        />
      </div>

      {/* 카테고리 태그 목록 */}
      <div
        ref={scrollContainerRef}
        role="group"
        aria-label="도서 카테고리 필터"
        className="flex items-center gap-2 overflow-x-auto scrollbar-none py-2 px-1 w-full scroll-smooth"
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectCategory(cat)}
              className={`min-h-[44px] px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${
                isSelected
                  ? 'bg-primary text-on-primary shadow-sm ring-2 ring-primary/20'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface border border-surface-container'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 우측 스크롤 버튼 */}
      <div className="hidden sm:block absolute right-0 z-10 translate-x-1/2">
        <IconButton
          icon="chevron_right"
          label="다음 카테고리 보기"
          variant="outline"
          onClick={() => scroll('right')}
          className="shadow-md bg-surface-container-lowest text-on-surface hover:bg-surface-container"
        />
      </div>
    </div>
  );
}
