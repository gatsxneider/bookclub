export function calculateProgress(completedCount: number, totalCount: number): number {
  if (!totalCount || totalCount <= 0) return 0;
  if (!completedCount || completedCount <= 0) return 0;
  const percentage = Math.round((completedCount / totalCount) * 100);
  return Math.min(percentage, 100);
}

/**
 * 독서회 전체 완독 진척률 계산
 * - 전체 참여 멤버 수 x 전체 단원 수 대비 총 작성된 독후감 수의 비율
 * @param totalReviewsWritten 클럽 멤버들이 작성한 총 독후감 수
 * @param memberCount 클럽 참여 멤버 수
 * @param scheduleCount 클럽 전체 단원 수
 */
export function calculateClubTotalProgress(
  totalReviewsWritten: number,
  memberCount: number,
  scheduleCount: number
): { percentage: number; totalReviews: number; targetReviews: number } {
  const members = Math.max(1, memberCount || 1);
  const schedules = Math.max(1, scheduleCount || 1);
  const targetReviews = members * schedules;
  const totalReviews = Math.max(0, totalReviewsWritten || 0);

  const percentage = Math.min(100, Math.round((totalReviews / targetReviews) * 100));

  return {
    percentage,
    totalReviews,
    targetReviews,
  };
}

/**
 * 사용자가 해당 독서 클럽의 방장 또는 승인된 멤버인지 확인
 */
export function isUserClubMember(
  club: {
    leader_id?: string;
    leader?: { id?: string };
    members?: Array<{ user_id: string; status?: string }>;
  },
  userId?: string | null
): boolean {
  if (!userId) return false;
  if (club.leader_id === userId || club.leader?.id === userId) return true;
  return (club.members || []).some(
    (m) => m.user_id === userId && m.status !== 'rejected'
  );
}

/**
 * 독서 클럽의 모든 멤버가 완독하였는지 여부 판별
 * - 모든 참여 멤버(방장 및 승인된 멤버)가 클럽의 모든 단원에 대해 독후감을 작성 완료했거나
 *   club.status가 'completed'인 경우에만 완료(true)
 * - 단원이 등록되지 않았거나(0개), 멤버 중 한 명이라도 미작성 단원이 있으면 진행중(false)
 */
export function isClubCompleted(club: {
  status?: string;
  members?: Array<{ user_id: string; status?: string }>;
  schedules?: Array<{ id?: string; reviews?: Array<{ user_id: string }>; reviews_count?: number }>;
}): boolean {
  if (club.status === 'completed') return true;

  const schedules = club.schedules || [];
  if (schedules.length === 0) return false;

  const approvedMembers = (club.members || []).filter(
    (m) => !m.status || m.status === 'approved'
  );

  const memberIds = approvedMembers.map((m) => m.user_id).filter(Boolean);

  if (memberIds.length > 0) {
    // 모든 멤버가 모든 단원에 리뷰를 작성했는지 확인
    return memberIds.every((userId) =>
      schedules.every((sched) =>
        (sched.reviews || []).some((rev) => rev.user_id === userId)
      )
    );
  }

  // 상세 리뷰 정보가 없을 경우 reviews_count로 fallback 계산
  const totalReviews = schedules.reduce(
    (sum, s) => sum + (s.reviews?.length ?? s.reviews_count ?? 0),
    0
  );
  const targetReviews = Math.max(1, approvedMembers.length || 1) * schedules.length;
  return totalReviews >= targetReviews;
}

/**
 * 클럽의 최종 유효 종료일 계산
 * - 세부 일정(schedules) 중 target_date가 설정된 항목이 있으면, 그 중 가장 마지막(최신) 날짜를 종료일로 간주
 * - 세부 일정에 유효한 target_date가 없으면 처음 모임 개설 시 설정한 clubEndDate를 fallback으로 사용
 */
export function getEffectiveClubEndDate(
  clubEndDate?: string | null,
  schedules?: Array<{ target_date?: string | null }> | null
): string | undefined {
  if (schedules && schedules.length > 0) {
    const validDates = schedules
      .map((s) => s.target_date?.trim())
      .filter((d): d is string => Boolean(d && !isNaN(new Date(d).getTime())));

    if (validDates.length > 0) {
      // 가장 늦은 날짜(최대 날짜)를 종료일로 반환
      validDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      return validDates[0];
    }
  }

  return clubEndDate || undefined;
}

