import { describe, it, expect, beforeEach } from 'vitest';
import { ScheduleUseCases } from '../ScheduleUseCases';
import { MemberUseCases } from '../MemberUseCases';
import { ForbiddenError, NotFoundError } from '@/application/errors';
import { Club, ClubMember, ClubSchedule, Message, Profile } from '@/domain/entities';
import {
  IClubRepository,
  IMemberRepository,
  IMessageRepository,
  IProfileRepository,
  IScheduleRepository,
} from '@/domain/repositories';

// InMemory Repositories for Unit Testing
class MockClubRepo implements Partial<IClubRepository> {
  public clubs: Club[] = [];
  async findById(id: string): Promise<Club | null> {
    return this.clubs.find((c) => c.id === id) || null;
  }
}

class MockScheduleRepo implements Partial<IScheduleRepository> {
  public schedules: ClubSchedule[] = [];
  async create(data: any): Promise<ClubSchedule> {
    const item = { id: 'sched-1', reviews: [], ...data };
    this.schedules.push(item);
    return item;
  }
  async delete(id: string): Promise<void> {
    this.schedules = this.schedules.filter((s) => s.id !== id);
  }
}

class MockMemberRepo implements Partial<IMemberRepository> {
  public members: ClubMember[] = [];
  async findByClubId(clubId: string): Promise<ClubMember[]> {
    return this.members.filter((m) => m.club_id === clubId);
  }
  async findMember(clubId: string, userId: string): Promise<ClubMember | null> {
    return this.members.find((m) => m.club_id === clubId && m.user_id === userId) || null;
  }
  async addMember(data: any): Promise<ClubMember> {
    const m = { id: `m-${Date.now()}`, ...data };
    this.members.push(m);
    return m;
  }
  async deleteMember(memberId: string): Promise<void> {
    this.members = this.members.filter((m) => m.id !== memberId);
  }
}

class MockMessageRepo implements Partial<IMessageRepository> {
  public messages: any[] = [];
  async createMany(msgs: any[]): Promise<void> {
    this.messages.push(...msgs);
  }
}

describe('Backend Clean Architecture Use Cases', () => {
  let clubRepo: MockClubRepo;
  let scheduleRepo: MockScheduleRepo;
  let memberRepo: MockMemberRepo;
  let messageRepo: MockMessageRepo;
  let scheduleUseCases: ScheduleUseCases;
  let memberUseCases: MemberUseCases;

  beforeEach(() => {
    clubRepo = new MockClubRepo();
    scheduleRepo = new MockScheduleRepo();
    memberRepo = new MockMemberRepo();
    messageRepo = new MockMessageRepo();

    clubRepo.clubs = [
      {
        id: 'club-1',
        name: '달빛 독서회',
        leader_id: 'leader-123',
        max_members: 10,
        status: 'active',
      },
    ];

    scheduleUseCases = new ScheduleUseCases(
      scheduleRepo as any,
      clubRepo as any,
      memberRepo as any,
      messageRepo as any
    );

    memberUseCases = new MemberUseCases(
      clubRepo as any,
      memberRepo as any,
      {} as any
    );
  });

  it('방장이 아닌 유저가 일정 추가를 시도하면 ForbiddenError를 던져야 한다', async () => {
    await expect(
      scheduleUseCases.createSchedule('club-1', 'intruder-user', {
        sequence: 1,
        chapter_title: '1단원',
      })
    ).rejects.toThrow(ForbiddenError);
  });

  it('방장은 일정을 정상적으로 추가하고 멤버들에게 알림을 발송해야 한다', async () => {
    memberRepo.members = [
      { id: 'm-1', club_id: 'club-1', user_id: 'leader-123', role: 'leader', status: 'approved' },
      { id: 'm-2', club_id: 'club-1', user_id: 'member-456', role: 'member', status: 'approved' },
    ];

    const result = await scheduleUseCases.createSchedule('club-1', 'leader-123', {
      sequence: 1,
      chapter_title: '1단원: 첫 만남',
    });

    expect(result.sequence).toBe(1);
    expect(scheduleRepo.schedules.length).toBe(1);
    // 방장을 제외한 일반 멤버 1명에게 알림 발송 확인
    expect(messageRepo.messages.length).toBe(1);
    expect(messageRepo.messages[0].receiver_id).toBe('member-456');
  });

  it('방장은 멤버를 제외할 수 있지만 방장 자신은 삭제할 수 없다', async () => {
    memberRepo.members = [
      { id: 'm-1', club_id: 'club-1', user_id: 'leader-123', role: 'leader', status: 'approved' },
      { id: 'm-2', club_id: 'club-1', user_id: 'member-456', role: 'member', status: 'approved' },
    ];

    // 방장 삭제 시도 -> 에러
    await expect(
      memberUseCases.removeMember('club-1', 'leader-123', 'm-1')
    ).rejects.toThrow('방장은 멤버에서 제외할 수 없습니다.');

    // 일반 멤버 삭제 -> 성공
    await memberUseCases.removeMember('club-1', 'leader-123', 'm-2');
    expect(memberRepo.members.length).toBe(1);
  });
});
