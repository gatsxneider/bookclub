import { ClubMember } from '@/types/database';

export function isClubLeader(leaderId?: string, currentUserId?: string): boolean {
  if (!leaderId || !currentUserId) return false;
  return leaderId === currentUserId;
}

export function isApprovedMember(member?: Pick<ClubMember, 'role' | 'status'> | null): boolean {
  if (!member) return false;
  return member.status === 'approved';
}

export function canEditReview(
  currentUserId?: string,
  reviewAuthorId?: string,
  clubLeaderId?: string
): boolean {
  if (!currentUserId || !reviewAuthorId) return false;
  // 작성자 본인은 항상 수정 가능
  return currentUserId === reviewAuthorId;
}
