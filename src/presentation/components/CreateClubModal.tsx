'use client';

import React, { useState, useEffect } from 'react';
import { Book } from '@/domain/entities';
import { Modal } from './ui/Modal';
import { FormField, inputClass } from './ui/FormField';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import { useContext } from 'react';
import { AuthContext } from '@/presentation/context/AuthContext';
import { apiClient } from '@/presentation/lib/apiClient';
import curatedBooksData from '@/shared/data/curatedBooks.json';
import { pickRandomUnreadBook, getAllCuratedBooks } from '@/domain/rules/bookSearch';

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
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;
  const { notify } = useToast();

  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [isRecommended, setIsRecommended] = useState(false);
  const [readIsbns, setReadIsbns] = useState<Set<string>>(new Set());
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState(10);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 사용자가 참여/개설(완독 및 독서 진행 중)한 클럽의 도서 및 카테고리 정보 조회
  useEffect(() => {
    const fetchUserReadData = async () => {
      try {
        const data = await apiClient.get<{ clubs: any[] }>('/api/clubs');
        if (data.clubs && Array.isArray(data.clubs)) {
          const isbns = new Set<string>();
          const categories: string[] = [];

          // 전체 큐레이션 데이터에서 isbn -> category 매핑 구축
          const allCurated = getAllCuratedBooks(curatedBooksData);
          const isbnToCategory = new Map<string, string>();
          allCurated.forEach((b) => {
            if (b.isbn && b.category) {
              isbnToCategory.set(b.isbn, b.category);
            }
          });

          data.clubs.forEach((club: any) => {
            const isLeader = user?.id && (club.leader_id === user.id || club.leader?.id === user.id);
            const isMember = user?.id && (club.members || []).some(
              (m: any) => m.user_id === user.id || m.profile?.id === user.id
            );

            if (!user?.id || isLeader || isMember) {
              const targetIsbn = club.isbn || club.book?.isbn;
              if (targetIsbn) {
                isbns.add(targetIsbn);
                const cat = club.book?.category || isbnToCategory.get(targetIsbn);
                if (cat && !categories.includes(cat)) {
                  categories.push(cat);
                }
              }
            }
          });

          setReadIsbns(isbns);
          setPreferredCategories(categories);
        }
      } catch {
        // ignore
      }
    };
    fetchUserReadData();
  }, [user?.id]);

  // 모달이 열릴 때 도서 지정 또는 랜덤 미독서(동일 카테고리 우선) 추천
  useEffect(() => {
    if (!isOpen) return;

    const propBook = selectedBook ?? book ?? null;
    if (propBook) {
      setActiveBook(propBook);
      setIsRecommended(false);
      setName(`[함께 읽기] ${propBook.title}`);
    } else {
      // 선택된 도서가 없는 경우: 완독/진행중 도서 제외 및 동일 카테고리 우선 추천
      const recommended = pickRandomUnreadBook(curatedBooksData, readIsbns, preferredCategories);
      if (recommended) {
        setActiveBook(recommended);
        setIsRecommended(true);
        setName(`[함께 읽기] ${recommended.title}`);
      }
    }

    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    const future = new Date();
    future.setDate(future.getDate() + 28);
    setEndDate(future.toISOString().split('T')[0]);
    setErrorMsg(null);
  }, [isOpen, selectedBook, book, readIsbns, preferredCategories]);

  // 다른 추천 도서로 다시 뽑기 (동일 카테고리 우선 유지)
  const handleRerollRecommendation = () => {
    const nextBook = pickRandomUnreadBook(curatedBooksData, readIsbns, preferredCategories);
    if (nextBook) {
      setActiveBook(nextBook);
      setName(`[함께 읽기] ${nextBook.title}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetBook = activeBook || selectedBook || book;
    if (!targetBook) {
      setErrorMsg('도서 정보가 없습니다.');
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
        isbn: targetBook.isbn,
        name: name.trim(),
        description: description.trim() || undefined,
        max_members: Number(maxMembers) || 10,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        book: targetBook,
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

        {/* 선택된 도서 / 추천 도서 요약 카드 */}
        {activeBook && (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-surface-container-low border border-surface-container">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-16 rounded-lg overflow-hidden bg-surface-container shrink-0 shadow-xs">
                <img
                  src={activeBook.thumbnail || '/images/book-placeholder.png'}
                  alt={`${activeBook.title} 표지`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/book-placeholder.png';
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      isRecommended
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-primary-fixed text-on-primary-fixed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {isRecommended ? 'auto_awesome' : 'bookmark'}
                    </span>
                    <span>{isRecommended ? '추천 도서' : '선택된 도서'}</span>
                  </span>
                  {activeBook.category && (
                    <span className="text-[11px] font-medium text-on-surface-variant">
                      {activeBook.category}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-sm text-on-surface truncate">{activeBook.title}</h4>
                <p className="text-xs text-on-surface-variant truncate">
                  {Array.isArray(activeBook.authors) ? activeBook.authors.join(', ') : activeBook.authors || '저자 미상'}
                </p>
              </div>
            </div>

            {isRecommended && (
              <button
                type="button"
                onClick={handleRerollRecommendation}
                title="다른 추천 도서 뽑기"
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-all flex items-center gap-1 text-xs font-semibold"
              >
                <span className="material-symbols-outlined text-[15px]">refresh</span>
                <span className="hidden sm:inline">다른 추천</span>
              </button>
            )}
          </div>
        )}

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
