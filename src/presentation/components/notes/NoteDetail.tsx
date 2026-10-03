'use client';

import React from 'react';
import Link from 'next/link';
import { Message } from '@/domain/entities';
import { Button, IconButton } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface NoteDetailProps {
  message: Message | null;
  boxType: 'inbox' | 'sent';
  onBack?: () => void;
  onReply?: (msg: Message) => void;
  onAction?: (msg: Message, action: 'approve_join' | 'reject_join') => void;
  actionLoading?: boolean;
}

export function NoteDetail({
  message,
  boxType,
  onBack,
  onReply,
  onAction,
  actionLoading,
}: NoteDetailProps) {
  if (!message) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center text-on-surface-variant gap-2">
        <Icon name="drafts" className="text-4xl text-on-surface-variant/40" />
        <p className="text-sm">목록에서 쪽지를 선택하여 내용을 확인하세요.</p>
      </div>
    );
  }

  const otherParty = boxType === 'inbox' ? message.sender : message.receiver;
  const isJoinRequest = message.type === 'club_join_request' && boxType === 'inbox';

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 sm:p-6 bg-surface-container-lowest">
      {/* 모바일 뒤로가기 버튼 */}
      {onBack && (
        <div className="sm:hidden mb-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon="arrow_back"
            onClick={onBack}
            className="-ml-2 text-xs"
          >
            쪽지 목록으로
          </Button>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-surface-container">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-surface-container shrink-0 ring-2 ring-primary/20">
            <img
              src={otherParty?.avatar_url || '/avatars/avatar_cat.png'}
              alt={otherParty?.nickname || '프로필'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/avatars/avatar_cat.png';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-on-surface">
                {otherParty?.nickname || (boxType === 'inbox' ? '시스템 알림' : '수신자')}
              </span>
              {otherParty?.manner_temperature && (
                <span className="text-[11px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">
                  {otherParty.manner_temperature}℃
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant">
              {boxType === 'inbox' ? '보낸 시간: ' : '받은 시간: '}
              {message.created_at ? new Date(message.created_at).toLocaleString() : ''}
            </p>
          </div>
        </div>

        {/* 답장 버튼 */}
        {boxType === 'inbox' && message.sender_id && onReply && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon="reply"
            onClick={() => onReply(message)}
            className="text-xs shrink-0"
          >
            답장
          </Button>
        )}
      </div>

      {/* 제목 및 본문 */}
      <div className="py-4 flex-1">
        <h3 className="font-bold text-base text-on-surface mb-3 break-keep">
          {message.title}
        </h3>
        <div className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap break-words bg-surface-container-low/50 p-4 rounded-2xl border border-surface-container">
          {message.content}
        </div>

        {/* 연관 클럽/일정 링크 카드 */}
        {message.club && (
          <div className="mt-4 p-3 rounded-xl bg-surface-container flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Icon name="groups" className="text-primary text-[20px]" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-on-surface truncate block">
                  {message.club.name}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {message.schedule ? `${message.schedule.sequence}단원 일정 알림` : '독서클럽'}
                </span>
              </div>
            </div>
            <Link
              href={`/clubs/${message.club.id}`}
              className="text-xs font-bold text-primary hover:underline shrink-0"
            >
              클럽 가기 →
            </Link>
          </div>
        )}

        {/* 클럽 가입 신청 액션 (방장인 경우) */}
        {isJoinRequest && (
          <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="person_add" className="text-amber-700 text-[20px]" />
              <span className="text-xs font-bold text-amber-900">
                클럽 멤버 가입 요청
              </span>
            </div>
            <p className="text-xs text-amber-800 mb-3">
              요청을 승인하면 멤버로 등록되며 자동으로 승인 안내 쪽지가 발송됩니다.
            </p>

            {message.action_status === 'approved' ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                <Icon name="check" className="text-[16px]" />
                가입 승인 완료
              </span>
            ) : message.action_status === 'rejected' ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-full">
                <Icon name="close" className="text-[16px]" />
                가입 거절됨
              </span>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={actionLoading}
                  onClick={() => onAction?.(message, 'approve_join')}
                >
                  가입 승인
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={actionLoading}
                  onClick={() => onAction?.(message, 'reject_join')}
                >
                  거절
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default NoteDetail;
