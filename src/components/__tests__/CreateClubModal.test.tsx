import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import CreateClubModal from '../CreateClubModal';
import { Book } from '@/types/database';

const mockBook: Book = {
  isbn: '9791161571188',
  title: '불편한 편의점',
  authors: ['김호연'],
  publisher: '나무옆의자',
  thumbnail: 'https://example.com/cover.jpg',
  contents: '따뜻한 감동 스토리',
};

describe('CreateClubModal Component', () => {
  it('선택된 도서의 정보와 폼 입력란이 화면에 렌더링되어야 한다', () => {
    render(
      <CreateClubModal
        isOpen={true}
        book={mockBook}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('불편한 편의점')).toBeInTheDocument();
    expect(screen.getByLabelText(/클럽 이름/)).toBeInTheDocument();
    expect(screen.getByLabelText(/모임 정원/)).toBeInTheDocument();
  });

  it('클럽 이름이 비어있으면 생성을 막아야 한다', async () => {
    render(
      <CreateClubModal
        isOpen={true}
        book={mockBook}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /독서클럽 개설하기/ });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/클럽 이름을 입력해주세요/)).toBeInTheDocument();
    });
  });
});
