import { describe, it, expect } from 'vitest';
import {
  calculateProgress,
  calculateClubTotalProgress,
  calculateDday,
  getEffectiveClubEndDate,
  getNearestUpcomingScheduleDday,
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

  it('세부 일정이 수립되면 가장 마지막 일정 날짜를 종료일로 간주하고 D-day가 업데이트되어야 한다', () => {
    const today = new Date('2026-09-26');
    const initialClubEndDate = '2026-10-15'; // 개설 시 설정한 종료일

    // 1) 세부 일정이 아직 없는 경우 -> 초기 모임 개설일 기준
    const effectiveDate1 = getEffectiveClubEndDate(initialClubEndDate, []);
    expect(effectiveDate1).toBe('2026-10-15');
    expect(calculateDday(effectiveDate1, today)).toBe('D-19');

    // 2) 세부 일정이 수립된 경우 -> 일정 중 가장 마지막 날짜가 종료일로 업데이트
    const schedules = [
      { target_date: '2026-10-05' },
      { target_date: '2026-10-31' },
      { target_date: '2026-10-20' },
    ];
    const effectiveDate2 = getEffectiveClubEndDate(initialClubEndDate, schedules);
    expect(effectiveDate2).toBe('2026-10-31');
    expect(calculateDday(effectiveDate2, today)).toBe('D-35');

    // 3) 일정에 target_date가 없는 항목이 섞여있거나 null인 경우
    const mixedSchedules = [
      { target_date: '' },
      { target_date: '2026-11-10' },
      { target_date: null },
    ];
    const effectiveDate3 = getEffectiveClubEndDate(initialClubEndDate, mixedSchedules);
    expect(effectiveDate3).toBe('2026-11-10');
    expect(calculateDday(effectiveDate3, today)).toBe('D-45');

    // 4) 일정의 모든 target_date가 비어있으면 초기 모임 종료일로 fallback
    const emptyDateSchedules = [{ target_date: '' }, { target_date: undefined }];
    const effectiveDate4 = getEffectiveClubEndDate(initialClubEndDate, emptyDateSchedules);
    expect(effectiveDate4).toBe('2026-10-15');
    expect(calculateDday(effectiveDate4, today)).toBe('D-19');
  });

  it('참여 중인 클럽들의 단원 일정 중 가장 빨리 도래하는 종료일을 찾아 D-day를 계산해야 한다', () => {
    const today = new Date('2026-09-29');

    // 1) 클럽이 없는 경우 -> '상시 토론'
    expect(getNearestUpcomingScheduleDday([], today)).toBe('상시 토론');

    // 2) 참여 클럽이 여러 개이고 여러 단원 일정이 있을 때, 가장 빨리 도래하는(최소 diffDays >= 0) 날짜 선택
    const clubs = [
      {
        end_date: '2026-10-20',
        schedules: [
          { target_date: '2026-10-05' },
          { target_date: '2026-10-20' },
        ],
      },
      {
        end_date: '2026-10-15',
        schedules: [
          { target_date: '2026-10-02' }, // 가장 빠른 도래일 (D-3)
          { target_date: '2026-10-10' },
        ],
      },
    ];
    expect(getNearestUpcomingScheduleDday(clubs, today)).toBe('D-3');

    // 3) 오늘이 마감일인 일정이 있는 경우 -> 'D-Day'
    const todayClub = [
      {
        schedules: [
          { target_date: '2026-09-29' },
          { target_date: '2026-10-05' },
        ],
      },
    ];
    expect(getNearestUpcomingScheduleDday(todayClub, today)).toBe('D-Day');

    // 4) 단원 일정이 없고 클럽 end_date만 있는 경우 fallback
    const fallbackClubs = [
      { end_date: '2026-10-04', schedules: [] },
      { end_date: '2026-10-10', schedules: [] },
    ];
    expect(getNearestUpcomingScheduleDday(fallbackClubs, today)).toBe('D-5');

    // 5) 모든 일정이 이미 지난 경우 -> '종료'
    const pastClubs = [
      {
        schedules: [
          { target_date: '2026-09-20' },
          { target_date: '2026-09-25' },
        ],
      },
    ];
    expect(getNearestUpcomingScheduleDday(pastClubs, today)).toBe('종료');
  });

  it('페이지 범위를 친절하고 일관된 형식으로 포맷팅해야 한다', () => {
    expect(formatPageRange('1-50')).toBe('p.1 ~ p.50');
    expect(formatPageRange('p. 10 ~ 45')).toBe('p.10 ~ p.45');
    expect(formatPageRange('')).toBe('');
  });
});
