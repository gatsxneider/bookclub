import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserProfileModal from '../UserProfileModal';

const mockUpdateProfile = vi.fn();
const mockUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  nickname: '기존필명',
  avatar_url: '/avatars/avatar_cat.png',
  manner_temperature: 36.5,
  completed_count: 3,
  level: 3,
};

vi.mock('@/presentation/context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    updateProfile: mockUpdateProfile,
  }),
}));

describe('UserProfileModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('모달이 열렸을 때 기존 닉네임과 프리셋 아바타가 정상 표시되어야 한다', () => {
    render(<UserProfileModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('내 프로필 관리')).toBeInTheDocument();
    expect(screen.getByDisplayValue('기존필명')).toBeInTheDocument();
    expect(screen.getByLabelText('코지 고양이')).toBeInTheDocument();
  });

  it('닉네임을 변경하고 저장 버튼을 누르면 updateProfile이 호출되어야 한다', async () => {
    mockUpdateProfile.mockResolvedValueOnce({ success: true });
    const onCloseMock = vi.fn();

    render(<UserProfileModal isOpen={true} onClose={onCloseMock} />);

    const nicknameInput = screen.getByDisplayValue('기존필명');
    fireEvent.change(nicknameInput, { target: { value: '새로운필명' } });

    const saveBtn = screen.getByRole('button', { name: /프로필 저장/ });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          nickname: '새로운필명',
        })
      );
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('비허용 확장자 파일 업로드 시 경고 메시지가 표시되어야 한다', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<UserProfileModal isOpen={true} onClose={vi.fn()} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['dummy content'], 'document.exe', { type: 'application/x-msdownload' });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalled();
    });

    alertMock.mockRestore();
  });
});
