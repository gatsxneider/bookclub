'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Message, MessageType } from '@/types/database';
import { useAuth } from '@/context/AuthContext';

interface NoteBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'inbox' | 'sent' | 'write';
  initialReceiverNickname?: string;
  onUnreadCountChange?: (count: number) => void;
}

export default function NoteBoxModal({
  isOpen,
  onClose,
  initialTab = 'inbox',
  initialReceiverNickname = '',
  onUnreadCountChange,
}: NoteBoxModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'write'>(initialTab);
  const [inboxMessages, setInboxMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // 쪽지 쓰기 폼 상태
  const [writeReceiver, setWriteReceiver] = useState(initialReceiverNickname);
  const [writeTitle, setWriteTitle] = useState('');
  const [writeContent, setWriteContent] = useState('');
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 안읽은 개수 계산
  const unreadCount = inboxMessages.filter((m) => !m.is_read).length;

  const fetchInbox = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/messages?userId=${user.id}&box=inbox`);
      if (res.ok) {
        const data = await res.json();
        const list = data.messages || [];
        setInboxMessages(list);
        const unread = list.filter((m: Message) => !m.is_read).length;
        if (onUnreadCountChange) onUnreadCountChange(unread);
      }
    } catch (err) {
      console.warn('Inbox fetch failed:', err);
    }
  }, [user, onUnreadCountChange]);

  const fetchSent = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/messages?userId=${user.id}&box=sent`);
      if (res.ok) {
        const data = await res.json();
        setSentMessages(data.messages || []);
      }
    } catch (err) {
      console.warn('Sent fetch failed:', err);
    }
  }, [user]);

  // 모달 오픈 시 데이터 로드 및 D-day 자동 점검
  useEffect(() => {
    if (isOpen && user) {
      setActiveTab(initialTab);
      if (initialReceiverNickname) {
        setWriteReceiver(initialReceiverNickname);
        setActiveTab('write');
      }
      setSelectedMessage(null);
      setFeedbackMsg(null);

      setLoading(true);
      // D-Day 알림 쪽지 체크 비동기 실행
      fetch('/api/messages/dday-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      }).catch(() => {});

      Promise.all([fetchInbox(), fetchSent()]).finally(() => {
        setLoading(false);
      });
    }
  }, [isOpen, user, initialTab, initialReceiverNickname, fetchInbox, fetchSent]);

  // 쪽지 상세 열람 & 읽음 처리
  const handleSelectMessage = async (msg: Message, boxType: 'inbox' | 'sent') => {
    setSelectedMessage(msg);
    setFeedbackMsg(null);

    // 받은 쪽지이고 읽지 않은 경우 읽음 처리
    if (boxType === 'inbox' && !msg.is_read && user) {
      try {
        const res = await fetch(`/api/messages/${msg.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'mark_read', userId: user.id }),
        });
        if (res.ok) {
          // 로컬 상태 갱신
          setInboxMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, is_read: true, read_at: new Date().toISOString() } : m))
          );
          setSelectedMessage((prev) => (prev ? { ...prev, is_read: true } : null));
          const newUnread = inboxMessages.filter((m) => m.id !== msg.id && !m.is_read).length;
          if (onUnreadCountChange) onUnreadCountChange(newUnread);
        }
      } catch (err) {
        console.warn('Failed to mark read:', err);
      }
    }
  };

  // 가입 승인 처리
  const handleApproveJoin = async (messageId: string) => {
    if (!user || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_join', userId: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: '멤버 가입을 승인하고 완료 쪽지를 발송했습니다.' });
        setSelectedMessage((prev) => (prev ? { ...prev, action_status: 'approved', is_read: true } : null));
        fetchInbox();
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || '승인 처리에 실패했습니다.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || '승인 처리 중 오류 발생' });
    } finally {
      setActionLoading(false);
    }
  };

  // 가입 거절 처리
  const handleRejectJoin = async (messageId: string) => {
    if (!user || actionLoading) return;
    if (!confirm('정말 가입 요청을 거절하시겠습니까?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject_join', userId: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: '가입 요청을 거절했습니다.' });
        setSelectedMessage((prev) => (prev ? { ...prev, action_status: 'rejected', is_read: true } : null));
        fetchInbox();
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || '거절 처리에 실패했습니다.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || '거절 처리 중 오류 발생' });
    } finally {
      setActionLoading(false);
    }
  };

  // 쪽지 삭제
  const handleDeleteMessage = async (messageId: string, boxType: 'inbox' | 'sent') => {
    if (!user) return;
    if (!confirm('쪽지를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/messages/${messageId}?userId=${user.id}&box=${boxType}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        if (boxType === 'inbox') {
          setInboxMessages((prev) => prev.filter((m) => m.id !== messageId));
        } else {
          setSentMessages((prev) => prev.filter((m) => m.id !== messageId));
        }
        setSelectedMessage(null);
        setFeedbackMsg({ type: 'success', text: '쪽지가 삭제되었습니다.' });
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (err) {
      console.warn('Delete message failed:', err);
    }
  };

  // 쪽지 보내기 제출
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!writeReceiver.trim()) {
      setFeedbackMsg({ type: 'error', text: '받는 회원의 닉네임을 입력해주세요.' });
      return;
    }
    if (!writeTitle.trim()) {
      setFeedbackMsg({ type: 'error', text: '쪽지 제목을 입력해주세요.' });
      return;
    }
    if (!writeContent.trim()) {
      setFeedbackMsg({ type: 'error', text: '쪽지 내용을 입력해주세요.' });
      return;
    }

    setSending(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          receiver_nickname: writeReceiver.trim(),
          title: writeTitle.trim(),
          content: writeContent.trim(),
          type: 'general',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedbackMsg({ type: 'success', text: `'${writeReceiver}' 님에게 쪽지를 성공적으로 보냈습니다.` });
        setWriteReceiver('');
        setWriteTitle('');
        setWriteContent('');
        fetchSent();
        setTimeout(() => {
          setActiveTab('sent');
        }, 600);
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || '쪽지 전송에 실패했습니다.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || '쪽지 전송 중 오류가 발생했습니다.' });
    } finally {
      setSending(false);
    }
  };

  // 답장 작성 모드로 전환
  const handleReply = (msg: Message) => {
    const senderNick = msg.sender?.nickname || '회원';
    setWriteReceiver(senderNick);
    setWriteTitle(`Re: ${msg.title.replace(/^Re:\s*/, '')}`);
    setWriteContent(`\n\n--- 이전 쪽지 내용 ---\n${msg.content}`);
    setSelectedMessage(null);
    setActiveTab('write');
  };

  // 날짜 포맷팅 헬퍼
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    if (isToday) {
      return `오늘 ${hours}:${minutes}`;
    }
    return `${month}.${day} ${hours}:${minutes}`;
  };

  // 쪽지 유형 배지 렌더러
  const renderTypeBadge = (type: MessageType) => {
    switch (type) {
      case 'club_join_request':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            가입요청
          </span>
        );
      case 'club_join_approved':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            승인완료
          </span>
        );
      case 'club_schedule':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            모임일정
          </span>
        );
      case 'club_schedule_dday':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            D-Day알림
          </span>
        );
      case 'general':
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-on-surface-variant">
            일반쪽지
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-surface-container flex flex-col max-h-[85vh] animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[19px]">mail</span>
            </div>
            <div>
              <h2 className="font-title-md text-base font-bold text-on-surface flex items-center gap-2">
                <span>쪽지함</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.2 rounded-full text-[11px] font-bold bg-rose-500 text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-surface-container bg-surface-container-low px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('inbox');
              setSelectedMessage(null);
              setFeedbackMsg(null);
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'inbox'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">inbox</span>
            <span>받은 쪽지함</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('sent');
              setSelectedMessage(null);
              setFeedbackMsg(null);
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'sent'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">send</span>
            <span>보낸 쪽지함</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('write');
              setSelectedMessage(null);
              setFeedbackMsg(null);
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all border-b-2 ${
              activeTab === 'write'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">edit_square</span>
            <span>쪽지 쓰기</span>
          </button>
        </div>

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div
            className={`px-4 py-2.5 text-xs font-semibold flex items-center justify-between transition-all ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">
                {feedbackMsg.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-current opacity-70 hover:opacity-100"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="py-16 text-center text-on-surface-variant">
              <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs">쪽지를 불러오는 중입니다...</p>
            </div>
          ) : selectedMessage ? (
            /* 쪽지 상세 보기 */
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>목록으로 돌아가기</span>
                </button>
                <div className="flex items-center gap-2">
                  {renderTypeBadge(selectedMessage.type)}
                  <button
                    type="button"
                    onClick={() => handleDeleteMessage(selectedMessage.id, activeTab === 'sent' ? 'sent' : 'inbox')}
                    className="text-on-surface-variant hover:text-rose-600 p-1 rounded-md hover:bg-surface-container transition-colors"
                    title="쪽지 삭제"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>

              {/* Message Header Info */}
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container flex flex-col gap-2">
                <h3 className="font-title-md text-base font-bold text-on-surface">
                  {selectedMessage.title}
                </h3>
                <div className="flex items-center justify-between text-xs text-on-surface-variant flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {activeTab === 'sent' ? (
                      <>
                        <span className="font-semibold text-on-surface">받은 회원:</span>
                        <span className="text-primary font-bold">
                          {selectedMessage.receiver?.nickname || '회원'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="font-semibold text-on-surface">보낸 사람:</span>
                        <span className="text-primary font-bold">
                          {selectedMessage.sender ? selectedMessage.sender.nickname : '시스템 알림'}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-[11px] text-on-surface-variant/80">
                    {formatDate(selectedMessage.created_at)}
                  </span>
                </div>
              </div>

              {/* Message Content */}
              <div className="bg-surface-container-low/40 p-4 sm:p-5 rounded-xl border border-surface-container text-xs sm:text-sm text-on-surface whitespace-pre-wrap leading-relaxed min-h-[120px]">
                {selectedMessage.content}
              </div>

              {/* 특화 기능 영역 1: 가입 요청 쪽지 처리 */}
              {selectedMessage.type === 'club_join_request' && activeTab === 'inbox' && (
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 mb-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">group_add</span>
                      <span>독서클럽 멤버 가입 승인 대기</span>
                    </h4>
                    <p className="text-[11px] text-amber-800">
                      신청자: <strong>{selectedMessage.sender?.nickname}</strong> 님
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {selectedMessage.action_status === 'approved' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs">
                        <span className="material-symbols-outlined text-[15px]">check</span>
                        <span>승인 완료됨</span>
                      </span>
                    ) : selectedMessage.action_status === 'rejected' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-500 text-white text-xs font-bold">
                        <span>거절됨</span>
                      </span>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleRejectJoin(selectedMessage.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 transition-colors disabled:opacity-50"
                        >
                          거절
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleApproveJoin(selectedMessage.id)}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-sm transition-all disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[15px]">how_to_reg</span>
                          <span>멤버 가입 승인</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 특화 기능 영역 2: 클럽/일정 바로가기 링크 */}
              {selectedMessage.related_club_id && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest border border-surface-container">
                  <span className="text-xs text-on-surface-variant">
                    관련 독서클럽: <strong>{selectedMessage.club?.name || '독서클럽'}</strong>
                  </span>
                  <Link
                    href={`/clubs/${selectedMessage.related_club_id}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                  >
                    <span>클럽 바로가기</span>
                    <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                  </Link>
                </div>
              )}

              {/* 일반 쪽지 답장하기 버튼 */}
              {selectedMessage.type === 'general' && activeTab === 'inbox' && selectedMessage.sender && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleReply(selectedMessage)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary-container transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">reply</span>
                    <span>답장 보내기</span>
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === 'inbox' ? (
            /* 받은 쪽지함 목록 */
            inboxMessages.length === 0 ? (
              <div className="py-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">
                  drafts
                </span>
                <p className="text-sm font-semibold">받은 쪽지가 없습니다.</p>
                <p className="text-xs text-on-surface-variant/70 mt-1">
                  클럽 가입 요청이나 새 일정 알림이 오면 여기에 표시됩니다.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-surface-container">
                {inboxMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg, 'inbox')}
                    className={`p-3 sm:p-3.5 rounded-xl flex items-start gap-3 cursor-pointer transition-all hover:bg-surface-container-low ${
                      !msg.is_read
                        ? 'bg-primary/5 font-semibold border-l-4 border-primary shadow-2xs'
                        : 'bg-transparent text-on-surface-variant'
                    }`}
                  >
                    {/* Icon / Status */}
                    <div className="shrink-0 pt-0.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          !msg.is_read
                            ? 'bg-primary text-on-primary shadow-xs'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {!msg.is_read ? 'mail' : 'drafts'}
                        </span>
                      </div>
                    </div>

                    {/* Content preview */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-xs font-bold text-on-surface truncate">
                            {msg.sender ? msg.sender.nickname : '시스템 알림'}
                          </span>
                          {renderTypeBadge(msg.type)}
                        </div>
                        <span className="text-[11px] text-on-surface-variant/70 shrink-0">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-on-surface truncate">
                        {msg.title}
                      </h4>
                      <p className="text-xs text-on-surface-variant/80 truncate mt-0.5">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'sent' ? (
            /* 보낸 쪽지함 목록 */
            sentMessages.length === 0 ? (
              <div className="py-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">
                  outgoing_mail
                </span>
                <p className="text-sm font-semibold">보낸 쪽지가 없습니다.</p>
                <p className="text-xs text-on-surface-variant/70 mt-1">
                  회원들에게 첫 쪽지를 보내보세요.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-surface-container">
                {sentMessages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg, 'sent')}
                    className="p-3 sm:p-3.5 rounded-xl flex items-start gap-3 cursor-pointer transition-all hover:bg-surface-container-low"
                  >
                    <div className="shrink-0 pt-0.5">
                      <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-[15px]">send</span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-xs font-bold text-on-surface truncate">
                            To. {msg.receiver ? msg.receiver.nickname : '회원'}
                          </span>
                          {renderTypeBadge(msg.type)}
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                              msg.is_read
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-surface-container text-on-surface-variant'
                            }`}
                          >
                            {msg.is_read ? '읽음' : '안읽음'}
                          </span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant/70 shrink-0">
                          {formatDate(msg.created_at)}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-on-surface truncate">
                        {msg.title}
                      </h4>
                      <p className="text-xs text-on-surface-variant/80 truncate mt-0.5">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* 쪽지 쓰기 폼 */
            <form onSubmit={handleSendMessage} className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  받는 회원 닉네임 <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={writeReceiver}
                    onChange={(e) => setWriteReceiver(e.target.value)}
                    placeholder="쪽지를 받을 회원의 닉네임을 정확히 입력하세요"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container bg-surface-container-lowest text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  쪽지 제목 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={writeTitle}
                  onChange={(e) => setWriteTitle(e.target.value)}
                  placeholder="제목을 입력하세요 (100자 이내)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container bg-surface-container-lowest text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  쪽지 내용 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  maxLength={2000}
                  value={writeContent}
                  onChange={(e) => setWriteContent(e.target.value)}
                  placeholder="따뜻하고 배려 넘치는 쪽지를 작성해보세요."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-container bg-surface-container-lowest text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('inbox')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm hover:bg-primary-container transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  <span>{sending ? '전송 중...' : '쪽지 보내기'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
