/**
 * 매너 온도 계산 및 관리 모듈
 * - 기본 시작 온도: 20.0℃
 * - 최고 온도: 100.0℃
 * - 최저 온도: 0.0℃
 * - 독후감 기한 내 작성 시: +2.0℃ (최대 100℃)
 * - 기한 내 미작성 시: -2.0℃ (최저 0℃)
 */

export const INITIAL_MANNER_TEMPERATURE = 20.0;
export const MAX_MANNER_TEMPERATURE = 100.0;
export const MIN_MANNER_TEMPERATURE = 0.0;
export const TEMP_CHANGE_STEP = 2.0;

/**
 * 주어진 온도를 0℃ ~ 100℃ 범위 내로 클램핑(Clamping)
 */
export function clampMannerTemperature(temperature: number): number {
  const rounded = Math.round(temperature * 10) / 10;
  return Math.min(MAX_MANNER_TEMPERATURE, Math.max(MIN_MANNER_TEMPERATURE, rounded));
}

/**
 * 작성일과 목표 마감일을 비교하여 기한 내 작성 여부 판별
 * @param targetDateStr YYYY-MM-DD 형식의 단원 목표일
 * @param submitDateStr YYYY-MM-DD 형식의 실제 제출일 (기본: 오늘)
 */
export function isWithinDeadline(targetDateStr?: string | null, submitDateStr?: string): boolean {
  if (!targetDateStr) return true; // 별도 목표일이 없으면 기한 내로 인정
  
  const target = new Date(targetDateStr);
  const submit = submitDateStr ? new Date(submitDateStr) : new Date();

  // 시간 제외하고 날짜만 비교 (targetDate 당일 23:59:59까지 유효)
  target.setHours(23, 59, 59, 999);
  return submit.getTime() <= target.getTime();
}

/**
 * 독후감 작성 시 매너온도 변화량 계산
 * @param currentTemp 현재 매너온도
 * @param targetDate 단원 독서 마감일
 * @param submitDate 실제 제출일
 */
export function calculateNewMannerTemperature(
  currentTemp: number = INITIAL_MANNER_TEMPERATURE,
  targetDate?: string | null,
  submitDate?: string
): { newTemperature: number; change: number; onTime: boolean } {
  const onTime = isWithinDeadline(targetDate, submitDate);
  const change = onTime ? TEMP_CHANGE_STEP : 0; // 기한 내 작성 시 +2도
  const newTemperature = clampMannerTemperature(currentTemp + change);

  return {
    newTemperature,
    change,
    onTime,
  };
}

/**
 * 기한 내 미작성 시 페널티 적용 계산 (-2℃)
 */
export function applyMissedDeadlinePenalty(
  currentTemp: number = INITIAL_MANNER_TEMPERATURE
): number {
  return clampMannerTemperature(currentTemp - TEMP_CHANGE_STEP);
}

/**
 * 완독 횟수에 따른 독서 레벨 계산 (1~5)
 * - 1회: Lv.1 씨앗 독서가
 * - 2회: Lv.2 새싹 독서가
 * - 3회: Lv.3 나무 독서가
 * - 4회: Lv.4 숲속 독서가
 * - 5회 이상: Lv.5 마스터 독서가 (최고 레벨 👑)
 */
export function calculateUserLevel(completedCount: number = 1): number {
  return Math.min(5, Math.max(1, completedCount || 1));
}

