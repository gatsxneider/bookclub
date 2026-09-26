import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ReviewEditor from '../ReviewEditor';
import { ClubSchedule } from '@/types/database';

const mockSchedules: ClubSchedule[] = [
  {
    id: 'sched-1',
    club_id: 'club-1',
    sequence: 1,
    chapter_title: '제1장. 2020 가을, 산해진미 도시락',
    page_range: 'p.1 ~ p.65',
  },
  {
    id: 'sched-2',
    club_id: 'club-1',
    sequence: 2,
    chapter_title: '제2장. 제이에스 오브 제이에스',
    page_range: 'p.66 ~ p.132',
  },
];

describe('ReviewEditor Component', () => {
  it('제목, 내용 입력란과 글자수 카운터가 렌더링되어야 한다', () => {
    render(
      <ReviewEditor
        schedules={mockSchedules}
        bookTitle="불편한 편의점"
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/따뜻한 감상의 제목/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/이 단원을 읽고 마음에 남은 생각/)).toBeInTheDocument();
    expect(screen.getByText(/0자/)).toBeInTheDocument();
  });

  it('글 작성 시 글자수가 동적으로 업데이트되어야 한다', () => {
    render(
      <ReviewEditor
        schedules={mockSchedules}
        bookTitle="불편한 편의점"
        onSubmit={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(/이 단원을 읽고 마음에 남은 생각/);
    fireEvent.change(textarea, { target: { value: '너무 따뜻한 이야기입니다.' } });

    expect(screen.getByText(/14자/)).toBeInTheDocument();
  });

  it('발행하기 버튼 클릭 시 onSubmit 콜백이 데이터와 함께 호출되어야 한다', () => {
    const handleSubmit = vi.fn();
    render(
      <ReviewEditor
        schedules={mockSchedules}
        selectedScheduleId="sched-1"
        bookTitle="불편한 편의점"
        onSubmit={handleSubmit}
      />
    );

    const titleInput = screen.getByPlaceholderText(/따뜻한 감상의 제목/);
    fireEvent.change(titleInput, { target: { value: '불편함 속에서 만난 온기' } });

    const textarea = screen.getByPlaceholderText(/이 단원을 읽고 마음에 남은 생각/);
    fireEvent.change(textarea, { target: { value: '독고 씨의 변화가 감동적이었습니다.' } });

    const publishBtn = screen.getByRole('button', { name: /독서클럽에 발행하기/ });
    fireEvent.click(publishBtn);

    expect(handleSubmit).toHaveBeenCalled();
  });
});
