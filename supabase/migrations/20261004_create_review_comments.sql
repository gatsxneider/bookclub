-- ==============================================================================
-- [마이그레이션] Cozy Book Club - 독후감 댓글(review_comments) 테이블 및 RLS 정책
-- ==============================================================================

-- 1. 독후감 댓글 테이블 생성
CREATE TABLE IF NOT EXISTS public.review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. 성능 최적화를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON public.review_comments(review_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_user_id ON public.review_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_created_at ON public.review_comments(created_at ASC);

-- 3. Row Level Security (RLS) 활성화
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;

-- 4. RLS 보안 정책 정의
DROP POLICY IF EXISTS "review_comments_select_policy" ON public.review_comments;
DROP POLICY IF EXISTS "review_comments_insert_policy" ON public.review_comments;
DROP POLICY IF EXISTS "review_comments_update_policy" ON public.review_comments;
DROP POLICY IF EXISTS "review_comments_delete_policy" ON public.review_comments;

-- 조회 정책: 모든 사용자(비로그인 포함)에게 공개
CREATE POLICY "review_comments_select_policy" ON public.review_comments
  FOR SELECT USING (true);

-- 생성 정책: 로그인된 본인만 댓글 작성 가능
CREATE POLICY "review_comments_insert_policy" ON public.review_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 수정 정책: 댓글 작성자 본인만 수정 가능
CREATE POLICY "review_comments_update_policy" ON public.review_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- 삭제 정책: 댓글 작성자 본인 또는 해당 독후감의 작성자만 삭제 가능
CREATE POLICY "review_comments_delete_policy" ON public.review_comments
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.reviews WHERE id = review_comments.review_id AND user_id = auth.uid())
  );
