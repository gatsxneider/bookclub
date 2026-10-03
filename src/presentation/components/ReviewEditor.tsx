'use client';

import React, { useState, useEffect } from 'react';
import { Review, ClubSchedule } from '@/domain/entities';
import { FormField, inputClass } from './ui/FormField';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { useToast } from './ui/Toast';
import { apiClient } from '@/presentation/lib/apiClient';

export interface ReviewEditorProps {
  clubId?: string;
  schedules?: ClubSchedule[];
  schedule?: ClubSchedule | null;
  selectedScheduleId?: string;
  bookTitle?: string;
  clubName?: string;
  authorNickname?: string;
  initialReview?: Review | null;
  initialTitle?: string;
  initialContent?: string;
  initialQuote?: string;
  initialRating?: number;
  initialIsPublic?: boolean;
  isEditMode?: boolean;
  onSubmit?: (reviewData: {
    club_id?: string;
    schedule_id?: string;
    title: string;
    content: string;
    quote?: string;
    rating: number;
    is_public: boolean;
  }) => Promise<any> | void;
  onSuccess?: (savedReview: Review) => void;
  onCancel?: () => void;
}

export default function ReviewEditor({
  clubId,
  schedules = [],
  schedule,
  selectedScheduleId: propScheduleId,
  bookTitle,
  clubName,
  authorNickname,
  initialReview,
  initialTitle,
  initialContent,
  initialQuote,
  initialRating,
  initialIsPublic,
  isEditMode: propIsEditMode,
  onSubmit,
  onSuccess,
  onCancel,
}: ReviewEditorProps) {
  const { notify } = useToast();
  const isEditing = propIsEditMode ?? Boolean(initialReview?.id);

  const [currentScheduleId, setCurrentScheduleId] = useState<string>(
    propScheduleId || schedule?.id || (schedules.length > 0 ? schedules[0].id : '')
  );

  const [title, setTitle] = useState(
    initialTitle ?? initialReview?.title ?? ''
  );
  const [content, setContent] = useState(
    initialContent ?? initialReview?.content ?? ''
  );
  const [quote, setQuote] = useState(
    initialQuote ?? initialReview?.quote ?? ''
  );
  const [rating, setRating] = useState<number>(
    initialRating !== undefined
      ? initialRating
      : initialReview?.rating !== undefined
      ? initialReview.rating
      : 0
  );
  const [isPublic, setIsPublic] = useState<boolean>(
    initialIsPublic ?? initialReview?.is_public ?? true
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (propScheduleId) {
      setCurrentScheduleId(propScheduleId);
    }
  }, [propScheduleId]);

  // 임시 저장 불러오기
  useEffect(() => {
    if (!isEditing && clubId && currentScheduleId && typeof window !== 'undefined') {
      const draftKey = `cozy_draft_${clubId}_${currentScheduleId}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.title && !title) setTitle(parsed.title);
          if (parsed.content && !content) setContent(parsed.content);
          if (parsed.quote && !quote) setQuote(parsed.quote);
          if (parsed.rating && rating === 0) setRating(parsed.rating);
        } catch {
          // ignore
        }
      }
    }
  }, [clubId, currentScheduleId, isEditing]);

  const handleSaveDraft = () => {
    if (typeof window === 'undefined') return;
    const draftKey = `cozy_draft_${clubId || 'default'}_${currentScheduleId || 'default'}`;
    const draft = {
      title,
      content,
      quote,
      rating,
      isPublic,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
    notify('작성 중인 내용이 임시 저장되었습니다.', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('제목과 내용을 모두 입력해주세요.');
      return;
    }

    if (rating === 0) {
      alert('평점을 선택해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const payload = {
      club_id: clubId || undefined,
      schedule_id: currentScheduleId || schedule?.id || undefined,
      title: title.trim(),
      content: content.trim(),
      quote: quote.trim() || undefined,
      rating,
      is_public: isPublic,
    };

    try {
      if (onSubmit) {
        await onSubmit(payload);
        // 임시 저장 삭제
        if (clubId && currentScheduleId && typeof window !== 'undefined') {
          localStorage.removeItem(`cozy_draft_${clubId}_${currentScheduleId}`);
        }
        return;
      }

      if (isEditing && initialReview) {
        const res = await apiClient.patch<{ success: boolean; review: Review }>(
          '/api/reviews',
          {
            id: initialReview.id,
            ...payload,
          }
        );
        notify('독후감이 성공적으로 수정되었습니다.', 'success');
        onSuccess?.(res.review);
      } else {
        const res = await apiClient.post<{
          success: boolean;
          review: Review;
          manner_temperature: number;
          temp_change: number;
          is_club_completed: boolean;
        }>('/api/reviews', payload);

        if (res.temp_change > 0) {
          notify(`기한 내 독후감 작성 완료! 감성 온도가 +${res.temp_change}℃ 올랐습니다. (+${res.manner_temperature}℃)`, 'success');
        } else {
          notify('독후감이 성공적으로 등록되었습니다.', 'success');
        }

        if (res.is_club_completed) {
          notify('🎉 축하합니다! 클럽의 모든 단원을 완독하셨습니다!', 'success');
        }

        // 임시 저장 삭제
        if (clubId && currentScheduleId && typeof window !== 'undefined') {
          localStorage.removeItem(`cozy_draft_${clubId}_${currentScheduleId}`);
        }

        onSuccess?.(res.review);
      }
    } catch (err: any) {
      setErrorMsg(err.message || '독후감 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const activeSchedule = schedules.find((s) => s.id === currentScheduleId) || schedule;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 p-4 sm:p-6 rounded-3xl bg-surface-container-lowest border border-surface-container shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-container gap-2">
        <div>
          <h2 className="font-headline-sm text-lg sm:text-xl font-bold text-on-surface flex items-center gap-2">
            <Icon name="auto_stories" className="text-primary text-[22px]" />
            {isEditing ? '독후감 수정' : '새 독후감 기록'}
          </h2>
          <div className="flex items-center gap-2 text-xs text-on-surface-variant mt-1 flex-wrap">
            {bookTitle && <span className="font-semibold text-primary">📖 {bookTitle}</span>}
            {clubName && <span>· {clubName}</span>}
            {authorNickname && <span>· 작성자: {authorNickname}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button type="button" variant="outline" size="sm" onClick={handleSaveDraft} className="text-xs">
            임시 저장
          </Button>
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-xs">
              취소
            </Button>
          )}
        </div>
      </div>

      {/* 단원 선택 드롭다운 (여러 단원이 있을 때) */}
      {schedules.length > 0 && (
        <div className="space-y-1.5">
          <label htmlFor="schedule-select" className="text-xs font-bold text-on-surface">
            단원 일정 선택
          </label>
          <select
            id="schedule-select"
            value={currentScheduleId}
            onChange={(e) => setCurrentScheduleId(e.target.value)}
            className={`${inputClass} bg-surface-container-low`}
          >
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sequence}단원: {s.chapter_title} {s.page_range ? `(${s.page_range})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {activeSchedule && schedules.length === 0 && (
        <div className="p-3 bg-surface-container-low rounded-xl text-xs text-on-surface-variant flex items-center gap-2">
          <Icon name="bookmark" className="text-primary text-[18px]" />
          <span>
            [{activeSchedule.sequence}단원: {activeSchedule.chapter_title}] 독서 기록
          </span>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium flex items-start gap-2"
        >
          <Icon name="error" className="text-[18px] shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. 별점 평가 (접근성 라디오 그룹) */}
      <fieldset className="flex flex-col gap-1.5 border-none p-0 m-0">
        <legend className="text-sm font-bold text-on-surface mb-1">
          단원 만족도 평점
        </legend>
        <div role="radiogroup" aria-label="별점 선택" className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= rating;
            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={`평점 ${star}점 선택`}
                onClick={() => setRating(star)}
                className="tap-target rounded-full hover:scale-110 transition-transform text-amber-500 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Icon
                  name="star"
                  filled={isFilled}
                  className="text-2xl"
                />
              </button>
            );
          })}
          <span className="text-xs font-bold text-on-surface ml-2">
            평점: <span className={rating > 0 ? 'text-amber-700' : 'text-on-surface-variant font-normal'}>
              {rating > 0 ? `${rating}점` : '선택 안 됨'}
            </span>
          </span>
        </div>
      </fieldset>

      {/* 2. 제목 입력 */}
      <FormField label="독후감 제목" required>
        {(fieldProps) => (
          <input
            {...fieldProps}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="따뜻한 감상의 제목을 입력해주세요"
            maxLength={100}
            className={inputClass}
          />
        )}
      </FormField>

      {/* 3. 인상 깊은 구절 (선택) */}
      <FormField label="인상 깊은 문장 (선택)" hint="책 속에서 간직하고 싶은 구절을 적어보세요.">
        {(fieldProps) => (
          <textarea
            {...fieldProps}
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="“우리가 빛의 속도로 갈 수 없다면...”"
            rows={2}
            maxLength={300}
            className={`${inputClass} resize-none font-serif italic text-xs sm:text-sm`}
          />
        )}
      </FormField>

      {/* 4. 본문 내용 */}
      <div>
        <FormField label="나의 생각과 느낌" required>
          {(fieldProps) => (
            <textarea
              {...fieldProps}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="이 단원을 읽고 마음에 남은 생각과 느낌을 기록해보세요..."
              rows={8}
              maxLength={3000}
              className={`${inputClass} resize-none`}
            />
          )}
        </FormField>
        <div aria-live="polite" className="text-right text-[11px] text-on-surface-variant mt-1">
          {content.length}자 / 3000자
        </div>
      </div>

      {/* 5. 공개 여부 설정 */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-surface-container">
        <div>
          <span className="text-xs font-bold text-on-surface block">
            피드 공개 여부
          </span>
          <span className="text-[11px] text-on-surface-variant">
            {isPublic ? '모든 회원과 독후감을 함께 나눕니다.' : '나만 보기 (비공개)'}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isPublic}
          onClick={() => setIsPublic(!isPublic)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            isPublic ? 'bg-primary' : 'bg-surface-variant'
          }`}
        >
          <span className="sr-only">독후감 공개 여부 토글</span>
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              isPublic ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            취소
          </Button>
        )}
        <Button type="submit" variant="primary" size="lg" loading={loading} icon="edit">
          {isEditing ? '독후감 수정 완료' : '독서클럽에 발행하기'}
        </Button>
      </div>
    </form>
  );
}
