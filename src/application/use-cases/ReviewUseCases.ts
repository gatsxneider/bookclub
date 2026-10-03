import {
  IClubRepository,
  IEmpathyRepository,
  IMemberRepository,
  IProfileRepository,
  IReviewRepository,
  IScheduleRepository,
  IUserBookRatingRepository,
} from '@/domain/repositories';
import { Review } from '@/domain/entities';
import {
  calculateNewMannerTemperature,
  calculateUserLevel,
  INITIAL_MANNER_TEMPERATURE,
} from '@/domain/rules/mannerTemperature';
import { checkCanEmpathize, MAX_EMPATHY_COUNT } from '@/domain/rules/empathy';
import { calculateBookRatings, BookRatingSummary } from '@/domain/rules/bookRating';
import { ForbiddenError, NotFoundError, ValidationError } from '@/application/errors';

export class ReviewUseCases {
  constructor(
    private reviewRepo: IReviewRepository,
    private profileRepo: IProfileRepository,
    private scheduleRepo: IScheduleRepository,
    private clubRepo: IClubRepository,
    private memberRepo: IMemberRepository,
    private empathyRepo: IEmpathyRepository,
    private userBookRatingRepo: IUserBookRatingRepository
  ) {}

  async getBookRatings(): Promise<Record<string, BookRatingSummary>> {
    const rawRatings = await this.reviewRepo.getAllBookRatings();
    return calculateBookRatings(rawRatings);
  }

  async getReviews(
    filters: { club_id?: string; schedule_id?: string; user_id?: string },
    viewerId?: string | null
  ): Promise<Review[]> {
    const rawReviews = await this.reviewRepo.find(filters);

    // 비공개 리뷰 필터링: 작성자 본인이 아닌 경우 비공개 리뷰 제외
    const visibleReviews = rawReviews.filter((r) => {
      if (r.is_public) return true;
      return viewerId && r.user_id === viewerId;
    });

    if (visibleReviews.length === 0) return [];

    let userEmpathiesMap: Record<string, number> = {};
    if (viewerId) {
      const reviewIds = visibleReviews.map((r) => r.id);
      userEmpathiesMap = await this.empathyRepo.findUserEmpathies(reviewIds, viewerId);
    }

    return visibleReviews.map((rev) => {
      const isMyReview = Boolean(viewerId && rev.user_id === viewerId);
      return {
        ...rev,
        my_empathy_count: userEmpathiesMap[rev.id] || 0,
        likes_count: isMyReview ? rev.likes_count || 0 : undefined,
      };
    });
  }

  async createReview(
    userId: string,
    params: {
      schedule_id?: string | null;
      club_id?: string | null;
      title: string;
      content: string;
      quote?: string | null;
      rating: number;
      is_public: boolean;
    }
  ): Promise<{
    review: Review;
    manner_temperature: number;
    temp_change: number;
    is_club_completed: boolean;
    book_rating: number | null;
    completed_count: number;
    level: number;
  }> {
    // 1. 프로필 없으면 기본 생성
    let profile = await this.profileRepo.findById(userId);
    if (!profile) {
      profile = await this.profileRepo.create({
        id: userId,
        nickname: '독서가',
        manner_temperature: INITIAL_MANNER_TEMPERATURE,
        completed_count: 0,
      });
    }

    let currentTemp = profile.manner_temperature != null
      ? Number(profile.manner_temperature)
      : INITIAL_MANNER_TEMPERATURE;

    // 2. 단원 목표일 확인 및 매너온도 계산
    let targetDate: string | null = null;
    if (params.schedule_id) {
      const schedule = await this.scheduleRepo.findById(params.schedule_id);
      if (schedule) {
        targetDate = schedule.target_date || null;
      }
    }

    const { newTemperature, change } = calculateNewMannerTemperature(currentTemp, targetDate);

    if (change > 0) {
      await this.profileRepo.update(userId, {
        manner_temperature: newTemperature,
      });
    }

    // 3. 독후감 저장
    const review = await this.reviewRepo.create({
      schedule_id: params.schedule_id || null,
      club_id: params.club_id || null,
      user_id: userId,
      title: params.title,
      content: params.content,
      quote: params.quote || null,
      rating: params.rating,
      is_public: params.is_public,
    });

    // 4. 클럽 완독 여부 및 평점 집계
    let isClubCompleted = false;
    let newCompletedCount = profile.completed_count != null ? Number(profile.completed_count) : 0;
    let newLevel = calculateUserLevel(newCompletedCount);
    let bookRating: number | null = null;

    if (params.club_id) {
      const allSchedules = await this.scheduleRepo.findByClubId(params.club_id);
      if (allSchedules && allSchedules.length > 0) {
        const userReviews = await this.reviewRepo.getUserReviewsForClub(params.club_id, userId);

        const reviewedScheduleIds = new Set(
          userReviews.map((r) => r.schedule_id).filter(Boolean)
        );
        if (params.schedule_id) {
          reviewedScheduleIds.add(params.schedule_id);
        }

        const allFinished = allSchedules.every((s) => reviewedScheduleIds.has(s.id));
        if (allFinished) {
          isClubCompleted = true;
          const currentMember = await this.memberRepo.findMember(params.club_id, userId);
          const wasAlreadyCompleted = currentMember?.is_completed;
          if (!wasAlreadyCompleted) {
            newCompletedCount = (profile.completed_count != null ? Number(profile.completed_count) : 0) + 1;
            newLevel = calculateUserLevel(newCompletedCount);

            await this.profileRepo.update(userId, {
              completed_count: newCompletedCount,
            });
          }

          // 개인별 평점 집계
          const validRatings: number[] = [];
          userReviews.forEach((r) => {
            if (r.id !== review.id && typeof r.rating === 'number') {
              validRatings.push(r.rating);
            }
          });
          if (typeof params.rating === 'number') {
            validRatings.push(params.rating);
          }

          if (validRatings.length > 0) {
            const sum = validRatings.reduce((acc, cur) => acc + cur, 0);
            bookRating = Math.round((sum / validRatings.length) * 10) / 10;
          } else {
            bookRating = params.rating;
          }

          await this.memberRepo.updateCompletion(params.club_id, userId, true, bookRating);

          const clubInfo = await this.clubRepo.findById(params.club_id);
          await this.userBookRatingRepo.upsertRating({
            user_id: userId,
            club_id: params.club_id,
            isbn: clubInfo?.isbn || null,
            rating: bookRating,
            is_completed: true,
          });
        }
      }
    }

    return {
      review,
      manner_temperature: newTemperature,
      temp_change: change,
      is_club_completed: isClubCompleted,
      book_rating: bookRating,
      completed_count: newCompletedCount,
      level: newLevel,
    };
  }

