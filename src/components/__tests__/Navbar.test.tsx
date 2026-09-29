import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Navbar from '../Navbar';
import { AuthProvider } from '@/context/AuthContext';

describe('Navbar Component', () => {
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

  it('새 독서클럽 버튼 클릭 시 onOpenNewClub 콜백이 실행되어야 한다', () => {
    const handleNewClub = vi.fn();
    render(
      <AuthProvider>
        <Navbar
          onOpenSearch={vi.fn()}
          onOpenNewClub={handleNewClub}
          onOpenAuth={vi.fn()}
        />
      </AuthProvider>
    );

    const btn = screen.getByRole('button', { name: /새 독서클럽/ });
    fireEvent.click(btn);
    expect(handleNewClub).toHaveBeenCalled();
  });
});
