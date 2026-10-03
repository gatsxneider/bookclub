import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import ReviewCommentSection from '../ReviewCommentSection';
import * as AuthContextModule from '@/presentation/context/AuthContext';

describe('ReviewCommentSection Component', () => {
  const mockReviewId = 'rev-100';
  const mockAuthorId = 'author-user-id';
  const onOpenAuthMock = vi.fn();
  const onCommentCountChangeMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('댓글 목록이 정상적으로 렌더링되고 작성자 닉네임, 매너온도, 댓글 내용이 표시된다', async () => {
    const mockComments = [
      {
        id: 'comm-1',
        review_id: mockReviewId,
        user_id: 'other-user',
        content: '정말 인상 깊은 독후감이네요!',
        created_at: '2026-10-04T10:00:00Z',
        author: {
          nickname: '책벌레린',
          avatar_url: '/avatars/avatar_cat.png',
          manner_temperature: 38.2,
        },
      },
    ];

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes(`/api/reviews/${mockReviewId}/comments`)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ comments: mockComments }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'my-user-id',
        nickname: '내닉네임',
        avatar_url: '/avatars/avatar_female.png',
      },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      quickLogin: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <ReviewCommentSection
        reviewId={mockReviewId}
        reviewAuthorId={mockAuthorId}
        onOpenAuth={onOpenAuthMock}
        onCommentCountChange={onCommentCountChangeMock}
      />
    );

    // 댓글 내용 및 작성자 정보 확인
    await waitFor(() => {
      expect(screen.getByText('책벌레린')).toBeInTheDocument();
      expect(screen.getByText('38.2°C')).toBeInTheDocument();
      expect(screen.getByText('정말 인상 깊은 독후감이네요!')).toBeInTheDocument();
    });

    expect(onCommentCountChangeMock).toHaveBeenCalledWith(1);
  });

  it('로그인한 사용자가 새 댓글을 입력하고 등록할 수 있다', async () => {
    const initialComments: any[] = [];
    const createdComment = {
      id: 'comm-new',
      review_id: mockReviewId,
      user_id: 'my-user-id',
      content: '새로운 댓글 작성합니다.',
      created_at: '2026-10-04T10:05:00Z',
      author: {
        nickname: '내닉네임',
        avatar_url: '/avatars/avatar_female.png',
      },
    };

    const fetchMock = vi.fn().mockImplementation((url: string, options?: any) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, comment: createdComment }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ comments: initialComments }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'my-user-id',
        nickname: '내닉네임',
        avatar_url: '/avatars/avatar_female.png',
      },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      quickLogin: vi.fn(),
      signOut: vi.fn(),
      updateProfile: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <ReviewCommentSection
        reviewId={mockReviewId}
        reviewAuthorId={mockAuthorId}
        onOpenAuth={onOpenAuthMock}
        onCommentCountChange={onCommentCountChangeMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/따뜻한 감상과 생각을 댓글로/)).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText(/따뜻한 감상과 생각을 댓글로/);
    fireEvent.change(textarea, { target: { value: '새로운 댓글 작성합니다.' } });

    const submitBtn = screen.getByText('등록');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('새로운 댓글 작성합니다.')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(`/api/reviews/${mockReviewId}/comments`),
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('비로그인 사용자의 경우 로그인 안내 메시지가 표시되고 로그인 버튼 클릭 시 onOpenAuth가 호출된다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ comments: [] }),
      })
    );

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

    render(
      <ReviewCommentSection
        reviewId={mockReviewId}
        reviewAuthorId={mockAuthorId}
        onOpenAuth={onOpenAuthMock}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('로그인하고 다정한 댓글을 남겨보세요.')).toBeInTheDocument();
    });

    const loginBtn = screen.getByRole('button', { name: '로그인하기' });
    fireEvent.click(loginBtn);

    expect(onOpenAuthMock).toHaveBeenCalledTimes(1);
  });
});
