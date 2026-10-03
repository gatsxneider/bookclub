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

// SQL/ilike 와일드카드 이스케이프 함수
export const escapeIlike = (str: string): string => {
  return str.replace(/[%_\\]/g, '\\$&');
};

export const bookPayloadSchema = z.object({
  isbn: z.string().min(1).max(30),
  title: z.string().min(1).max(300),
  authors: z.union([z.array(z.string()), z.string()]).optional(),
  publisher: z.string().max(100).optional(),
  thumbnail: z.string().max(1000).optional(),
  thumbnail_url: z.string().max(1000).optional(),
  contents: z.string().max(5000).optional(),
  price: z.number().optional(),
  sale_price: z.number().optional(),
  category: z.string().max(100).optional(),
  url: z.string().max(1000).optional(),
}).optional();

export const createClubSchema = z.object({
  name: z.string().min(1, '클럽 이름을 입력해주세요').max(100, '클럽 이름은 100자 이내여야 합니다'),
  description: z.string().max(1000, '설명은 1000자 이내여야 합니다').optional(),
  isbn: z.string().min(1, '도서 ISBN이 필요합니다'),
  max_members: z.number().int().min(1, '최소 1명 이상이어야 합니다').max(50, '최대 50명까지 가능합니다').default(10),
  start_date: z.string().optional(),
  end_date: z.string().optional().nullable(),
  book: bookPayloadSchema,
});

export const createScheduleSchema = z.object({
  club_id: z.string().uuid('올바른 클럽 ID가 아닙니다'),
  sequence: z.number().int().min(1, '순번은 1 이상이어야 합니다'),
  chapter_title: z.string().min(1, '단원 제목을 입력해주세요').max(150),
  page_range: z.string().max(50).optional().nullable(),
  target_date: z.string().optional().nullable(),
});

export const updateScheduleSchema = z.object({
  schedule_id: z.string().uuid('올바른 일정 ID가 아닙니다'),
  chapter_title: z.string().min(1, '단원 제목을 입력해주세요').max(150).optional(),
  page_range: z.string().max(50).optional().nullable(),
  target_date: z.string().optional().nullable(),
  sequence: z.number().int().min(1).optional(),
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

export const addMemberSchema = z.object({
  nickname: z.string().min(1).max(50).optional(),
});

export const createMessageSchema = z.object({
  receiver_id: z.string().uuid().optional().nullable(),
  receiver_nickname: z.string().min(1).max(50).optional(),
  title: z.string().min(1, '쪽지 제목을 입력해주세요').max(150, '제목은 150자 이내여야 합니다'),
  content: z.string().min(1, '쪽지 내용을 입력해주세요').max(3000, '내용은 3000자 이내여야 합니다').transform((val) => sanitizeHtml(val)),
  type: z.enum(['general', 'club_join_request', 'club_join_approved', 'club_schedule', 'club_schedule_dday']).default('general'),
  related_club_id: z.string().uuid().optional().nullable(),
  related_schedule_id: z.string().uuid().optional().nullable(),
});

export const messageActionSchema = z.object({
  action: z.enum(['mark_read', 'approve_join', 'reject_join']),
});

export const updateProfileSchema = z.object({
  nickname: z.string().min(2, '닉네임은 2자 이상이어야 합니다').max(20, '닉네임은 20자 이하이어야 합니다').optional(),
  avatar_url: z.string().max(2000000).optional(), // base64 또는 URL
  bio: z.string().max(200).optional(),
});

export const createReviewCommentSchema = z.object({
  review_id: z.string().uuid('올바른 독후감 ID가 아닙니다'),
  content: z
    .string()
    .trim()
    .min(1, '댓글 내용을 입력해주세요')
    .max(500, '댓글은 최대 500자까지 작성할 수 있습니다')
    .transform((val) => sanitizeHtml(val)),
});

