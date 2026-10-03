import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import BookCard from '../BookCard';
import { Book } from '@/domain/entities';

const mockBook: Book = {
  isbn: '9791161571188',
  title: '불편한 편의점',
  authors: ['김호연'],
  publisher: '나무옆의자',
  thumbnail: 'https://example.com/cover.jpg',
  contents: '마음을 울리는 편의점 이야기',
  category: '01. 소설 / 문학',
  datetime: '2021-04-20T00:00:00.000+09:00',
};

describe('BookCard Component', () => {
  it('도서의 제목, 저자, 출판사 및 출간일이 화면에 표시되어야 한다', () => {
    render(<BookCard book={mockBook} onSelectBook={vi.fn()} />);

    expect(screen.getByText('불편한 편의점')).toBeInTheDocument();
    expect(screen.getByText(/김호연/)).toBeInTheDocument();
    expect(screen.getByText(/나무옆의자/)).toBeInTheDocument();
    expect(screen.getByText('2021.04.20')).toBeInTheDocument();
  });

  it('클럽 만들기 버튼 클릭 시 도서 정보와 함께 onSelectBook 콜백이 실행되어야 한다', () => {
    const handleSelect = vi.fn();
    render(<BookCard book={mockBook} onSelectBook={handleSelect} />);

    const selectBtn = screen.getByRole('button', { name: /클럽 개설|도서 선택/ });
    fireEvent.click(selectBtn);
    expect(handleSelect).toHaveBeenCalledWith(mockBook);
  });

  it('카드 표지나 제목 클릭 시 onViewDetail 콜백이 호출되어야 한다', () => {
    const handleViewDetail = vi.fn();
    render(<BookCard book={mockBook} onViewDetail={handleViewDetail} />);

    const titleElem = screen.getByText('불편한 편의점');
    fireEvent.click(titleElem);
    expect(handleViewDetail).toHaveBeenCalledWith(mockBook);
  });
});
