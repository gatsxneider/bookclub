import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BookDetailModal from '../BookDetailModal';

const mockBook = {
  isbn: '9791161571188',
  title: '소년이 온다',
  authors: ['한강'],
  publisher: '창비',
  thumbnail: 'https://example.com/cover.jpg',
  contents: '한강 작가의 5.18 장편소설',
  price: 15000,
  category: '01. 소설 / 문학',
};

describe('BookDetailModal Component', () => {
  it('도서의 상세 줄거리와 저자, 출판사 정보가 올바르게 렌더링되어야 한다', () => {
    render(<BookDetailModal isOpen={true} onClose={vi.fn()} book={mockBook} />);

    expect(screen.getByText('소년이 온다')).toBeInTheDocument();
    expect(screen.getByText('한강 작가의 5.18 장편소설')).toBeInTheDocument();
    expect(screen.getByText('15,000원')).toBeInTheDocument();
  });

  it('클럽 개설하기 버튼을 누르면 onOpenCreateClub이 호출되어야 한다', () => {
    const handleCreate = vi.fn();
    const handleClose = vi.fn();

    render(
      <BookDetailModal
        isOpen={true}
        onClose={handleClose}
        book={mockBook}
        onOpenCreateClub={handleCreate}
      />
    );

    const createBtn = screen.getByRole('button', { name: '이 책으로 클럽 만들기' });
    fireEvent.click(createBtn);

    expect(handleCreate).toHaveBeenCalledWith(mockBook);
    expect(handleClose).toHaveBeenCalled();
  });
});
