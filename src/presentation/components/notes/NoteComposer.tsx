'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FormField, inputClass } from '../ui/FormField';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { apiClient } from '@/presentation/lib/apiClient';
import { Profile } from '@/domain/entities';

interface NoteComposerProps {
  initialReceiver?: { id?: string; nickname: string } | null;
  onSend: (data: { receiver_id?: string; receiver_nickname?: string; title: string; content: string }) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export function NoteComposer({
  initialReceiver,
  onSend,
  onCancel,
  loading,
}: NoteComposerProps) {
  const [receiverNickname, setReceiverNickname] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimer = useRef<any>(null);

  useEffect(() => {
    if (initialReceiver) {
      setReceiverNickname(initialReceiver.nickname);
      if (initialReceiver.id) setSelectedUserId(initialReceiver.id);
    }
  }, [initialReceiver]);

  const handleNicknameChange = (val: string) => {
    setReceiverNickname(val);
    setSelectedUserId(null);

    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      try {
        const res = await apiClient.get<{ users: Profile[] }>('/api/users/search', { q: val.trim() });
        setSuggestions(res.users || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);
  };

  const handleSelectUser = (user: Profile) => {
    setReceiverNickname(user.nickname);
    setSelectedUserId(user.id);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverNickname.trim() || !title.trim() || !content.trim()) return;

    await onSend({
      receiver_id: selectedUserId || undefined,
      receiver_nickname: selectedUserId ? undefined : receiverNickname.trim(),
      title: title.trim(),
      content: content.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 sm:p-6 bg-surface-container-lowest h-full overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-surface-container">
        <h3 className="font-bold text-base text-on-surface flex items-center gap-2">
          <Icon name="edit_note" className="text-primary text-[22px]" />
          새 쪽지 쓰기
        </h3>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="text-xs">
          취소
        </Button>
      </div>

      {/* 수신자 검색/입력 */}
      <div className="relative">
        <FormField label="받는 사람 (닉네임)" required hint="회원 필명을 검색하거나 직접 입력하세요.">
          {(fieldProps) => (
            <div className="relative">
              <input
                {...fieldProps}
                type="text"
                value={receiverNickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                placeholder="받는 사람 닉네임"
                autoComplete="off"
                className={inputClass}
              />
              {selectedUserId && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary text-xs font-bold flex items-center gap-1">
                  <Icon name="check_circle" className="text-[16px]" />
                  확인됨
                </span>
              )}
            </div>
          )}
        </FormField>

        {/* 자동완성 드롭다운 */}
        {showSuggestions && suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-20 left-0 right-0 mt-1 bg-surface-container-lowest border border-surface-container shadow-xl rounded-2xl max-h-48 overflow-y-auto divide-y divide-surface-container"
          >
            {suggestions.map((u) => (
              <li
                key={u.id}
                role="option"
                aria-selected={selectedUserId === u.id}
                onClick={() => handleSelectUser(u)}
                className="flex items-center gap-3 p-3 hover:bg-surface-container cursor-pointer transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-container shrink-0">
                  <img src={u.avatar_url || '/avatars/avatar_cat.png'} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-on-surface truncate">{u.nickname}</span>
                    <span className="text-[10px] text-primary font-extrabold px-1.5 py-0.2 rounded-full bg-primary/10">
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

      <FormField label="쪽지 제목" required>
        {(fieldProps) => (
          <input
            {...fieldProps}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            maxLength={100}
            className={inputClass}
          />
        )}
      </FormField>

      <FormField label="쪽지 내용" required>
        {(fieldProps) => (
          <textarea
            {...fieldProps}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="따뜻한 마음을 담아 메시지를 작성해보세요."
            rows={6}
            maxLength={2000}
            className={`${inputClass} resize-none min-h-[140px]`}
          />
        )}
      </FormField>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" variant="primary" loading={loading} icon="send">
          쪽지 보내기
        </Button>
      </div>
    </form>
  );
}

export default NoteComposer;
