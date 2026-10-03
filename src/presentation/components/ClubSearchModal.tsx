'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Club } from '@/domain/entities';
import { useAuth } from '@/presentation/context/AuthContext';
import { useToast } from './ui/Toast';
import { apiClient } from '@/presentation/lib/apiClient';
import { Modal } from './ui/Modal';
import { Tabs } from './ui/Tabs';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { inputClass } from './ui/FormField';
import Link from 'next/link';

interface ClubSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateClub?: () => void;
}

export default function ClubSearchModal({
  isOpen,
  onClose,
  onOpenCreateClub,
}: ClubSearchModalProps) {
  const { user } = useAuth();
  const { notify } = useToast();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed'>('active');

  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      apiClient
        .get<{ clubs: Club[] }>('/api/clubs')
        .then((data) => setClubs(data.clubs || []))
        .catch((err) => notify(err.message || '클럽 목록 조회 실패', 'error'))
        .finally(() => setLoading(false));
    } else {
      setSelectedClub(null);
      setIsApplying(false);
    }
  }, [isOpen, notify]);

  const filteredClubs = useMemo(() => {
    return clubs.filter((c) => {
      const matchStatus = statusFilter === 'active' ? c.status !== 'completed' : c.status === 'completed';
      if (!matchStatus) return false;
      if (!searchTerm.trim()) return true;
      const lower = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(lower) ||
        (c.book?.title || '').toLowerCase().includes(lower) ||
        (c.leader?.nickname || '').toLowerCase().includes(lower)
      );
    });
  }, [clubs, statusFilter, searchTerm]);

  const handleApplyJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub || !user) return;

    setApplyLoading(true);
    try {
      await apiClient.post('/api/messages', {
        receiver_id: selectedClub.leader_id,
        title: `👋 '${user.nickname}' 님의 '${selectedClub.name}' 클럽 가입 신청`,
        content: applyMessage.trim() || `안녕하세요! '${selectedClub.name}' 독서클럽에 참여하고 싶습니다.`,
        type: 'club_join_request',
        related_club_id: selectedClub.id,
      });

      notify('방장님께 가입 신청 쪽지를 발송했습니다!', 'success');
      setIsApplying(false);
      setApplyMessage('');
    } catch (err: any) {
      notify(err.message || '가입 신청에 실패했습니다.', 'error');
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="독서클럽 탐색 및 가입"
      description="다양한 주제의 북클럽을 찾아보고 멤버로 참여해보세요."
      icon="explore"
      size="xl"
    >
      <div className="flex flex-col h-[560px] max-h-[70vh]">
        {/* 상단 검색 & 필터 탭 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-surface-container shrink-0">
          <Tabs
            label="클럽 진행 상태"
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            items={[
              { value: 'active', label: '모집 / 진행 중', icon: 'auto_stories' },
              { value: 'completed', label: '완독된 클럽', icon: 'task_alt' },
            ]}
          />

          <div className="w-full sm:w-64">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="클럽명, 도서명, 방장명 검색"
              aria-label="클럽 검색어"
              className={`${inputClass} text-xs py-2`}
            />
          </div>
        </div>

        {/* 2단 분할 레이아웃 */}
        <div className="grid grid-cols-1 sm:grid-cols-12 flex-1 overflow-hidden min-h-0 divide-y sm:divide-y-0 sm:divide-x divide-surface-container">
          {/* 좌측: 클럽 목록 */}
          <div className="sm:col-span-6 h-full overflow-y-auto p-2">
            {loading ? (
              <div className="p-12 text-center text-xs text-on-surface-variant flex flex-col items-center gap-2">
                <Icon name="progress_activity" className="animate-spin text-2xl text-primary" />
                <span>클럽 목록을 불러오는 중입니다...</span>
              </div>
            ) : filteredClubs.length > 0 ? (
              <ul role="list" className="space-y-2">
                {filteredClubs.map((club) => {
                  const isSelected = selectedClub?.id === club.id;
                  const memberCount = (club.members || []).filter((m) => m.status === 'approved').length;

                  return (
                    <li key={club.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClub(club);
                          setIsApplying(false);
                        }}
                        aria-pressed={isSelected}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left border transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary shadow-sm'
                            : 'bg-surface-container-lowest border-surface-container hover:bg-surface-container-low'
                        }`}
                      >
                        <div className="w-12 h-16 rounded-lg overflow-hidden bg-surface-container shrink-0 shadow-xs">
                          <img
                            src={club.book?.thumbnail || '/images/book-placeholder.png'}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/images/book-placeholder.png';
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 inline-block mb-1">
                            {club.status === 'completed' ? '완독 완료' : '모집중'}
                          </span>
                          <h4 className="font-bold text-sm text-on-surface truncate">{club.name}</h4>
                          <p className="text-xs text-on-surface-variant truncate mt-0.5">
                            도서: {club.book?.title || '도서 정보 없음'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
                            <span>방장: {club.leader?.nickname || '방장'}</span>
                            <span>·</span>
                            <span>인원: {memberCount}/{club.max_members}명</span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-8 text-center text-xs text-on-surface-variant">
                조건에 맞는 독서클럽이 없습니다.
              </div>
            )}
          </div>

          {/* 우측: 상세 정보 및 가입 신청 */}
          <div className="sm:col-span-6 h-full overflow-y-auto p-4 sm:p-6 bg-surface-container-lowest flex flex-col justify-between">
            {selectedClub ? (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="font-headline-sm text-lg font-bold text-on-surface mb-1">
                    {selectedClub.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    개설일: {selectedClub.start_date || '일정 미정'} ~ {selectedClub.end_date || '상시'}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-surface-container-low text-xs flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">도서</span>
                    <span className="font-bold text-on-surface">{selectedClub.book?.title || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">방장</span>
                    <span className="font-bold text-on-surface">{selectedClub.leader?.nickname || '방장'} (온도 {selectedClub.leader?.manner_temperature ?? 20.0}℃)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">참여 인원</span>
                    <span className="font-bold text-primary">
                      {(selectedClub.members || []).filter((m) => m.status === 'approved').length} / {selectedClub.max_members}명
                    </span>
                  </div>
                </div>

                {selectedClub.description && (
                  <div>
                    <h4 className="text-xs font-bold text-on-surface-variant mb-1">모임 소개</h4>
                    <p className="text-xs text-on-surface leading-relaxed p-3 rounded-xl bg-surface-container-low/50">
                      {selectedClub.description}
                    </p>
                  </div>
                )}

                {/* 가입 신청 폼 */}
                {isApplying ? (
                  <form onSubmit={handleApplyJoin} className="flex flex-col gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/20">
                    <label className="text-xs font-bold text-primary">방장님께 전할 가입 인사말</label>
                    <textarea
                      value={applyMessage}
                      onChange={(e) => setApplyMessage(e.target.value)}
                      placeholder="함께 읽고 싶은 이유나 다짐을 간단히 적어보세요."
                      rows={3}
                      className={`${inputClass} text-xs resize-none`}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIsApplying(false)}>
                        취소
                      </Button>
                      <Button type="submit" variant="primary" size="sm" loading={applyLoading}>
                        신청 쪽지 발송
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-2 pt-3">
                    <Button
                      variant="primary"
                      icon="mail"
                      fullWidth
                      onClick={() => {
                        if (!user) {
                          notify('로그인 후 가입 신청이 가능합니다.', 'info');
                          return;
                        }
                        setIsApplying(true);
                      }}
                    >
                      클럽 가입 신청하기
                    </Button>
                    <Link
                      href={`/clubs/${selectedClub.id}`}
                      className="text-center text-xs font-bold text-primary hover:underline py-2"
                    >
                      클럽 상세 페이지 둘러보기 →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-on-surface-variant gap-2 p-6">
                <Icon name="groups" className="text-4xl text-on-surface-variant/40" />
                <p className="text-xs">왼쪽 목록에서 클럽을 선택하여 상세 정보와 일정을 확인해보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
