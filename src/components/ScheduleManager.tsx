'use client';

import React, { useState } from 'react';
import { ClubSchedule } from '@/types/database';

interface ScheduleManagerProps {
  schedules: ClubSchedule[];
  isLeader: boolean;
  onAddSchedule: (scheduleData: {
    sequence: number;
    chapter_title: string;
    page_range: string;
    target_date: string;
  }) => Promise<void>;
  onWriteReview: (schedule: ClubSchedule) => void;
  onViewReviews?: (schedule: ClubSchedule) => void;
}

export default function ScheduleManager({
  schedules,
  isLeader,
  onAddSchedule,
  onWriteReview,
  onViewReviews,
}: ScheduleManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');
  const [pageRange, setPageRange] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle.trim()) return;

    setLoading(true);
    try {
      await onAddSchedule({
        sequence: schedules.length + 1,
        chapter_title: chapterTitle.trim(),
        page_range: pageRange.trim(),
        target_date: targetDate,
      });
      setChapterTitle('');
      setPageRange('');
      setTargetDate('');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-surface-container-lowest rounded-2xl p-space-md sm:p-space-lg shadow-sm border border-surface-container flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-container">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">
              format_list_bulleted
            </span>
            <h3 className="font-headline-sm text-lg font-semibold text-on-surface">
              도서 단원별 독서 일정 & 진척도
            </h3>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            단원을 클릭하면 해당 구간에 대한 독후감을 작성하거나 멤버들의 기록을 볼 수 있습니다.
          </p>
        </div>

        {isLeader && (
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-fixed text-on-primary-fixed hover:bg-primary hover:text-on-primary text-xs font-semibold shadow-sm transition-all self-start sm:self-auto"
            aria-label="단원 추가"
          >
            <span className="material-symbols-outlined text-[16px]">
              {showAddForm ? 'close' : 'add'}
            </span>
            <span>{showAddForm ? '작성 취소' : '+ 새 단원 추가'}</span>
          </button>
        )}
      </div>

      {/* Leader Add Form */}
      {showAddForm && isLeader && (
        <form
          onSubmit={handleCreate}
          className="p-4 rounded-xl bg-surface-container-low border border-primary/20 space-y-3 animate-fade-in"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <span className="material-symbols-outlined text-[16px]">shield_person</span>
            <span>방장 전용: {schedules.length + 1}번째 단원 일정 등록</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                단원/챕터 제목 *
              </label>
              <input
                type="text"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="예: 제1장. 2020 가을, 산해진미 도시락"
                required
                className="w-full bg-surface-container-lowest text-on-surface px-3 py-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">
                페이지 범위
              </label>
              <input
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="예: p.1 ~ p.65"
                className="w-full bg-surface-container-lowest text-on-surface px-3 py-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-on-surface-variant">독서 마감일:</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="bg-surface-container-lowest text-on-surface px-2.5 py-1.5 rounded-lg text-xs outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !chapterTitle.trim()}
              className="px-4 py-2 rounded-full bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? '추가 중...' : '일정 확정'}
            </button>
          </div>
        </form>
      )}

      {/* Schedules List */}
      {schedules.length === 0 ? (
        <div className="py-10 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[36px] text-outline mb-1">
            calendar_today
          </span>
          <p className="text-sm font-medium">아직 등록된 독서 일정이 없습니다.</p>
          {isLeader ? (
            <p className="text-xs text-primary mt-1">
              상단의 '+ 새 단원 추가' 버튼을 눌러 독서 계획을 세워보세요!
            </p>
          ) : (
            <p className="text-xs text-on-surface-variant mt-1">
              방장님이 단원별 일정을 등록하면 이곳에 표시됩니다.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {schedules.map((schedule, idx) => (
            <div
              key={schedule.id || idx}
              className="group p-4 rounded-xl bg-surface-container-low hover:bg-surface-container transition-all border border-surface-container-high flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-surface-container-high text-primary font-bold text-xs flex items-center justify-center shrink-0">
                  {schedule.sequence || idx + 1}
                </span>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-title-sm text-sm font-semibold text-on-surface">
                      {schedule.chapter_title}
                    </h4>
                    {schedule.page_range && (
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px]">
                        {schedule.page_range}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1">
                    {schedule.target_date && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-secondary">
                          event
                        </span>
                        <span>목표일: {schedule.target_date}</span>
                      </span>
                    )}
                    <span>•</span>
                    <span className="text-primary font-medium">
                      독후감 {schedule.reviews_count || 0}편 작성됨
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {onViewReviews && (
                  <button
                    type="button"
                    onClick={() => onViewReviews(schedule)}
                    className="px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-medium transition-all"
                  >
                    독후감 보기
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onWriteReview(schedule)}
                  className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-sm transition-all"
                  aria-label="독후감 작성"
                >
                  <span className="material-symbols-outlined text-[14px]">edit_note</span>
                  <span>독후감 작성</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
