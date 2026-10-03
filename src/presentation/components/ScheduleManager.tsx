'use client';

import React, { useState } from 'react';
import { ClubSchedule } from '@/domain/entities';
import { Button, IconButton } from './ui/Button';
import { Modal } from './ui/Modal';
import { FormField, inputClass } from './ui/FormField';
import { Icon } from './ui/Icon';
import { useToast } from './ui/Toast';
import { apiClient } from '@/presentation/lib/apiClient';

interface ScheduleManagerProps {
  clubId?: string;
  schedules: ClubSchedule[];
  isLeader: boolean;
  onSchedulesUpdated?: () => void;
  onAddSchedule?: (scheduleData: {
    sequence: number;
    chapter_title: string;
    page_range?: string;
    target_date?: string;
  }) => Promise<boolean | void>;
  onWriteReview?: (schedule: ClubSchedule) => void;
  onOpenReviewEditor?: (schedule: ClubSchedule) => void;
}

export default function ScheduleManager({
  clubId,
  schedules,
  isLeader,
  onSchedulesUpdated,
  onAddSchedule,
  onWriteReview,
  onOpenReviewEditor,
}: ScheduleManagerProps) {
  const { notify } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ClubSchedule | null>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null);

  const [sequence, setSequence] = useState<number>(schedules.length + 1);
  const [chapterTitle, setChapterTitle] = useState('');
  const [pageRange, setPageRange] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setSequence(schedules.length + 1);
    setChapterTitle('');
    setPageRange('');
    setTargetDate('');
    setEditingSchedule(null);
  };

  const handleAddClick = () => {
    if (!isLeader) {
      alert('독서일정 추가는 모임의 방장만 가능합니다.');
      return;
    }
    resetForm();
    setSequence(schedules.length + 1);
    setIsAddOpen(true);
  };

  const handleEditModeToggle = () => {
    if (!isLeader) {
      alert('독서일정 수정은 모임의 방장만 가능합니다.');
      return;
    }
    setIsEditMode(!isEditMode);
  };

  const handleOpenEdit = (sched: ClubSchedule) => {
    setEditingSchedule(sched);
    setSequence(sched.sequence);
    setChapterTitle(sched.chapter_title);
    setPageRange(sched.page_range || '');
    setTargetDate(sched.target_date || '');
    setIsAddOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterTitle.trim()) {
      notify('단원 제목을 입력해주세요.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (editingSchedule) {
        if (clubId) {
          await apiClient.patch(`/api/clubs/${clubId}/schedules`, {
            schedule_id: editingSchedule.id,
            sequence,
            chapter_title: chapterTitle.trim(),
            page_range: pageRange.trim() || undefined,
            target_date: targetDate || undefined,
          });
        }
        notify('단원 일정이 수정되었습니다.', 'success');
      } else {
        if (onAddSchedule) {
          await onAddSchedule({
            sequence,
            chapter_title: chapterTitle.trim(),
            page_range: pageRange.trim() || undefined,
            target_date: targetDate || undefined,
          });
        } else if (clubId) {
          await apiClient.post(`/api/clubs/${clubId}/schedules`, {
            sequence,
            chapter_title: chapterTitle.trim(),
            page_range: pageRange.trim() || undefined,
            target_date: targetDate || undefined,
          });
        }
        notify('새 단원 일정이 등록되었습니다.', 'success');
      }

      setIsAddOpen(false);
      resetForm();
      onSchedulesUpdated?.();
    } catch (err: any) {
      notify(err.message || '일정 저장에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingScheduleId) return;
    setLoading(true);
    try {
      if (clubId) {
        await apiClient.delete(`/api/clubs/${clubId}/schedules`, {
          scheduleId: deletingScheduleId,
        });
      }
      notify('단원 일정이 삭제되었습니다.', 'info');
      setDeletingScheduleId(null);
      onSchedulesUpdated?.();
    } catch (err: any) {
      notify(err.message || '일정 삭제에 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAction = (sched: ClubSchedule) => {
    if (onWriteReview) {
      onWriteReview(sched);
    } else if (onOpenReviewEditor) {
      onOpenReviewEditor(sched);
    }
  };

  return (
    <section aria-labelledby="schedule-heading" className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-container">
        <div>
          <h2 id="schedule-heading" className="font-headline-sm text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2">
            <Icon name="calendar_month" className="text-primary text-[22px]" />
            함께 읽는 단원별 일정
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            단원별 목표일까지 읽고 독후감을 기록해보세요.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon="tune"
            onClick={handleEditModeToggle}
            aria-label="독서일정 수정"
          >
            독서일정 수정
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon="add"
            onClick={handleAddClick}
            aria-label="독서일정 추가"
          >
            독서일정 추가
          </Button>
        </div>
      </div>

      {/* 일정 리스트 (ol 구조) */}
      {schedules.length > 0 ? (
        <ol className="divide-y divide-surface-container rounded-2xl border border-surface-container bg-surface-container-lowest overflow-hidden shadow-xs">
          {schedules.map((sched) => {
            const isSubmitted = sched.my_review_submitted;

            return (
              <li
                key={sched.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3.5 hover:bg-surface-container-low transition-colors"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {sched.sequence}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-on-surface break-keep">
                        {sched.chapter_title}
                      </h3>
                      {isSubmitted ? (
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold inline-flex items-center gap-1">
                          <Icon name="check" className="text-[12px]" />
                          작성 완료
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1 flex-wrap">
                      {sched.page_range && <span>{sched.page_range}</span>}
                      {sched.target_date && <span>목표일: {sched.target_date}</span>}
                      <span>독후감 {sched.reviews_count || 0}편</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {(onWriteReview || onOpenReviewEditor) && (
                    <Button
                      type="button"
                      variant={isSubmitted ? 'outline' : 'primary'}
                      size="sm"
                      icon="edit"
                      onClick={() => handleReviewAction(sched)}
                      aria-label={isSubmitted ? '독후감 수정' : '독후감 작성'}
                      className="text-xs"
                    >
                      {isSubmitted ? '독후감 수정' : '독후감 작성'}
                    </Button>
                  )}

                  {(isLeader || isEditMode) && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon="edit"
                        aria-label="단원 수정"
                        onClick={() => handleOpenEdit(sched)}
                        className="text-xs px-2.5 h-8 text-on-surface-variant hover:text-on-surface"
                      >
                        단원 수정
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon="delete"
                        aria-label="단원 삭제"
                        onClick={() => setDeletingScheduleId(sched.id)}
                        className="text-xs px-2.5 h-8 text-on-surface-variant hover:text-error"
                      >
                        단원 삭제
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="p-8 rounded-2xl bg-surface-container-low border border-surface-container text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
          <Icon name="event_busy" className="text-3xl text-on-surface-variant/40" />
          <span>아직 등록된 단원 일정이 없습니다. {isLeader ? '새 일정을 추가해보세요!' : ''}</span>
        </div>
      )}

      {/* 일정 추가/수정 모달 */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={editingSchedule ? '단원 일정 수정' : `방장 전용: ${sequence}번째 단원 일정 등록`}
        description="멤버들과 함께 읽을 챕터와 목표 날짜를 설정하세요."
        icon="event_note"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="단원 순번" required>
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="number"
                min={1}
                value={sequence}
                onChange={(e) => setSequence(Number(e.target.value))}
                className={inputClass}
              />
            )}
          </FormField>

          <FormField label="단원 제목 / 범위" required hint="예: 1단원: 어린 새, 1장~3장">
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="text"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                placeholder="단원 명칭을 입력하세요"
                maxLength={100}
                className={inputClass}
              />
            )}
          </FormField>

          <FormField label="페이지 범위 (선택)" hint="예: p.15 ~ p.84">
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="text"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="예: p.1 ~ p.50"
                maxLength={50}
                className={inputClass}
              />
            )}
          </FormField>

          <FormField label="목표 완독일 (선택)">
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className={inputClass}
              />
            )}
          </FormField>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
            <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>
              취소
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              {editingSchedule ? '일정 수정 저장' : '일정 등록'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 일정 삭제 확인 모달 */}
      <Modal
        isOpen={Boolean(deletingScheduleId)}
        onClose={() => setDeletingScheduleId(null)}
        title="단원 일정 삭제"
        icon="warning"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="ghost" onClick={() => setDeletingScheduleId(null)}>
              취소
            </Button>
            <Button variant="danger" loading={loading} onClick={handleDeleteConfirm}>
              일정 삭제
            </Button>
          </div>
        }
      >
        <p className="text-sm text-on-surface">
          해당 단원 일정을 삭제하시겠습니까? 등록된 독후감 데이터가 영향을 받을 수 있습니다.
        </p>
      </Modal>
    </section>
  );
}
