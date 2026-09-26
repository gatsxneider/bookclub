'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';

export const CATEGORIES = [
  '전체',
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbRatio, setThumbRatio] = useState(0.3);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);

  // 스크롤 위치 및 진행률 업데이트
  const updateScrollMetrics = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    if (maxScroll > 0) {
      const progress = Math.min(Math.max(scrollLeft / maxScroll, 0), 1);
      setScrollProgress(progress);
      setThumbRatio(Math.max(clientWidth / scrollWidth, 0.15));
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft < maxScroll - 2);
    } else {
      setScrollProgress(0);
      setThumbRatio(1);
      setCanScrollLeft(false);
      setCanScrollRight(false);
    }
  }, []);

  useEffect(() => {
    updateScrollMetrics();
    window.addEventListener('resize', updateScrollMetrics);
    return () => window.removeEventListener('resize', updateScrollMetrics);
  }, [updateScrollMetrics]);

  // 좌우 화살표 클릭 시 스크롤 이동
  const handleScrollBy = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -260 : 260;
    if (typeof el.scrollBy === 'function') {
      el.scrollBy({ left: offset, behavior: 'smooth' });
    } else {
      el.scrollLeft += offset;
    }
  };

  // 탐색바 트랙 클릭 시 해당 위치로 점프
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const el = scrollRef.current;
    if (!track || !el) return;

    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.min(Math.max(clickX / rect.width, 0), 1);
    const maxScroll = el.scrollWidth - el.clientWidth;
    const targetLeft = ratio * maxScroll;

    if (typeof el.scrollTo === 'function') {
      el.scrollTo({
        left: targetLeft,
        behavior: 'smooth',
      });
    } else {
      el.scrollLeft = targetLeft;
    }
  };

  // 마우스 드래그 스크롤 (데스크톱 마우스로 잡고 당기기 지원)
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftStartRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const el = scrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    el.scrollLeft = scrollLeftStartRef.current - walk;
    updateScrollMetrics();
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // 마우스 휠로 가로 스크롤
  const handleWheel = (e: React.WheelEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
      el.scrollLeft += e.deltaY;
      updateScrollMetrics();
    }
  };

  // 카테고리 클릭 시 해당 요소 중앙으로 부드럽게 스크롤
  const handleCategoryClick = (cat: string, e: React.MouseEvent<HTMLButtonElement>) => {
    onSelectCategory(cat);
    const target = e.currentTarget;
    if (typeof target?.scrollIntoView === 'function') {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };

  // 썸(인디케이터) 위치 계산
  const thumbWidthPercent = thumbRatio * 100;
  const maxLeftPercent = 100 - thumbWidthPercent;
  const thumbLeftPercent = scrollProgress * maxLeftPercent;

  return (
    <div className="w-full flex flex-col gap-2.5 bg-surface-container-low/60 p-3 rounded-2xl border border-surface-container shadow-xs">
      {/* 1. 카테고리 칩 가로 스크롤 목록 */}
      <div
        ref={scrollRef}
        onScroll={updateScrollMetrics}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        className={`w-full overflow-x-auto pb-1 scrollbar-none select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab sm:cursor-default'
        }`}
        style={{ scrollBehavior: isDragging ? 'auto' : 'smooth' }}
      >
        <div className="flex items-center gap-2 min-w-max px-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={(e) => handleCategoryClick(cat, e)}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 shrink-0 shadow-xs ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-sm ring-1 ring-primary/20 scale-[1.02] font-semibold'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface border border-surface-container'
                }`}
                type="button"
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <span className="material-symbols-outlined text-[15px] text-on-primary animate-pulse">
                    eco
                  </span>
                )}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 하단 탐색바 (Scroll Track, Navigation Arrows & Status) */}
      <div className="flex items-center justify-between gap-3 pt-1 px-1 border-t border-surface-container/60">
        {/* 좌측: 이전 카테고리 탐색 버튼 */}
        <button
          type="button"
          onClick={() => handleScrollBy('left')}
          disabled={!canScrollLeft}
          aria-label="이전 카테고리 보기"
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
            canScrollLeft
              ? 'bg-surface-container-highest text-primary hover:bg-primary hover:text-on-primary shadow-xs'
              : 'bg-surface-container/40 text-on-surface-variant/30 cursor-not-allowed'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>

        {/* 중앙: 인터랙티브 탐색바 트랙 (클릭하여 탐색 가능) */}
        <div className="flex-1 flex flex-col gap-1">
          <div
            ref={trackRef}
            onClick={handleTrackClick}
            className="w-full h-2.5 bg-surface-container rounded-full relative cursor-pointer overflow-hidden p-0.5 group hover:bg-surface-container-high transition-colors"
            title="클릭하여 분야 탐색 이동"
            role="scrollbar"
            aria-valuenow={Math.round(scrollProgress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
          >
            <div
              className="h-full bg-primary/70 group-hover:bg-primary rounded-full transition-all duration-150 shadow-xs"
              style={{
                width: `${thumbWidthPercent}%`,
                marginLeft: `${thumbLeftPercent}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-on-surface-variant px-1 font-medium">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-primary">menu_book</span>
              <span>12개 전체 분야 탐색</span>
            </span>
            <span className="text-[10px] text-secondary font-medium">
              좌우로 밀거나 화살표를 눌러 12개 분야를 모두 확인하세요
            </span>
          </div>
        </div>

        {/* 우측: 다음 카테고리 탐색 버튼 */}
        <button
          type="button"
          onClick={() => handleScrollBy('right')}
          disabled={!canScrollRight}
          aria-label="다음 카테고리 보기"
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
            canScrollRight
              ? 'bg-surface-container-highest text-primary hover:bg-primary hover:text-on-primary shadow-xs'
              : 'bg-surface-container/40 text-on-surface-variant/30 cursor-not-allowed'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
