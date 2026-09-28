import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import ClubSearchModal from '../ClubSearchModal';
import { Club } from '@/types/database';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const mockClubs: Club[] = [
  {
    id: 'club-1',
    name: '고요한 숲속 심야 독서회',
    description: '따뜻한 온기를 나누는 모임입니다.',
    status: 'active',
    max_members: 6,
    book: {
      isbn: '9791161571188',
      title: '불편한 편의점',
      authors: ['김호연'],
      publisher: '나무옆의자',
    },
    leader: {
      id: 'leader-1',
      nickname: '달빛책방지기',
    },
    members: [],
  },
  {
    id: 'club-2',
    name: '도둑맞은 집중력 함께 읽기',
    description: '디지털 디톡스와 몰입의 힘을 기릅니다.',
    status: 'active',
    max_members: 8,
    book: {
      isbn: '9791191043297',
      title: '도둑맞은 집중력',
      authors: ['요한 하리'],
      publisher: '어크로스',
    },
    leader: {
      id: 'leader-2',
      nickname: '포근한바람',
    },
    members: [],
  },
];

describe('ClubSearchModal Component', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ clubs: mockClubs }),
        })
      )
    );
  });

  it('모달이 열렸을 때 독서클럽 찾기 타이틀과 클럽 목록이 렌더링되어야 한다', async () => {
    render(<ClubSearchModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('독서 클럽 찾기')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/클럽명, 도서명, 저자, 방장 닉네임으로 검색/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '독서 클럽 검색' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('고요한 숲속 심야 독서회')).toBeInTheDocument();
      expect(screen.getByText('도둑맞은 집중력 함께 읽기')).toBeInTheDocument();
    });
  });

  it('독서 클럽 검색 버튼 클릭 시 검색어로 필터링되어야 한다', async () => {
    render(<ClubSearchModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('고요한 숲속 심야 독서회')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/클럽명, 도서명, 저자, 방장 닉네임으로 검색/);
    fireEvent.change(searchInput, { target: { value: '집중력' } });

    const searchBtn = screen.getByRole('button', { name: '독서 클럽 검색' });
    fireEvent.click(searchBtn);

    expect(screen.queryByText('고요한 숲속 심야 독서회')).not.toBeInTheDocument();
    expect(screen.getByText('도둑맞은 집중력 함께 읽기')).toBeInTheDocument();
  });

  it('클럽 카드를 클릭하면 onSelectClub 콜백이 호출되어야 한다', async () => {
    const handleSelectClub = vi.fn();
    const handleClose = vi.fn();

    render(
      <ClubSearchModal
        isOpen={true}
        onClose={handleClose}
        onSelectClub={handleSelectClub}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('고요한 숲속 심야 독서회')).toBeInTheDocument();
    });

    const clubCard = screen.getByText('고요한 숲속 심야 독서회').closest('div');
    if (clubCard) {
      fireEvent.click(clubCard);
      expect(handleSelectClub).toHaveBeenCalledWith(mockClubs[0]);
      expect(handleClose).toHaveBeenCalled();
    }
  });
});
