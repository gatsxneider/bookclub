import { describe, it, expect, beforeEach } from 'vitest';
import { ReviewCommentUseCases } from '../ReviewCommentUseCases';
import { ForbiddenError, NotFoundError, ValidationError } from '@/application/errors';
import { Profile, Review, ReviewComment } from '@/domain/entities';
import {
  IProfileRepository,
  IReviewCommentRepository,
  IReviewRepository,
} from '@/domain/repositories';

class MockReviewCommentRepo implements Partial<IReviewCommentRepository> {
  public comments: ReviewComment[] = [];

  async findByReviewId(reviewId: string): Promise<ReviewComment[]> {
    return this.comments.filter((c) => c.review_id === reviewId);
  }

  async findById(id: string): Promise<ReviewComment | null> {
    return this.comments.find((c) => c.id === id) || null;
  }

  async create(data: { review_id: string; user_id: string; content: string }): Promise<ReviewComment> {
    const comment: ReviewComment = {
      id: `comment-${this.comments.length + 1}`,
      review_id: data.review_id,
      user_id: data.user_id,
      content: data.content,
      created_at: new Date().toISOString(),
    };
    this.comments.push(comment);
    return comment;
  }

  async delete(id: string): Promise<void> {
    this.comments = this.comments.filter((c) => c.id !== id);
  }

  async getCommentCounts(reviewIds: string[]): Promise<Record<string, number>> {
    const map: Record<string, number> = {};
    this.comments.forEach((c) => {
      if (reviewIds.includes(c.review_id)) {
        map[c.review_id] = (map[c.review_id] || 0) + 1;
      }
    });
    return map;
  }
}

class MockReviewRepo implements Partial<IReviewRepository> {
  public reviews: Review[] = [];

  async findById(id: string): Promise<Review | null> {
    return this.reviews.find((r) => r.id === id) || null;
  }
}

class MockProfileRepo implements Partial<IProfileRepository> {
  public profiles: Profile[] = [];

  async findById(id: string): Promise<Profile | null> {
    return this.profiles.find((p) => p.id === id) || null;
  }

  async create(profile: any): Promise<Profile> {
    const newProf = { ...profile, nickname: profile.nickname || '독서가' };
    this.profiles.push(newProf);
    return newProf;
  }
}

