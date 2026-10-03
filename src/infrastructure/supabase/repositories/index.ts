import {
  Book,
  Club,
  ClubMember,
  ClubSchedule,
  Message,
  Profile,
  Review,
  ReviewComment,
  ReviewEmpathy,
} from '@/domain/entities';
import {
  IBookRepository,
  IClubRepository,
  IEmpathyRepository,
  IMemberRepository,
  IMessageRepository,
  IProfileRepository,
  IScheduleRepository,
  IReviewRepository,
  IReviewCommentRepository,
  IUserBookRatingRepository,
} from '@/domain/repositories';
import { createAdminSupabaseClient } from '@/infrastructure/supabase/serverClient';
import { escapeIlike } from '@/application/validation/schemas';
import { INITIAL_MANNER_TEMPERATURE } from '@/domain/rules/mannerTemperature';

export class SupabaseProfileRepository implements IProfileRepository {
  private client = createAdminSupabaseClient();

  async findById(id: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return data as Profile;
  }

  async findByNickname(nickname: string): Promise<Profile | null> {
    const escaped = escapeIlike(nickname.trim());
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .ilike('nickname', escaped)
      .maybeSingle();
    if (error || !data) return null;
    return data as Profile;
  }

  async findByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle();
    if (error || !data) return null;
    return data as Profile;
  }

  async searchByNickname(query: string, limit: number = 10): Promise<Profile[]> {
    const trimmed = query.trim();
    let dbQuery = this.client
      .from('profiles')
      .select('id, nickname, avatar_url, manner_temperature, completed_count, role')
      .limit(limit);

    if (trimmed) {
      const escaped = escapeIlike(trimmed);
      dbQuery = dbQuery.ilike('nickname', `%${escaped}%`);
    }

    const { data, error } = await dbQuery;
    if (error || !data) return [];
    return data as Profile[];
  }

  async create(profile: Partial<Profile> & { id: string; nickname: string }): Promise<Profile> {
    const { data, error } = await this.client
      .from('profiles')
      .insert({
        manner_temperature: INITIAL_MANNER_TEMPERATURE,
        completed_count: 0,
        avatar_url: '/avatars/avatar_cat.png',
        ...profile,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Profile;
  }

  async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await this.client
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Profile;
  }

  async upsert(profile: Partial<Profile> & { id: string }): Promise<Profile> {
    const { data, error } = await this.client
      .from('profiles')
      .upsert({
        manner_temperature: INITIAL_MANNER_TEMPERATURE,
        completed_count: 0,
        avatar_url: '/avatars/avatar_cat.png',
        ...profile,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Profile;
  }
}

export class SupabaseBookRepository implements IBookRepository {
  private client = createAdminSupabaseClient();

  async findByIsbn(isbn: string): Promise<Book | null> {
    const { data, error } = await this.client
      .from('books')
      .select('*')
      .eq('isbn', isbn)
      .maybeSingle();
    if (error || !data) return null;
    return data as Book;
  }

  async upsert(book: Book): Promise<Book> {
    const authors = Array.isArray(book.authors)
      ? book.authors
      : typeof book.authors === 'string'
      ? (book.authors as string).split(',').map((s) => s.trim())
      : [];

    const { data, error } = await this.client
      .from('books')
      .upsert({
        isbn: book.isbn,
        title: book.title,
        authors,
        publisher: book.publisher || '',
        thumbnail: book.thumbnail || '',
        contents: book.contents || '',
        price: book.price || 0,
        sale_price: book.sale_price || 0,
        category: book.category || '',
        url: book.url || '',
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Book;
  }

  async upsertMany(books: Book[]): Promise<void> {
    if (books.length === 0) return;
    const { error } = await this.client.from('books').upsert(books);
    if (error) throw new Error(error.message);
  }
}

export class SupabaseClubRepository implements IClubRepository {
  private client = createAdminSupabaseClient();

  async findAll(): Promise<Club[]> {
    const { data, error } = await this.client
      .from('clubs')
      .select(`
        *,
        book:books (*),
        leader:profiles!clubs_leader_id_fkey (*),
        members:club_members (*, profile:profiles (*)),
        schedules:club_schedules (*, reviews (*))
      `)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map((club: any) => ({
      ...club,
      schedules: (club.schedules || []).map((s: any) => ({
        ...s,
        reviews_count: (s.reviews || []).length,
        reviews: s.reviews || [],
      })),
    })) as Club[];
  }

  async findById(id: string): Promise<Club | null> {
    const { data, error } = await this.client
      .from('clubs')
      .select(`
        *,
        book:books (*),
        leader:profiles!clubs_leader_id_fkey (*),
        members:club_members (*, profile:profiles (*)),
        schedules:club_schedules (*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return data as Club;
  }

  async create(club: {
    leader_id: string;
    isbn: string;
    name: string;
    description?: string;
    max_members: number;
    start_date?: string;
    end_date?: string | null;
  }): Promise<Club> {
    const { data, error } = await this.client
      .from('clubs')
      .insert({
        leader_id: club.leader_id,
        isbn: club.isbn,
        name: club.name,
        description: club.description || '',
        status: 'active',
        max_members: club.max_members,
        start_date: club.start_date || new Date().toISOString().split('T')[0],
        end_date: club.end_date || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Club;
  }

  async update(id: string, updates: Partial<Club>): Promise<Club> {
    const { data, error } = await this.client
      .from('clubs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Club;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('clubs').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}

export class SupabaseMemberRepository implements IMemberRepository {
  private client = createAdminSupabaseClient();

  async findByClubId(clubId: string): Promise<ClubMember[]> {
    const { data, error } = await this.client
      .from('club_members')
      .select('*, profile:profiles (*)')
      .eq('club_id', clubId)
      .order('joined_at', { ascending: true });

    if (error || !data) return [];
    return data as ClubMember[];
  }

  async findMember(clubId: string, userId: string): Promise<ClubMember | null> {
    const { data, error } = await this.client
      .from('club_members')
      .select('*, profile:profiles (*)')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as ClubMember;
  }

  async addMember(data: {
    club_id: string;
    user_id: string;
    role: 'leader' | 'member';
    status: 'pending' | 'approved' | 'rejected';
  }): Promise<ClubMember> {
    const { data: member, error } = await this.client
      .from('club_members')
      .insert(data)
      .select('*, profile:profiles (*)')
      .single();

    if (error) throw new Error(error.message);
    return member as ClubMember;
  }

  async updateStatus(memberId: string, status: 'approved' | 'rejected'): Promise<ClubMember> {
    const { data, error } = await this.client
      .from('club_members')
      .update({ status })
      .eq('id', memberId)
      .select('*, profile:profiles (*)')
      .single();

    if (error) throw new Error(error.message);
    return data as ClubMember;
  }

  async updateCompletion(
    clubId: string,
    userId: string,
    isCompleted: boolean,
    bookRating: number | null
  ): Promise<void> {
    const { error } = await this.client
      .from('club_members')
      .update({
        is_completed: isCompleted,
        book_rating: bookRating,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq('club_id', clubId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }

  async deleteMember(memberId: string): Promise<void> {
    const { error } = await this.client.from('club_members').delete().eq('id', memberId);
    if (error) throw new Error(error.message);
  }
}

export class SupabaseScheduleRepository implements IScheduleRepository {
  private client = createAdminSupabaseClient();

  async findByClubId(clubId: string): Promise<ClubSchedule[]> {
    const { data, error } = await this.client
      .from('club_schedules')
      .select('*, reviews (*)')
      .eq('club_id', clubId)
      .order('sequence', { ascending: true });

    if (error || !data) return [];
    return data as ClubSchedule[];
  }

  async findById(id: string): Promise<ClubSchedule | null> {
    const { data, error } = await this.client
      .from('club_schedules')
      .select('*, reviews (*), club:clubs (*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return data as ClubSchedule;
  }

  async findPastSchedulesForClubs(clubIds: string[], beforeDate: string): Promise<ClubSchedule[]> {
    if (clubIds.length === 0) return [];
    const { data, error } = await this.client
      .from('club_schedules')
      .select('id, club_id, sequence, chapter_title, target_date, club:clubs(id, name)')
      .in('club_id', clubIds)
      .not('target_date', 'is', null)
      .lt('target_date', beforeDate);

    if (error || !data) return [];
    return data as ClubSchedule[];
  }

  async create(data: {
    club_id: string;
    sequence: number;
    chapter_title: string;
    page_range?: string | null;
    target_date?: string | null;
  }): Promise<ClubSchedule> {
    const { data: schedule, error } = await this.client
      .from('club_schedules')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return schedule as ClubSchedule;
  }

  async update(id: string, updates: Partial<ClubSchedule>): Promise<ClubSchedule> {
    const { data, error } = await this.client
      .from('club_schedules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as ClubSchedule;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('club_schedules').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}

export class SupabaseReviewRepository implements IReviewRepository {
  private client = createAdminSupabaseClient();

  async find(filters: {
    club_id?: string;
    schedule_id?: string;
    user_id?: string;
  }): Promise<Review[]> {
    let query = this.client
      .from('reviews')
      .select(`
        *,
        author:profiles (*),
        schedule:club_schedules (*),
        club:clubs (*, book:books (*))
      `)
      .order('created_at', { ascending: false });

    if (filters.club_id) query = query.eq('club_id', filters.club_id);
    if (filters.schedule_id) query = query.eq('schedule_id', filters.schedule_id);
    if (filters.user_id) query = query.eq('user_id', filters.user_id);

    const { data, error } = await query;
    if (error || !data) return [];
    return data as Review[];
  }

  async findById(id: string): Promise<Review | null> {
    const { data, error } = await this.client
      .from('reviews')
      .select(`
        *,
        author:profiles (*),
        schedule:club_schedules (*),
        club:clubs (*, book:books (*))
      `)
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return data as Review;
  }

  async create(data: {
    schedule_id?: string | null;
    club_id?: string | null;
    user_id: string;
    title: string;
    content: string;
    quote?: string | null;
    rating: number;
    is_public: boolean;
  }): Promise<Review> {
    const { data: review, error } = await this.client
      .from('reviews')
      .insert(data)
      .select(`
        *,
        author:profiles (*),
        schedule:club_schedules (*)
      `)
      .single();

    if (error) throw new Error(error.message);
    return review as Review;
  }

  async update(id: string, updates: Partial<Review>): Promise<Review> {
    const { data, error } = await this.client
      .from('reviews')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        author:profiles (*),
        schedule:club_schedules (*)
      `)
      .single();

    if (error) throw new Error(error.message);
    return data as Review;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client.from('reviews').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async getUserReviewsForClub(clubId: string, userId: string): Promise<Review[]> {
    const { data, error } = await this.client
      .from('reviews')
      .select('id, schedule_id, rating')
      .eq('club_id', clubId)
      .eq('user_id', userId);

    if (error || !data) return [];
    return data as Review[];
  }

  async getAllBookRatings(): Promise<Array<{ isbn?: string | null; rating: number }>> {
    const results: Array<{ isbn?: string | null; rating: number }> = [];

    try {
      // 1. reviews 테이블에서 클럽 조인 후 ISBN 및 평점 조회
      const { data: reviewsData } = await this.client
        .from('reviews')
        .select('rating, club:clubs(isbn)');

      if (reviewsData && Array.isArray(reviewsData)) {
        reviewsData.forEach((r: any) => {
          if (typeof r.rating === 'number' && r.rating >= 1 && r.rating <= 5) {
            const isbn = r.club?.isbn;
            if (isbn) {
              results.push({ isbn, rating: r.rating });
            }
          }
        });
      }
    } catch {
      // ignore
    }

    try {
      // 2. user_book_ratings 테이블의 완독/도서 평점 데이터도 병합
      const { data: userRatingsData } = await this.client
        .from('user_book_ratings')
        .select('isbn, rating');

      if (userRatingsData && Array.isArray(userRatingsData)) {
        userRatingsData.forEach((ur: any) => {
          if (typeof ur.rating === 'number' && ur.rating >= 1 && ur.rating <= 5 && ur.isbn) {
            results.push({ isbn: ur.isbn, rating: ur.rating });
          }
        });
      }
    } catch {
      // ignore
    }

    return results;
  }
}

export class SupabaseEmpathyRepository implements IEmpathyRepository {
  private client = createAdminSupabaseClient();

  async findUserEmpathies(reviewIds: string[], userId: string): Promise<Record<string, number>> {
    if (reviewIds.length === 0 || !userId) return {};
    const { data, error } = await this.client
      .from('review_empathies')
      .select('review_id, count')
      .in('review_id', reviewIds)
      .eq('user_id', userId);

    if (error || !data) return {};
    const map: Record<string, number> = {};
    data.forEach((e: any) => {
      map[e.review_id] = e.count;
    });
    return map;
  }

  async getEmpathy(reviewId: string, userId: string): Promise<ReviewEmpathy | null> {
    const { data, error } = await this.client
      .from('review_empathies')
      .select('*')
      .eq('review_id', reviewId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data as ReviewEmpathy;
  }

  async setEmpathyCount(reviewId: string, userId: string, count: number): Promise<void> {
    const { error } = await this.client
      .from('review_empathies')
      .upsert({
        review_id: reviewId,
        user_id: userId,
        count,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'review_id, user_id' });

    if (error) throw new Error(error.message);
  }

  async incrementReviewLikes(reviewId: string, newTotal: number): Promise<void> {
    const { error } = await this.client
      .from('reviews')
      .update({ likes_count: newTotal })
      .eq('id', reviewId);

    if (error) throw new Error(error.message);
  }
}

export class SupabaseReviewCommentRepository implements IReviewCommentRepository {
  private client = createAdminSupabaseClient();

  async findByReviewId(reviewId: string): Promise<ReviewComment[]> {
    const { data, error } = await this.client
      .from('review_comments')
      .select('id, review_id, user_id, content, created_at, updated_at, author:profiles(id, nickname, avatar_url, manner_temperature)')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data as unknown as ReviewComment[];
  }

  async findById(id: string): Promise<ReviewComment | null> {
    const { data, error } = await this.client
      .from('review_comments')
      .select('id, review_id, user_id, content, created_at, updated_at, author:profiles(id, nickname, avatar_url, manner_temperature)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return data as unknown as ReviewComment;
  }

  async create(commentData: { review_id: string; user_id: string; content: string }): Promise<ReviewComment> {
    const { data, error } = await this.client
      .from('review_comments')
      .insert({
        review_id: commentData.review_id,
        user_id: commentData.user_id,
        content: commentData.content,
      })
      .select('id, review_id, user_id, content, created_at, updated_at, author:profiles(id, nickname, avatar_url, manner_temperature)')
      .single();

    if (error) throw new Error(error.message);
    return data as unknown as ReviewComment;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.client
      .from('review_comments')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  async getCommentCounts(reviewIds: string[]): Promise<Record<string, number>> {
    if (reviewIds.length === 0) return {};
    const { data, error } = await this.client
      .from('review_comments')
      .select('review_id')
      .in('review_id', reviewIds);

    if (error || !data) return {};
    const map: Record<string, number> = {};
    data.forEach((c: any) => {
      map[c.review_id] = (map[c.review_id] || 0) + 1;
    });
    return map;
  }

  async countByReviewId(reviewId: string): Promise<number> {
    const { count, error } = await this.client
      .from('review_comments')
      .select('id', { count: 'exact', head: true })
      .eq('review_id', reviewId);

    if (error) return 0;
    return count || 0;
  }
}

export class SupabaseMessageRepository implements IMessageRepository {
  private client = createAdminSupabaseClient();

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.client
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('receiver_deleted', false)
      .eq('is_read', false);

    if (error) return 0;
    return count || 0;
  }

  async getInbox(userId: string): Promise<Message[]> {
    const { data, error } = await this.client
      .from('messages')
      .select(`
        *,
        sender:sender_id (
          id, nickname, avatar_url, manner_temperature, completed_count
        ),
        club:related_club_id (
          id, name, isbn, leader_id, status,
          book:books (*)
        ),
        schedule:related_schedule_id (
          id, sequence, chapter_title, target_date
        )
      `)
      .eq('receiver_id', userId)
      .eq('receiver_deleted', false)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as Message[];
  }

  async getSent(userId: string): Promise<Message[]> {
    const { data, error } = await this.client
      .from('messages')
      .select(`
        *,
        receiver:receiver_id (
          id, nickname, avatar_url, manner_temperature, completed_count
        ),
        club:related_club_id (
          id, name, isbn, leader_id, status,
          book:books (*)
        ),
        schedule:related_schedule_id (
          id, sequence, chapter_title, target_date
        )
      `)
      .eq('sender_id', userId)
      .eq('sender_deleted', false)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as Message[];
  }

  async findById(id: string): Promise<Message | null> {
    const { data, error } = await this.client
      .from('messages')
      .select('*, club:related_club_id (*)')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return data as Message;
  }

  async create(message: {
    sender_id?: string | null;
    receiver_id: string;
    title: string;
    content: string;
    type: Message['type'];
    related_club_id?: string | null;
    related_schedule_id?: string | null;
    action_status?: 'pending' | 'approved' | 'rejected' | null;
  }): Promise<Message> {
    const { data, error } = await this.client
      .from('messages')
      .insert({
        ...message,
        is_read: false,
        sender_deleted: false,
        receiver_deleted: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Message;
  }

  async createMany(messages: Array<{
    sender_id?: string | null;
    receiver_id: string;
    title: string;
    content: string;
    type: Message['type'];
    related_club_id?: string | null;
    related_schedule_id?: string | null;
  }>): Promise<void> {
    if (messages.length === 0) return;
    const { error } = await this.client.from('messages').insert(
      messages.map((m) => ({
        ...m,
        is_read: false,
        sender_deleted: false,
        receiver_deleted: false,
      }))
    );
    if (error) throw new Error(error.message);
  }

  async update(id: string, updates: Partial<Message>): Promise<Message> {
    const { data, error } = await this.client
      .from('messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Message;
  }

  async markAsRead(id: string): Promise<Message> {
    return this.update(id, {
      is_read: true,
      read_at: new Date().toISOString(),
    });
  }

  async deleteForUser(id: string, userId: string, box: 'inbox' | 'sent'): Promise<void> {
    const message = await this.findById(id);
    if (!message) return;

    const updates: Partial<Message> = {};
    if (box === 'inbox' || message.receiver_id === userId) {
      updates.receiver_deleted = true;
    }
    if (box === 'sent' || message.sender_id === userId) {
      updates.sender_deleted = true;
    }

    if (Object.keys(updates).length > 0) {
      await this.update(id, updates);
    }
  }

  async findExistingDdayMessages(userId: string, scheduleIds: string[]): Promise<string[]> {
    if (scheduleIds.length === 0) return [];
    const { data, error } = await this.client
      .from('messages')
      .select('related_schedule_id')
      .eq('receiver_id', userId)
      .eq('type', 'club_schedule_dday')
      .in('related_schedule_id', scheduleIds);

    if (error || !data) return [];
    return data.map((m: any) => m.related_schedule_id).filter(Boolean);
  }
}

export class SupabaseUserBookRatingRepository implements IUserBookRatingRepository {
  private client = createAdminSupabaseClient();

  async upsertRating(data: {
    user_id: string;
    club_id: string;
    isbn?: string | null;
    rating: number | null;
    is_completed: boolean;
  }): Promise<void> {
    const { error } = await this.client
      .from('user_book_ratings')
      .upsert({
        ...data,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id, club_id' });

    if (error) throw new Error(error.message);
  }
}
