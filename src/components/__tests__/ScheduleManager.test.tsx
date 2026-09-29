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

  it('방장일 경우 독서일정 추가 폼이 토글되고, 방장이 아닐 경우 방장만 추가할 수 있다는 메시지가 출력되어야 한다', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { rerender } = render(
      <ScheduleManager
        schedules={mockSchedules}
        isLeader={true}
        onAddSchedule={vi.fn()}
        onWriteReview={vi.fn()}
      />
    );
    const addBtn = screen.getByRole('button', { name: /독서일정 추가/ });
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);
    expect(screen.getByText(/방장 전용: 3번째 단원 일정 등록/)).toBeInTheDocument();

    rerender(
      <ScheduleManager
        schedules={mockSchedules}
        isLeader={false}
        onAddSchedule={vi.fn()}
        onWriteReview={vi.fn()}
      />
    );
    const nonLeaderAddBtn = screen.getByRole('button', { name: /독서일정 추가/ });
    fireEvent.click(nonLeaderAddBtn);
    expect(alertMock).toHaveBeenCalledWith('독서일정 추가는 모임의 방장만 가능합니다.');
    alertMock.mockRestore();
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

    const writeBtns = screen.getAllByRole('button', { name: '독후감 작성' });
    fireEvent.click(writeBtns[0]);
    expect(handleWriteReview).toHaveBeenCalledWith(mockSchedules[0]);
  });

  it('다른 멤버가 독후감을 썼더라도 내가 작성하지 않았으면(my_review_submitted: false) 작성 버튼이 노출되어야 한다', () => {
    const schedulesWithMixedStatus: ClubSchedule[] = [
      {
        id: 'sched-1',
        club_id: 'club-1',
        sequence: 1,
        chapter_title: '제1장. 2020 가을, 산해진미 도시락',
        page_range: 'p.1 ~ p.65',
        reviews_count: 2,
        my_review_submitted: false,
      },
      {
        id: 'sched-2',
        club_id: 'club-1',
        sequence: 2,
        chapter_title: '제2장. 제이에스 오브 제이에스',
        page_range: 'p.66 ~ p.132',
        reviews_count: 1,
        my_review_submitted: true,
      },
    ];

    render(
      <ScheduleManager
        schedules={schedulesWithMixedStatus}
        isLeader={false}
        onAddSchedule={vi.fn()}
        onWriteReview={vi.fn()}
      />
    );

    // 1단원은 내가 안 썼으므로 독후감 작성 버튼 표시
    expect(screen.getByRole('button', { name: '독후감 작성' })).toBeInTheDocument();
    // 2단원은 내가 작성 완료했으므로 독후감 수정 버튼 및 작성 완료 뱃지 표시
    expect(screen.getByRole('button', { name: '독후감 수정' })).toBeInTheDocument();
    expect(screen.getByText('작성 완료')).toBeInTheDocument();
  });

  it('방장일 경우 독서일정 수정 버튼 클릭 시 수정 모드가 활성화되고, 비방장일 경우 경고가 발생해야 한다', () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const { rerender } = render(
      <ScheduleManager
        schedules={mockSchedules}
        isLeader={true}
        onAddSchedule={vi.fn()}
        onWriteReview={vi.fn()}
      />
    );

    const editModeBtn = screen.getByRole('button', { name: /독서일정 수정/ });
    expect(editModeBtn).toBeInTheDocument();
    fireEvent.click(editModeBtn);

    // 수정 모드 활성화 확인 (개별 단원의 '수정', '삭제' 버튼 노출)
    expect(screen.getAllByRole('button', { name: '단원 수정' }).length).toBe(2);
    expect(screen.getAllByRole('button', { name: '단원 삭제' }).length).toBe(2);

    rerender(
      <ScheduleManager
        schedules={mockSchedules}
        isLeader={false}
        onAddSchedule={vi.fn()}
        onWriteReview={vi.fn()}
      />
    );

    const nonLeaderEditBtn = screen.getByRole('button', { name: /독서일정 수정/ });
    fireEvent.click(nonLeaderEditBtn);
    expect(alertMock).toHaveBeenCalledWith('독서일정 수정은 모임의 방장만 가능합니다.');
    alertMock.mockRestore();
  });
});
