import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ScheduleManager from '../ScheduleManager';
import { ClubSchedule } from '@/types/database';

const mockSchedules: ClubSchedule[] = [
  {
    id: 'sched-1',
    club_id: 'club-1',
    sequence: 1,
    chapter_title: '제1장. 2020 가을, 산해진미 도시락',
    page_range: 'p.1 ~ p.65',
    target_date: '2026-10-01',
    reviews_count: 3,
  },
  {
    id: 'sched-2',
    club_id: 'club-1',
    sequence: 2,
    chapter_title: '제2장. 제이에스 오브 제이에스',
    page_range: 'p.66 ~ p.132',
    target_date: '2026-10-08',
    reviews_count: 1,
  },
];

describe('ScheduleManager Component', () => {
  it('등록된 단원별 일정 목록이 올바르게 렌더링되어야 한다', () => {
    render(
      <ScheduleManager
        schedules={mockSchedules}
        isLeader={false}
        onAddSchedule={vi.fn()}
        onWriteReview={vi.fn()}
      />
    );

    expect(screen.getByText('제1장. 2020 가을, 산해진미 도시락')).toBeInTheDocument();
    expect(screen.getByText('p.1 ~ p.65')).toBeInTheDocument();
  });

  it('방장일 경우 단원 추가 폼이 토글되고, 방장이 아닐 경우 onRequireAuth가 호출되어야 한다', () => {
    const handleRequireAuth = vi.fn();
    const { rerender } = render(
      <ScheduleManager
        schedules={mockSchedules}
        isLeader={true}
        onAddSchedule={vi.fn()}
        onWriteReview={vi.fn()}
        onRequireAuth={handleRequireAuth}
      />
    );
    const addBtn = screen.getByRole('button', { name: /단원 추가/ });
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);
    expect(screen.getByText(/방장 전용: 3번째 단원 일정 등록/)).toBeInTheDocument();

    rerender(
      <ScheduleManager
        schedules={mockSchedules}
        isLeader={false}
        onAddSchedule={vi.fn()}
        onWriteReview={vi.fn()}
        onRequireAuth={handleRequireAuth}
      />
    );
    const nonLeaderAddBtn = screen.getByRole('button', { name: /단원 추가/ });
    fireEvent.click(nonLeaderAddBtn);
    expect(handleRequireAuth).toHaveBeenCalledTimes(1);
  });

  it('일정의 독후감 작성 버튼 클릭 시 onWriteReview 콜백이 호출되어야 한다', () => {
    const handleWriteReview = vi.fn();
    render(
      <ScheduleManager
        schedules={mockSchedules}
        isLeader={false}
        onAddSchedule={vi.fn()}
        onWriteReview={handleWriteReview}
      />
    );

    const writeBtns = screen.getAllByRole('button', { name: /독후감 작성/ });
    fireEvent.click(writeBtns[0]);
    expect(handleWriteReview).toHaveBeenCalledWith(mockSchedules[0]);
  });
});
