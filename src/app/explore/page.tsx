'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import CategoryFilter from '@/components/CategoryFilter';
import BookCard from '@/components/BookCard';
import BookSearchModal from '@/components/BookSearchModal';
import BookDetailModal from '@/components/BookDetailModal';
import CreateClubModal from '@/components/CreateClubModal';
import AuthModal from '@/components/AuthModal';
import { Book } from '@/types/database';
import { filterCuratedBooks } from '@/lib/core/bookSearch';
import curatedBooksData from '@/lib/constants/curatedBooks.json';

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState('01. 소설 / 문학');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedBookForDetail, setSelectedBookForDetail] = useState<Book | null>(null);

  const books = filterCuratedBooks(curatedBooksData, selectedCategory);

  const handleSelectBook = (b: Book) => {
    setSelectedBook(b);
    setIsCreateOpen(true);
  };

  const handleViewDetail = (b: Book) => {
    setSelectedBookForDetail(b);
    setIsDetailOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNewClub={() => setIsCreateOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="w-full pt-24 pb-16 flex-1">
        <div className="max-w-7xl mx-auto px-gutter flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-headline-md text-2xl font-bold text-on-surface">
                카테고리별 베스트셀러 도서 탐색
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">
                12개 대분류 카테고리별 가장 많이 팔린 베스트셀러 도서 Top 10을 둘러보고 나만의 북클럽을 시작하세요.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              <span>도서 직접 검색하기</span>
            </button>
          </div>

          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {books.map((book) => (
              <BookCard
                key={book.isbn}
                book={book}
                onSelectBook={handleSelectBook}
                onViewDetail={handleViewDetail}
              />
            ))}
          </div>
        </div>
      </main>

      <BookDetailModal
        isOpen={isDetailOpen}
        book={selectedBookForDetail}
        onClose={() => setIsDetailOpen(false)}
        onSelectForClub={handleSelectBook}
      />
      <BookSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectBook={handleSelectBook}
      />
      <CreateClubModal
        isOpen={isCreateOpen}
        book={selectedBook}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {}}
      />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
