import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Navbar from '../Navbar';
import { AuthProvider } from '@/context/AuthContext';

let mockPathname = '/';
let mockSearchParamsValue: Record<string, string | null> = {};

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => ({
    get: (key: string) => mockSearchParamsValue[key] || null,
  }),
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/';
    mockSearchParamsValue = {};
  });

  it('코지 북클럽 로고와 메뉴 항목들이 모두 렌더링되어야 한다', () => {
    render(
      <AuthProvider>
        <Navbar
          onOpenSearch={vi.fn()}
          onOpenNewClub={vi.fn()}
          onOpenAuth={vi.fn()}
        />
      </AuthProvider>
    );

    expect(screen.getByText('Cozy Book Club')).toBeInTheDocument();
    expect(screen.getByText(/숲속의 북클럽/)).toBeInTheDocument();
    expect(screen.getByText('홈')).toBeInTheDocument();
    expect(screen.getByText('내 서재 & 클럽')).toBeInTheDocument();
    expect(screen.getByText('내 독후감 피드')).toBeInTheDocument();
    expect(screen.getByText('도서 탐색')).toBeInTheDocument();
  });

  it('검색 트리거 버튼 클릭 시 onOpenSearch 콜백이 실행되어야 한다', () => {
    const handleSearch = vi.fn();
    render(
      <AuthProvider>
        <Navbar
          onOpenSearch={handleSearch}
          onOpenAuth={vi.fn()}
        />
      </AuthProvider>
    );

    const btn = screen.getByRole('button', { name: /도서 검색/ });
    fireEvent.click(btn);
    expect(handleSearch).toHaveBeenCalled();
  });


  it('내 서재 & 클럽 링크가 올바른 /my-clubs 경로를 가리켜야 한다', () => {
    render(
      <AuthProvider>
        <Navbar
          onOpenSearch={vi.fn()}
          onOpenNewClub={vi.fn()}
          onOpenAuth={vi.fn()}
        />
      </AuthProvider>
    );

    const myClubsLink = screen.getByText('내 서재 & 클럽').closest('a');
    expect(myClubsLink).toHaveAttribute('href', '/my-clubs');
  });

  it('순수 내 독후감 피드(/book-reviews)에서는 활성화 하이라이트가 적용되어야 한다', () => {
    mockPathname = '/book-reviews';
    mockSearchParamsValue = {};

    render(
      <AuthProvider>
        <Navbar
          onOpenSearch={vi.fn()}
          onOpenNewClub={vi.fn()}
          onOpenAuth={vi.fn()}
        />
      </AuthProvider>
    );

    const feedLink = screen.getByText('내 독후감 피드').closest('a');
    expect(feedLink).toHaveClass('bg-primary-container');
  });

  it('클럽 독후감 전체 모아보기(/book-reviews?clubId=...) 조회 시에는 상단 내 독후감 피드가 하이라이트되지 않아야 한다', () => {
    mockPathname = '/book-reviews';
    mockSearchParamsValue = { clubId: 'club-123' };

    render(
      <AuthProvider>
        <Navbar
          onOpenSearch={vi.fn()}
          onOpenNewClub={vi.fn()}
          onOpenAuth={vi.fn()}
        />
      </AuthProvider>
    );

    const feedLink = screen.getByText('내 독후감 피드').closest('a');
    expect(feedLink).not.toHaveClass('bg-primary-container');
    expect(feedLink).toHaveClass('text-on-surface-variant');
  });
});
