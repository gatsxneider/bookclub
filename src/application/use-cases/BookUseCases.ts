import { IBookRepository, IBookSearchGateway } from '@/domain/repositories';
import { Book } from '@/domain/entities';
import { UnauthorizedError } from '@/application/errors';

export class BookUseCases {
  constructor(
    private bookRepo: IBookRepository,
    private bookSearchGateway: IBookSearchGateway
  ) {}

  async searchBooks(query: string): Promise<{ documents: Book[]; total_count: number; source: string }> {
    return this.bookSearchGateway.search(query);
  }

  async runCronUpdate(authHeader: string | null): Promise<{ totalCount: number; updatedAt: string }> {
    const cronSecret = process.env.CRON_SECRET;
    // 보안: CRON_SECRET이 설정되어 있지 않거나 토큰이 불일치하면 거부
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      throw new UnauthorizedError('Unauthorized: Invalid or missing CRON_SECRET token');
    }

    // 12개 카테고리별 큐레이션 도서 업데이트 작업 (간소화)
    return {
      totalCount: 0,
      updatedAt: new Date().toISOString(),
    };
  }
}
