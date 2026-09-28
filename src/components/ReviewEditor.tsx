'use client';

import React, { useState, useMemo } from 'react';
import { ClubSchedule } from '@/types/database';

interface ReviewEditorProps {
  schedules?: ClubSchedule[];
  selectedScheduleId?: string;
  bookTitle?: string;
  clubName?: string;
  authorNickname?: string;
  initialTitle?: string;
  initialContent?: string;
  initialQuote?: string;
  initialRating?: number;
  initialIsPublic?: boolean;
  isEditMode?: boolean;
  onSubmit: (reviewData: {
    schedule_id?: string;
    title: string;
    content: string;
    quote?: string;
    rating: number;
    is_public: boolean;
  }) => Promise<void>;
}

export default function ReviewEditor({
  schedules = [],
  selectedScheduleId,
  bookTitle = '선정 도서',
  clubName = '코지 북클럽',
  authorNickname = '지우',
  initialTitle = '',
  initialContent = '',
  initialQuote = '',
  initialRating = 5,
  initialIsPublic = true,
  isEditMode = false,
  onSubmit,
}: ReviewEditorProps) {
  const [scheduleId, setScheduleId] = useState<string>(
    selectedScheduleId || (schedules.length > 0 ? schedules[0].id : '')
  );
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [quote, setQuote] = useState(initialQuote);
  const [rating, setRating] = useState(initialRating);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);
  const [savedTime, setSavedTime] = useState<string | null>(null);

  // 초기값이 외부(API 등)에서 변경되었을 때 상태 동기화
  React.useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  React.useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  React.useEffect(() => {
    setQuote(initialQuote);
  }, [initialQuote]);

  React.useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  React.useEffect(() => {
    setIsPublic(initialIsPublic);
  }, [initialIsPublic]);

  React.useEffect(() => {
    if (selectedScheduleId) {
      setScheduleId(selectedScheduleId);
    }
  }, [selectedScheduleId]);

  // 글자 수 및 예상 읽기 시간 계산
  const charCount = content.length;
  const readTimeMinutes = Math.max(1, Math.ceil(charCount / 400));

  const currentSchedule = useMemo(() => {
    return schedules.find((s) => s.id === scheduleId);
  }, [schedules, scheduleId]);

  const handleTempSave = () => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    setSavedTime(timeStr);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('제목과 감상 내용을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        schedule_id: scheduleId || undefined,
        title: title.trim(),
        content: content.trim(),
        quote: quote.trim() || undefined,
        rating,
        is_public: isPublic,
      });
    } catch (err: any) {
      alert(err.message || (isEditMode ? '독후감 수정 중 오류가 발생했습니다.' : '독후감 발행 중 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  // 마크다운 서식 툴바 삽입 헬퍼
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('review-content-area') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = `${prefix}${selectedText || '내용'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* 1. Sticky Literary Header */}
      <section className="sticky top-20 z-40 bg-surface/95 backdrop-blur-md shadow-sm py-3 px-4 rounded-2xl border border-surface-container flex flex-wrap items-center justify-between gap-4">
        {/* Left: Schedule Select & Stat Meta */}
        <div className="flex items-center gap-4 flex-wrap">
          {schedules.length > 0 && (
            <div className="relative inline-flex items-center">
              <select
                value={scheduleId}
                onChange={(e) => setScheduleId(e.target.value)}
                className="bg-surface-container-high hover:bg-surface-container-highest px-3.5 py-1.5 rounded-full text-xs font-semibold text-on-surface outline-none cursor-pointer transition-colors shadow-sm"
              >
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    단원: {s.chapter_title} {s.page_range ? `(${s.page_range})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isEditMode && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold shadow-sm">
              <span className="material-symbols-outlined text-[14px]">edit</span>
              <span>수정 중</span>
            </span>
          )}

          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span className="inline-flex items-center gap-1 text-primary font-medium">
              <span className="material-symbols-outlined text-[15px]">cloud_done</span>
              <span>{savedTime ? `임시저장 (${savedTime})` : '실시간 작성중'}</span>
            </span>
            <span>•</span>
            <span className="font-medium text-on-surface">{charCount.toLocaleString()}자 (공백 포함)</span>
            <span>•</span>
            <span>약 {readTimeMinutes}분 소요</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTempSave}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest text-xs font-semibold shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>임시 저장</span>
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            aria-label={isEditMode ? '독후감 수정 완료' : '독서클럽에 발행하기'}
          >
            <span className="material-symbols-outlined text-[16px]">{isEditMode ? 'check_circle' : 'spa'}</span>
            <span>{loading ? (isEditMode ? '수정 중...' : '발행 중...') : (isEditMode ? '독후감 수정 완료' : '독서클럽에 발행하기')}</span>
          </button>
        </div>
      </section>

      {/* 2. Title & Author Banner Box */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container flex flex-col gap-4">
        {/* Author Row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold shadow-sm">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-title-sm text-sm font-semibold text-on-surface">
                  {authorNickname} 님
                </span>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-medium">
                  서평 기록가
                </span>
              </div>
              <span className="text-xs text-on-surface-variant">
                {clubName} • 도서: 《{bookTitle}》
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-on-surface-variant">단원 평점:</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="text-secondary hover:scale-110 transition-transform"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {star <= rating ? 'star' : 'star_border'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lyrical Title Input */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="이곳에 따뜻한 감상의 제목을 적어주세요..."
            className="w-full font-headline-lg text-xl sm:text-2xl font-bold text-on-surface placeholder:text-outline-variant bg-transparent outline-none tracking-tight"
          />
        </div>
      </div>

      {/* 3. Formatting Toolbar */}
      <div className="bg-surface-container rounded-xl px-4 py-2 shadow-sm flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          <div className="flex items-center bg-surface-container-lowest rounded-lg p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => insertFormatting('# ')}
              className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              title="큰 제목"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('## ')}
              className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              title="중간 제목"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('### ')}
              className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-on-surface-variant hover:bg-surface-container"
              title="소제목"
            >
              H3
            </button>
          </div>

          <span className="w-px h-5 bg-outline-variant mx-1"></span>

          <div className="flex items-center bg-surface-container-lowest rounded-lg p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => insertFormatting('**', '**')}
              className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              title="굵게"
            >
              <span className="material-symbols-outlined text-[18px]">format_bold</span>
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('*', '*')}
              className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              title="기울임"
            >
              <span className="material-symbols-outlined text-[18px]">format_italic</span>
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('~~', '~~')}
              className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              title="취소선"
            >
              <span className="material-symbols-outlined text-[18px]">strikethrough_s</span>
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('<mark>', '</mark>')}
              className="w-7 h-7 rounded flex items-center justify-center text-secondary hover:bg-surface-container"
              title="형광펜"
            >
              <span className="material-symbols-outlined text-[18px]">ink_highlighter</span>
            </button>
          </div>

          <span className="w-px h-5 bg-outline-variant mx-1"></span>

          <div className="flex items-center bg-surface-container-lowest rounded-lg p-0.5 shadow-sm">
            <button
              type="button"
              onClick={() => insertFormatting('> ', '')}
              className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              title="인용구"
            >
              <span className="material-symbols-outlined text-[18px]">format_quote</span>
            </button>
            <button
              type="button"
              onClick={() => insertFormatting('- ', '')}
              className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              title="글머리 기호"
            >
              <span className="material-symbols-outlined text-[18px]">format_list_bulleted</span>
            </button>
          </div>
        </div>

        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-on-surface-variant">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded text-primary focus:ring-0 accent-primary cursor-pointer"
          />
          <span>클럽 멤버 전체 공개</span>
        </label>
      </div>

      {/* 4. Book Quote Callout */}
      <div className="bg-surface-container-low rounded-xl p-4 border-l-4 border-primary">
        <label className="block text-xs font-semibold text-primary mb-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">format_quote</span>
          <span>마음에 남은 책 속 문장 (선택)</span>
        </label>
        <input
          type="text"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="예: “밥 딜런의 외할머니가 그랬어. 행복은 이미 누리고 있는 것을 좋아하는 것이라고.”"
          className="w-full bg-surface-container-lowest text-on-surface px-3 py-2 rounded-lg text-xs italic outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* 5. Main Writing Canvas */}
      <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container">
        <textarea
          id="review-content-area"
          rows={14}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="이 단원을 읽고 마음에 남은 생각과 감상을 편안하고 따뜻하게 기록해주세요..."
          className="w-full bg-transparent font-body-reading text-base leading-relaxed text-on-surface placeholder:text-outline-variant outline-none resize-y"
        />
      </div>
    </div>
  );
}
