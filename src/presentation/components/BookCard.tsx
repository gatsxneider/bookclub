'use client';

import React from 'react';
import { Book } from '@/domain/entities';

interface BookCardProps {
  book: Book;
  onSelectBook?: (book: Book) => void;
  onViewDetail?: (book: Book) => void;
}

export default function BookCard({ book, onSelectBook, onViewDetail }: BookCardProps) {
  const authorText = book.authors?.length ? book.authors.join(', ') : '저자 미상';
  const categoryBadge = book.category ? book.category.replace(/^\d+\.\s*/, '') : '';

  // 출간일 포맷팅 (예: 2024.01.15)
  const formatPublishedDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.split('T')[0] || dateStr;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}.${month}.${day}`;
    } catch {
      return dateStr;
    }
  };

  const publishedDate = formatPublishedDate(book.datetime);

  return (
    <article className="group bg-surface-container-lowest rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between border border-surface-container-high relative overflow-hidden">
      <div>
        {/* Cover Image Container */}
        <div
          onClick={() => onViewDetail?.(book)}
          className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-surface-container-low mb-3 shadow-inner group-hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
          title="도서 상세 정보 보기"
        >
          {book.thumbnail ? (
            <img
              src={book.thumbnail}
              alt={book.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-surface-container text-on-surface-variant">
              <span className="material-symbols-outlined text-[36px] text-outline mb-1">
                menu_book
              </span>
              <span className="text-xs">{book.title}</span>
            </div>
          )}

          {categoryBadge && (
            <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-primary/90 text-on-primary text-[11px] font-medium backdrop-blur-sm shadow-sm">
              {categoryBadge}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1 cursor-pointer" onClick={() => onViewDetail?.(book)}>
          <h3
            className="font-headline-sm text-base font-semibold text-on-surface line-clamp-1 group-hover:text-primary transition-colors"
            title={book.title}
          >
            {book.title}
          </h3>
          <p className="text-xs text-on-surface-variant line-clamp-1">
            {authorText} {book.publisher ? `· ${book.publisher}` : ''}
          </p>
          {book.contents && (
            <p className="text-xs text-on-surface-variant/80 line-clamp-2 mt-1 leading-relaxed">
              {book.contents}
            </p>
          )}
        </div>
      </div>

      {/* Action Area & Published Date */}
      <div className="mt-4 pt-3 border-t border-surface-container-low flex items-center justify-between gap-2">
        {publishedDate ? (
          <div className="flex items-center gap-1 text-xs font-medium text-secondary" title={`출간일: ${publishedDate}`}>
            <span className="material-symbols-outlined text-[15px] text-secondary/80">
              calendar_today
            </span>
            <span>{publishedDate}</span>
          </div>
        ) : (
          <span className="text-xs text-on-surface-variant">추천도서</span>
        )}

        <button
          type="button"
          onClick={() => onSelectBook?.(book)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-sm transition-all active:scale-95 shrink-0"
          aria-label="클럽 개설 및 도서 선택"
        >
          <span className="material-symbols-outlined text-[14px]">add_circle</span>
          <span>도서 선택</span>
        </button>
      </div>
    </article>
  );
}
