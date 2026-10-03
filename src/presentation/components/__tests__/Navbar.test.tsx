import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from '../Navbar';

const mockSignOut = vi.fn();
let mockUser: any = null;

vi.mock('@/presentation/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    signOut: mockSignOut,
  }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/presentation/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ unreadCount: 2 }),
  },
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;
  });

  it('비로그인 상태일 때 로그인 버튼이 렌더링되어야 한다', () => {
    const onOpenAuth = vi.fn();
    render(<Navbar onOpenSearch={vi.fn()} onOpenAuth={onOpenAuth} />);

    const loginBtns = screen.getAllByRole('button', { name: /로그인/ });
    expect(loginBtns.length).toBeGreaterThan(0);

    fireEvent.click(loginBtns[0]);
    expect(onOpenAuth).toHaveBeenCalled();
  });

  it('로그인 상태일 때 사용자 닉네임과 레벨, 쪽지함 아이콘이 렌더링되어야 한다', () => {
    mockUser = {
      id: '00000000-0000-0000-0000-000000000001',
      nickname: '테스트독서가',
      manner_temperature: 36.5,
      completed_count: 2,
      level: 2,
    };

    render(<Navbar onOpenSearch={vi.fn()} onOpenAuth={vi.fn()} />);

    expect(screen.getByText('테스트독서가')).toBeInTheDocument();
    expect(screen.getByText('Lv.2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
  });
});
