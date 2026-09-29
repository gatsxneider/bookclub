import {
  MAX_EMPATHY_COUNT,
  checkCanEmpathize,
  calculateNextEmpathyCount,
} from '../empathy';

describe('Empathy Core Logic', () => {
  const authorId = 'user-author-1';
  const otherUserId = 'user-reader-2';

  test('비로그인 사용자는 공감할 수 없음 (login_required)', () => {
    const result = checkCanEmpathize(authorId, null, 0);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe('login_required');
    }
  });

  test('본인이 작성한 독후감에는 공감할 수 없음 (self_review)', () => {
    const result = checkCanEmpathize(authorId, authorId, 0);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe('self_review');
    }
  });

  test('다른 사람의 독후감에는 5회 미만일 때 공감 가능', () => {
    for (let count = 0; count < 5; count++) {
      const result = checkCanEmpathize(authorId, otherUserId, count);
      expect(result.allowed).toBe(true);
    }
  });

  test('5회 이상 공감 시 더 이상 공감할 수 없음 (max_reached)', () => {
    const result = checkCanEmpathize(authorId, otherUserId, 5);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe('max_reached');
    }

    const overResult = checkCanEmpathize(authorId, otherUserId, 6);
    expect(overResult.allowed).toBe(false);
  });

  test('다음 공감 횟수 계산 시 5를 초과하지 않음', () => {
    expect(calculateNextEmpathyCount(0)).toBe(1);
    expect(calculateNextEmpathyCount(1)).toBe(2);
    expect(calculateNextEmpathyCount(4)).toBe(5);
    expect(calculateNextEmpathyCount(5)).toBe(5);
  });
});
