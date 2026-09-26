import { describe, it, expect } from 'vitest';
import { calculateProgress, calculateDday, formatPageRange } from '../scheduleCalculator';

describe('scheduleCalculator', () => {
  it('총 일정과 완료된 일정을 바탕으로 진행률 퍼센티지를 정확히 계산해야 한다', () => {
    expect(calculateProgress(0, 5)).toBe(0);
    expect(calculateProgress(2, 5)).toBe(40);
    expect(calculateProgress(4, 5)).toBe(80);
    expect(calculateProgress(5, 5)).toBe(100);
    expect(calculateProgress(0, 0)).toBe(0);
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
