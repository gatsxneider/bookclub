import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import BookReviewsFeedPage from '@/app/book-reviews/page';
import * as AuthContextModule from '@/context/AuthContext';

let mockSearchParamsValue: Record<string, string | null> = {};

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/book-reviews',
  useSearchParams: () => ({
    get: (key: string) => mockSearchParamsValue[key] || null,
  }),
}));

describe('BookReviewsFeedPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsValue = {};
  });

  it('club_id 파라미터가 있는 경우 클럽 모든 멤버의 독후감 피드를 조회해야 한다', async () => {
    mockSearchParamsValue = { club_id: 'club-123' };

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            reviews: [
              {
                id: 'rev-1',
                user_id: 'member-1',
                title: '멤버1의 독후감',
                content: '멤버1의 감상입니다.',
                rating: 5,
                created_at: '2026-09-29',
                author: { nickname: '달빛독서가', avatar_url: '/avatars/avatar_female.png' },
                club: { id: 'club-123', name: '고요한 숲속 북클럽', book: { title: '불편한 편의점' } },
              },
              {
                id: 'rev-2',
                user_id: 'member-2',
                title: '멤버2의 독후감',
                content: '멤버2의 감상입니다.',
                rating: 4,
                created_at: '2026-09-28',
                author: { nickname: '별빛독서가', avatar_url: '/avatars/avatar_male.png' },
                club: { id: 'club-123', name: '고요한 숲속 북클럽', book: { title: '불편한 편의점' } },
              },
            ],
          }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'current-user-id',
        email: 'user@test.com',
        nickname: '현재사용자',
      },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      quickLogin: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(<BookReviewsFeedPage />);

    await waitFor(() => {
      expect(screen.getByText('클럽 독후감 전체 모아보기')).toBeInTheDocument();
      expect(screen.getByText('멤버1의 독후감')).toBeInTheDocument();
      expect(screen.getByText('멤버2의 독후감')).toBeInTheDocument();
      expect(screen.getByText('달빛독서가')).toBeInTheDocument();
      expect(screen.getByText('별빛독서가')).toBeInTheDocument();
      expect(screen.getAllByText('고요한 숲속 북클럽').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('불편한 편의점').length).toBeGreaterThanOrEqual(1);
    });

    // fetch 호출 시 user_id 없이 club_id만 전달되었는지 확인
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('club_id=club-123'));
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('user_id=current-user-id'));
  });

  it('club_id가 없는 경우 내 독후감 피드 모드로 동작하여 본인 user_id로만 조회해야 한다', async () => {
    mockSearchParamsValue = {};

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            reviews: [
              {
                id: 'rev-my',
                user_id: 'current-user-id',
                title: '나만의 독후감',
                content: '내가 작성한 소중한 감상입니다.',
                rating: 5,
                created_at: '2026-09-29',
                author: { nickname: '현재사용자' },
                club: { id: 'club-123', name: '고요한 숲속 북클럽' },
              },
            ],
          }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'current-user-id',
        email: 'user@test.com',
        nickname: '현재사용자',
      },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      quickLogin: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(<BookReviewsFeedPage />);

    await waitFor(() => {
      expect(screen.getAllByText('내 독후감 피드').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('나만의 독후감')).toBeInTheDocument();
    });

    // fetch 호출 시 본인 user_id 파라미터가 포함되었는지 확인
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('user_id=current-user-id'));
  });
});
