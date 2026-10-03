import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthModal from '../AuthModal';

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();

vi.mock('@/presentation/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    signIn: mockSignIn,
    signUp: mockSignUp,
  }),
}));

vi.mock('@/presentation/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ available: true, message: '사용 가능한 닉네임입니다!' }),
    post: vi.fn(),
  },
}));

describe('AuthModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('로그인 탭에서 이메일/비밀번호 입력 후 로그인을 수행한다', async () => {
    mockSignIn.mockResolvedValueOnce({ success: true });
    const onCloseMock = vi.fn();

    render(<AuthModal isOpen={true} onClose={onCloseMock} />);

    const emailInput = screen.getByPlaceholderText('cozy@bookclub.com');
    const passwordInput = screen.getByPlaceholderText('비밀번호 입력');
    const submitBtn = screen.getByRole('button', { name: '로그인하기' });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('user@example.com', 'password123');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('회원가입 탭으로 전환 후 닉네임 및 계정 정보를 입력하여 가입을 수행한다', async () => {
    mockSignUp.mockResolvedValueOnce({ success: true });
    const onCloseMock = vi.fn();

    render(<AuthModal isOpen={true} onClose={onCloseMock} />);

    const signupTab = screen.getByRole('tab', { name: /회원가입/ });
    fireEvent.click(signupTab);

    const nicknameInput = screen.getByPlaceholderText('예: 별헤는밤');
    const emailInput = screen.getByPlaceholderText('cozy@bookclub.com');
    const passwordInput = screen.getByPlaceholderText('비밀번호 입력');
    const submitBtn = screen.getByRole('button', { name: '회원가입 완료' });

    fireEvent.change(nicknameInput, { target: { value: '새로운독서가' } });
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'securePass123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('newuser@example.com', 'securePass123!', '새로운독서가');
      expect(onCloseMock).toHaveBeenCalled();
    });
  });
});
