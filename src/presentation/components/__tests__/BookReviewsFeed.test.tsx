import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import BookReviewsFeedPage from '@/app/book-reviews/page';
import * as AuthContextModule from '@/presentation/context/AuthContext';

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
                my_empathy_count: 0,
                author: { nickname: '달빛독서가', avatar_url: '/avatars/avatar_female.png' },
                club: { id: 'club-123', name: '고요한 숲속 북클럽', book: { title: '불편한 편의점' } },
              },
              {
                id: 'rev-2',
                user_id: 'current-user-id',
                title: '내 독후감',
                content: '내가 쓴 글입니다.',
                rating: 4,
                created_at: '2026-09-28',
                author: { nickname: '현재사용자', avatar_url: '/avatars/avatar_male.png' },
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
      expect(screen.getByText('내 독후감')).toBeInTheDocument();
      expect(screen.getByText('달빛독서가')).toBeInTheDocument();
      expect(screen.getByText('공감하기')).toBeInTheDocument();
      expect(screen.queryByText('내가 쓴 독후감')).not.toBeInTheDocument();
    });

    // fetch 호출 시 user_id 없이 club_id만 전달되었는지 확인
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('club_id=club-123'), expect.anything());
  });

  it('club_id가 없는 경우 내 독후감 피드 모드로 동작하여 공감하기 버튼 위치에 총 공감 건수가 노출되어야 한다', async () => {
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
                likes_count: 8,
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
      // 내 피드에서는 '공감하기' 버튼 대신 '받은 공감 8개'가 표시됨
      expect(screen.getByText('받은 공감 8개')).toBeInTheDocument();
      expect(screen.queryByText('공감하기')).not.toBeInTheDocument();
    });

    // fetch 호출 시 본인 user_id 파라미터가 포함되었는지 확인
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('user_id=current-user-id'), expect.anything());
  });

  it('다른 사람의 독후감에 공감하기 클릭 시 최대 5회까지 반영되어야 한다', async () => {
    mockSearchParamsValue = { club_id: 'club-123' };

    let currentEmpathy = 0;
    const fetchMock = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url === '/api/reviews/empathy' && options?.method === 'POST') {
        currentEmpathy += 1;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, my_empathy_count: currentEmpathy }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            reviews: [
              {
                id: 'rev-other',
                user_id: 'other-user',
                title: '타인의 독후감',
                content: '타인의 감상입니다.',
                rating: 5,
                my_empathy_count: 0,
                created_at: '2026-09-29',
                author: { nickname: '타인독서가' },
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
      expect(screen.getByText('타인의 독후감')).toBeInTheDocument();
    });

    const empathyBtn = screen.getByText('공감하기');
    fireEvent.click(empathyBtn);

    await waitFor(() => {
      expect(screen.getByText('공감 1/5')).toBeInTheDocument();
    });
  });

  it('독후감에 댓글이 존재하는 경우 카드 하단에 댓글 섹션이 기본적으로 펼쳐져서 표시되어야 한다', async () => {
    mockSearchParamsValue = { club_id: 'club-123' };

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/comments')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              comments: [
                {
                  id: 'c-1',
                  review_id: 'rev-with-comment',
                  user_id: 'user-1',
                  content: '노란색 부분에 표시되는 작성된 댓글 내용입니다.',
                  created_at: '2026-10-04T12:00:00Z',
                  author: {
                    nickname: '댓글작성자',
                    manner_temperature: 36.5,
                  },
                },
              ],
            }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            reviews: [
              {
                id: 'rev-with-comment',
                user_id: 'other-user',
                title: '댓글이 달린 독후감',
                content: '독후감 내용입니다.',
                rating: 5,
                comments_count: 1,
                created_at: '2026-10-03',
                author: { nickname: '모래고래' },
                club: { id: 'club-123', name: '까다로운 독서회', book: { title: '파우스트 1' } },
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
      expect(screen.getByText('댓글이 달린 독후감')).toBeInTheDocument();
      expect(screen.getAllByText('댓글 1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('review-comment-section')).toBeInTheDocument();
      expect(screen.getByText('노란색 부분에 표시되는 작성된 댓글 내용입니다.')).toBeInTheDocument();
    });
  });
});

