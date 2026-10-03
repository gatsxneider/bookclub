import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BookCard from '../BookCard';

const mockBook = {
  isbn: '9791161571188',
  title: '소년이 온다',
  authors: ['한강'],
  publisher: '창비',
  thumbnail: 'https://example.com/cover.jpg',
  contents: '한강 작가의 대표 장편소설',
  price: 15000,
};

describe('BookCard Component', () => {
  it('도서 정보가 올바르게 렌더링되어야 한다', () => {
    render(<BookCard book={mockBook} />);

    expect(screen.getByText('소년이 온다')).toBeInTheDocument();
    expect(screen.getByText(/한강/)).toBeInTheDocument();
    expect(screen.getByText(/창비/)).toBeInTheDocument();
    expect(screen.getByText('15,000원')).toBeInTheDocument();
  });

  it('클럽 만들기 버튼 클릭 시 onSelectBook 콜백이 호출되어야 한다', () => {
    const handleSelectBook = vi.fn();
    render(<BookCard book={mockBook} onSelectBook={handleSelectBook} />);

    const button = screen.getByRole('button', { name: /독서클럽 개설하기/ });
    fireEvent.click(button);

    expect(handleSelectBook).toHaveBeenCalledWith(mockBook);
  });

  it('평점 정보가 주어지면 별점과 평균 점수가 올바르게 렌더링되어야 한다', () => {
    const ratingInfo = { average: 4.8, count: 5 };
    render(<BookCard book={mockBook} ratingInfo={ratingInfo} />);

    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('star')).toBeInTheDocument();
    expect(screen.getByLabelText('평균 평점 4.8점 (리뷰 5개)')).toBeInTheDocument();
  });

  it('평점 정보가 없거나 리뷰 수가 0이면 평점이 표시되지 않아야 한다', () => {
    const { rerender } = render(<BookCard book={mockBook} />);
    expect(screen.queryByText('star')).not.toBeInTheDocument();

    rerender(<BookCard book={mockBook} ratingInfo={{ average: 0, count: 0 }} />);
    expect(screen.queryByText('star')).not.toBeInTheDocument();
  });
});
