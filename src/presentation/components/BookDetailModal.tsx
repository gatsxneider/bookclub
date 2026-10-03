'use client';

import React from 'react';
import { Book } from '@/domain/entities';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

interface BookDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
  onOpenCreateClub?: (book: Book) => void;
}

export default function BookDetailModal({
  isOpen,
  onClose,
  book,
  onOpenCreateClub,
}: BookDetailModalProps) {
  if (!book) return null;

  const authorText = Array.isArray(book.authors)
    ? book.authors.join(', ')
    : typeof book.authors === 'string'
    ? book.authors
    : '저자 미상';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={book.title}
      description={`${authorText} · ${book.publisher || '출판사 정보 없음'}`}
      icon="menu_book"
      size="lg"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <Button variant="ghost" onClick={onClose}>
            닫기
          </Button>
          {onOpenCreateClub && (
            <Button
              variant="primary"
              icon="group_add"
              onClick={() => {
                onClose();
                onOpenCreateClub(book);
              }}
            >
              이 책으로 클럽 만들기
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row gap-6">
        {/* 도서 표지 */}
        <div className="w-36 sm:w-44 shrink-0 mx-auto sm:mx-0">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-lg ring-1 ring-surface-container bg-surface-container">
            <img
              src={book.thumbnail || '/images/book-placeholder.png'}
              alt={`${book.title} 표지`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/images/book-placeholder.png';
              }}
            />
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-surface-container-low text-xs">
            <div>
              <span className="text-on-surface-variant block">저자</span>
              <span className="font-bold text-on-surface">{authorText}</span>
            </div>
            <div>
              <span className="text-on-surface-variant block">출판사</span>
              <span className="font-bold text-on-surface">{book.publisher || '-'}</span>
            </div>
            {book.price ? (
              <div>
                <span className="text-on-surface-variant block">정가</span>
                <span className="font-bold text-on-surface">{book.price.toLocaleString()}원</span>
              </div>
            ) : null}
            {book.category ? (
              <div>
                <span className="text-on-surface-variant block">분야</span>
                <span className="font-bold text-on-surface">{book.category}</span>
              </div>
            ) : null}
          </div>

          <div>
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Icon name="description" className="text-[16px] text-primary" />
              책 소개 / 줄거리
            </h3>
            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap break-words bg-surface-container-lowest p-3.5 rounded-2xl border border-surface-container max-h-56 overflow-y-auto">
              {book.contents || '등록된 책 소개 정보가 없습니다.'}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
