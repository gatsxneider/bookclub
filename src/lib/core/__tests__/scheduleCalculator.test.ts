import { describe, it, expect } from 'vitest';
import {
  calculateProgress,
  calculateClubTotalProgress,
  calculateDday,
  formatPageRange,
  isUserClubMember,
  isClubCompleted,
} from '../scheduleCalculator';

describe('scheduleCalculator', () => {
  it('총 일정과 완료된 일정을 바탕으로 진행률 퍼센티지를 정확히 계산해야 한다', () => {
    expect(calculateProgress(0, 5)).toBe(0);
    expect(calculateProgress(2, 5)).toBe(40);
    expect(calculateProgress(4, 5)).toBe(80);
    expect(calculateProgress(5, 5)).toBe(100);
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it('독서회 전체 완독 진척률을 멤버 수와 단원 수를 기반으로 정확히 계산해야 한다', () => {
    // 1명, 3개 단원, 3건 작성 -> 100%
    const res1 = calculateClubTotalProgress(3, 1, 3);
    expect(res1.percentage).toBe(100);
    expect(res1.totalReviews).toBe(3);
    expect(res1.targetReviews).toBe(3);

    // 2명, 3개 단원 (목표 6건), 3건 작성 -> 50%
    const res2 = calculateClubTotalProgress(3, 2, 3);
    expect(res2.percentage).toBe(50);
    expect(res2.totalReviews).toBe(3);
    expect(res2.targetReviews).toBe(6);

    // 2명, 3개 단원, 6건 모두 작성 -> 100%
    const res3 = calculateClubTotalProgress(6, 2, 3);
    expect(res3.percentage).toBe(100);

    // 0건 작성 시 0%
    const res4 = calculateClubTotalProgress(0, 2, 3);
    expect(res4.percentage).toBe(0);
  });

  it('사용자가 방장 또는 승인된 멤버인지 정확히 판정해야 한다', () => {
    const club = {
      leader_id: 'user-1',
      members: [
        { user_id: 'user-1', status: 'approved' },
        { user_id: 'user-2', status: 'approved' },
        { user_id: 'user-3', status: 'rejected' },
      ],
    };

    expect(isUserClubMember(club, 'user-1')).toBe(true); // 방장
    expect(isUserClubMember(club, 'user-2')).toBe(true); // 승인된 멤버
    expect(isUserClubMember(club, 'user-3')).toBe(false); // 거절된 멤버
    expect(isUserClubMember(club, 'user-999')).toBe(false); // 미참여 유저
    expect(isUserClubMember(club, null)).toBe(false); // 미로그인 유저
  });

  it('독서 클럽 멤버 모두 완독 시 완료로 판정하고, 한 명이라도 미완료 시 진행 중으로 판정해야 한다', () => {
    // 1) 2명 멤버 중 1명만 3단원 완료, 1명은 0단원 완료 -> 진행중 (false)
    const inProgressClub = {
      members: [
        { user_id: 'user-1', status: 'approved' },
        { user_id: 'user-2', status: 'approved' },
      ],
      schedules: [
        { id: 's1', reviews: [{ user_id: 'user-1' }] },
        { id: 's2', reviews: [{ user_id: 'user-1' }] },
        { id: 's3', reviews: [{ user_id: 'user-1' }] },
      ],
    };
    expect(isClubCompleted(inProgressClub)).toBe(false);

    // 2) 2명 멤버 모두 3개 단원에 독후감 작성 완료 -> 완료 (true)
    const completedClub = {
      members: [
        { user_id: 'user-1', status: 'approved' },
        { user_id: 'user-2', status: 'approved' },
      ],
      schedules: [
        { id: 's1', reviews: [{ user_id: 'user-1' }, { user_id: 'user-2' }] },
        { id: 's2', reviews: [{ user_id: 'user-1' }, { user_id: 'user-2' }] },
        { id: 's3', reviews: [{ user_id: 'user-1' }, { user_id: 'user-2' }] },
      ],
    };
    expect(isClubCompleted(completedClub)).toBe(true);

    // 3) 단원이 아직 0개인 경우 -> 진행중 (false)
    const noScheduleClub = {
      members: [{ user_id: 'user-1', status: 'approved' }],
      schedules: [],
    };
    expect(isClubCompleted(noScheduleClub)).toBe(false);

    // 4) status가 이미 'completed'인 경우 -> 완료 (true)
    const explicitlyCompletedClub = {
      status: 'completed',
      members: [{ user_id: 'user-1', status: 'approved' }],
      schedules: [],
    };
    expect(isClubCompleted(explicitlyCompletedClub)).toBe(true);
  });

  it('목표 날짜를 기준으로 D-Day 문자열을 반환해야 한다', () => {
    const today = new Date('2026-09-26');
    expect(calculateDday('2026-09-26', today)).toBe('D-Day');
    expect(calculateDday('2026-09-28', today)).toBe('D-2');
    expect(calculateDday('2026-09-20', today)).toBe('종료');
    expect(calculateDday(undefined, today)).toBe('-');
  });

  it('페이지 범위를 친절하고 일관된 형식으로 포맷팅해야 한다', () => {
    expect(formatPageRange('1-50')).toBe('p.1 ~ p.50');
    expect(formatPageRange('p. 10 ~ 45')).toBe('p.10 ~ p.45');
    expect(formatPageRange('')).toBe('');
  });
});
