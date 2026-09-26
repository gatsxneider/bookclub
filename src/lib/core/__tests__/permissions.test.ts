import { describe, it, expect } from 'vitest';
import { isClubLeader, isApprovedMember, canEditReview } from '../permissions';

describe('permissions', () => {
  it('방장 ID와 사용자 ID가 일치할 때 방장 권한을 부여해야 한다', () => {
    expect(isClubLeader('user-1', 'user-1')).toBe(true);
    expect(isClubLeader('user-1', 'user-2')).toBe(false);
    expect(isClubLeader(undefined, 'user-1')).toBe(false);
  });

  it('클럽 멤버의 status가 approved일 때 승인된 멤버로 판별해야 한다', () => {
    expect(isApprovedMember({ role: 'member', status: 'approved' })).toBe(true);
    expect(isApprovedMember({ role: 'leader', status: 'approved' })).toBe(true);
    expect(isApprovedMember({ role: 'member', status: 'pending' })).toBe(false);
    expect(isApprovedMember({ role: 'member', status: 'rejected' })).toBe(false);
    expect(isApprovedMember(null)).toBe(false);
  });

  it('독후감 작성자 본인 또는 클럽 방장에게 수정 권한을 부여해야 한다', () => {
    expect(canEditReview('user-author', 'user-author', 'leader-1')).toBe(true);
    expect(canEditReview('user-other', 'user-author', 'leader-1')).toBe(false);
  });
});
