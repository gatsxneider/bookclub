'use client';

import React, { useState } from 'react';
import Navbar from '@/presentation/components/Navbar';
import CategoryFilter from '@/presentation/components/CategoryFilter';
import BookCard from '@/presentation/components/BookCard';
import BookSearchModal from '@/presentation/components/BookSearchModal';
import BookDetailModal from '@/presentation/components/BookDetailModal';
import CreateClubModal from '@/presentation/components/CreateClubModal';
import AuthModal from '@/presentation/components/AuthModal';
import Footer from '@/presentation/components/Footer';
import { Book } from '@/domain/entities';
import { filterCuratedBooks } from '@/domain/rules/bookSearch';
import curatedBooksData from '@/shared/data/curatedBooks.json';
import { Button } from '@/presentation/components/ui/Button';

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

  const handleOpenDetail = (b: Book) => {
    setSelectedBookForDetail(b);
    setIsDetailOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNewClub={() => {
          setSelectedBook(null);
          setIsCreateOpen(true);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main id="main-content" tabIndex={-1} className="w-full pt-20 lg:pt-24 pb-mobile-nav flex-1 outline-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="font-headline-md text-2xl font-bold text-on-surface">
                카테고리별 베스트셀러 도서 탐색
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">
                12개 대분류 카테고리별 가장 많이 팔린 베스트셀러 도서 Top 10을 둘러보고 나만의 북클럽을 시작하세요.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              icon="search"
              onClick={() => setIsSearchOpen(true)}
              className="self-start sm:self-auto"
            >
              도서 직접 검색하기
            </Button>
          </div>

          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
            {books.map((book) => (
              <BookCard
                key={book.isbn}
                book={book}
                onSelectBook={handleSelectBook}
                onOpenDetail={handleOpenDetail}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />

      <BookDetailModal
        isOpen={isDetailOpen}
        book={selectedBookForDetail}
        onClose={() => setIsDetailOpen(false)}
        onOpenCreateClub={handleSelectBook}
      />
      <BookSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectBook={handleSelectBook}
      />
      <CreateClubModal
        isOpen={isCreateOpen}
        selectedBook={selectedBook}
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
