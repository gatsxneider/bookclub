'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/presentation/context/AuthContext';
import { apiClient } from '@/presentation/lib/apiClient';
import { Message } from '@/domain/entities';
import { Modal } from './ui/Modal';
import { Tabs } from './ui/Tabs';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import { NoteList } from './notes/NoteList';
import { NoteDetail } from './notes/NoteDetail';
import { NoteComposer } from './notes/NoteComposer';

interface NoteBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export default function NoteBoxModal({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NoteBoxModalProps) {
  const { user } = useAuth();
  const { notify } = useToast();

  const [boxType, setBoxType] = useState<'inbox' | 'sent'>('inbox');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [replyReceiver, setReplyReceiver] = useState<{ id?: string; nickname: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 쪽지 목록 조회
  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiClient.get<{ messages: Message[] }>('/api/messages', {
        box: boxType,
      });
      setMessages(data.messages || []);
    } catch (err: any) {
      notify(err.message || '쪽지 목록을 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, boxType, notify]);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      // D-day 쪽지 확인 자동 트리거
      apiClient.post('/api/messages/dday-check').catch(() => {});
    } else {
      setSelectedMessage(null);
      setIsComposing(false);
    }
  }, [isOpen, fetchMessages]);

  const handleSelectMessage = async (msg: Message) => {
    setSelectedMessage(msg);
    setIsComposing(false);

    // 받은 쪽지이고 안 읽었으면 읽음 처리
    if (boxType === 'inbox' && !msg.is_read) {
      try {
        await apiClient.patch(`/api/messages/${msg.id}`, { action: 'mark_read' });
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m))
        );
        onUnreadCountChange?.(Math.max(0, (messages.filter((m) => !m.is_read).length) - 1));
      } catch {}
    }
  };

  const handleDeleteMessage = async (msg: Message, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/api/messages/${msg.id}`, { box: boxType });
      notify('쪽지가 삭제되었습니다.', 'info');
      setMessages((prev) => prev.filter((m) => m.id !== msg.id));
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage(null);
      }
    } catch (err: any) {
      notify(err.message || '쪽지 삭제에 실패했습니다.', 'error');
    }
  };

  const handleSend = async (data: {
    receiver_id?: string;
    receiver_nickname?: string;
    title: string;
    content: string;
  }) => {
    setActionLoading(true);
    try {
      await apiClient.post('/api/messages', data);
      notify('쪽지를 성공적으로 보냈습니다.', 'success');
      setIsComposing(false);
      setReplyReceiver(null);
      if (boxType === 'sent') {
        fetchMessages();
      }
    } catch (err: any) {
      notify(err.message || '쪽지 전송에 실패했습니다.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async (msg: Message, action: 'approve_join' | 'reject_join') => {
    setActionLoading(true);
    try {
      const res = await apiClient.patch<{ success: boolean; message: string }>(
        `/api/messages/${msg.id}`,
        { action }
      );
      notify(res.message, 'success');
      setSelectedMessage((prev) =>
        prev && prev.id === msg.id
          ? { ...prev, action_status: action === 'approve_join' ? 'approved' : 'rejected' }
          : prev
      );
      fetchMessages();
    } catch (err: any) {
      notify(err.message || '처리에 실패했습니다.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCompose = (receiver?: { id?: string; nickname: string } | null) => {
    setReplyReceiver(receiver || null);
    setIsComposing(true);
    setSelectedMessage(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="온기 쪽지함"
      description="독서 클럽 멤버들과 따뜻한 메시지와 일정을 나눠보세요."
      icon="mail"
      size="xl"
    >
      <div className="flex flex-col h-[560px] max-h-[70vh]">
        {/* 상단 탭 & 쪽지 쓰기 버튼 */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-surface-container shrink-0">
          <Tabs
            label="쪽지함 선택"
            value={boxType}
            onChange={(val) => {
              setBoxType(val);
              setSelectedMessage(null);
              setIsComposing(false);
            }}
            items={[
              { value: 'inbox', label: '받은 쪽지함', icon: 'inbox' },
              { value: 'sent', label: '보낸 쪽지함', icon: 'send' },
            ]}
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon="edit"
            onClick={() => handleOpenCompose(null)}
          >
            쪽지 쓰기
          </Button>
        </div>

        {/* 2단 분할 레이아웃 (모바일에서는 화면 전환) */}
        <div className="grid grid-cols-1 sm:grid-cols-12 flex-1 overflow-hidden min-h-0 divide-y sm:divide-y-0 sm:divide-x divide-surface-container">
          {/* 좌측: 쪽지 목록 (모바일에선 상세/작성 중일 때 숨김) */}
          <div
            className={`sm:col-span-5 h-full overflow-y-auto ${
              (selectedMessage || isComposing) ? 'hidden sm:block' : 'block'
            }`}
          >
            <NoteList
              messages={messages}
              boxType={boxType}
              selectedMessageId={selectedMessage?.id || null}
              onSelectMessage={handleSelectMessage}
              onDeleteMessage={handleDeleteMessage}
              loading={loading}
            />
          </div>

          {/* 우측: 상세 보기 또는 작성 폼 */}
          <div
            className={`sm:col-span-7 h-full overflow-hidden ${
              (!selectedMessage && !isComposing) ? 'hidden sm:flex flex-col' : 'block'
            }`}
          >
            {isComposing ? (
              <NoteComposer
                initialReceiver={replyReceiver}
                onSend={handleSend}
                onCancel={() => {
                  setIsComposing(false);
                  setReplyReceiver(null);
                }}
                loading={actionLoading}
              />
            ) : (
              <NoteDetail
                message={selectedMessage}
                boxType={boxType}
                onBack={() => setSelectedMessage(null)}
                onReply={(msg) => {
                  if (msg.sender) {
                    handleOpenCompose({ id: msg.sender.id, nickname: msg.sender.nickname });
                  }
                }}
                onAction={handleAction}
                actionLoading={actionLoading}
              />
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
