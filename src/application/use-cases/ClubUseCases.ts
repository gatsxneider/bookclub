import {
  IBookRepository,
  IClubRepository,
  IMemberRepository,
  IProfileRepository,
} from '@/domain/repositories';
import { Club } from '@/domain/entities';
import { normalizeKakaoBook } from '@/domain/rules/bookSearch';
import curatedData from '@/shared/data/curatedBooks.json';
import { INITIAL_MANNER_TEMPERATURE } from '@/domain/rules/mannerTemperature';
import { NotFoundError, ValidationError } from '@/application/errors';
import { sanitizeHtml } from '@/application/validation/schemas';

export class ClubUseCases {
  constructor(
    private clubRepo: IClubRepository,
    private bookRepo: IBookRepository,
    private profileRepo: IProfileRepository,
    private memberRepo: IMemberRepository
  ) {}

  async getAllClubs(): Promise<Club[]> {
    return this.clubRepo.findAll();
  }

  async getClubById(id: string): Promise<Club> {
    const club = await this.clubRepo.findById(id);
    if (!club) {
      throw new NotFoundError('독서클럽을 찾을 수 없습니다.');
    }
    return club;
  }

  async createClub(
    leaderId: string,
    params: {
      name: string;
      description?: string;
      isbn: string;
      max_members: number;
      start_date?: string;
      end_date?: string | null;
      book?: any;
    }
  ): Promise<Club> {
    const name = sanitizeHtml(params.name.trim());
    if (!name) {
      throw new ValidationError('클럽 이름을 입력해주세요.');
    }

    // 1. 도서 정보 upsert
    let bookData = params.book;
    if (!bookData) {
      Object.values(curatedData).forEach((list: any[]) => {
        const found = list.find((b: any) => (b.isbn || '').includes(params.isbn));
        if (found) bookData = normalizeKakaoBook(found);
      });
    }

    if (bookData) {
      const normalized = normalizeKakaoBook(bookData);
      await this.bookRepo.upsert(normalized);
    }

    // 2. 방장 프로필 없으면 기본 생성
    const profile = await this.profileRepo.findById(leaderId);
    if (!profile) {
      await this.profileRepo.create({
        id: leaderId,
        nickname: '달빛책방지기',
        manner_temperature: INITIAL_MANNER_TEMPERATURE,
        completed_count: 1,
      });
    }

    // 3. 클럽 생성
    const newClub = await this.clubRepo.create({
      leader_id: leaderId,
      isbn: params.isbn,
      name,
      description: params.description ? sanitizeHtml(params.description) : '',
      max_members: params.max_members || 10,
      start_date: params.start_date || new Date().toISOString().split('T')[0],
      end_date: params.end_date || null,
    });

    // 4. 방장 승인 멤버 등록
    await this.memberRepo.addMember({
      club_id: newClub.id,
      user_id: leaderId,
      role: 'leader',
      status: 'approved',
    });

    return newClub;
  }
}
