'use client';

import React, { useState, useEffect } from 'react';
import { ClubMember } from '@/types/database';

interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: ClubMember[];
  onRemove: (memberId: string, memberNickname: string) => Promise<boolean>;
  clubName?: string;
}

export default function RemoveMemberModal({
  isOpen,
  onClose,
  members,
  onRemove,
  clubName,
}: RemoveMemberModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 제외 가능한 일반 멤버 목록 (방장 제외)
  const removableMembers = members.filter((m) => m.role !== 'leader');

  useEffect(() => {
    if (isOpen) {
      setSelectedMemberId(removableMembers[0]?.id || '');
      setErrorMsg('');
    }
  }, [isOpen, members]);

  if (!isOpen) return null;

  const handleConfirmRemove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setErrorMsg('제외할 멤버를 선택해주세요.');
      return;
    }

    const targetMember = removableMembers.find((m) => m.id === selectedMemberId);
    const targetNick = targetMember?.profile?.nickname || '선택한 멤버';

    if (!confirm(`정말 '${targetNick}' 님을 클럽에서 제외하시겠습니까?`)) {
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const success = await onRemove(selectedMemberId, targetNick);
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || '멤버 제외 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-modal-title"
    >
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-outline-variant flex flex-col max-h-[85vh]">
        {/* Header Strip */}
        <div className="h-1.5 bg-gradient-to-r from-error/60 via-error to-error-container shrink-0" />

        {/* Modal Header */}
        <div className="p-5 border-b border-surface-container flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-error-container flex items-center justify-center text-on-error-container shadow-sm">
              <span className="material-symbols-outlined text-[20px]">person_remove</span>
            </div>
            <div>
              <h3 id="remove-modal-title" className="font-headline-sm text-base font-bold text-on-surface">
                클럽 멤버 제외
              </h3>
              <p className="text-[11px] text-on-surface-variant truncate max-w-[240px]">
                {clubName ? `[${clubName}]` : '클럽에서 제외할 멤버를 선택해주세요.'}
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
        <form onSubmit={handleConfirmRemove} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            <div className="p-3 bg-surface-container-low rounded-xl text-xs text-on-surface-variant flex items-start gap-2">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">info</span>
              <span>
                방장을 제외한 일반 참여 멤버 목록입니다. 제외할 멤버를 선택한 후 하단의 제외하기 버튼을 눌러주세요.
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-1.5 animate-shake">
                <span className="material-symbols-outlined text-[16px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface">
                제외할 멤버 선택 ({removableMembers.length}명)
              </label>

              {removableMembers.length === 0 ? (
                <div className="py-8 text-center text-xs text-on-surface-variant bg-surface-container-low rounded-xl p-4">
                  <p className="font-semibold text-on-surface">제외 가능한 일반 멤버가 없습니다.</p>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    방장 외에 다른 참여 멤버가 있을 때 멤버를 제외할 수 있습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {removableMembers.map((m) => {
                    const isSelected = selectedMemberId === m.id;
                    const nick = m.profile?.nickname || '멤버';

                    return (
                      <label
                        key={m.id}
                        onClick={() => setSelectedMemberId(m.id)}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-error-container/20 border-error ring-1 ring-error/30 shadow-xs'
                            : 'bg-surface-container-lowest border-surface-container hover:border-outline-variant hover:bg-surface-container-low'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="selectedMember"
                            value={m.id}
                            checked={isSelected}
                            onChange={() => setSelectedMemberId(m.id)}
                            className="accent-error w-4 h-4 cursor-pointer"
                          />
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center font-bold text-primary text-xs shrink-0">
                            {m.profile?.avatar_url ? (
                              <img
                                src={m.profile.avatar_url}
                                alt={nick}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/avatars/avatar_cat.png';
                                }}
                              />
                            ) : (
                              nick[0]
                            )}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-on-surface">{nick}</span>
                              {m.status === 'pending' && (
                                <span className="px-1.5 py-0.2 rounded-full bg-secondary-fixed text-secondary text-[9px] font-semibold">
                                  승인 대기
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-on-surface-variant">
                              매너온도 {m.profile?.manner_temperature ?? 20.0}℃
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-xs font-bold text-error flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>선택됨</span>
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-surface-container-low border-t border-surface-container flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || removableMembers.length === 0 || !selectedMemberId}
              className="inline-flex items-center gap-1 px-5 py-2 rounded-full bg-error text-on-error hover:bg-error/90 text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              <span>{submitting ? '제외 처리 중...' : '선택한 멤버 제외하기'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
