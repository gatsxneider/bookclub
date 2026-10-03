'use client';

import React, { useState, useEffect } from 'react';
import { Book } from '@/domain/entities';
import { Modal } from './ui/Modal';
import { FormField, inputClass } from './ui/FormField';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import { apiClient } from '@/presentation/lib/apiClient';

interface CreateClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBook?: Book | null;
  book?: Book | null;
  onSuccess?: (clubId: string) => void;
}

export default function CreateClubModal({
  isOpen,
  onClose,
  selectedBook,
  book,
  onSuccess,
}: CreateClubModalProps) {
  const { notify } = useToast();
  const currentBook = selectedBook ?? book ?? null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentBook) {
      setName(`[함께 읽기] ${currentBook.title}`);
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      // 기본 4주 뒤 종료일
      const future = new Date();
      future.setDate(future.getDate() + 28);
      setEndDate(future.toISOString().split('T')[0]);
    }
  }, [currentBook, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) {
      setErrorMsg('선택된 도서가 없습니다.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('클럽 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiClient.post<{ success: boolean; club: { id: string } }>('/api/clubs', {
        isbn: selectedBook.isbn,
        name: name.trim(),
        description: description.trim() || undefined,
        max_members: Number(maxMembers) || 10,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        book: selectedBook,
      });

      if (res.success && res.club) {
        notify('새로운 독서 모임이 개설되었습니다!', 'success');
        onSuccess?.(res.club.id);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || '클럽 개설 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedBook) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="새 독서클럽 개설"
      description="선택한 책으로 다정한 사람들과 함께 읽는 모임을 만들어보세요."
      icon="group_add"
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {errorMsg && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium"
          >
            {errorMsg}
          </div>
        )}

        {/* 선택된 도서 요약 카드 */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-container-low border border-surface-container">
          <div className="w-12 h-16 rounded-lg overflow-hidden bg-surface-container shrink-0 shadow-xs">
            <img
              src={selectedBook.thumbnail || '/images/book-placeholder.png'}
              alt={`${selectedBook.title} 표지`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/images/book-placeholder.png';
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-primary block">선택된 도서</span>
            <h4 className="font-bold text-sm text-on-surface truncate">{selectedBook.title}</h4>
            <p className="text-xs text-on-surface-variant truncate">
              {Array.isArray(selectedBook.authors) ? selectedBook.authors.join(', ') : selectedBook.authors}
            </p>
          </div>
        </div>

        <FormField label="클럽 이름" required>
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: [함께 읽기] 소년이 온다"
              maxLength={100}
              className={inputClass}
            />
          )}
        </FormField>

        <FormField label="클럽 소개 및 목표" hint="어떤 방식으로 읽고 나눌지 간단히 적어주세요.">
          {(fieldProps) => (
            <textarea
              {...fieldProps}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 매주 한 단원씩 편안하게 읽고 자유롭게 독후감을 공유하는 모임입니다."
              rows={3}
              maxLength={500}
              className={`${inputClass} resize-none`}
            />
          )}
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FormField label="최대 인원" required>
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="number"
                min={1}
                max={50}
                value={maxMembers}
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                className={inputClass}
              />
            )}
          </FormField>

          <FormField label="시작일">
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            )}
          </FormField>

          <FormField label="목표 종료일">
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClass}
              />
            )}
          </FormField>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
          <Button type="button" variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            클럽 개설하기
          </Button>
        </div>
      </form>
    </Modal>
  );
}
