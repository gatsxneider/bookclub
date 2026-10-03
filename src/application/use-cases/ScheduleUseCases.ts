import {
  IClubRepository,
  IMemberRepository,
  IMessageRepository,
  IScheduleRepository,
} from '@/domain/repositories';
import { ClubSchedule } from '@/domain/entities';
import { ForbiddenError, NotFoundError } from '@/application/errors';
import { sanitizeHtml } from '@/application/validation/schemas';

export class ScheduleUseCases {
  constructor(
    private scheduleRepo: IScheduleRepository,
    private clubRepo: IClubRepository,
    private memberRepo: IMemberRepository,
    private messageRepo: IMessageRepository
  ) {}

  async getSchedules(clubId: string, viewerId?: string | null): Promise<ClubSchedule[]> {
    const schedules = await this.scheduleRepo.findByClubId(clubId);
    return schedules.map((s) => {
      const reviewsList = s.reviews || [];
      const hasMyReview = Boolean(
        viewerId && reviewsList.some((r) => r.user_id === viewerId)
      );
      return {
        ...s,
        reviews_count: reviewsList.length,
        my_review_submitted: hasMyReview,
      };
    });
  }

  async createSchedule(
    clubId: string,
    currentUserId: string,
    params: {
      sequence: number;
      chapter_title: string;
      page_range?: string | null;
      target_date?: string | null;
    }
  ): Promise<ClubSchedule> {
    const club = await this.clubRepo.findById(clubId);
    if (!club) {
      throw new NotFoundError('독서클럽을 찾을 수 없습니다.');
    }

    if (club.leader_id !== currentUserId) {
      throw new ForbiddenError('단원 일정은 모임의 방장만 추가할 수 있습니다.');
    }

    const sanitizedTitle = sanitizeHtml(params.chapter_title.trim());
    const sanitizedPages = params.page_range ? sanitizeHtml(params.page_range.trim()) : null;

    const newSchedule = await this.scheduleRepo.create({
      club_id: clubId,
      sequence: params.sequence,
      chapter_title: sanitizedTitle,
      page_range: sanitizedPages,
      target_date: params.target_date || null,
    });

    // 클럽 멤버들에게 새 일정 알림 쪽지 자동 발송
    try {
      const members = await this.memberRepo.findByClubId(clubId);
      const approvedMembers = members.filter((m) => m.status === 'approved');
      const targetDateText = params.target_date ? ` (목표일: ${params.target_date})` : '';
      const noteTitle = `📅 [일정 등록] '${club.name}'의 새 독서 일정이 등록되었습니다.`;
      const noteContent = `'${club.name}' 모임에 새로운 일정 [${params.sequence}단원: ${sanitizedTitle}]${targetDateText}이(가) 등록되었습니다. 일정에 맞춰 독서를 진행해 보세요!`;

      const messagesToInsert = approvedMembers
        .filter((m) => m.user_id !== currentUserId)
        .map((m) => ({
          sender_id: currentUserId,
          receiver_id: m.user_id,
          title: noteTitle,
          content: noteContent,
          type: 'club_schedule' as const,
          related_club_id: clubId,
          related_schedule_id: newSchedule.id,
        }));

      if (messagesToInsert.length > 0) {
        await this.messageRepo.createMany(messagesToInsert);
      }
    } catch (e) {
      console.warn('일정 알림 쪽지 발송 오류:', e);
    }

    return newSchedule;
  }

  async updateSchedule(
    clubId: string,
    currentUserId: string,
    params: {
      schedule_id: string;
      chapter_title?: string;
      page_range?: string | null;
      target_date?: string | null;
      sequence?: number;
    }
  ): Promise<ClubSchedule> {
    const club = await this.clubRepo.findById(clubId);
    if (!club) {
      throw new NotFoundError('독서클럽을 찾을 수 없습니다.');
    }

    if (club.leader_id !== currentUserId) {
      throw new ForbiddenError('단원 일정 수정은 모임의 방장만 가능합니다.');
    }

    const updates: Partial<ClubSchedule> = {};
    if (params.chapter_title !== undefined) {
      updates.chapter_title = sanitizeHtml(params.chapter_title.trim());
    }
    if (params.page_range !== undefined) {
      updates.page_range = params.page_range ? sanitizeHtml(params.page_range.trim()) : undefined;
    }
    if (params.target_date !== undefined) {
      updates.target_date = params.target_date || undefined;
    }
    if (params.sequence !== undefined) {
      updates.sequence = Number(params.sequence);
    }

    return this.scheduleRepo.update(params.schedule_id, updates);
  }

  async deleteSchedule(
    clubId: string,
    currentUserId: string,
    scheduleId: string
  ): Promise<void> {
    const club = await this.clubRepo.findById(clubId);
    if (!club) {
      throw new NotFoundError('독서클럽을 찾을 수 없습니다.');
    }

    if (club.leader_id !== currentUserId) {
      throw new ForbiddenError('단원 일정 삭제는 모임의 방장만 가능합니다.');
    }

    await this.scheduleRepo.delete(scheduleId);
  }
}
