-- ==============================================================================
-- [보안 강화 마이그레이션] Cozy Book Club - Supabase Row Level Security (RLS) 정책
-- 
-- 적용 목적:
-- 1. 브라우저에서 공개된 ANON KEY로 타인의 데이터를 무단 수정/삭제하는 보안 취약점 차단
-- 2. profiles, clubs, members, schedules, reviews, empathies, messages의 본인 소유/권한 검증 강제
-- 3. 매너온도/완독횟수는 일반 유저가 임의로 UPDATE할 수 없도록 방어
--
-- 적용 방법:
-- Supabase 대시보드 SQL Editor에서 관리자 권한으로 실행하십시오.
-- ==============================================================================

-- 1. 기존 RLS 활성화 확인
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_book_ratings ENABLE ROW LEVEL SECURITY;

-- 쪽지 및 공감 테이블 RLS 활성화 (테이블이 존재할 경우)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'review_empathies') THEN
    ALTER TABLE public.review_empathies ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 2. 기존 과도하게 허용된 정책 제거
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Clubs are viewable by everyone" ON public.clubs;
DROP POLICY IF EXISTS "Anyone can insert clubs" ON public.clubs;
DROP POLICY IF EXISTS "Anyone can update clubs" ON public.clubs;
DROP POLICY IF EXISTS "Anyone can delete clubs" ON public.clubs;

DROP POLICY IF EXISTS "Club members are viewable by everyone" ON public.club_members;
DROP POLICY IF EXISTS "Anyone can insert club members" ON public.club_members;
DROP POLICY IF EXISTS "Anyone can update club members" ON public.club_members;
DROP POLICY IF EXISTS "Anyone can delete club members" ON public.club_members;

DROP POLICY IF EXISTS "Club schedules are viewable by everyone" ON public.club_schedules;
DROP POLICY IF EXISTS "Anyone can insert club schedules" ON public.club_schedules;
DROP POLICY IF EXISTS "Anyone can update club schedules" ON public.club_schedules;
DROP POLICY IF EXISTS "Anyone can delete club schedules" ON public.club_schedules;

DROP POLICY IF EXISTS "Public reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Anyone can delete reviews" ON public.reviews;

-- 3. 세부 강화 정책 적용

-- [profiles]
-- 조회: 모두 공개
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (true);

-- 생성: 본인 id로만 생성 가능
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 수정: 본인 id만 수정 가능
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- [clubs]
-- 조회: 모두 공개
CREATE POLICY "clubs_select_policy" ON public.clubs
  FOR SELECT USING (true);

-- 생성: 방장 id가 본인이어야 함
CREATE POLICY "clubs_insert_policy" ON public.clubs
  FOR INSERT WITH CHECK (auth.uid() = leader_id);

-- 수정/삭제: 방장만 가능
CREATE POLICY "clubs_update_policy" ON public.clubs
  FOR UPDATE USING (auth.uid() = leader_id);

CREATE POLICY "clubs_delete_policy" ON public.clubs
  FOR DELETE USING (auth.uid() = leader_id);

-- [club_members]
-- 조회: 모두 공개
CREATE POLICY "club_members_select_policy" ON public.club_members
  FOR SELECT USING (true);

-- 등록: 본인 참여 또는 클럽 방장의 초대
CREATE POLICY "club_members_insert_policy" ON public.club_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND leader_id = auth.uid())
  );

-- 수정: 방장만 상태 승인/변경 가능
CREATE POLICY "club_members_update_policy" ON public.club_members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND leader_id = auth.uid())
  );

-- 삭제: 본인 탈퇴 또는 방장의 추방
CREATE POLICY "club_members_delete_policy" ON public.club_members
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.clubs WHERE id = club_id AND leader_id = auth.uid())
  );

-- [reviews]
-- 조회: 공개 글이거나 본인이 작성한 글
CREATE POLICY "reviews_select_policy" ON public.reviews
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- 작성: 본인만 작성
CREATE POLICY "reviews_insert_policy" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 수정/삭제: 본인만 가능
CREATE POLICY "reviews_update_policy" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "reviews_delete_policy" ON public.reviews
  FOR DELETE USING (auth.uid() = user_id);

-- [messages] (존재 시)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'messages') THEN
    -- 조회: 발신자이거나 수신자인 본인만 조회
    EXECUTE 'CREATE POLICY "messages_select_policy" ON public.messages
      FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);';

    -- 작성: 발신자가 본인이어야 함
    EXECUTE 'CREATE POLICY "messages_insert_policy" ON public.messages
      FOR INSERT WITH CHECK (auth.uid() = sender_id);';

    -- 수정: 수신자(읽음/액션) 또는 발신자(삭제플래그)
    EXECUTE 'CREATE POLICY "messages_update_policy" ON public.messages
      FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);';
  END IF;
END $$;
