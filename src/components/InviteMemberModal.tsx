'use client';

import React, { useState, useEffect } from 'react';
import { Profile } from '@/types/database';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (nickname: string) => Promise<boolean>;
  clubName?: string;
  existingMemberNicknames?: string[];
}

export default function InviteMemberModal({
  isOpen,
  onClose,
  onInvite,
  clubName,
  existingMemberNicknames = [],
}: InviteMemberModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 닉네임 검색
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setErrorMsg('');
      return;
    }

    const timer = setTimeout(async () => {
      const trimmed = searchQuery.trim();
      setSearching(true);
      setErrorMsg('');
      try {
        const url = trimmed ? `/api/users/search?q=${encodeURIComponent(trimmed)}` : '/api/users/search';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
        }
      } catch (err) {
        console.warn('User search error:', err);
      } finally {
        setSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  if (!isOpen) return null;

  const handleDirectInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = searchQuery.trim();
    if (!target) {
      setErrorMsg('초대할 회원의 닉네임을 입력해주세요.');
      return;
    }

    if (existingMemberNicknames.some((nick) => nick.toLowerCase() === target.toLowerCase())) {
      setErrorMsg(`'${target}' 님은 이미 클럽 멤버로 참여 중입니다.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const success = await onInvite(target);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || '멤버 초대 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectUser = async (user: Profile) => {
    if (existingMemberNicknames.some((nick) => nick.toLowerCase() === user.nickname.toLowerCase())) {
      setErrorMsg(`'${user.nickname}' 님은 이미 클럽 멤버로 참여 중입니다.`);
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const success = await onInvite(user.nickname);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || '멤버 초대 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
    >
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-outline-variant flex flex-col max-h-[85vh]">
        {/* Header Strip */}
        <div className="h-1.5 bg-gradient-to-r from-primary-fixed via-primary to-secondary-container shrink-0" />

        {/* Modal Header */}
        <div className="p-5 border-b border-surface-container flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <div>
              <h3 id="invite-modal-title" className="font-headline-sm text-base font-bold text-on-surface">
                클럽 멤버 초대
              </h3>
              <p className="text-[11px] text-on-surface-variant truncate max-w-[240px]">
                {clubName ? `[${clubName}] 에 새 멤버를 초대합니다.` : '닉네임으로 회원을 검색하여 등록합니다.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Search Form */}
          <form onSubmit={handleDirectInvite} className="space-y-2">
            <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-primary">search</span>
              <span>초대할 닉네임 검색 및 입력</span>
            </label>
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="예: 모래고래, 아린, 달빛서재"
                  className="w-full bg-surface-container-low text-on-surface pl-3.5 pr-8 py-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface border border-surface-container"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface text-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">cancel</span>
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting || !searchQuery.trim()}
                className="px-4 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-bold transition-all disabled:opacity-50 shrink-0"
              >
                {submitting ? '초대 중...' : '등록하기'}
              </button>
            </div>
          </form>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-1.5 animate-shake">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Search Results / Member Suggestions */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-on-surface-variant">
              {searchQuery.trim() ? `검색 결과 (${searchResults.length}명)` : '추천 회원 목록'}
            </span>

            {searching ? (
              <div className="py-6 text-center text-xs text-primary flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                <span>회원 검색 중...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {searchResults.map((user) => {
                  const isAlreadyMember = existingMemberNicknames.some(
                    (n) => n.toLowerCase() === user.nickname.toLowerCase()
                  );

                  return (
                    <div
                      key={user.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        isAlreadyMember
                          ? 'bg-surface-container-low border-surface-container opacity-60'
                          : 'bg-surface-container-lowest border-surface-container hover:border-primary/40 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center font-bold text-primary text-xs shrink-0">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.nickname}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/avatars/avatar_cat.png';
                              }}
                            />
                          ) : (
                            user.nickname[0]
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-on-surface">{user.nickname}</span>
                            {user.completed_count ? (
                              <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary text-[9px] font-extrabold">
                                Lv.{Math.min(5, Math.max(1, user.completed_count))}
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[10px] text-on-surface-variant">
                            온도 {user.manner_temperature ?? 20.0}℃
                          </span>
                        </div>
                      </div>

                      {isAlreadyMember ? (
                        <span className="text-[11px] font-semibold text-on-surface-variant px-2.5 py-1 rounded-full bg-surface-container">
                          참여 중
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => handleSelectUser(user)}
                          className="px-3 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary hover:text-on-secondary text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1 shadow-2xs"
                        >
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          <span>초대</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl p-4">
                <p className="font-semibold text-on-surface">일치하는 회원이 없습니다.</p>
                <p className="text-[11px] text-on-surface-variant mt-1">
                  입력란에 닉네임을 적고 <strong>[등록하기]</strong> 버튼을 누르면 새 멤버로 즉시 등록할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface-container-low border-t border-surface-container flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
