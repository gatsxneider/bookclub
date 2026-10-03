import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import RemoveMemberModal from '../RemoveMemberModal';
import { ClubMember } from '@/domain/entities';

describe('RemoveMemberModal Component', () => {
  const dummyMembers: ClubMember[] = [
    {
      id: 'mem-1',
      club_id: 'club-1',
      user_id: 'user-1',
      role: 'leader',
      status: 'approved',
      profile: {
        id: 'user-1',
        nickname: '린건맘 (방장)',
        manner_temperature: 26.0,
      },
    },
    {
      id: 'mem-2',
      club_id: 'club-1',
      user_id: 'user-2',
      role: 'member',
      status: 'approved',
      profile: {
        id: 'user-2',
        nickname: '모래고래',
        manner_temperature: 36.5,
      },
    },
  ];

  it('방장을 제외한 일반 참여 멤버만 목록에 표시되어야 한다', () => {
    render(
      <RemoveMemberModal
        isOpen={true}
        onClose={vi.fn()}
        members={dummyMembers}
        onRemove={vi.fn().mockResolvedValue(true)}
      />
    );

    expect(screen.getByText('클럽 멤버 제외')).toBeInTheDocument();
    expect(screen.getByText('모래고래')).toBeInTheDocument();
    expect(screen.queryByText('린건맘 (방장)')).not.toBeInTheDocument();
  });

  it('멤버 선택 후 제외하기 클릭 시 onRemove가 호출되어야 한다', async () => {
    const handleRemove = vi.fn().mockResolvedValue(true);
    const handleClose = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <RemoveMemberModal
        isOpen={true}
        onClose={handleClose}
        members={dummyMembers}
        onRemove={handleRemove}
      />
    );

    const removeBtn = screen.getByRole('button', { name: /선택한 멤버 제외하기/ });
    fireEvent.click(removeBtn);

    await waitFor(() => {
      expect(handleRemove).toHaveBeenCalledWith('mem-2', '모래고래');
      expect(handleClose).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });
});
