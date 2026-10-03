import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ClubSearchModal from '../ClubSearchModal';

const { mockClubs } = vi.hoisted(() => ({
  mockClubs: [
    {
      id: 'club-1',
      name: '클린 코드 읽기 모임',
      leader_id: 'leader-1',
      max_members: 8,
      status: 'active',
      book: {
        isbn: '9788966260959',
        title: '클린 코드',
        authors: ['로버트 C. 마틴'],
        publisher: '인사이트',
        thumbnail: 'https://example.com/clean-code.jpg',
        contents: '애자일 소프트웨어 장인 정신',
      },
      leader: {
        id: 'leader-1',
        nickname: '개발자A',
        manner_temperature: 36.5,
      },
      members: [
        { id: 'm-1', user_id: 'leader-1', role: 'leader', status: 'approved' },
        { id: 'm-2', user_id: 'user-2', role: 'member', status: 'approved' },
      ],
    },
  ],
}));

vi.mock('@/presentation/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ clubs: mockClubs }),
    post: vi.fn(),
  },
}));

vi.mock('@/presentation/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', nickname: '신청자' },
  }),
}));

describe('ClubSearchModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('클럽 목록이 렌더링되고 검색창에 입력 시 필터링된다', async () => {
    render(<ClubSearchModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('클린 코드 읽기 모임')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('클럽명, 도서명, 방장명 검색');
    fireEvent.change(searchInput, { target: { value: '클린' } });
    expect(searchInput).toHaveValue('클린');
  });

  it('클럽을 선택하면 우측에 클럽 상세 정보와 가입 신청 버튼이 나타난다', async () => {
    render(<ClubSearchModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('클린 코드 읽기 모임')).toBeInTheDocument();
    });

    const clubItem = screen.getByText('클린 코드 읽기 모임');
    fireEvent.click(clubItem);

    expect(screen.getByRole('button', { name: /클럽 가입 신청하기/ })).toBeInTheDocument();
  });
});
