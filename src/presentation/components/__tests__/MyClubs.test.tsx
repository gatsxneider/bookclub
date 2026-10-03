import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import MyClubsPage from '@/app/my-clubs/page';
import * as AuthContextModule from '@/presentation/context/AuthContext';

describe('MyClubsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로그인한 회원의 닉네임, 레벨, 매너온도, 이메일 정보가 서재 배너에 정상 반영되어야 한다', async () => {
    const mockUser = {
      id: 'test-user-123',
      email: 'reader@cozybook.com',
      nickname: '밤하늘독서가',
      avatar_url: '/avatars/avatar_cat.png',
      manner_temperature: 42.5,
      completed_count: 3,
      level: 3,
    };

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: mockUser,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      quickLogin: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/api/reviews')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                reviews: [
                  {
                    id: 'rev-1',
                    user_id: 'test-user-123',
                    title: '테스트 독후감',
                    content: '따뜻한 문장이 가득한 책입니다.',
                    rating: 5,
                    created_at: '2026-09-29',
                  },
                ],
              }),
          });
        }
        if (url.includes('/api/clubs')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                clubs: [
                  {
                    id: 'club-1',
                    name: '테스트 독서 모임',
                    leader_id: 'test-user-123',
                    book: {
                      title: '불편한 편의점',
                      thumbnail: 'https://example.com/thumb.jpg',
                    },
                    members: [{ user_id: 'test-user-123' }],
                    schedules: [
                      {
                        id: 'sched-1',
                        title: '1장 읽기',
                        target_pages: '1~50',
                        due_date: '2026-10-01',
                        reviews: [{ user_id: 'test-user-123', title: '테스트 독후감' }],
                      },
                    ],
                  },
                ],
              }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      })
    );

    render(<MyClubsPage />);

    // 닉네임 반영 확인
    expect(screen.getByText('밤하늘독서가 님의 따뜻한 서재')).toBeInTheDocument();

    // 매너온도 및 이메일 반영 확인 (Navbar 및 페이지 배너에 정상 반영)
    expect(screen.getAllByText(/42.5/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('reader@cozybook.com')).toBeInTheDocument();

    // 통계 지표 및 탭 확인 (완독 1권)
    await waitFor(() => {
      expect(screen.getByText(/테스트 독서 모임/)).toBeInTheDocument();
      expect(screen.getByText('완독한 책')).toBeInTheDocument();
      expect(screen.getByText('1권')).toBeInTheDocument();
      expect(screen.getByText('완독 기념서가 (1권)')).toBeInTheDocument();
    });
  });

  it('비로그인 상태에서는 로그인 유도 메시지와 버튼이 노출되어야 한다', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      quickLogin: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(<MyClubsPage />);

    expect(screen.getAllByText('내 서재 & 클럽').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('온기 있는 나의 서재')).toBeInTheDocument();
    expect(screen.getByText('로그인이 필요합니다')).toBeInTheDocument();
    expect(screen.getByText(/로그인하시면 참여 중인 독서 클럽의 일정과 단원별 독후감 작성 현황을 확인하실 수 있습니다/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /로그인하기/ })).toBeInTheDocument();
  });
});
