import { z } from 'zod';

// XSS 방지를 위한 경량화된 안전 살균 함수 (Server/Edge/Browser 완벽 호환)
export const sanitizeHtml = (dirty: string): string => {
  if (!dirty) return '';
  // 잠재적 스크립트 실행 태그 및 이벤트 핸들러 제거
  return dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
};

export const createClubSchema = z.object({
  name: z.string().min(1, '클럽 이름을 입력해주세요').max(100, '클럽 이름은 100자 이내여야 합니다'),
  description: z.string().max(1000, '설명은 1000자 이내여야 합니다').optional(),
  isbn: z.string().min(1, '도서 ISBN이 필요합니다'),
  max_members: z.number().int().min(1, '최소 1명 이상이어야 합니다').max(50, '최대 50명까지 가능합니다').default(10),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const createScheduleSchema = z.object({
  club_id: z.string().uuid('올바른 클럽 ID가 아닙니다'),
  sequence: z.number().int().min(1, '순번은 1 이상이어야 합니다'),
  chapter_title: z.string().min(1, '단원 제목을 입력해주세요').max(150),
  page_range: z.string().max(50).optional(),
  target_date: z.string().optional(),
});

export const createReviewSchema = z.object({
  schedule_id: z.string().uuid('올바른 일정 ID가 아닙니다').optional().nullable(),
  club_id: z.string().uuid('올바른 클럽 ID가 아닙니다').optional().nullable(),
  title: z.string().min(1, '제목을 입력해주세요').max(200),
  content: z.string().min(1, '내용을 입력해주세요').transform((val) => sanitizeHtml(val)),
  quote: z.string().max(500).optional().nullable(),
  rating: z.number().int().min(1).max(5).default(5),
  is_public: z.boolean().default(true),
});

export const updateReviewSchema = z.object({
  id: z.string().min(1, '리뷰 ID가 필요합니다'),
  title: z.string().min(1, '제목을 입력해주세요').max(200),
  content: z.string().min(1, '내용을 입력해주세요').transform((val) => sanitizeHtml(val)),
  quote: z.string().max(500).optional().nullable(),
  rating: z.number().int().min(1).max(5).default(5),
  is_public: z.boolean().default(true),
});

export const updateMemberStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
});