export function calculateDday(targetDateStr?: string, baseDate: Date = new Date()): string {
  if (!targetDateStr) return '-';
  const target = new Date(targetDateStr);
  if (isNaN(target.getTime())) return '-';

  // YYYY-MM-DD 기준 날짜 차이 계산
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const baseDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()).getTime();
  
  const diffDays = Math.ceil((targetDay - baseDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'D-Day';
  if (diffDays > 0) return `D-${diffDays}`;
  return '종료';
}

export interface NearestScheduleResult {
  dDay: string;
  clubId?: string;
  scheduleId?: string;
  isAllCompleted?: boolean;
}

/**
 * 참여 중인 클럽들의 각 단원별 일정 종료일(target_date) 중
 * 독후감 작성이 완료된 일정은 제외하고, 가장 빨리 도래하는 일자를 기준으로 D-day 및 해당 독서회 ID 반환
 * @param clubs 참여 중인 클럽 목록
 * @param baseDate 기준 일자 (기본값: 오늘)
 * @param userId 현재 사용자 ID (작성 여부 판별용)
 */
export function getNearestUpcomingSchedule(
  clubs: Array<{
    id?: string;
    name?: string;
    end_date?: string | null;
    schedules?: Array<{
      id?: string;
      chapter_title?: string;
      target_date?: string | null;
      my_review_submitted?: boolean;
      reviews?: Array<{ user_id?: string }>;
    }> | null;
  }>,
  baseDate: Date = new Date(),
  userId?: string | null
): NearestScheduleResult {
  if (!clubs || clubs.length === 0) {
    return { dDay: '상시 토론' };
  }

  const baseDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()).getTime();

  // 1. 참여 클럽들의 미작성 단원 일정 target_date와 club.id 수집 (작성 완료된 단원은 제외)
  const items: Array<{
    dateStr: string;
    clubId?: string;
    scheduleId?: string;
    diffDays: number;
  }> = [];
  let totalScheduleCount = 0;
  let completedScheduleCount = 0;

  for (const club of clubs) {
    if (club.schedules && club.schedules.length > 0) {
      for (const s of club.schedules) {
        totalScheduleCount++;

        // 본인이 독후감을 작성 완료했는지 판별
        const isReviewed = Boolean(
          s.my_review_submitted ||
          (userId && s.reviews && s.reviews.some((r) => r.user_id === userId))
        );

        if (isReviewed) {
          completedScheduleCount++;
          // 독후감 작성 완료된 일정은 D-day 산정에서 제외
          continue;
        }

        if (s.target_date && s.target_date.trim() && !isNaN(new Date(s.target_date).getTime())) {
          const target = new Date(s.target_date.trim());
          const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
          const diffDays = Math.ceil((targetDay - baseDay) / (1000 * 60 * 60 * 24));
          items.push({
            dateStr: s.target_date.trim(),
            clubId: club.id,
            scheduleId: s.id,
            diffDays,
          });
        }
      }
    }
  }

  // 모든 등록된 단원의 독후감을 전부 작성 완료한 경우
  if (totalScheduleCount > 0 && totalScheduleCount === completedScheduleCount) {
    return { dDay: '완독 완료', clubId: clubs[0]?.id, isAllCompleted: true };
  }

  // 2. 단원 일정이 없으면 클럽별 end_date를 fallback으로 수집
  if (items.length === 0) {
    for (const club of clubs) {
      if (club.end_date && club.end_date.trim() && !isNaN(new Date(club.end_date).getTime())) {
        const target = new Date(club.end_date.trim());
        const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
        const diffDays = Math.ceil((targetDay - baseDay) / (1000 * 60 * 60 * 24));
        items.push({
          dateStr: club.end_date.trim(),
          clubId: club.id,
          diffDays,
        });
      }
    }
  }

  if (items.length === 0) {
    return { dDay: '상시 토론' };
  }

  // 오늘 이후(diffDays >= 0)인 날짜 중 가장 작은 diffDays(가장 빨리 도래하는 일자) 찾기
  const upcoming = items.filter((d) => d.diffDays >= 0);
  if (upcoming.length > 0) {
    upcoming.sort((a, b) => a.diffDays - b.diffDays);
    const nearest = upcoming[0];
    return {
      dDay: calculateDday(nearest.dateStr, baseDate),
      clubId: nearest.clubId,
      scheduleId: nearest.scheduleId,
    };
  }

  // 만약 모든 미완료 일정이 이미 지난 경우, 가장 최근에 지난 일정 기준 calculateDday 반환 ('종료')
  items.sort((a, b) => b.diffDays - a.diffDays);
  const mostRecent = items[0];
  return {
    dDay: calculateDday(mostRecent.dateStr, baseDate),
    clubId: mostRecent.clubId,
    scheduleId: mostRecent.scheduleId,
  };
}

/**
 * 참여 중인 클럽들의 각 단원별 일정 종료일(target_date) 중 가장 빨리 도래하는 일자를 기준으로 D-day 계산
 * @param clubs 참여 중인 클럽 목록
 * @param baseDate 기준 일자 (기본값: 오늘)
 * @param userId 현재 사용자 ID (작성 여부 판별용)
 */
export function getNearestUpcomingScheduleDday(
  clubs: Array<{
    id?: string;
    end_date?: string | null;
    schedules?: Array<{
      id?: string;
      target_date?: string | null;
      my_review_submitted?: boolean;
      reviews?: Array<{ user_id?: string }>;
    }> | null;
  }>,
  baseDate: Date = new Date(),
  userId?: string | null
): string {
  return getNearestUpcomingSchedule(clubs, baseDate, userId).dDay;
}

export function formatPageRange(rangeStr?: string): string {
  if (!rangeStr) return '';
  const trimmed = rangeStr.trim();
  if (!trimmed) return '';

  // 숫자 패턴 추출 (예: 1-50, p. 10 ~ 45, 12~34)
  const match = trimmed.match(/(\d+)\s*[-~]\s*(\d+)/);
  if (match) {
    return `p.${match[1]} ~ p.${match[2]}`;
  }
  return trimmed.startsWith('p.') ? trimmed : `p.${trimmed}`;
}
