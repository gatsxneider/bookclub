'use client';

import React, { useState, useEffect } from 'react';
import { ClubMember } from '@/domain/entities';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="클럽 멤버 제외"
      description={clubName ? `[${clubName}]` : '클럽에서 제외할 멤버를 선택해주세요.'}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleConfirmRemove} className="flex flex-col gap-4">
        <div className="p-3 bg-surface-container-low rounded-xl text-xs text-on-surface-variant flex items-start gap-2">
          <Icon name="info" className="text-primary text-[18px] shrink-0 mt-0.5" />
          <span>
            방장을 제외한 일반 참여 멤버 목록입니다. 제외할 멤버를 선택한 후 하단의 제외하기 버튼을 눌러주세요.
          </span>
        </div>

        {errorMsg && (
          <div role="alert" className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-1.5">
            <Icon name="error" className="text-[16px] shrink-0" />
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
            <div role="radiogroup" aria-label="제외할 멤버 선택" className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {removableMembers.map((m) => {
                const isSelected = selectedMemberId === m.id;
                const nick = m.profile?.nickname || '멤버';

                return (
                  <label
                    key={m.id}
                    onClick={() => setSelectedMemberId(m.id)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-error/10 border-error ring-1 ring-error/30 shadow-xs'
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
                          감성 온도 {m.profile?.manner_temperature ?? 20.0}℃
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-xs font-bold text-error flex items-center gap-0.5">
                        <Icon name="check_circle" className="text-[16px]" />
                        <span>선택됨</span>
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 -mx-6 -mb-6 bg-surface-container-low border-t border-surface-container flex items-center justify-end gap-2 rounded-b-3xl shrink-0 mt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={submitting || removableMembers.length === 0 || !selectedMemberId}
            loading={submitting}
            icon="delete"
          >
            선택한 멤버 제외하기
          </Button>
        </div>
      </form>
    </Modal>
  );
}
