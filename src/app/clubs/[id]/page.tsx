'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ScheduleManager from '@/components/ScheduleManager';
import BookSearchModal from '@/components/BookSearchModal';
import CreateClubModal from '@/components/CreateClubModal';
import AuthModal from '@/components/AuthModal';
import InviteMemberModal from '@/components/InviteMemberModal';
import RemoveMemberModal from '@/components/RemoveMemberModal';
import { Club, ClubSchedule, ClubMember } from '@/types/database';
import {
  calculateProgress,
  calculateClubTotalProgress,
  calculateDday,
} from '@/lib/core/scheduleCalculator';
import { useAuth } from '@/context/AuthContext';

export default function ClubDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const clubId = params.id;
  const { user } = useAuth();

  const [club, setClub] = useState<Club | null>(null);
  const [schedules, setSchedules] = useState<ClubSchedule[]>([]);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [activeTab, setActiveTab] = useState<'schedules' | 'members'>('schedules');
  const [loading, setLoading] = useState(true);

  // 모달
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);

  // 방장 여부 판별
  const isLeader = Boolean(
    (user && club && (user.id === club.leader_id || club.leader_id === '00000000-0000-0000-0000-000000000001')) ||
    (user && members.some((m) => m.user_id === user.id && m.role === 'leader')) ||
    (!user && (!club?.leader_id || club?.leader_id === '00000000-0000-0000-0000-000000000001'))
  );

  // 기본 폴백 데이터 (데이터가 없을 때 UI 가이드용)
  const defaultClub: Club = {
    id: clubId,
    leader_id: '00000000-0000-0000-0000-000000000001',
    name: '고요한 숲속 심야 독서회',
    description: '매일 밤 따뜻한 차 한 잔을 곁들이며, 삶의 모퉁이에서 만난 따스한 온기를 문장으로 기록합니다.',
    status: 'active',
    max_members: 6,
    start_date: '2026-09-01',
    end_date: '2026-10-15',
    book: {
      isbn: '9791161571188',
      title: '불편한 편의점',
      authors: ['김호연'],
      publisher: '나무옆의자',
      thumbnail:
        'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5871383%3Ftimestamp%3D20240904121510',
      contents: '서울역 노숙자 독고 씨가 야간 알바를 하며 전하는 따뜻한 온기 이야기',
      category: '01. 소설 / 문학',
    },
  };

  // API 데이터 로드
  const loadClubData = async () => {
    setLoading(true);
    try {
      // 1. 클럽 상세 정보
      const clubRes = await fetch(`/api/clubs/${clubId}`);
      if (clubRes.ok) {
        const clubData = await clubRes.json();
        if (clubData.club) {
          setClub(clubData.club);
        } else {
          setClub(defaultClub);
        }
      } else {
        setClub(defaultClub);
      }

      // 2. 단원 일정
      const schedUrl = user?.id
        ? `/api/clubs/${clubId}/schedules?userId=${user.id}`
        : `/api/clubs/${clubId}/schedules`;
      const schedRes = await fetch(schedUrl);
      if (schedRes.ok) {
        const schedData = await schedRes.json();
        setSchedules(schedData.schedules || []);
      }

      // 3. 멤버 목록
      const memRes = await fetch(`/api/clubs/${clubId}/members`);
      if (memRes.ok) {
        const memData = await memRes.json();
        setMembers(memData.members || []);
      }
    } catch (err) {
      console.warn('데이터 로드 실패:', err);
      setClub(defaultClub);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClubData();
  }, [clubId, user?.id]);

  // 방장이 아닐 경우 멤버 관리 탭에서 일정 탭으로 자동 전환
  useEffect(() => {
    if (!isLeader && activeTab === 'members') {
      setActiveTab('schedules');
    }
  }, [isLeader, activeTab]);

  // 방장의 단원 추가
  const handleAddSchedule = async (scheduleData: {
    sequence: number;
    chapter_title: string;
    page_range: string;
    target_date: string;
  }) => {
    try {
      const currentUserId = user?.id || '00000000-0000-0000-0000-000000000001';
      const res = await fetch(`/api/clubs/${clubId}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scheduleData,
          user_id: currentUserId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '단원 추가 실패');
      }

      const data = await res.json();
      if (data.schedule) {
        setSchedules((prev) => [...prev, { ...data.schedule, reviews_count: 0 }]);
      }
      alert('단원 일정이 성공적으로 등록되었습니다.');
    } catch (err: any) {
      alert(err.message || '단원 등록 중 오류가 발생했습니다.');
    }
  };

  // 방장의 단원 수정
  const handleUpdateSchedule = async (
    scheduleId: string,
    updatedData: { chapter_title: string; page_range: string; target_date: string }
  ) => {
    try {
      const currentUserId = user?.id || '00000000-0000-0000-0000-000000000001';
      const res = await fetch(`/api/clubs/${clubId}/schedules`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_id: scheduleId,
          ...updatedData,
          user_id: currentUserId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '단원 일정 수정 실패');
      }

      const data = await res.json();
      if (data.schedule) {
        setSchedules((prev) =>
          prev.map((s) => (s.id === scheduleId ? { ...s, ...data.schedule } : s))
        );
      }
      alert('단원 일정이 성공적으로 수정되었습니다.');
    } catch (err: any) {
      alert(err.message || '단원 수정 중 오류가 발생했습니다.');
    }
  };

  // 방장의 단원 삭제
  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const currentUserId = user?.id || '00000000-0000-0000-0000-000000000001';
      const res = await fetch(
        `/api/clubs/${clubId}/schedules?scheduleId=${scheduleId}&userId=${currentUserId}`,
        {
          method: 'DELETE',
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '단원 일정 삭제 실패');
      }

      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
      alert('단원 일정이 삭제되었습니다.');
    } catch (err: any) {
      alert(err.message || '단원 삭제 중 오류가 발생했습니다.');
    }
  };

  // 독후감 작성 페이지로 이동
  const handleWriteReview = (schedule: ClubSchedule) => {
    router.push(`/clubs/${clubId}/reviews/new?scheduleId=${schedule.id}`);
  };

  // 멤버 승인 처리
  const handleApproveMember = async (memberId: string) => {
    try {
      const currentUserId = user?.id || '00000000-0000-0000-0000-000000000001';
      const res = await fetch(`/api/clubs/${clubId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, status: 'approved', currentUserId }),
      });

      if (!res.ok) throw new Error('승인 실패');

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, status: 'approved' } : m))
      );
      alert('멤버 가입이 승인되었습니다.');
    } catch (err: any) {
      alert(err.message || '멤버 승인 중 문제가 발생했습니다.');
    }
  };

  // 멤버 제외 처리 (목록 개별 버튼용)
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('정말 이 멤버를 제외하시겠습니까?')) return;
    try {
      const currentUserId = user?.id || '00000000-0000-0000-0000-000000000001';
      const res = await fetch(
        `/api/clubs/${clubId}/members?memberId=${memberId}&userId=${currentUserId}`,
        {
          method: 'DELETE',
        }
      );

      if (!res.ok) throw new Error('제외 실패');

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      alert('멤버를 클럽에서 제외했습니다.');
    } catch (err: any) {
      alert(err.message || '멤버 제외 중 문제가 발생했습니다.');
    }
  };

  // 멤버 초대 모달을 통한 닉네임 초대 처리
  const handleInviteMember = async (nickname: string): Promise<boolean> => {
    try {
      const currentUserId = user?.id || '00000000-0000-0000-0000-000000000001';
      const res = await fetch(`/api/clubs/${clubId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          currentUserId,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '멤버 초대에 실패했습니다.');
      }

      alert(`'${nickname}' 님이 클럽 멤버로 등록되었습니다! 🌿`);
      await loadClubData();
      return true;
    } catch (err: any) {
      alert(err.message || '멤버 초대 중 문제가 발생했습니다.');
      return false;
    }
  };

  // 멤버 제외 모달을 통한 멤버 제외 처리
  const handleRemoveMemberFromModal = async (
    memberId: string,
    memberNickname: string
  ): Promise<boolean> => {
    try {
      const currentUserId = user?.id || '00000000-0000-0000-0000-000000000001';
      const res = await fetch(
        `/api/clubs/${clubId}/members?memberId=${memberId}&userId=${currentUserId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '멤버 제외에 실패했습니다.');
      }

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      alert(`'${memberNickname}' 님을 클럽 멤버에서 제외했습니다.`);
      return true;
    } catch (err: any) {
      alert(err.message || '멤버 제외 중 문제가 발생했습니다.');
      return false;
    }
  };

  const totalSchedulesCount = schedules.length || 1;
  const activeMembersCount = members.length || 1;

  // 1. 독서회 전체 완독 진척률 (전체 참여 멤버 수 x 단원 수 대비 총 작성된 독후감 수의 비율)
  // 예: 멤버 2명, 단원 3개 -> 총 6건 중 3건 작성 시 50%
  const totalReviewsWritten = schedules.reduce(
    (sum, s) => sum + (s.reviews_count || 0),
    0
  );
  const {
    percentage: clubProgress,
    totalReviews: clubReviewsCount,
    targetReviews: clubTargetReviews,
  } = calculateClubTotalProgress(
    totalReviewsWritten,
    activeMembersCount,
    totalSchedulesCount
  );

  // 2. 개인 완독 진척률 (본인이 독후감을 작성 완료한 단원 비율 - 독서 레벨과 직접 연계)
  const myCompletedChapters = schedules.filter((s) => Boolean(s.my_review_submitted)).length;
  const myProgress = calculateProgress(myCompletedChapters, totalSchedulesCount);

  const dDay = calculateDday(club?.end_date);

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNewClub={() => setIsCreateOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main className="w-full pt-24 pb-16 flex-1">
        <div className="max-w-7xl mx-auto px-gutter flex flex-col gap-6">
          {/* 1. Breadcrumb & Top Utility Area */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">cottage</span>
                <span>홈</span>
              </Link>
              <span>/</span>
              <Link href="/my-clubs" className="hover:text-primary transition-colors">
                나의 독서클럽
              </Link>
              <span>/</span>
              <span className="text-on-surface font-semibold truncate max-w-xs">
                {club?.name || '독서클럽'}
              </span>
            </nav>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isLeader && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">shield_person</span>
                  <span>단원 관리 모드 (방장)</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    alert('클럽 초대 링크가 복사되었습니다!');
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface text-xs font-medium transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">share</span>
                <span>클럽 공유</span>
              </button>
            </div>
          </div>

          {/* 2. Book & Club Hero Card */}
          <section className="relative overflow-hidden rounded-3xl bg-surface-container-low p-6 sm:p-8 border border-surface-container shadow-xs">
            <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-start">
              {/* Book Cover */}
              <div className="shrink-0 w-28 sm:w-36 md:w-44 rounded-2xl overflow-hidden shadow-lg border border-surface-container bg-surface-container">
                <img
                  src={club?.book?.thumbnail || 'https://via.placeholder.com/180x260?text=Book+Cover'}
                  alt={club?.book?.title || '도서 표지'}
                  className="w-full h-full object-cover aspect-[3/4] hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Club Info */}
              <div className="flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-fixed text-primary shadow-2xs">
                      {club?.book?.category || '독서클럽'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-container-highest text-on-surface-variant">
                      {dDay}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-container-highest text-on-surface-variant">
                      멤버 {members.length} / {club?.max_members || 6}명
                    </span>
                  </div>

                  <h1 className="font-headline-lg text-2xl sm:text-3xl font-extrabold text-on-surface leading-tight">
                    {club?.name || '독서클럽'}
                  </h1>
                  <p className="font-title-sm text-sm text-on-surface-variant">
                    {club?.book?.title} · {club?.book?.authors?.join(', ')} 저 ({club?.book?.publisher})
                  </p>
                  <p className="text-xs sm:text-sm text-on-surface-variant line-clamp-2 leading-relaxed pt-1">
                    {club?.description || club?.book?.contents}
                  </p>
                </div>

                {/* Progress Metrics Area: 독서회 전체 완독 진척률 & 개인 완독 진척률 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* 1. 독서회 전체 완독 진척률 */}
                  <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-secondary">groups</span>
                        <span>독서회 전체 완독 진척률</span>
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-secondary">{clubProgress}%</span>
                        <span className="text-xs text-on-surface-variant">
                          ({clubReviewsCount}/{clubTargetReviews}건 기록됨)
                        </span>
                      </div>
                    </div>

                    {/* Circular Indicator */}
                    <div className="relative w-12 h-12 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          className="text-surface-container-high"
                          cx="50"
                          cy="50"
                          fill="none"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="9"
                        />
                        <circle
                          className="text-secondary transition-all duration-700 ease-out"
                          cx="50"
                          cy="50"
                          fill="none"
                          r="40"
                          stroke="currentColor"
                          strokeDasharray="251.2"
                          strokeDashoffset={`${251.2 - (251.2 * clubProgress) / 100}`}
                          strokeLinecap="round"
                          strokeWidth="9"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="material-symbols-outlined text-secondary text-[20px]">menu_book</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. 개인 완독 진척률 */}
                  <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-primary">person</span>
                        <span>개인 완독 진척률</span>
                        <span className="text-[9px] text-primary bg-primary/10 px-2 py-0.2 rounded-full font-bold ml-1">
                          레벨 연동
                        </span>
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-extrabold text-primary">{myProgress}%</span>
                        <span className="text-xs text-on-surface-variant">
                          ({myCompletedChapters}/{schedules.length} 단원 완독)
                        </span>
                      </div>
                    </div>

                    {/* Circular Leaf Indicator */}
                    <div className="relative w-12 h-12 shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                          className="text-surface-container-high"
                          cx="50"
                          cy="50"
                          fill="none"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="9"
                        />
                        <circle
                          className="text-primary transition-all duration-700 ease-out"
                          cx="50"
                          cy="50"
                          fill="none"
                          r="40"
                          stroke="currentColor"
                          strokeDasharray="251.2"
                          strokeDashoffset={`${251.2 - (251.2 * myProgress) / 100}`}
                          strokeLinecap="round"
                          strokeWidth="9"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="material-symbols-outlined text-primary text-[20px]">energy_savings_leaf</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Tab Buttons: 단원 일정 vs 멤버 관리 (방장에게만 멤버 관리 탭 노출) */}
          <div className="flex items-center gap-2 border-b border-surface-container pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('schedules')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === 'schedules'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
            >
              단원별 독서 일정 ({schedules.length})
            </button>
            {isLeader && (
              <button
                type="button"
                onClick={() => setActiveTab('members')}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  activeTab === 'members'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                멤버 관리 ({members.length})
              </button>
            )}
            <Link
              href={`/book-reviews?club_id=${clubId}`}
              className="ml-auto px-4 py-2 rounded-full bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary hover:text-on-secondary text-xs font-semibold transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">rate_review</span>
              <span>클럽 독후감 전체 모아보기</span>
            </Link>
          </div>

          {/* 4. Tab Content */}
          {activeTab === 'schedules' ? (
            <ScheduleManager
              schedules={schedules}
              isLeader={isLeader}
              onAddSchedule={handleAddSchedule}
              onUpdateSchedule={handleUpdateSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onWriteReview={handleWriteReview}
              onViewReviews={(s) => router.push(`/book-reviews?schedule_id=${s.id}`)}
              onRequireAuth={() => setIsAuthOpen(true)}
            />
          ) : (
            /* Member Management Tab (방장 전용) */
            <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-surface-container gap-3">
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">클럽 멤버 관리</h3>
                  <p className="text-xs text-on-surface-variant">방장은 대기 중인 멤버를 승인하거나 초대 및 제외할 수 있습니다.</p>
                </div>
                {isLeader && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInviteOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-xs transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_add</span>
                      <span>멤버 초대</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRemoveOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-error-container text-on-error-container hover:bg-error hover:text-on-error text-xs font-semibold shadow-xs transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px]">person_remove</span>
                      <span>멤버 제외</span>
                    </button>
                  </div>
                )}
              </div>

              {members.length === 0 ? (
                <div className="py-8 text-center text-on-surface-variant text-xs">
                  아직 참여 중인 멤버가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary text-xs shadow-sm overflow-hidden">
                          {m.profile?.avatar_url ? (
                            <img
                              src={m.profile.avatar_url}
                              alt={m.profile?.nickname || '멤버'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/avatars/avatar_cat.png';
                              }}
                            />
                          ) : (
                            m.profile?.nickname?.[0] || 'M'
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-on-surface">{m.profile?.nickname}</span>
                            {m.role === 'leader' && (
                              <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-semibold">
                                방장
                              </span>
                            )}
                            {m.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary text-[10px] font-semibold">
                                승인 대기
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-on-surface-variant">
                            감성 온도 {m.profile?.manner_temperature ?? 20.0}℃
                          </span>
                        </div>
                      </div>

                      {isLeader && m.role !== 'leader' && (
                        <div className="flex items-center gap-1.5">
                          {m.status === 'pending' ? (
                            <button
                              type="button"
                              onClick={() => handleApproveMember(m.id)}
                              className="px-3 py-1 rounded-full bg-primary text-on-primary text-[11px] font-semibold hover:bg-primary-container"
                            >
                              승인
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(m.id)}
                            className="px-3 py-1 rounded-full bg-surface-container-high hover:bg-error-container hover:text-on-error-container text-on-surface-variant text-[11px] font-semibold transition-colors"
                          >
                            제외
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      <BookSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectBook={() => {}}
      />
      <CreateClubModal
        isOpen={isCreateOpen}
        book={club?.book || null}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadClubData}
      />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={handleInviteMember}
        clubName={club?.name}
        existingMemberNicknames={members.map((m) => m.profile?.nickname || '').filter(Boolean)}
      />
      <RemoveMemberModal
        isOpen={isRemoveOpen}
        onClose={() => setIsRemoveOpen(false)}
        members={members}
        onRemove={handleRemoveMemberFromModal}
        clubName={club?.name}
      />
    </div>
  );
}
