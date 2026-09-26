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

export default function ClubDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const clubId = params.id;

  const [club, setClub] = useState<Club | null>(null);
  const [schedules, setSchedules] = useState<ClubSchedule[]>([]);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [isLeader, setIsLeader] = useState(true); // 기본적으로 방장 모드 지원 (시안 기준)
  const [activeTab, setActiveTab] = useState<'schedules' | 'members'>('schedules');

  // 모달
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // 기본 더미 데이터 (Supabase 연결 폴백 및 시안 반영)
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

  const defaultSchedules: ClubSchedule[] = [
    {
      id: 'sched-1',
      club_id: clubId,
      sequence: 1,
      chapter_title: '제1장. 2020 가을, 산해진미 도시락',
      page_range: 'p.1 ~ p.65',
      target_date: '2026-09-10',
      reviews_count: 6,
    },
    {
      id: 'sched-2',
      club_id: clubId,
      sequence: 2,
      chapter_title: '제2장. 제이에스 오브 제이에스',
      page_range: 'p.66 ~ p.132',
      target_date: '2026-09-17',
      reviews_count: 6,
    },
    {
      id: 'sched-3',
      club_id: clubId,
      sequence: 3,
      chapter_title: '제3장. 삼각김밥의 용도',
      page_range: 'p.133 ~ p.198',
      target_date: '2026-09-24',
      reviews_count: 5,
    },
    {
      id: 'sched-4',
      club_id: clubId,
      sequence: 4,
      chapter_title: '제4장. 네 잎 클로버의 기적',
      page_range: 'p.199 ~ p.262',
      target_date: '2026-10-01',
      reviews_count: 3,
    },
    {
      id: 'sched-5',
      club_id: clubId,
      sequence: 5,
      chapter_title: '제5장. 불편한 편의점의 에필로그',
      page_range: 'p.263 ~ p.310',
      target_date: '2026-10-15',
      reviews_count: 0,
    },
  ];

  const defaultMembers: ClubMember[] = [
    {
      id: 'mem-1',
      club_id: clubId,
      user_id: '00000000-0000-0000-0000-000000000001',
      role: 'leader',
      status: 'approved',
      profile: { id: 'user-1', nickname: '달빛책방지기 (김민서)', manner_temperature: 38.2 },
    },
    {
      id: 'mem-2',
      club_id: clubId,
      user_id: '00000000-0000-0000-0000-000000000002',
      role: 'member',
      status: 'approved',
      profile: { id: 'user-2', nickname: '지우 님 (나)', manner_temperature: 36.8 },
    },
    {
      id: 'mem-3',
      club_id: clubId,
      user_id: '00000000-0000-0000-0000-000000000003',
      role: 'member',
      status: 'approved',
      profile: { id: 'user-3', nickname: '도윤 님', manner_temperature: 37.0 },
    },
    {
      id: 'mem-4',
      club_id: clubId,
      user_id: '00000000-0000-0000-0000-000000000004',
      role: 'member',
      status: 'pending',
      profile: { id: 'user-4', nickname: '서연 님 (가입 대기)', manner_temperature: 36.5 },
    },
  ];

  // API 데이터 로드
  useEffect(() => {
    const loadClubData = async () => {
      try {
        const res = await fetch(`/api/clubs/${clubId}/schedules`);
        if (res.ok) {
          const data = await res.json();
          if (data.schedules && data.schedules.length > 0) {
            setSchedules(data.schedules);
          } else {
            setSchedules(defaultSchedules);
          }
        } else {
          setSchedules(defaultSchedules);
        }
      } catch {
        setSchedules(defaultSchedules);
      }

      setClub(defaultClub);
      setMembers(defaultMembers);
    };

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

      const newSched: ClubSchedule = {
        id: `sched-${Date.now()}`,
        club_id: clubId,
        sequence: scheduleData.sequence,
        chapter_title: scheduleData.chapter_title,
        page_range: scheduleData.page_range,
        target_date: scheduleData.target_date,
        reviews_count: 0,
      };

      setSchedules((prev) => [...prev, newSched]);
    } catch {
      alert('단원 등록 완료');
    }
  };

  // 독후감 작성 페이지로 이동
  const handleWriteReview = (schedule: ClubSchedule) => {
    router.push(`/clubs/${clubId}/reviews/new?scheduleId=${schedule.id}`);
  };

  // 멤버 승인 처리
  const handleApproveMember = async (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, status: 'approved' } : m))
    );
    alert('멤버 가입이 승인되었습니다.');
  };

  // 멤버 제외 처리
  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('정말 이 멤버를 제외하시겠습니까?')) return;
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    alert('멤버를 클럽에서 제외했습니다.');
  };

  const progress = calculateProgress(4, schedules.length || 5);
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
                {club?.name}
              </span>
            </nav>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold shadow-sm">
                <span className="material-symbols-outlined text-[16px]">shield_person</span>
                <span>단원 관리 모드 (방장 전용)</span>
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

          {/* 2. Book & Club Hero Card (_5/code.html 디자인) */}
          <section className="bg-surface-container-lowest rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden border border-surface-container">
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary-fixed/25 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full bg-secondary-fixed/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Book Cover (클릭 시 단원 일정 설정 유도) */}
              <div className="lg:col-span-3 flex justify-center lg:justify-start">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => setActiveTab('schedules')}
                  title="클릭하여 단원별 독서 일정을 확인하세요"
                >
                  <div className="w-40 sm:w-44 md:w-48 aspect-[3/4.2] rounded-xl overflow-hidden shadow-xl bg-surface-container-high relative transition-transform duration-300 group-hover:-translate-y-1">
                    <img
                      src={club?.book?.thumbnail}
                      alt={club?.book?.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent flex flex-col justify-end p-3 text-inverse-on-surface">
                      <span className="text-[10px] opacity-80 uppercase tracking-widest">
                        {club?.book?.publisher}
                      </span>
                      <span className="font-headline-sm text-sm font-semibold leading-tight">
                        {club?.book?.title}
                      </span>
                      <span className="text-[10px] opacity-90 mt-0.5">
                        {club?.book?.authors?.join(', ')}
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
                    {club?.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-on-surface">
                  <div className="p-3 rounded-xl bg-surface-container-low flex flex-col">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">local_cafe</span> 모임 방장
                    </span>
                    <span className="text-xs font-bold mt-0.5 text-primary">달빛책방지기</span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container-low flex flex-col">
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">group</span> 참여 인원
                    </span>
                    <span className="text-xs font-bold mt-0.5">
                      정원 {club?.max_members}명 <span className="text-secondary text-[11px] font-normal">({members.filter(m => m.status === 'approved').length}명 활동)</span>
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
                      <span>총 {schedules.length}개 단원 중 4개 진행</span>
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
              href={`/book-reviews?clubId=${clubId}`}
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
              onViewReviews={(s) => router.push(`/book-reviews?scheduleId=${s.id}`)}
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
        onSuccess={() => {}}
      />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
