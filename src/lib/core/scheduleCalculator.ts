export function calculateProgress(completedCount: number, totalCount: number): number {
  if (!totalCount || totalCount <= 0) return 0;
  if (!completedCount || completedCount <= 0) return 0;
  const percentage = Math.round((completedCount / totalCount) * 100);
  return Math.min(percentage, 100);
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
