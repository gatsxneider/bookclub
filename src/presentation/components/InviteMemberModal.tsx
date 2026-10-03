'use client';

import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { FormField, inputClass } from './ui/FormField';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';
import { useToast } from './ui/Toast';
import { apiClient } from '@/presentation/lib/apiClient';
import { Profile } from '@/domain/entities';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubId?: string;
  clubName?: string;
  onMemberAdded?: () => void;
  onInvite?: (nickname: string) => Promise<boolean | void>;
  existingMemberNicknames?: string[];
}

export default function InviteMemberModal({
  isOpen,
  onClose,
  clubId,
  clubName,
  onMemberAdded,
  onInvite,
  existingMemberNicknames,
}: InviteMemberModalProps) {
  const { notify } = useToast();

  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  const handleNicknameChange = async (val: string) => {
    setNickname(val);
    setErrorMsg(null);
    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    try {
      const res = await apiClient.get<{ users: Profile[] }>('/api/users/search', { q: val.trim() });
      setSuggestions(res.users || []);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (user: Profile) => {
    setNickname(user.nickname);
    setSuggestions([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNick = nickname.trim();
    if (!cleanNick) {
      setErrorMsg('초대할 회원의 닉네임을 입력해주세요.');
      return;
    }

    if (existingMemberNicknames && existingMemberNicknames.includes(cleanNick)) {
      setErrorMsg(`'${cleanNick}' 님은 이미 클럽 멤버로 참여 중입니다.`);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (onInvite) {
        await onInvite(cleanNick);
        notify(`'${cleanNick}' 님을 클럽 멤버로 초대했습니다!`, 'success');
        setNickname('');
        setSuggestions([]);
        onClose();
        return;
      }

      if (clubId) {
        await apiClient.post(`/api/clubs/${clubId}/members`, {
          nickname: cleanNick,
        });
        notify(`'${cleanNick}' 님을 클럽 멤버로 초대했습니다!`, 'success');
        setNickname('');
        setSuggestions([]);
        onMemberAdded?.();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || '멤버 초대에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="클럽 멤버 초대"
      description={clubName ? `[${clubName}] 함께 읽고 토론할 회원의 닉네임을 검색하여 클럽에 초대하세요.` : "함께 읽고 토론할 회원의 닉네임을 검색하여 클럽에 초대하세요."}
      icon="person_add"
      maxWidth="max-w-md"
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

        <div className="relative">
          <FormField label="회원 닉네임" required hint="검색된 회원 목록에서 선택하거나 직접 입력하세요.">
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                placeholder="예: 모래고래, 아린 (닉네임 입력)"
                autoComplete="off"
                className={inputClass}
              />
            )}
          </FormField>

          {/* 실시간 자동완성 제안 */}
          {suggestions.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-20 left-0 right-0 mt-1 bg-surface-container-lowest border border-surface-container shadow-xl rounded-2xl max-h-44 overflow-y-auto divide-y divide-surface-container"
            >
              {suggestions.map((u) => (
                <li
                  key={u.id}
                  role="option"
                  aria-selected={false}
                  onClick={() => handleSelectUser(u)}
                  className="flex items-center gap-3 p-3 hover:bg-surface-container cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container shrink-0">
                    <img src={u.avatar_url || '/avatars/avatar_cat.png'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-on-surface truncate">{u.nickname}</span>
                      <span className="text-[10px] text-primary font-bold px-1.5 py-0.2 rounded-full bg-primary/10">
                        Lv.{u.completed_count ? Math.min(5, u.completed_count) : 1}
                      </span>
                    </div>
                    <span className="text-[11px] text-on-surface-variant">온도 {u.manner_temperature ?? 20.0}℃</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
          <Button type="button" variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" variant="primary" loading={loading} icon="person_add">
            등록하기
          </Button>
        </div>
      </form>
    </Modal>
  );
}
