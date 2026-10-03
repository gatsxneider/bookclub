'use client';

import React from 'react';
import { Book } from '@/domain/entities';
import { Button } from './ui/Button';

interface BookCardProps {
  book: Book;
  onSelectBook?: (book: Book) => void;
  onOpenDetail?: (book: Book) => void;
}

export default function BookCard({
  book,
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
        aria-label={`${book.title} 도서 상세 정보 보기`}
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

        {book.price ? (
          <p className="text-xs font-bold text-secondary mt-1">
            {book.price.toLocaleString()}원
          </p>
        ) : null}
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
