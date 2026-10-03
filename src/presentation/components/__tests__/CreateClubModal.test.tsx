import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateClubModal from '../CreateClubModal';

const mockBook = {
  isbn: '9791161571188',
  title: '불편한 편의점',
  authors: ['김호연'],
  publisher: '나무옆의자',
  thumbnail: 'https://example.com/cover.jpg',
  contents: '따뜻한 감동을 주는 소설',
};

vi.mock('@/presentation/lib/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

describe('CreateClubModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('선택된 도서의 정보와 폼 입력란이 화면에 렌더링되어야 한다', () => {
    render(
      <CreateClubModal
        isOpen={true}
        onClose={vi.fn()}
        selectedBook={mockBook}
      />
    );

    expect(screen.getByText('불편한 편의점')).toBeInTheDocument();
    expect(screen.getByLabelText(/클럽 이름/)).toBeInTheDocument();
    expect(screen.getByLabelText(/최대 인원/)).toBeInTheDocument();
  });

  it('클럽 이름이 비어있으면 생성을 막아야 한다', async () => {
    const { apiClient } = await import('@/presentation/lib/apiClient');

    render(
      <CreateClubModal
        isOpen={true}
        onClose={vi.fn()}
        selectedBook={mockBook}
      />
    );

    const nameInput = screen.getByLabelText(/클럽 이름/);
    fireEvent.change(nameInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /클럽 개설하기/ });
    fireEvent.click(submitBtn);

    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
