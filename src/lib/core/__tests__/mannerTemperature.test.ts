import { describe, it, expect } from 'vitest';
import {
  INITIAL_MANNER_TEMPERATURE,
  MAX_MANNER_TEMPERATURE,
  MIN_MANNER_TEMPERATURE,
  clampMannerTemperature,
  isWithinDeadline,
  calculateNewMannerTemperature,
  applyMissedDeadlinePenalty,
} from '../mannerTemperature';

describe('mannerTemperature Core Module', () => {
  it('초기 매너 온도는 20도여야 한다', () => {
    expect(INITIAL_MANNER_TEMPERATURE).toBe(20.0);
    expect(MAX_MANNER_TEMPERATURE).toBe(100.0);
    expect(MIN_MANNER_TEMPERATURE).toBe(0.0);
  });

  it('기한 내 독후감 작성 시 온도가 2도 올라가고 최대 100도를 넘지 않아야 한다', () => {
    const result1 = calculateNewMannerTemperature(20.0, '2026-10-01', '2026-09-28');
    expect(result1.onTime).toBe(true);
    expect(result1.change).toBe(2.0);
    expect(result1.newTemperature).toBe(22.0);

    const resultMax = calculateNewMannerTemperature(99.0, '2026-10-01', '2026-09-28');
    expect(resultMax.newTemperature).toBe(100.0);
  });

  it('기한 내 미작성 페널티 시 온도가 2도 내려가고 최저 0도 밑으로 떨어지지 않아야 한다', () => {
    const penalty1 = applyMissedDeadlinePenalty(20.0);
    expect(penalty1).toBe(18.0);

    const penaltyMin = applyMissedDeadlinePenalty(1.0);
    expect(penaltyMin).toBe(0.0);
  });

  it('목표일 당일까지는 기한 내 작성으로 판별되어야 한다', () => {
    expect(isWithinDeadline('2026-09-28', '2026-09-28')).toBe(true);
    expect(isWithinDeadline('2026-09-28', '2026-09-29')).toBe(false);
    expect(isWithinDeadline(null, '2026-09-28')).toBe(true);
  });

  it('clampMannerTemperature 함수는 0도와 100도 사이로 제한해야 한다', () => {
    expect(clampMannerTemperature(105)).toBe(100);
    expect(clampMannerTemperature(-5)).toBe(0);
    expect(clampMannerTemperature(36.5)).toBe(36.5);
  });
});
