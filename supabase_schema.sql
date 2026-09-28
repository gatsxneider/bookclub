-- Supabase Schema for Book Club Application (Cozy)

-- 1. profiles table (회원 프로필)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  nickname TEXT NOT NULL DEFAULT '독서가',
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  manner_temperature NUMERIC DEFAULT 36.5,
  role TEXT DEFAULT 'member',
  activity_area TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. books table (도서 정보 캐시)
CREATE TABLE IF NOT EXISTS public.books (
  isbn TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  authors TEXT[] DEFAULT '{}',
  publisher TEXT,
  thumbnail TEXT,
  contents TEXT,
  price NUMERIC DEFAULT 0,
  sale_price NUMERIC DEFAULT 0,
  category TEXT,
  url TEXT,
  status TEXT,
  datetime TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. clubs table (독서 모임)
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id UUID NOT NULL,
  isbn TEXT,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  max_members INTEGER NOT NULL DEFAULT 6,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT clubs_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT clubs_isbn_fkey FOREIGN KEY (isbn) REFERENCES public.books(isbn) ON DELETE SET NULL
);

-- 4. club_members table (모임 멤버)
CREATE TABLE IF NOT EXISTS public.club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT club_members_club_user_unique UNIQUE (club_id, user_id)
);

-- 5. club_schedules table (단원/회차별 독서 일정)
CREATE TABLE IF NOT EXISTS public.club_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  chapter_title TEXT NOT NULL,
  page_range TEXT,
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. reviews table (독후감 및 한 줄 평)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.club_schedules(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  quote TEXT,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_clubs_leader_id ON public.clubs(leader_id);
CREATE INDEX IF NOT EXISTS idx_clubs_isbn ON public.clubs(isbn);
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON public.club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON public.club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_schedules_club_id ON public.club_schedules(club_id);
CREATE INDEX IF NOT EXISTS idx_reviews_club_id ON public.reviews(club_id);
CREATE INDEX IF NOT EXISTS idx_reviews_schedule_id ON public.reviews(schedule_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- RLS (행 수준 보안) 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS 정책 설정
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert profile" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (true);

CREATE POLICY "Books are viewable by everyone" ON public.books FOR SELECT USING (true);
CREATE POLICY "Anyone can insert books" ON public.books FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update books" ON public.books FOR UPDATE USING (true);

CREATE POLICY "Clubs are viewable by everyone" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert clubs" ON public.clubs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update clubs" ON public.clubs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete clubs" ON public.clubs FOR DELETE USING (true);

CREATE POLICY "Club members are viewable by everyone" ON public.club_members FOR SELECT USING (true);
CREATE POLICY "Anyone can insert club members" ON public.club_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update club members" ON public.club_members FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete club members" ON public.club_members FOR DELETE USING (true);

CREATE POLICY "Club schedules are viewable by everyone" ON public.club_schedules FOR SELECT USING (true);
CREATE POLICY "Anyone can insert club schedules" ON public.club_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update club schedules" ON public.club_schedules FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete club schedules" ON public.club_schedules FOR DELETE USING (true);

CREATE POLICY "Public reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update reviews" ON public.reviews FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete reviews" ON public.reviews FOR DELETE USING (true);
