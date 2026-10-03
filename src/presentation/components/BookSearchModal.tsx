'use client';

import React, { useState } from 'react';
import { Book } from '@/domain/entities';
import { useBookSearch } from '@/presentation/hooks/useBookSearch';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { inputClass } from './ui/FormField';

interface BookSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBook: (book: Book) => void;
}

export default function BookSearchModal({
  isOpen,
  onClose,
  onSelectBook,
}: BookSearchModalProps) {
  const [query, setQuery] = useState('');
  const { results, loading, totalCount, searchBooks, clear } = useBookSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchBooks(query);
    }
  };

  const handleClose = () => {
    setQuery('');
    clear();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="도서 검색"
      description="책 제목, 작가, 출판사명으로 책을 찾고 새로운 독서 모임을 시작해보세요."
      icon="search"
      size="lg"
    >
      <div className="flex flex-col gap-4">
        {/* 검색 폼 */}
        <form onSubmit={handleSearch} role="search" className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="도서명 또는 작가명을 입력하세요"
              aria-label="도서 검색어"
              className={inputClass}
            />
          </div>
          <Button type="submit" variant="primary" loading={loading} icon="search">
            검색
          </Button>
        </form>

        {/* 결과 건수 알림 */}
        <div aria-live="polite" className="text-xs text-on-surface-variant px-1 font-medium">
          {loading
            ? '검색 중...'
            : results.length > 0
            ? `총 ${totalCount.toLocaleString()}건의 도서가 검색되었습니다.`
            : query && !loading
            ? '검색 결과가 없습니다.'
            : ''}
        </div>

        {/* 검색 결과 목록 */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-surface-container rounded-2xl border border-surface-container bg-surface-container-lowest">
          {results.length > 0 ? (
            <ul role="list" className="divide-y divide-surface-container">
              {results.map((book) => {
                const authorText = Array.isArray(book.authors)
                  ? book.authors.join(', ')
                  : book.authors;

                return (
                  <li key={book.isbn} className="flex items-center justify-between p-3.5 sm:p-4 gap-4 hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-12 h-16 rounded-lg overflow-hidden bg-surface-container shrink-0 shadow-xs">
                        <img
                          src={book.thumbnail || '/images/book-placeholder.png'}
                          alt={`${book.title} 표지`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/images/book-placeholder.png';
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-on-surface truncate">
                          {book.title}
                        </h4>
                        <p className="text-xs text-on-surface-variant truncate mt-0.5">
                          {authorText} {book.publisher ? `· ${book.publisher}` : ''}
                        </p>
                        {book.price ? (
                          <span className="text-xs font-bold text-secondary mt-1 inline-block">
                            {book.price.toLocaleString()}원
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="tonal"
                      size="sm"
                      icon="group_add"
                      onClick={() => {
                        onSelectBook(book);
                        handleClose();
                      }}
                      aria-label={`'${book.title}' 도서로 클럽 만들기`}
                      className="shrink-0 text-xs font-bold"
                    >
                      선택
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : !loading && (
            <div className="p-8 text-center text-xs text-on-surface-variant">
              {query ? '일치하는 도서를 찾지 못했습니다.' : '도서명을 검색하여 모임을 만들 책을 찾아보세요.'}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
