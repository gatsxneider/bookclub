'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ScheduleManager from '@/components/ScheduleManager';
import BookSearchModal from '@/components/BookSearchModal';
import CreateClubModal from '@/components/CreateClubModal';
import AuthModal from '@/components/AuthModal';
import { Club, ClubSchedule, ClubMember } from '@/types/database';
import { calculateProgress, calculateDday } from '@/lib/core/scheduleCalculator';

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

  // 방장 여부: 로그인한 사용자가 클럽 leader_id와 일치하거나 기본 데모 모드일 때
  const isLeader = Boolean(user && club && user.id === club.leader_id) || (!user && club?.leader_id === '00000000-0000-0000-0000-000000000001');

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
      const schedRes = await fetch(`/api/clubs/${clubId}/schedules`);
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
  }, [clubId]);

  // 방장의 단원 추가
  const handleAddSchedule = async (scheduleData: {
    sequence: number;
    chapter_title: string;
    page_range: string;
    target_date: string;
  }) => {
    try {
      const res = await fetch(`/api/clubs/${clubId}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
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

  // 독후감 작성 페이지로 이동
  const handleWriteReview = (schedule: ClubSchedule) => {
    router.push(`/clubs/${clubId}/reviews/new?scheduleId=${schedule.id}`);
  };

  // 멤버 승인 처리
  const handleApproveMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/clubs/${clubId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, status: 'approved' }),
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

  // 멤버 제외 처리
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('정말 이 멤버를 제외하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/clubs/${clubId}/members?memberId=${memberId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('제외 실패');

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      alert('멤버를 클럽에서 제외했습니다.');
    } catch (err: any) {
      alert(err.message || '멤버 제외 중 문제가 발생했습니다.');
    }
  };

  const progress = calculateProgress(
    schedules.filter((s) => (s.reviews_count || 0) > 0).length,
    schedules.length || 1
  );
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
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold shadow-sm">
                <span className="material-symbols-outlined text-[16px]">shield_person</span>
                <span>단원 관리 모드 (방장)</span>
              </div>
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
          <section className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden border border-surface-container">
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary-fixed/25 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-secondary-fixed/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Book Cover */}
              <div className="lg:col-span-3 flex justify-center lg:justify-start">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => setActiveTab('schedules')}
                  title="클릭하여 단원별 독서 일정을 확인하세요"
                >
                  <div className="w-40 sm:w-44 md:w-48 aspect-[3/4.2] rounded-xl overflow-hidden shadow-xl bg-surface-container-high relative transition-transform duration-300 group-hover:-translate-y-1">
                    {club?.book?.thumbnail ? (
                      <img
                        src={club.book.thumbnail}
                        alt={club.book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-surface-container">
                        <span className="material-symbols-outlined text-[32px] text-primary mb-2">menu_book</span>
                        <span className="text-xs font-bold text-on-surface">{club?.book?.title || club?.name}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent flex flex-col justify-end p-3 text-inverse-on-surface">
                      <span className="text-[10px] opacity-80 uppercase tracking-widest">
                        {club?.book?.publisher}
                      </span>
                      <span className="font-headline-sm text-sm font-semibold leading-tight">
                        {club?.book?.title}
                      </span>
                      <span className="text-[10px] opacity-90 mt-0.5">
                        {Array.isArray(club?.book?.authors) ? club.book.authors.join(', ') : club?.book?.authors}
                      </span>
                    </div>
                  </div>
                  <span className="absolute -top-2 -left-2 px-2.5 py-1 rounded-full bg-primary text-on-primary text-[11px] font-semibold shadow-md flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">auto_stories</span>
                    <span>정기 도서</span>
                  </span>
                </div>
              </div>

              {/* Book & Club Metadata */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-primary-fixed-dim/40 text-on-primary-fixed text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span>북토크 & 독서 진행중</span>
                </div>

                <div>
                  <h1 className="font-headline-lg text-2xl sm:text-3xl text-primary font-bold tracking-tight">
                    {club?.name}
                  </h1>
                  <p className="font-body-reading text-sm text-on-surface-variant mt-2 leading-relaxed">
                    {club?.description || '함께 모여 따뜻한 문장을 읽고 나눕니다.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-on-surface">
                  <div className="p-3 rounded-xl bg-surface-container-low flex flex-col">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">local_cafe</span> 모임 방장
                    </span>
                    <span className="text-xs font-bold mt-0.5 text-primary">
                      {club?.leader?.nickname || '달빛책방지기'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low flex flex-col">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">group</span> 참여 인원
                    </span>
                    <span className="text-xs font-bold mt-0.5">
                      정원 {club?.max_members || 6}명 <span className="text-secondary text-[11px] font-normal">({members.filter(m => m.status === 'approved').length}명 활동)</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low flex flex-col col-span-2 sm:col-span-1">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">event_available</span> 완독 D-Day
                    </span>
                    <span className="text-xs font-bold mt-0.5 text-secondary">{dDay}</span>
                  </div>
                </div>
              </div>

              {/* Completion Meter & Radial Visualizer */}
              <div className="lg:col-span-4 flex flex-col items-center lg:items-end justify-center">
                <div className="p-5 rounded-2xl bg-surface-container-low w-full max-w-sm flex items-center justify-between gap-4 shadow-sm border border-surface-container">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-on-surface-variant">북클럽 완독 진척률</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="font-display-hero text-3xl font-bold text-primary">{progress}</span>
                      <span className="text-lg font-bold text-primary">%</span>
                    </div>
                    <span className="text-xs text-secondary font-medium mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      <span>총 {schedules.length}개 단원 등록됨</span>
                    </span>
                  </div>

                  {/* Radial Gauge */}
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        className="text-surface-variant"
                        cx="50"
                        cy="50"
                        fill="none"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="9"
                      />
                      <circle
                        className="text-primary transition-all duration-1000 ease-out"
                        cx="50"
                        cy="50"
                        fill="none"
                        r="40"
                        stroke="currentColor"
                        strokeDasharray="251.2"
                        strokeDashoffset={`${251.2 - (251.2 * progress) / 100}`}
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
          </section>

          {/* 3. Tab Buttons: 단원 일정 vs 멤버 관리 */}
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
              onWriteReview={handleWriteReview}
              onViewReviews={(s) => router.push(`/book-reviews?schedule_id=${s.id}`)}
            />
          ) : (
            /* Member Management Tab */
            <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-surface-container space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-on-surface">클럽 멤버 관리</h3>
                  <p className="text-xs text-on-surface-variant">방장은 대기 중인 멤버를 승인하거나 제외할 수 있습니다.</p>
                </div>
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
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary text-xs shadow-sm">
                          {m.profile?.nickname?.[0] || 'M'}
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
                            매너온도 {m.profile?.manner_temperature || 36.5}℃
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
    </div>
  );
}
