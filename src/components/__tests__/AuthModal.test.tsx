import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import AuthModal from '../AuthModal';
import { AuthProvider } from '@/context/AuthContext';

describe('AuthModal Component', () => {
  it('모달이 열렸을 때 로그인 및 회원가입 탭만 존재하고 닉네임 시작 탭은 없어야 한다', () => {
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    expect(screen.getByText('코지 북클럽')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument();

    // '닉네임 시작' 탭이나 버튼이 제거되었는지 확인
    expect(screen.queryByText('닉네임 시작')).not.toBeInTheDocument();
    expect(screen.queryByText(/바로 시작하기/)).not.toBeInTheDocument();
  });

  it('회원가입 탭 클릭 시 독서클럽 닉네임 필드가 렌더링되어야 한다', () => {
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    const signupTab = screen.getByRole('button', { name: '회원가입' });
    fireEvent.click(signupTab);

    expect(screen.getByText(/독서클럽 닉네임/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('cozy@bookclub.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /가입 완료하고 북클럽 시작/ })).toBeInTheDocument();
  });

  it('로그인 폼에서 빈 값 제출 시 유효성 검사 에러가 표시되어야 한다', async () => {
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    const submitBtn = screen.getByRole('button', { name: /로그인하고 서재 입장/ });
    fireEvent.click(submitBtn);

    // Form required validation or error message check
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('회원가입 탭에서 닉네임 중복 확인 버튼이 렌더링되고 동작해야 한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('check-nickname')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ available: true, message: '사용 가능한 닉네임입니다! ✨' }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      })
    );

    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    const signupTab = screen.getByRole('button', { name: '회원가입' });
    fireEvent.click(signupTab);

    expect(screen.getByRole('button', { name: '중복 확인' })).toBeInTheDocument();

    const nickInput = screen.getByPlaceholderText('예: 모래고래, 달빛서재');
    fireEvent.change(nickInput, { target: { value: '모래고래' } });

    const checkBtn = screen.getByRole('button', { name: '중복 확인' });
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(screen.getByText('사용 가능한 닉네임입니다! ✨')).toBeInTheDocument();
      expect(screen.getByText('확인됨')).toBeInTheDocument();
    });
  });
});