  async updateReview(
    userId: string,
    params: {
      id: string;
      title: string;
      content: string;
      quote?: string | null;
      rating: number;
      is_public: boolean;
    }
  ): Promise<{ review: Review; book_rating: number | null }> {
    const existing = await this.reviewRepo.findById(params.id);
    if (!existing) {
      throw new NotFoundError('수정할 독후감을 찾을 수 없습니다.');
    }

    if (existing.user_id !== userId) {
      throw new ForbiddenError('본인이 작성한 독후감만 수정할 수 있습니다.');
    }

    const updatedReview = await this.reviewRepo.update(params.id, {
      title: params.title,
      content: params.content,
      quote: params.quote || undefined,
      rating: params.rating,
      is_public: params.is_public,
    });

    let updatedBookRating: number | null = null;
    const targetClubId = existing.club_id;

    if (targetClubId) {
      const allSchedules = await this.scheduleRepo.findByClubId(targetClubId);
      if (allSchedules && allSchedules.length > 0) {
        const userReviews = await this.reviewRepo.getUserReviewsForClub(targetClubId, userId);
        const reviewedScheduleIds = new Set(
          userReviews.map((r) => r.schedule_id).filter(Boolean)
        );

        const allFinished = allSchedules.every((s) => reviewedScheduleIds.has(s.id));
        if (allFinished && userReviews.length > 0) {
          const validRatings = userReviews
            .map((r) => (r.id === params.id ? params.rating : r.rating))
            .filter((r): r is number => typeof r === 'number');

          if (validRatings.length > 0) {
            const sum = validRatings.reduce((acc, cur) => acc + cur, 0);
            updatedBookRating = Math.round((sum / validRatings.length) * 10) / 10;

            await this.memberRepo.updateCompletion(targetClubId, userId, true, updatedBookRating);
            await this.userBookRatingRepo.upsertRating({
              user_id: userId,
              club_id: targetClubId,
              rating: updatedBookRating,
              is_completed: true,
            });
          }
        }
      }
    }

    return {
      review: updatedReview,
      book_rating: updatedBookRating,
    };
  }

  async empathizeReview(
    userId: string,
    reviewId: string
  ): Promise<{ my_empathy_count: number; message: string }> {
    const review = await this.reviewRepo.findById(reviewId);
    if (!review) {
      throw new NotFoundError('독후감을 찾을 수 없습니다.');
    }

    const existingEmpathy = await this.empathyRepo.getEmpathy(reviewId, userId);
    const currentCount = existingEmpathy?.count || 0;

    const check = checkCanEmpathize(review.user_id, userId, currentCount);
    if (!check.allowed) {
      if (check.reason === 'self_review') {
        throw new ValidationError('본인이 작성한 독후감에는 공감할 수 없습니다.');
      }
      if (check.reason === 'max_reached') {
        throw new ValidationError(`한 독후감당 최대 ${MAX_EMPATHY_COUNT}회까지만 공감할 수 있습니다.`);
      }
      throw new ValidationError('공감할 수 없습니다.');
    }

    const newEmpathyCount = currentCount + 1;
    const newTotalLikes = (review.likes_count || 0) + 1;

    await this.empathyRepo.setEmpathyCount(reviewId, userId, newEmpathyCount);
    await this.empathyRepo.incrementReviewLikes(reviewId, newTotalLikes);

    return {
      my_empathy_count: newEmpathyCount,
      message: `공감했습니다! (${newEmpathyCount}/${MAX_EMPATHY_COUNT})`,
    };
  }
}
