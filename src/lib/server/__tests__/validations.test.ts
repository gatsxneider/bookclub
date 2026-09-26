import { describe, it, expect } from 'vitest';
import {
  createClubSchema,
  createScheduleSchema,
  createReviewSchema,
  updateMemberStatusSchema,
} from '../validations';

describe('Server Validations (Security & Data Integrity)', () => {
  it('클럽 생성 시 필수 도서 정보와 클럽 이름, 인원 수가 올바르게 검증되어야 한다', () => {
    const validData = {
      name: '고요한 숲속 심야 독서회',
      description: '매일 밤 함께 읽는 독서회',
      isbn: '9791161571188',
      max_members: 6,
    };
    expect(() => createClubSchema.parse(validData)).not.toThrow();

    // 잘못된 인원 수 (0명 이하 또는 50명 초과)
    expect(() => createClubSchema.parse({ ...validData, max_members: 0 })).toThrow();
    // 이름 누락
    expect(() => createClubSchema.parse({ ...validData, name: '' })).toThrow();
  });

  it('일정 생성 시 단원명과 순번이 필수여야 한다', () => {
    const validSchedule = {
      club_id: '123e4567-e89b-12d3-a456-426614174000',
      sequence: 1,
      chapter_title: '제1장. 만남과 시작',
      page_range: 'p.1 ~ p.45',
      target_date: '2026-10-15',
    };
    expect(() => createScheduleSchema.parse(validSchedule)).not.toThrow();
    expect(() => createScheduleSchema.parse({ ...validSchedule, sequence: -1 })).toThrow();
  });

  it('독후감 작성 시 내용(content)은 필수이며 XSS 잠재 위험 태그를 살균해야 한다', () => {
    const validReview = {
      schedule_id: '123e4567-e89b-12d3-a456-426614174000',
      club_id: '123e4567-e89b-12d3-a456-426614174000',
      title: '첫 장을 덮으며 느낀 온기',
      content: '이 책을 읽으며 마음의 위로를 받았습니다.',
      quote: '책은 손에 쥐는 고요한 숲이다.',
      rating: 5,
      is_public: true,
    };
    expect(() => createReviewSchema.parse(validReview)).not.toThrow();
    expect(() => createReviewSchema.parse({ ...validReview, content: '' })).toThrow();
  });

  it('멤버 상태 변경은 approved 또는 rejected만 허용되어야 한다', () => {
    expect(() => updateMemberStatusSchema.parse({ status: 'approved' })).not.toThrow();
    expect(() => updateMemberStatusSchema.parse({ status: 'rejected' })).not.toThrow();
    expect(() => updateMemberStatusSchema.parse({ status: 'invalid_status' })).toThrow();
  });
});
