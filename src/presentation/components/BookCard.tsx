'use client';

import React from 'react';
import { Book } from '@/domain/entities';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { BookRatingSummary } from '@/domain/rules/bookRating';

interface BookCardProps {
  book: Book;
  ratingInfo?: BookRatingSummary | null;
  onSelectBook?: (book: Book) => void;
  onOpenDetail?: (book: Book) => void;
}

export default function BookCard({
  book,
  ratingInfo,
  onSelectBook,
  onOpenDetail,
}: BookCardProps) {
  const authorText = Array.isArray(book.authors)
    ? book.authors.join(', ')
    : typeof book.authors === 'string'
    ? book.authors
    : '저자 미상';

  return (
    <div className="group relative flex flex-col justify-between bg-surface-container-lowest rounded-2xl border border-surface-container overflow-hidden hover:shadow-lg transition-all duration-200">
      {/* 1. 도서 표지 및 기본 정보 (클릭 시 상세 모달) */}
      <button
        type="button"
        onClick={() => onOpenDetail?.(book)}
        aria-label={`${book.title} 도서 상세 정보 보기${
          ratingInfo && ratingInfo.count > 0
            ? `, 평균 평점 ${ratingInfo.average.toFixed(1)}점`
            : ''
        }`}
        className="flex flex-col text-left w-full p-3 sm:p-4 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-surface-container mb-3 shadow-xs group-hover:shadow-md transition-shadow">
          <img
            src={book.thumbnail || '/images/book-placeholder.png'}
            alt={`${book.title} 표지`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = '/images/book-placeholder.png';
            }}
          />
        </div>

        <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {book.title}
        </h3>

        <p className="text-xs text-on-surface-variant line-clamp-1 mt-1 font-medium">
          {authorText} {book.publisher ? `· ${book.publisher}` : ''}
        </p>

        {/* 가격 및 회원 평균 평점 (평점 없을 시 미표시) */}
        <div className="flex items-center justify-between mt-1.5 min-h-[20px] text-xs">
          {book.price ? (
            <p className="font-bold text-secondary">
              {book.price.toLocaleString()}원
            </p>
          ) : <span />}

          {ratingInfo && ratingInfo.count > 0 ? (
            <div
              className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold"
              aria-label={`평균 평점 ${ratingInfo.average.toFixed(1)}점 (리뷰 ${ratingInfo.count}개)`}
              title={`평균 평점 ${ratingInfo.average.toFixed(1)}점 (총 ${ratingInfo.count}개의 회원 평가)`}
            >
              <Icon name="star" className="text-[15px] text-amber-500 fill-current shrink-0" />
              <span>{ratingInfo.average.toFixed(1)}</span>
            </div>
          ) : null}
        </div>
      </button>

      {/* 2. 클럽 개설 액션 버튼 */}
      {onSelectBook && (
        <div className="p-3 sm:p-4 pt-0">
          <Button
            type="button"
            variant="tonal"
            size="sm"
            icon="group_add"
            fullWidth
            onClick={() => onSelectBook(book)}
            aria-label={`'${book.title}' 도서로 새 독서클럽 개설하기`}
            className="text-xs font-bold"
          >
            클럽 만들기
          </Button>
        </div>
      )}
    </div>
  );
}
