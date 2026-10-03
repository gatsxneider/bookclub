import {
  IClubRepository,
  IMemberRepository,
  IMessageRepository,
  IProfileRepository,
  IScheduleRepository,
} from '@/domain/repositories';
import { Message } from '@/domain/entities';
import { ForbiddenError, NotFoundError, ValidationError } from '@/application/errors';

export class MessageUseCases {
  constructor(
    private messageRepo: IMessageRepository,
    private profileRepo: IProfileRepository,
    private clubRepo: IClubRepository,
    private memberRepo: IMemberRepository,
    private scheduleRepo: IScheduleRepository
  ) {}

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepo.getUnreadCount(userId);
  }

  async getInbox(userId: string): Promise<Message[]> {
    return this.messageRepo.getInbox(userId);
  }

  async getSent(userId: string): Promise<Message[]> {
    return this.messageRepo.getSent(userId);
  }

  async sendMessage(
    senderId: string,
    params: {
      receiver_id?: string | null;
      receiver_nickname?: string;
      title: string;
      content: string;
      type: Message['type'];
      related_club_id?: string | null;
      related_schedule_id?: string | null;
    }
  ): Promise<Message> {
    let targetReceiverId = params.receiver_id;

    if (!targetReceiverId && params.receiver_nickname) {
      const trimmedNick = params.receiver_nickname.trim();
      const profile = await this.profileRepo.findByNickname(trimmedNick);
      if (!profile) {
        throw new NotFoundError(`'${trimmedNick}' 닉네임을 가진 회원을 찾을 수 없습니다.`);
      }
      targetReceiverId = profile.id;
    }

    if (!targetReceiverId) {
      throw new ValidationError('쪽지를 받을 회원을 지정해주세요.');
    }

    if (params.type === 'general' && senderId === targetReceiverId) {
      throw new ValidationError('자기 자신에게는 쪽지를 보낼 수 없습니다.');
    }

    // club_join_request인 경우 방장 검증
    if (params.type === 'club_join_request' && params.related_club_id) {
      const club = await this.clubRepo.findById(params.related_club_id);
      if (club && club.leader_id !== targetReceiverId) {
        targetReceiverId = club.leader_id;
      }
    }

    const actionStatus = params.type === 'club_join_request' ? 'pending' : null;

    return this.messageRepo.create({
      sender_id: senderId,
      receiver_id: targetReceiverId,
      title: params.title,
      content: params.content,
      type: params.type,
      related_club_id: params.related_club_id || null,
      related_schedule_id: params.related_schedule_id || null,
      action_status: actionStatus,
    });
  }

  async handleAction(
    userId: string,
    messageId: string,
    action: 'mark_read' | 'approve_join' | 'reject_join'
  ): Promise<{ success: boolean; message: string }> {
    const msg = await this.messageRepo.findById(messageId);
    if (!msg) {
      throw new NotFoundError('쪽지를 찾을 수 없습니다.');
    }

    if (action === 'mark_read') {
      if (msg.receiver_id !== userId) {
        throw new ForbiddenError('쪽지 수신자만 읽음 처리할 수 있습니다.');
      }
      await this.messageRepo.markAsRead(messageId);
      return { success: true, message: '읽음 처리되었습니다.' };
    }

    if (action === 'approve_join' || action === 'reject_join') {
      const clubId = msg.related_club_id;
      const applicantId = msg.sender_id;

      if (!clubId || !applicantId) {
        throw new ValidationError('가입 요청 정보가 올바르지 않습니다.');
      }

      const club = await this.clubRepo.findById(clubId);
      if (!club) {
        throw new NotFoundError('해당 독서클럽을 찾을 수 없습니다.');
      }

      if (club.leader_id !== userId || msg.receiver_id !== userId) {
        throw new ForbiddenError('클럽 가입 승인 및 거절은 방장만 가능합니다.');
      }

      if (action === 'approve_join') {
        const existingMember = await this.memberRepo.findMember(clubId, applicantId);
        if (existingMember) {
          await this.memberRepo.updateStatus(existingMember.id, 'approved');
        } else {
          await this.memberRepo.addMember({
            club_id: clubId,
            user_id: applicantId,
            role: 'member',
            status: 'approved',
          });
        }

        await this.messageRepo.update(messageId, {
          action_status: 'approved',
          is_read: true,
          read_at: new Date().toISOString(),
        });

        await this.messageRepo.create({
          sender_id: userId,
          receiver_id: applicantId,
          title: `🎉 '${club.name}' 클럽 가입이 승인되었습니다!`,
          content: `축하합니다! 방장님께서 '${club.name}' 독서클럽 가입 요청을 승인하셨습니다. 지금 바로 클럽에서 멤버들과 함께 책을 읽고 독후감을 나눠보세요.`,
          type: 'club_join_approved',
          related_club_id: clubId,
        });

        return { success: true, message: '가입 승인이 완료되었습니다.' };
      }

      if (action === 'reject_join') {
        await this.messageRepo.update(messageId, {
          action_status: 'rejected',
          is_read: true,
          read_at: new Date().toISOString(),
        });

        await this.messageRepo.create({
          sender_id: userId,
          receiver_id: applicantId,
          title: `'${club.name}' 가입 신청 안내`,
          content: `아쉽게도 '${club.name}' 가입 신청이 수락되지 않았습니다. 다른 멋진 독서클럽도 탐색해보세요!`,
          type: 'general',
          related_club_id: clubId,
        });

        return { success: true, message: '가입 요청이 거절되었습니다.' };
      }
    }

    throw new ValidationError('유효하지 않은 액션입니다.');
  }

  async deleteMessage(userId: string, messageId: string, box: 'inbox' | 'sent'): Promise<void> {
    const msg = await this.messageRepo.findById(messageId);
    if (!msg) {
      throw new NotFoundError('삭제할 쪽지를 찾을 수 없습니다.');
    }

    if (msg.receiver_id !== userId && msg.sender_id !== userId) {
      throw new ForbiddenError('본인의 쪽지만 삭제할 수 있습니다.');
    }

    await this.messageRepo.deleteForUser(messageId, userId, box);
  }

  async runDdayCheck(userId: string): Promise<number> {
    const todayStr = new Date().toISOString().split('T')[0];

    // 유저가 가입된 활성 클럽 조회
    const clubs = await this.clubRepo.findAll();
    const joinedClubIds = clubs
      .filter((c) => (c.members || []).some((m) => m.user_id === userId && m.status === 'approved'))
      .map((c) => c.id);

    if (joinedClubIds.length === 0) return 0;

    const pastSchedules = await this.scheduleRepo.findPastSchedulesForClubs(joinedClubIds, todayStr);
    if (pastSchedules.length === 0) return 0;

    const scheduleIds = pastSchedules.map((s) => s.id);
    const existingScheduleIds = await this.messageRepo.findExistingDdayMessages(userId, scheduleIds);
    const alreadyNotified = new Set(existingScheduleIds);

    const newMessages = [];
    for (const schedule of pastSchedules) {
      if (!alreadyNotified.has(schedule.id)) {
        const clubName = (schedule as any).club?.name || '독서클럽';
        newMessages.push({
          sender_id: null,
          receiver_id: userId,
          title: `⏰ [D-day 알림] '${clubName}' [${schedule.sequence}단원] 일정 기한 안내`,
          content: `'${clubName}'의 [${schedule.sequence}단원: ${schedule.chapter_title}] 목표일(${schedule.target_date})이 지났습니다. 아직 기록하지 못한 독후감이 있다면 지금 바로 남겨보세요!`,
          type: 'club_schedule_dday' as const,
          related_club_id: schedule.club_id,
          related_schedule_id: schedule.id,
        });
      }
    }

    if (newMessages.length > 0) {
      await this.messageRepo.createMany(newMessages);
    }

    return newMessages.length;
  }
}
