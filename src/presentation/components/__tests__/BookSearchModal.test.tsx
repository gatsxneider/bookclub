import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BookSearchModal from '../BookSearchModal';

const mockBook = {
  isbn: '9791161571188',
  title: '소년이 온다',
  authors: ['한강'],
  publisher: '창비',
  thumbnail: 'https://example.com/cover.jpg',
  contents: '한강 작가의 대표작',
  price: 15000,
};

const mockSearchBooks = vi.fn();
const mockClear = vi.fn();

vi.mock('@/presentation/hooks/useBookSearch', () => ({
  useBookSearch: () => ({
    results: [mockBook],
    loading: false,
    totalCount: 1,
    error: null,
    searchBooks: mockSearchBooks,
    clear: mockClear,
  }),
}));

describe('BookSearchModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('검색어를 입력하고 검색 버튼을 누르면 searchBooks가 호출된다', async () => {
    render(
      <BookSearchModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectBook={vi.fn()}
      />
    );

    const input = screen.getByPlaceholderText('도서명 또는 작가명을 입력하세요');
    fireEvent.change(input, { target: { value: '소년이 온다' } });

    const searchBtn = screen.getByRole('button', { name: '검색' });
    fireEvent.click(searchBtn);

    expect(mockSearchBooks).toHaveBeenCalledWith('소년이 온다');
  });

  it('검색된 도서의 선택 버튼을 누르면 onSelectBook이 호출된다', () => {
    const onSelect = vi.fn();
    render(
      <BookSearchModal
        isOpen={true}
        onClose={vi.fn()}
        onSelectBook={onSelect}
      />
    );

    const selectBtn = screen.getByRole('button', { name: /클럽 만들기/ });
    fireEvent.click(selectBtn);

    expect(onSelect).toHaveBeenCalledWith(mockBook);
  });
});
