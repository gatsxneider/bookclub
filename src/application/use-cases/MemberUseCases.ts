import {
  IClubRepository,
  IMemberRepository,
  IProfileRepository,
} from '@/domain/repositories';
import { ClubMember } from '@/domain/entities';
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/application/errors';

export class MemberUseCases {
  constructor(
    private clubRepo: IClubRepository,
    private memberRepo: IMemberRepository,
    private profileRepo: IProfileRepository
  ) {}

  async getMembers(clubId: string): Promise<ClubMember[]> {
    return this.memberRepo.findByClubId(clubId);
  }

  async addMember(
    clubId: string,
    currentUserId: string,
    nickname?: string
  ): Promise<ClubMember> {
    const club = await this.clubRepo.findById(clubId);
    if (!club) {
      throw new NotFoundError('독서클럽을 찾을 수 없습니다.');
    }

    let targetUserId = currentUserId;

    // 닉네임으로 타인 초대 시: 방장만 초대 가능
    if (nickname) {
      if (club.leader_id !== currentUserId) {
        throw new ForbiddenError('멤버 초대는 모임의 방장만 가능합니다.');
      }

      const trimmedNick = nickname.trim();
      const foundProfile = await this.profileRepo.findByNickname(trimmedNick);
      if (!foundProfile) {
        throw new NotFoundError(`'${trimmedNick}' 닉네임을 가진 회원을 찾을 수 없습니다.`);
      }
      targetUserId = foundProfile.id;
    }

    // 이미 참여 중인지 확인
    const existing = await this.memberRepo.findMember(clubId, targetUserId);
    if (existing) {
      throw new ConflictError(
        nickname
          ? `'${nickname}' 님은 이미 클럽 멤버로 등록되어 있습니다.`
          : '이미 클럽에 참여 중입니다.'
      );
    }

    return this.memberRepo.addMember({
      club_id: clubId,
      user_id: targetUserId,
      role: 'member',
      status: 'approved',
    });
  }

  async updateMemberStatus(
    clubId: string,
    currentUserId: string,
    memberId: string,
    status: 'approved' | 'rejected'
  ): Promise<ClubMember> {
    const club = await this.clubRepo.findById(clubId);
    if (!club) {
      throw new NotFoundError('독서클럽을 찾을 수 없습니다.');
    }

    if (club.leader_id !== currentUserId) {
      throw new ForbiddenError('멤버 승인 및 관리는 방장만 수행할 수 있습니다.');
    }

    return this.memberRepo.updateStatus(memberId, status);
  }

  async removeMember(
    clubId: string,
    currentUserId: string,
    memberId: string
  ): Promise<void> {
    const club = await this.clubRepo.findById(clubId);
    if (!club) {
      throw new NotFoundError('독서클럽을 찾을 수 없습니다.');
    }

    const members = await this.memberRepo.findByClubId(clubId);
    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) {
      throw new NotFoundError('해당 멤버를 찾을 수 없습니다.');
    }

    if (targetMember.role === 'leader') {
      throw new ValidationError('방장은 멤버에서 제외할 수 없습니다.');
    }

    const isLeader = club.leader_id === currentUserId;
    const isSelf = targetMember.user_id === currentUserId;

    if (!isLeader && !isSelf) {
      throw new ForbiddenError('멤버를 제외할 권한이 없습니다.');
    }

    await this.memberRepo.deleteMember(memberId);
  }
}
