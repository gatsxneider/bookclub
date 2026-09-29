'use client';

import React, { useState } from 'react';
import { Book } from '@/types/database';

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
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Book[]>([]);
  const [searched, setSearched] = useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSearched(false);
      return;
    }
    setQuery('');
    setResults([]);
    setSearched(false);
  }, [isOpen]);

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    onClose();
  };

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/books/search?query=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.documents || []);
    } catch (err) {
      console.error('도서 검색 오류:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-outline-variant">
        {/* Header */}
        <div className="p-5 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">search</span>
            <div>
              <h2 className="font-headline-sm text-lg font-semibold text-on-surface">도서 직접 검색</h2>
              <p className="text-xs text-on-surface-variant">원하는 책을 찾아 새로운 독서클럽을 시작해보세요</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="닫기"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="p-4 bg-surface-container-lowest border-b border-surface-container flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="도서명, 작가, 출판사를 입력하세요..."
              className="w-full bg-surface-container-low text-on-surface pl-10 pr-4 py-2.5 rounded-full text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all"
              autoFocus
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-full text-sm font-semibold hover:bg-primary-container transition-all disabled:opacity-50 whitespace-nowrap shadow-sm"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </form>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && (
            <div className="py-12 text-center text-on-surface-variant flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[32px] text-primary animate-spin">
                progress_activity
              </span>
              <p className="text-sm">카카오 도서 서고에서 책을 찾고 있습니다...</p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="py-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[40px] text-outline mb-2">
                sentiment_dissatisfied
              </span>
              <p className="text-sm">검색 결과가 없습니다. 도서명을 다시 확인해주세요.</p>
            </div>
          )}

          {!loading && !searched && (
            <div className="py-10 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[36px] text-primary/60 mb-2">
                menu_book
              </span>
              <p className="text-sm">읽고 싶은 책의 제목이나 저자를 검색해보세요.</p>
            </div>
          )}

          {!loading &&
            results.map((book, idx) => (
              <div
                key={`${book.isbn}-${idx}`}
                className="flex gap-4 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors items-center justify-between border border-surface-container-high"
              >
                <div className="flex gap-3 items-center min-w-0 flex-1">
                  <div className="w-12 h-16 rounded overflow-hidden bg-surface-container shrink-0 shadow-sm">
                    {book.thumbnail ? (
                      <img
                        src={book.thumbnail}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-outline">
                        <span className="material-symbols-outlined text-[18px]">book</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-semibold text-on-surface truncate">{book.title}</h4>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      {book.authors?.join(', ')} · {book.publisher}
                    </p>
                    {book.contents && (
                      <p className="text-xs text-on-surface-variant/70 line-clamp-1 mt-1">
                        {book.contents}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectBook(book);
                    handleClose();
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold whitespace-nowrap shadow-sm transition-all"
                  aria-label="이 책으로 클럽 만들기"
                >
                  이 책으로 클럽 만들기
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
