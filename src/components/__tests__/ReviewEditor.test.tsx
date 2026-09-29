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

  it('최초 작성 시 평점이 미선택 상태여야 하고, 평점 미선택 시 발행이 차단되어야 한다', () => {
    const handleSubmit = vi.fn();
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <ReviewEditor
        schedules={mockSchedules}
        selectedScheduleId="sched-1"
        bookTitle="불편한 편의점"
        onSubmit={handleSubmit}
      />
    );

    // 최초 렌더링 시 "선택 안 됨" 표시
    expect(screen.getByText('평점:')).toBeInTheDocument();
    expect(screen.getByText('선택 안 됨')).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText(/따뜻한 감상의 제목/);
    fireEvent.change(titleInput, { target: { value: '불편함 속에서 만난 온기' } });

    const textarea = screen.getByPlaceholderText(/이 단원을 읽고 마음에 남은 생각/);
    fireEvent.change(textarea, { target: { value: '독고 씨의 변화가 감동적이었습니다.' } });

    // 평점을 선택하지 않고 발행하기 클릭
    const publishBtn = screen.getByRole('button', { name: /독서클럽에 발행하기/ });
    fireEvent.click(publishBtn);

    expect(alertMock).toHaveBeenCalledWith('평점을 선택해주세요.');
    expect(handleSubmit).not.toHaveBeenCalled();

    // 4점 선택 후 발행하기 클릭
    const star4Button = screen.getByLabelText('평점 4점 선택');
    fireEvent.click(star4Button);
    expect(screen.getByText('4점')).toBeInTheDocument();

    fireEvent.click(publishBtn);
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '불편함 속에서 만난 온기',
        content: '독고 씨의 변화가 감동적이었습니다.',
        rating: 4,
        schedule_id: 'sched-1',
      })
    );

    alertMock.mockRestore();
  });

  it('상단 바에 단원 목록 선택 드롭다운이 정상 렌더링되어야 한다', () => {
    render(
      <ReviewEditor
        schedules={mockSchedules}
        selectedScheduleId="sched-1"
        bookTitle="불편한 편의점"
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText(/제1장. 2020 가을, 산해진미 도시락/)).toBeInTheDocument();
    expect(screen.getByText(/제2장. 제이에스 오브 제이에스/)).toBeInTheDocument();
  });

  it('임시 저장 버튼 클릭 시 작성 내용이 localStorage에 저장되어야 한다', () => {
    render(
      <ReviewEditor
        clubId="club-1"
        schedules={mockSchedules}
        selectedScheduleId="sched-1"
        bookTitle="불편한 편의점"
        onSubmit={vi.fn()}
      />
    );

    const titleInput = screen.getByPlaceholderText(/따뜻한 감상의 제목/);
    fireEvent.change(titleInput, { target: { value: '임시 저장용 제목' } });

    const textarea = screen.getByPlaceholderText(/이 단원을 읽고 마음에 남은 생각/);
    fireEvent.change(textarea, { target: { value: '임시 저장 내용' } });

    const star5Button = screen.getByLabelText('평점 5점 선택');
    fireEvent.click(star5Button);

    const tempSaveBtn = screen.getByRole('button', { name: /임시 저장/ });
    fireEvent.click(tempSaveBtn);

    const savedDraftStr = localStorage.getItem('cozy_draft_club-1_sched-1');
    expect(savedDraftStr).toBeTruthy();
    const parsed = JSON.parse(savedDraftStr!);
    expect(parsed.title).toBe('임시 저장용 제목');
    expect(parsed.content).toBe('임시 저장 내용');
    expect(parsed.rating).toBe(5);
  });
});


