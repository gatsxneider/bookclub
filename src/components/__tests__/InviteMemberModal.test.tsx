import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import InviteMemberModal from '../InviteMemberModal';

describe('InviteMemberModal Component', () => {
  it('모달이 열렸을 때 닉네임 입력란과 닫기 버튼이 렌더링되어야 한다', () => {
    render(
      <InviteMemberModal
        isOpen={true}
        onClose={vi.fn()}
        onInvite={vi.fn().mockResolvedValue(true)}
        clubName="불편한 독서회"
      />
    );

    expect(screen.getByText('클럽 멤버 초대')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/모래고래, 아린/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '등록하기' })).toBeInTheDocument();
  });

  it('이미 참여 중인 닉네임 입력 시 에러 메시지를 표시해야 한다', async () => {
    render(
      <InviteMemberModal
        isOpen={true}
        onClose={vi.fn()}
        onInvite={vi.fn().mockResolvedValue(true)}
        existingMemberNicknames={['린건맘', '모래고래']}
      />
    );

    const input = screen.getByPlaceholderText(/모래고래, 아린/);
    const submitBtn = screen.getByRole('button', { name: '등록하기' });

    fireEvent.change(input, { target: { value: '린건맘' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/'린건맘' 님은 이미 클럽 멤버로 참여 중입니다/)).toBeInTheDocument();
    });
  });

  it('새로운 닉네임 입력 후 등록하기 클릭 시 onInvite가 호출되어야 한다', async () => {
    const handleInvite = vi.fn().mockResolvedValue(true);
    const handleClose = vi.fn();

    render(
      <InviteMemberModal
        isOpen={true}
        onClose={handleClose}
        onInvite={handleInvite}
        existingMemberNicknames={['린건맘']}
      />
    );

    const input = screen.getByPlaceholderText(/모래고래, 아린/);
    const submitBtn = screen.getByRole('button', { name: '등록하기' });

    fireEvent.change(input, { target: { value: '아린' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleInvite).toHaveBeenCalledWith('아린');
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
