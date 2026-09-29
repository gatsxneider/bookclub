export interface Book {
  isbn: string;
  title: string;
  authors: string[];
  publisher: string;
  thumbnail: string;
  contents: string;
  price?: number;
  sale_price?: number;
  category?: string;
  url?: string;
  status?: string;
  datetime?: string;
}

export interface Profile {
  id: string;
  email?: string;
  nickname: string;
  avatar_url?: string;
  bio?: string;
  manner_temperature?: number;
  completed_count?: number;
  role?: string;
  activity_area?: string;
  created_at?: string;
  updated_at?: string;
}

export type ClubMemberRole = 'leader' | 'member';
export type ClubMemberStatus = 'pending' | 'approved' | 'rejected';

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: ClubMemberRole;
  status: ClubMemberStatus;
  book_rating?: number;
  is_completed?: boolean;
  completed_at?: string;
  joined_at?: string;
  profile?: Profile;
}

export interface UserBookRating {
  id: string;
  user_id: string;
  club_id?: string;
  isbn?: string;
  rating: number;
  is_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClubSchedule {
  id: string;
  club_id: string;
  sequence: number;
  chapter_title: string;
  page_range?: string;
  target_date?: string;
  created_at?: string;
  reviews_count?: number;
  my_review_submitted?: boolean;
  reviews?: Review[];
}

export interface Club {
  id: string;
  leader_id: string;
  isbn?: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'recruiting';
  max_members: number;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  book?: Book;
  leader?: Profile;
  members?: ClubMember[];
  schedules?: ClubSchedule[];
  progress_percentage?: number;
}

export interface Review {
  id: string;
  schedule_id?: string;
  club_id?: string;
  user_id: string;
  title: string;
  content: string;
  quote?: string;
  rating?: number;
  likes_count?: number;
  my_empathy_count?: number;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
  author?: Profile;
  schedule?: ClubSchedule;
  club?: Club;
  book?: Book;
}

export interface ReviewEmpathy {
  id: string;
  review_id: string;
  user_id: string;
  count: number;
  created_at?: string;
  updated_at?: string;
}

