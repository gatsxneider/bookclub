'use client';

import React, { useEffect } from 'react';
import { Book } from '@/domain/entities';

interface BookDetailModalProps {
  isOpen: boolean;
  book: Book | null;
  onClose: () => void;
  onSelectForClub?: (book: Book) => void;
}

export default function BookDetailModal({
  isOpen,
  book,
  onClose,
  onSelectForClub,
}: BookDetailModalProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !book) return null;

  const authorText = book.authors?.length ? book.authors.join(', ') : '저자 미상';
  const categoryBadge = book.category ? book.category.replace(/^\d+\.\s*/, '') : '';
  const formattedDate = book.datetime
    ? new Date(book.datetime).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const discountRate =
    book.price && book.sale_price && book.price > book.sale_price && book.sale_price > 0
      ? Math.round(((book.price - book.sale_price) / book.price) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="book-detail-title"
    >
      <div
        className="bg-surface-container-lowest text-on-surface w-full max-w-2xl rounded-3xl shadow-2xl border border-surface-container overflow-hidden flex flex-col max-h-[90vh] transition-all transform animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-container bg-surface-container-low/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              menu_book
            </span>
            <span className="font-headline-sm text-base font-bold text-on-surface">
              도서 상세 정보
            </span>
            {categoryBadge && (
              <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-semibold">
                {categoryBadge}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          {/* Left Column: Book Cover & Quick Meta */}
          <div className="flex flex-col items-center md:items-start shrink-0 w-full md:w-48 gap-3">
            <div className="w-36 md:w-48 aspect-[3/4.2] rounded-2xl overflow-hidden shadow-lg bg-surface-container-low border border-surface-container relative group">
              {book.thumbnail ? (
                <img
                  src={book.thumbnail}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] text-outline mb-2">
                    auto_stories
                  </span>
                  <span className="text-xs">{book.title}</span>
                </div>
              )}
            </div>

            {/* Price Info Box */}
            <div className="w-full bg-surface-container-low p-3 rounded-xl border border-surface-container flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">정가</span>
                <span className={`font-medium ${discountRate > 0 ? 'line-through text-on-surface-variant/70' : 'text-on-surface'}`}>
                  {book.price ? `${book.price.toLocaleString()}원` : '정보 없음'}
                </span>
              </div>
              {discountRate > 0 && book.sale_price && (
                <div className="flex items-center justify-between font-bold">
                  <span className="text-secondary">{discountRate}% 할인</span>
                  <span className="text-secondary text-sm">
                    {book.sale_price.toLocaleString()}원
                  </span>
                </div>
              )}
              {book.status && (
                <div className="flex items-center justify-between pt-1 border-t border-surface-container text-[11px]">
                  <span className="text-on-surface-variant">상태</span>
                  <span className="text-primary font-medium">{book.status}</span>
                </div>
              )}
            </div>

            {/* Daum / Kakao Book External Link */}
            {book.url && (
              <a
                href={book.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold transition-all border border-surface-container-high"
              >
                <span>Daum 도서 정보 보기</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </a>
            )}
          </div>

          {/* Right Column: Book Details & Description */}
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <h2
                id="book-detail-title"
                className="font-headline-md text-xl md:text-2xl font-bold text-on-surface leading-snug"
              >
                {book.title}
              </h2>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs sm:text-sm text-on-surface-variant mt-2">
                <span className="font-semibold text-primary">{authorText}</span>
                {book.publisher && (
                  <>
                    <span className="text-outline-variant">·</span>
                    <span>출판사: {book.publisher}</span>
                  </>
                )}
                {formattedDate && (
                  <>
                    <span className="text-outline-variant">·</span>
                    <span>출간일: {formattedDate}</span>
                  </>
                )}
              </div>

              {book.isbn && (
                <div className="mt-1 text-xs text-on-surface-variant/70">
                  <span>ISBN: {book.isbn}</span>
                </div>
              )}
            </div>

            {/* Book Description / Contents */}
            <div className="flex flex-col gap-2 pt-2 border-t border-surface-container">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">description</span>
                <span>책 소개 및 줄거리</span>
              </h3>
              <div className="bg-surface-container-low/60 p-4 rounded-2xl border border-surface-container max-h-60 overflow-y-auto">
                <p className="font-body-reading text-sm sm:text-base text-on-surface/90 leading-relaxed whitespace-pre-line">
                  {book.contents ? book.contents : '등록된 도서 소개 내용이 없습니다.'}
                </p>
              </div>
            </div>

            {/* Cozy Book Club Recommendation Note */}
            <div className="bg-secondary-fixed/40 text-on-secondary-fixed p-3.5 rounded-2xl border border-secondary-fixed flex items-start gap-2.5">
              <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                spa
              </span>
              <div className="text-xs leading-relaxed">
                <p className="font-bold text-secondary mb-0.5">코지 북클럽 추천 포인트</p>
                <p className="text-on-secondary-fixed-variant">
                  이 책으로 함께 읽는 북클럽을 개설하고 단원별 독후감을 기록하며 온기 있는 생각을 나눠보세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-surface-container bg-surface-container-low/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            닫기
          </button>
          {onSelectForClub && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectForClub(book);
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-on-primary hover:bg-primary-container text-xs sm:text-sm font-semibold shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>이 책으로 북클럽 시작하기</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
