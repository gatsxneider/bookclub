/**
 * 독후감 공감하기(Empathy) 비즈니스 로직 및 제약조건
 */

export const MAX_EMPATHY_COUNT = 5;

export type EmpathyCheckResult =
  | { allowed: true }
  | { allowed: false; reason: 'login_required' | 'self_review' | 'max_reached' | 'invalid_input' };

/**
 * 공감하기 버튼 활성화 및 클릭 가능 여부 검증
 * @param authorId 독후감 작성자 ID
 * @param currentUserId 현재 로그인한 사용자 ID
 * @param currentEmpathyCount 사용자가 이 독후감에 대해 누른 기존 공감 횟수 (0~5)
 */
export function checkCanEmpathize(
  authorId: string | undefined | null,
  currentUserId: string | undefined | null,
  currentEmpathyCount: number = 0
): EmpathyCheckResult {
  if (!currentUserId) {
    return { allowed: false, reason: 'login_required' };
  }

  if (!authorId) {
    return { allowed: false, reason: 'invalid_input' };
  }

  // 본인의 글에는 공감할 수 없음
  if (authorId === currentUserId) {
    return { allowed: false, reason: 'self_review' };
  }

  // 1인당 최대 5회까지만 공감 가능
  if (currentEmpathyCount >= MAX_EMPATHY_COUNT) {
    return { allowed: false, reason: 'max_reached' };
  }

  return { allowed: true };
}

/**
 * 다음 공감 횟수 계산
 */
export function calculateNextEmpathyCount(currentEmpathyCount: number = 0): number {
  if (currentEmpathyCount >= MAX_EMPATHY_COUNT) {
    return MAX_EMPATHY_COUNT;
  }
  return Math.max(1, currentEmpathyCount + 1);
}