describe('ReviewCommentUseCases', () => {
  let commentRepo: MockReviewCommentRepo;
  let reviewRepo: MockReviewRepo;
  let profileRepo: MockProfileRepo;
  let useCases: ReviewCommentUseCases;

  beforeEach(() => {
    commentRepo = new MockReviewCommentRepo();
    reviewRepo = new MockReviewRepo();
    profileRepo = new MockProfileRepo();
    useCases = new ReviewCommentUseCases(
      commentRepo as unknown as IReviewCommentRepository,
      reviewRepo as unknown as IReviewRepository,
      profileRepo as unknown as IProfileRepository
    );

    // 샘플 독후감 생성
    reviewRepo.reviews = [
      {
        id: 'rev-1',
        user_id: 'user-author',
        title: '멋진 책 후기',
        content: '인상 깊은 구절이 많았습니다.',
        is_public: true,
      },
      {
        id: 'rev-private',
        user_id: 'user-author',
        title: '나만의 비밀 독후감',
        content: '나만 볼 수 있는 글',
        is_public: false,
      },
    ];

    // 프로필 등록
    profileRepo.profiles = [
      {
        id: 'user-author',
        nickname: '독후감작성자',
        manner_temperature: 36.5,
      },
      {
        id: 'user-commenter',
        nickname: '댓글러',
        manner_temperature: 37.0,
      },
      {
        id: 'user-stranger',
        nickname: '제3자',
        manner_temperature: 36.5,
      },
    ];
  });

  describe('createComment', () => {
    it('유효한 독후감에 정상적으로 댓글을 작성할 수 있다', async () => {
      const comment = await useCases.createComment('user-commenter', {
        review_id: 'rev-1',
        content: '공감되는 글이네요! 잘 읽었습니다.',
      });

      expect(comment).toBeDefined();
      expect(comment.content).toBe('공감되는 글이네요! 잘 읽었습니다.');
      expect(comment.author?.nickname).toBe('댓글러');
      expect(commentRepo.comments.length).toBe(1);
    });

    it('내용이 비어있으면 ValidationError가 발생한다', async () => {
      await expect(
        useCases.createComment('user-commenter', {
          review_id: 'rev-1',
          content: '   ',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('존재하지 않는 독후감에 작성 시 NotFoundError가 발생한다', async () => {
      await expect(
        useCases.createComment('user-commenter', {
          review_id: 'non-existent',
          content: '존재하지 않는 글 댓글',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('비공개 독후감에 타인이 댓글 작성 시 ForbiddenError가 발생한다', async () => {
      await expect(
        useCases.createComment('user-commenter', {
          review_id: 'rev-private',
          content: '비공개 글에 침입 시도',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('비공개 독후감이라도 작성자 본인은 댓글을 작성할 수 있다', async () => {
      const comment = await useCases.createComment('user-author', {
        review_id: 'rev-private',
        content: '내 비밀 글에 추가 메모 남기기',
      });
      expect(comment).toBeDefined();
      expect(comment.user_id).toBe('user-author');
    });
  });

  describe('deleteComment', () => {
    beforeEach(async () => {
      // 사전 댓글 1개 추가
      await useCases.createComment('user-commenter', {
        review_id: 'rev-1',
        content: '삭제 테스트용 댓글',
      });
    });

    it('댓글 작성자 본인은 댓글을 삭제할 수 있다', async () => {
      const commentId = commentRepo.comments[0].id;
      await useCases.deleteComment('user-commenter', commentId);
      expect(commentRepo.comments.length).toBe(0);
    });

    it('독후감 작성자는 본인 글에 달린 타인의 댓글을 삭제할 수 있다', async () => {
      const commentId = commentRepo.comments[0].id;
      await useCases.deleteComment('user-author', commentId);
      expect(commentRepo.comments.length).toBe(0);
    });

    it('권한이 없는 제3자는 댓글을 삭제할 수 없으며 ForbiddenError가 발생한다', async () => {
      const commentId = commentRepo.comments[0].id;
      await expect(useCases.deleteComment('user-stranger', commentId)).rejects.toThrow(
        ForbiddenError
      );
      expect(commentRepo.comments.length).toBe(1);
    });

    it('존재하지 않는 댓글 삭제 시 NotFoundError가 발생한다', async () => {
      await expect(useCases.deleteComment('user-commenter', 'non-existent')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('getCommentsByReviewId', () => {
    it('공개 독후감의 댓글 목록을 조회할 수 있다', async () => {
      await useCases.createComment('user-commenter', {
        review_id: 'rev-1',
        content: '첫 번째 댓글',
      });
      await useCases.createComment('user-author', {
        review_id: 'rev-1',
        content: '두 번째 댓글 (답글)',
      });

      const comments = await useCases.getCommentsByReviewId('rev-1', null);
      expect(comments.length).toBe(2);
    });

    it('비공개 독후감의 댓글은 비로그인자 또는 타인 조회 시 ForbiddenError가 발생한다', async () => {
      await expect(useCases.getCommentsByReviewId('rev-private', null)).rejects.toThrow(
        ForbiddenError
      );
      await expect(
        useCases.getCommentsByReviewId('rev-private', 'user-stranger')
      ).rejects.toThrow(ForbiddenError);
    });

    it('비공개 독후감의 댓글은 작성자 본인이면 조회할 수 있다', async () => {
      const comments = await useCases.getCommentsByReviewId('rev-private', 'user-author');
      expect(comments).toEqual([]);
    });
  });
});
