'use client';

import React from 'react';
import { Message } from '@/domain/entities';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/Button';

interface NoteListProps {
  messages: Message[];
  boxType: 'inbox' | 'sent';
  selectedMessageId: string | null;
  onSelectMessage: (msg: Message) => void;
  onDeleteMessage: (msg: Message, e: React.MouseEvent) => void;
  loading: boolean;
}

export function NoteList({
  messages,
  boxType,
  selectedMessageId,
  onSelectMessage,
  onDeleteMessage,
  loading,
}: NoteListProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-on-surface-variant gap-2" aria-busy="true">
        <Icon name="progress_activity" className="text-3xl animate-spin text-primary" />
        <p className="text-xs">쪽지 목록을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-on-surface-variant gap-3">
        <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
          <Icon name={boxType === 'inbox' ? 'mail' : 'send'} className="text-2xl text-on-surface-variant/60" />
        </div>
        <p className="text-sm font-medium">
          {boxType === 'inbox' ? '받은 쪽지가 없습니다.' : '보낸 쪽지가 없습니다.'}
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-surface-container overflow-y-auto" role="list" aria-label="쪽지 목록">
      {messages.map((msg) => {
        const isSelected = msg.id === selectedMessageId;
        const otherParty = boxType === 'inbox' ? msg.sender : msg.receiver;
        const isUnread = boxType === 'inbox' && !msg.is_read;

        return (
          <li key={msg.id}>
            <div
              className={`flex items-start justify-between p-3 sm:p-4 gap-3 cursor-pointer transition-colors relative group ${
                isSelected
                  ? 'bg-primary/10 border-l-4 border-primary'
                  : isUnread
                  ? 'bg-amber-500/5 hover:bg-surface-container'
                  : 'hover:bg-surface-container-low'
              }`}
              onClick={() => onSelectMessage(msg)}
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {/* 프로필 아바타 */}
                <div className="w-9 h-9 rounded-full overflow-hidden bg-surface-container shrink-0 mt-0.5 ring-1 ring-surface-container">
                  <img
                    src={otherParty?.avatar_url || '/avatars/avatar_cat.png'}
                    alt={otherParty?.nickname || '사용자'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/avatars/avatar_cat.png';
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs sm:text-sm text-on-surface truncate">
                      {otherParty?.nickname || (boxType === 'inbox' ? '시스템 알림' : '수신자')}
                    </span>
                    <span className="text-[11px] text-on-surface-variant shrink-0">
                      {msg.created_at ? new Date(msg.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" aria-label="안 읽음" />
                    )}
                    <h3 className={`text-xs sm:text-sm truncate ${isUnread ? 'font-bold text-on-surface' : 'text-on-surface-variant'}`}>
                      {msg.title}
                    </h3>
                  </div>

                  <p className="text-xs text-on-surface-variant/80 truncate mt-0.5">
                    {msg.content}
                  </p>
                </div>
              </div>

              {/* 삭제 버튼 */}
              <div className="shrink-0 self-center">
                <IconButton
                  type="button"
                  icon="delete"
                  label="쪽지 삭제"
                  onClick={(e) => onDeleteMessage(msg, e)}
                  className="w-8 h-8 text-on-surface-variant/50 hover:text-error hover:bg-error/10"
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default NoteList;
