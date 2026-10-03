'use client';

import React, { useState } from 'react';
import { Book } from '@/domain/entities';
import { useAuth } from '@/presentation/context/AuthContext';

interface CreateClubModalProps {
  isOpen: boolean;
  book: Book | null;
  onClose: () => void;
  onSuccess: (clubId: string) => void;
}

export default function CreateClubModal({
  isOpen,
  book,
  onClose,
  onSuccess,
}: CreateClubModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState(6);
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !book) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('클럽 이름을 입력해주세요');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          isbn: book.isbn,
          max_members: Number(maxMembers),
          end_date: endDate || undefined,
          book,
          user_id: user?.id,
          nickname: user?.nickname,
          email: user?.email,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '클럽 개설에 실패했습니다');
      }

      onSuccess(data.club?.id || '');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-outline-variant">
        {/* Header */}
        <div className="p-5 border-b border-surface-container flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">local_cafe</span>
            <div>
              <h2 className="font-headline-sm text-lg font-semibold text-on-surface">새 독서클럽 만들기</h2>
              <p className="text-xs text-on-surface-variant">
                방장: <span className="font-bold text-primary">{user?.nickname || '회원'}</span> 님
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Selected Book Banner */}
        <div className="p-4 bg-surface-container-lowest border-b border-surface-container flex gap-3 items-center">
          <div className="w-12 h-16 rounded overflow-hidden bg-surface-container shrink-0 shadow-sm">
            {book.thumbnail ? (
              <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-outline">
                <span className="material-symbols-outlined text-[18px]">book</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-secondary px-2 py-0.5 rounded-full bg-secondary-fixed">
              선정 도서
            </span>
            <h3 className="text-sm font-bold text-on-surface truncate mt-1">{book.title}</h3>
            <p className="text-xs text-on-surface-variant truncate">
              {Array.isArray(book.authors) ? book.authors.join(', ') : book.authors} · {book.publisher}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label htmlFor="club-name" className="block text-xs font-semibold text-on-surface mb-1">
              클럽 이름 <span className="text-secondary">*</span>
            </label>
            <input
              id="club-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 고요한 숲속 심야 독서회"
              className="w-full bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all"
            />
          </div>

          <div>
            <label htmlFor="club-desc" className="block text-xs font-semibold text-on-surface mb-1">
              클럽 소개
            </label>
            <textarea
              id="club-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="함께 읽는 방식이나 모임 일정, 나눔의 방향을 적어주세요."
              className="w-full bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="club-members" className="block text-xs font-semibold text-on-surface mb-1">
                모임 정원
              </label>
              <select
                id="club-members"
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                className="w-full bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all"
              >
                <option value={4}>4명 (소수 집중)</option>
                <option value={6}>6명 (권장 모임)</option>
                <option value={8}>8명</option>
                <option value={10}>10명</option>
                <option value={15}>15명</option>
              </select>
            </div>

            <div>
              <label htmlFor="club-end-date" className="block text-xs font-semibold text-on-surface mb-1">
                완독 목표일
              </label>
              <input
                id="club-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface transition-all"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-on-surface-variant hover:bg-surface-container text-xs font-semibold transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-full bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                  <span>개설 중...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">eco</span>
                  <span>독서클럽 개설하기</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
