import {
  SupabaseBookRepository,
  SupabaseClubRepository,
  SupabaseEmpathyRepository,
  SupabaseMemberRepository,
  SupabaseMessageRepository,
  SupabaseProfileRepository,
  SupabaseReviewRepository,
  SupabaseReviewCommentRepository,
  SupabaseScheduleRepository,
  SupabaseUserBookRatingRepository,
} from './supabase/repositories';
import { KakaoBookSearchGateway } from './kakao/KakaoBookSearchGateway';
import { ProfileUseCases } from '@/application/use-cases/ProfileUseCases';
import { ClubUseCases } from '@/application/use-cases/ClubUseCases';
import { MemberUseCases } from '@/application/use-cases/MemberUseCases';
import { ScheduleUseCases } from '@/application/use-cases/ScheduleUseCases';
import { ReviewUseCases } from '@/application/use-cases/ReviewUseCases';
import { ReviewCommentUseCases } from '@/application/use-cases/ReviewCommentUseCases';
import { MessageUseCases } from '@/application/use-cases/MessageUseCases';
import { BookUseCases } from '@/application/use-cases/BookUseCases';

class Container {
  public profileRepo = new SupabaseProfileRepository();
  public bookRepo = new SupabaseBookRepository();
  public clubRepo = new SupabaseClubRepository();
  public memberRepo = new SupabaseMemberRepository();
  public scheduleRepo = new SupabaseScheduleRepository();
  public reviewRepo = new SupabaseReviewRepository();
  public empathyRepo = new SupabaseEmpathyRepository();
  public commentRepo = new SupabaseReviewCommentRepository();
  public messageRepo = new SupabaseMessageRepository();
  public userBookRatingRepo = new SupabaseUserBookRatingRepository();
  public bookSearchGateway = new KakaoBookSearchGateway();

  public profileUseCases = new ProfileUseCases(this.profileRepo);
  public clubUseCases = new ClubUseCases(
    this.clubRepo,
    this.bookRepo,
    this.profileRepo,
    this.memberRepo
  );
  public memberUseCases = new MemberUseCases(
    this.clubRepo,
    this.memberRepo,
    this.profileRepo
  );
  public scheduleUseCases = new ScheduleUseCases(
    this.scheduleRepo,
    this.clubRepo,
    this.memberRepo,
    this.messageRepo
  );
  public reviewUseCases = new ReviewUseCases(
    this.reviewRepo,
    this.profileRepo,
    this.scheduleRepo,
    this.clubRepo,
    this.memberRepo,
    this.empathyRepo,
    this.userBookRatingRepo,
    this.commentRepo
  );
  public reviewCommentUseCases = new ReviewCommentUseCases(
    this.commentRepo,
    this.reviewRepo,
    this.profileRepo
  );
  public messageUseCases = new MessageUseCases(
    this.messageRepo,
    this.profileRepo,
    this.clubRepo,
    this.memberRepo,
    this.scheduleRepo
  );
  public bookUseCases = new BookUseCases(this.bookRepo, this.bookSearchGateway);
}

export const container = new Container();
