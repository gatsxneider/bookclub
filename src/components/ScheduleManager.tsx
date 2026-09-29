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
  onUpdateSchedule?: (
    scheduleId: string,
    updatedData: {
      chapter_title: string;
      page_range: string;
      target_date: string;
    }
  ) => Promise<void>;
  onDeleteSchedule?: (scheduleId: string) => Promise<void>;
  onWriteReview: (schedule: ClubSchedule) => void;
  onViewReviews?: (schedule: ClubSchedule) => void;
  onRequireAuth?: () => void;
}

export default function ScheduleManager({
  schedules,
  isLeader,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onWriteReview,
  onViewReviews,
  onRequireAuth,
}: ScheduleManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  // 추가 폼 상태
  const [chapterTitle, setChapterTitle] = useState('');
  const [pageRange, setPageRange] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);

  // 수정 폼 상태
  const [editTitle, setEditTitle] = useState('');
  const [editPages, setEditPages] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // 독서일정 추가 폼 토글 (방장 전용)
  const handleToggleAddForm = () => {
    if (!isLeader) {
      alert('독서일정 추가는 모임의 방장만 가능합니다.');
      return;
    }
    setShowAddForm(!showAddForm);
    if (!showAddForm) {
      setEditingScheduleId(null);
    }
  };

  // 독서일정 수정 모드 토글 (방장 전용)
  const handleToggleEditMode = () => {
    if (!isLeader) {
      alert('독서일정 수정은 모임의 방장만 가능합니다.');
      return;
    }
    setIsEditMode(!isEditMode);
    setEditingScheduleId(null);
  };

  // 새 일정 생성 제출
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

  // 개별 일정 수정 시작
  const handleStartEdit = (schedule: ClubSchedule) => {
    setEditingScheduleId(schedule.id);
    setEditTitle(schedule.chapter_title || '');
    setEditPages(schedule.page_range || '');
    setEditDate(schedule.target_date || '');
  };

  // 개별 일정 수정 저장
  const handleSaveEdit = async (scheduleId: string) => {
    if (!editTitle.trim()) {
      alert('단원 제목을 입력해주세요.');
      return;
    }

    setEditLoading(true);
    try {
      if (onUpdateSchedule) {
        await onUpdateSchedule(scheduleId, {
          chapter_title: editTitle.trim(),
          page_range: editPages.trim(),
          target_date: editDate,
        });
      }
      setEditingScheduleId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  // 개별 일정 삭제
  const handleDelete = async (scheduleId: string, title: string) => {
    if (!confirm(`'${title}' 일정을 정말 삭제하시겠습니까?`)) return;

    try {
      if (onDeleteSchedule) {
        await onDeleteSchedule(scheduleId);
      }
    } catch (err) {
      console.error(err);
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

        {/* Buttons: 독서일정 수정 & 새 독서일정 추가 */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleToggleEditMode}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all ${
              isEditMode && isLeader
                ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
            aria-label="독서일정 수정"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isEditMode && isLeader ? 'check' : 'edit'}
            </span>
            <span>{isEditMode && isLeader ? '수정 완료' : '독서일정 수정'}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleAddForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-fixed text-on-primary-fixed hover:bg-primary hover:text-on-primary text-xs font-semibold shadow-sm transition-all"
            aria-label="독서일정 추가"
          >
            <span className="material-symbols-outlined text-[16px]">
              {showAddForm && isLeader ? 'close' : 'add'}
            </span>
            <span>{showAddForm && isLeader ? '작성 취소' : '새 독서일정 추가'}</span>
          </button>
        </div>
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
        <div className="py-10 text-center text-on-surface-variant flex flex-col items-center">
          <span className="material-symbols-outlined text-[36px] text-outline mb-1">
            calendar_today
          </span>
          <p className="text-sm font-medium">아직 등록된 독서 일정이 없습니다.</p>
          <button
            type="button"
            onClick={handleToggleAddForm}
            className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1 font-semibold"
          >
            <span>상단의 '새 독서일정 추가'를 눌러 독서 계획을 세워보세요!</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {schedules.map((schedule, idx) => {
            const isSubmitted = Boolean(schedule.my_review_submitted);
            const isEditing = editingScheduleId === schedule.id;

            if (isEditing && isLeader) {
              /* Inline Edit Form */
              return (
                <div
                  key={schedule.id || idx}
                  className="p-4 rounded-xl bg-surface-container-low border-2 border-primary/30 space-y-3 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>제{schedule.sequence || idx + 1}단원 일정 수정</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingScheduleId(null)}
                      className="text-xs text-on-surface-variant hover:text-on-surface"
                    >
                      취소
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                        단원 제목 *
                      </label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-surface-container-lowest text-on-surface px-3 py-2 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-on-surface-variant mb-1">
                        페이지 범위
                      </label>
                      <input
                        type="text"
                        value={editPages}
                        onChange={(e) => setEditPages(e.target.value)}
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
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="bg-surface-container-lowest text-on-surface px-2.5 py-1.5 rounded-lg text-xs outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingScheduleId(null)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high transition-all"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(schedule.id)}
                        disabled={editLoading || !editTitle.trim()}
                        className="px-4 py-1.5 rounded-full bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                      >
                        {editLoading ? '저장 중...' : '저장하기'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={schedule.id || idx}
                className={`group p-4 rounded-xl transition-all border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSubmitted
                    ? 'bg-surface-container-lowest border-secondary-fixed-dim/60 shadow-sm'
                    : 'bg-surface-container-low hover:bg-surface-container border-surface-container-high'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isSubmitted ? (
                    <span
                      className="w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold text-xs flex items-center justify-center shrink-0 shadow-sm"
                      title="독후감 작성 완료"
                    >
                      <span className="material-symbols-outlined text-[16px]">check</span>
                    </span>
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-surface-container-high text-primary font-bold text-xs flex items-center justify-center shrink-0">
                      {schedule.sequence || idx + 1}
                    </span>
                  )}

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
                      {isSubmitted && (
                        <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-semibold flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[12px]">task_alt</span>
                          <span>작성 완료</span>
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

                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  {/* 방장 수정 모드일 때: 수정 및 삭제 버튼 표시 */}
                  {isEditMode && isLeader ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(schedule)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed hover:bg-primary hover:text-on-primary text-xs font-semibold shadow-xs transition-all"
                        aria-label="단원 수정"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        <span>수정</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(schedule.id, schedule.chapter_title)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-error-container text-on-error-container hover:bg-error hover:text-on-error text-xs font-semibold shadow-xs transition-all"
                        aria-label="단원 삭제"
                      >
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                        <span>삭제</span>
                      </button>
                    </>
                  ) : (
                    <>
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
                        className={`inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all ${
                          isSubmitted
                            ? 'bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary hover:text-on-secondary'
                            : 'bg-primary text-on-primary hover:bg-primary-container'
                        }`}
                        title={isSubmitted ? '클릭하여 작성한 독후감을 수정합니다' : '단원 독후감을 작성합니다'}
                        aria-label={isSubmitted ? '독후감 수정' : '독후감 작성'}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isSubmitted ? 'edit' : 'edit_note'}
                        </span>
                        <span>{isSubmitted ? '독후감 작성 완료' : '독후감 작성'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
