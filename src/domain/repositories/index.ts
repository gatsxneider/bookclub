import {
  Book,
  Club,
  ClubMember,
  ClubSchedule,
  Message,
  Profile,
  Review,
  ReviewEmpathy,
  UserBookRating,
} from '../entities';

export interface IProfileRepository {
  findById(id: string): Promise<Profile | null>;
  findByNickname(nickname: string): Promise<Profile | null>;
  findByEmail(email: string): Promise<Profile | null>;
  searchByNickname(query: string, limit?: number): Promise<Profile[]>;
  create(profile: Partial<Profile> & { id: string; nickname: string }): Promise<Profile>;
  update(id: string, updates: Partial<Profile>): Promise<Profile>;
  upsert(profile: Partial<Profile> & { id: string }): Promise<Profile>;
}

export interface IBookRepository {
  findByIsbn(isbn: string): Promise<Book | null>;
  upsert(book: Book): Promise<Book>;
  upsertMany(books: Book[]): Promise<void>;
}

export interface IClubRepository {
  findAll(): Promise<Club[]>;
  findById(id: string): Promise<Club | null>;
  create(club: {
    leader_id: string;
    isbn: string;
    name: string;
    description?: string;
    max_members: number;
    start_date?: string;
    end_date?: string | null;
  }): Promise<Club>;
  update(id: string, updates: Partial<Club>): Promise<Club>;
  delete(id: string): Promise<void>;
}

export interface IMemberRepository {
  findByClubId(clubId: string): Promise<ClubMember[]>;
  findMember(clubId: string, userId: string): Promise<ClubMember | null>;
  addMember(data: {
    club_id: string;
    user_id: string;
    role: 'leader' | 'member';
    status: 'pending' | 'approved' | 'rejected';
  }): Promise<ClubMember>;
  updateStatus(memberId: string, status: 'approved' | 'rejected'): Promise<ClubMember>;
  updateCompletion(clubId: string, userId: string, isCompleted: boolean, bookRating: number | null): Promise<void>;
  deleteMember(memberId: string): Promise<void>;
}

export interface IScheduleRepository {
  findByClubId(clubId: string): Promise<ClubSchedule[]>;
  findById(id: string): Promise<ClubSchedule | null>;
  findPastSchedulesForClubs(clubIds: string[], beforeDate: string): Promise<ClubSchedule[]>;
  create(data: {
    club_id: string;
    sequence: number;
    chapter_title: string;
    page_range?: string | null;
    target_date?: string | null;
  }): Promise<ClubSchedule>;
  update(id: string, updates: Partial<ClubSchedule>): Promise<ClubSchedule>;
  delete(id: string): Promise<void>;
}

export interface IReviewRepository {
  find(filters: {
    club_id?: string;
    schedule_id?: string;
    user_id?: string;
  }): Promise<Review[]>;
  findById(id: string): Promise<Review | null>;
  create(data: {
    schedule_id?: string | null;
    club_id?: string | null;
    user_id: string;
    title: string;
    content: string;
    quote?: string | null;
    rating: number;
    is_public: boolean;
  }): Promise<Review>;
  update(id: string, updates: Partial<Review>): Promise<Review>;
  delete(id: string): Promise<void>;
  getUserReviewsForClub(clubId: string, userId: string): Promise<Review[]>;
}

export interface IEmpathyRepository {
  findUserEmpathies(reviewIds: string[], userId: string): Promise<Record<string, number>>;
  getEmpathy(reviewId: string, userId: string): Promise<ReviewEmpathy | null>;
  setEmpathyCount(reviewId: string, userId: string, count: number): Promise<void>;
  incrementReviewLikes(reviewId: string, newTotal: number): Promise<void>;
}

export interface IMessageRepository {
  getUnreadCount(userId: string): Promise<number>;
  getInbox(userId: string): Promise<Message[]>;
  getSent(userId: string): Promise<Message[]>;
  findById(id: string): Promise<Message | null>;
  create(message: {
    sender_id?: string | null;
    receiver_id: string;
    title: string;
    content: string;
    type: Message['type'];
    related_club_id?: string | null;
    related_schedule_id?: string | null;
    action_status?: 'pending' | 'approved' | 'rejected' | null;
  }): Promise<Message>;
  createMany(messages: Array<{
    sender_id?: string | null;
    receiver_id: string;
    title: string;
    content: string;
    type: Message['type'];
    related_club_id?: string | null;
    related_schedule_id?: string | null;
  }>): Promise<void>;
  update(id: string, updates: Partial<Message>): Promise<Message>;
  markAsRead(id: string): Promise<Message>;
  deleteForUser(id: string, userId: string, box: 'inbox' | 'sent'): Promise<void>;
  findExistingDdayMessages(userId: string, scheduleIds: string[]): Promise<string[]>;
}

export interface IUserBookRatingRepository {
  upsertRating(data: {
    user_id: string;
    club_id: string;
    isbn?: string | null;
    rating: number | null;
    is_completed: boolean;
  }): Promise<void>;
}

export interface IBookSearchGateway {
  search(query: string): Promise<{ documents: Book[]; total_count: number; source: string }>;
}
