import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import BookSearchModal from '../BookSearchModal';

describe('BookSearchModal Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            documents: [
              {
                isbn: '9791161571188',
                title: '불편한 편의점',
                authors: ['김호연'],
                publisher: '나무옆의자',
                thumbnail: 'https://example.com/cover.jpg',
                contents: '따뜻한 감동 스토리',
              },
            ],
          }),
      })
    ));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('모달이 열렸을 때 검색 인풋과 닫기 버튼이 노출되어야 한다', () => {
    render(<BookSearchModal isOpen={true} onClose={vi.fn()} onSelectBook={vi.fn()} />);

    expect(screen.getByPlaceholderText(/도서명, 작가, 출판사/)).toBeInTheDocument();
    expect(screen.getByLabelText(/닫기/)).toBeInTheDocument();
  });

  it('도서 검색 시 결과 리스트가 노출되고 도서 선택이 가능해야 한다', async () => {
    const handleSelect = vi.fn();
    render(<BookSearchModal isOpen={true} onClose={vi.fn()} onSelectBook={handleSelect} />);

    const input = screen.getByPlaceholderText(/도서명, 작가, 출판사/);
    fireEvent.change(input, { target: { value: '불편한 편의점' } });

    const searchBtn = screen.getByRole('button', { name: /검색/ });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByText('불편한 편의점')).toBeInTheDocument();
    });

    const selectBookBtn = screen.getByRole('button', { name: /이 책으로 클럽 만들기/ });
    fireEvent.click(selectBookBtn);
    expect(handleSelect).toHaveBeenCalled();
  });
});
