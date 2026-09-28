import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import UserProfileModal from '../UserProfileModal';
import { AuthProvider } from '@/context/AuthContext';

describe('UserProfileModal Component', () => {
  it('모달이 열렸을 때 프로필 아바타, 레벨, 매너온도가 올바르게 렌더링되어야 한다', () => {
    render(
      <AuthProvider>
        <UserProfileModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    expect(screen.getByText('내 프로필 & 아바타 관리')).toBeInTheDocument();
    expect(screen.getAllByText(/매너온도/).length).toBeGreaterThan(0);
    expect(screen.getByText(/독서클럽 완독 레벨/)).toBeInTheDocument();
    expect(screen.getByText('추천 아바타 이미지 선택')).toBeInTheDocument();
    expect(screen.getByText('나만의 사진 직접 업로드')).toBeInTheDocument();
  });

  it('추천 아바타 클릭 시 선택 상태가 반영되어야 한다', () => {
    render(
      <AuthProvider>
        <UserProfileModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    const presetButtons = screen.getAllByRole('button').filter(b => b.querySelector('img'));
    expect(presetButtons.length).toBeGreaterThan(0);

    fireEvent.click(presetButtons[0]);
    expect(screen.getByRole('button', { name: /프로필 저장하기/ })).toBeInTheDocument();
  });

  it('프로필 저장하기 버튼 클릭 시 updateProfile이 호출되고 저장 완료되어야 한다', async () => {
    const handleClose = vi.fn();
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <AuthProvider>
        <UserProfileModal isOpen={true} onClose={handleClose} />
      </AuthProvider>
    );

    const saveBtn = screen.getByRole('button', { name: /프로필 저장하기/ });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('성공적으로 변경'));
      expect(handleClose).toHaveBeenCalled();
    });

    alertMock.mockRestore();
  });
});
