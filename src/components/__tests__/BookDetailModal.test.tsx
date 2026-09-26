import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import BookDetailModal from '../BookDetailModal';
import { Book } from '@/types/database';

const mockBook: Book = {
  isbn: '9788991759374',
  title: '한국중장편소설 베스트 12',
  authors: ['이미륵', '박완서', '이문구'],
  publisher: '리베르',
  thumbnail: 'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=test.jpg',
  contents: '중고생이 꼭 읽어야 할 중장편소설 모음집입니다.',
  price: 6500,
  sale_price: 5850,
  category: '01. 소설 / 문학',
  url: 'https://search.daum.net/book',
  status: '정상판매',
  datetime: '2024-01-15T00:00:00.000+09:00',
};

describe('BookDetailModal Component', () => {
  it('isOpen이 false이면 렌더링되지 않아야 한다', () => {
    const onClose = vi.fn();
    const { container } = render(
      <BookDetailModal isOpen={false} book={mockBook} onClose={onClose} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('isOpen이 true일 때 도서의 상세 정보가 정상 렌더링되어야 한다', () => {
    const onClose = vi.fn();
    render(<BookDetailModal isOpen={true} book={mockBook} onClose={onClose} />);

    expect(screen.getByText('도서 상세 정보')).toBeInTheDocument();
    expect(screen.getByText('한국중장편소설 베스트 12')).toBeInTheDocument();
    expect(screen.getByText(/이미륵, 박완서, 이문구/)).toBeInTheDocument();
    expect(screen.getByText(/리베르/)).toBeInTheDocument();
    expect(screen.getByText(/중고생이 꼭 읽어야 할/)).toBeInTheDocument();
    expect(screen.getByText(/5,850원/)).toBeInTheDocument();
    expect(screen.getByText(/10% 할인/)).toBeInTheDocument();
  });

  it('닫기 버튼 클릭 시 onClose가 호출되어야 한다', () => {
    const onClose = vi.fn();
    render(<BookDetailModal isOpen={true} book={mockBook} onClose={onClose} />);

    const closeButtons = screen.getAllByLabelText('닫기');
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it('북클럽 시작하기 버튼 클릭 시 onSelectForClub 콜백이 호출되어야 한다', () => {
    const onClose = vi.fn();
    const onSelectForClub = vi.fn();
    render(
      <BookDetailModal
        isOpen={true}
        book={mockBook}
        onClose={onClose}
        onSelectForClub={onSelectForClub}
      />
    );

    const clubBtn = screen.getByText('이 책으로 북클럽 시작하기');
    fireEvent.click(clubBtn);
    expect(onSelectForClub).toHaveBeenCalledWith(mockBook);
  });
});
