import {
  IProfileRepository,
  IReviewCommentRepository,
  IReviewRepository,
} from '@/domain/repositories';
import { ReviewComment } from '@/domain/entities';
import { ForbiddenError, NotFoundError, ValidationError } from '@/application/errors';
import { INITIAL_MANNER_TEMPERATURE } from '@/domain/rules/mannerTemperature';

export class ReviewCommentUseCases {
  constructor(
    private commentRepo: IReviewCommentRepository,
    private reviewRepo: IReviewRepository,
    private profileRepo: IProfileRepository
  ) {}

  async getCommentsByReviewId(
    reviewId: string,
    viewerId?: string | null
  ): Promise<ReviewComment[]> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) {
      throw new NotFoundError('독후감을 찾을 수 없습니다.');
    }

    // 비공개 독후감인 경우 작성자 본인만 댓글 조회 가능
    if (!review.is_public && (!viewerId || review.user_id !== viewerId)) {
      throw new ForbiddenError('비공개 독후감의 댓글은 작성자만 조회할 수 있습니다.');
    }

    return this.commentRepo.findByReviewId(reviewId);
  }

  async createComment(
    userId: string,
    params: {
      review_id: string;
      content: string;
    }
  ): Promise<ReviewComment> {
    const trimmedContent = params.content?.trim();
    if (!trimmedContent) {
      throw new ValidationError('댓글 내용을 입력해주세요.');
    }
    if (trimmedContent.length > 500) {
      throw new ValidationError('댓글은 최대 500자까지 작성할 수 있습니다.');
    }

    const review = await this.reviewRepo.findById(params.review_id);
    if (!review) {
      throw new NotFoundError('댓글을 작성할 독후감을 찾을 수 없습니다.');
    }

    // 비공개 독후감인 경우 작성자 본인만 댓글 작성 가능
    if (!review.is_public && review.user_id !== userId) {
      throw new ForbiddenError('비공개 독후감에는 작성자만 댓글을 남길 수 있습니다.');
    }

    // 작성자 프로필 확인 및 없으면 생성
    let profile = await this.profileRepo.findById(userId);
    if (!profile) {
      profile = await this.profileRepo.create({
        id: userId,
        nickname: '독서가',
        manner_temperature: INITIAL_MANNER_TEMPERATURE,
        completed_count: 0,
      });
    }

    const comment = await this.commentRepo.create({
      review_id: params.review_id,
      user_id: userId,
      content: trimmedContent,
    });

    return {
      ...comment,
      author: profile,
    };
  }

  async deleteComment(userId: string, commentId: string): Promise<void> {
    const comment = await this.commentRepo.findById(commentId);
    if (!comment) {
      throw new NotFoundError('삭제할 댓글을 찾을 수 없습니다.');
    }

    const review = await this.reviewRepo.findById(comment.review_id);

    // 댓글 작성자 본인이거나 해당 독후감 작성자만 삭제 가능
    const isCommentAuthor = comment.user_id === userId;
    const isReviewAuthor = review && review.user_id === userId;

    if (!isCommentAuthor && !isReviewAuthor) {
      throw new ForbiddenError('댓글을 삭제할 권한이 없습니다.');
    }

    await this.commentRepo.delete(commentId);
  }
}
