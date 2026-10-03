'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ReviewComment } from '@/domain/entities';
import { apiClient } from '@/presentation/lib/apiClient';
import { useAuth } from '@/presentation/context/AuthContext';

interface ReviewCommentSectionProps {
  reviewId: string;
  reviewAuthorId: string;
  onOpenAuth: () => void;
  onCommentCountChange?: (count: number) => void;
}

export default function ReviewCommentSection({
  reviewId,
  reviewAuthorId,
  onOpenAuth,
  onCommentCountChange,
}: ReviewCommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await apiClient.get<{ comments: ReviewComment[] }>(
        `/api/reviews/${reviewId}/comments`
      );
      if (data && Array.isArray(data.comments)) {
        setComments(data.comments);
        onCommentCountChange?.(data.comments.length);
      }
    } catch (err: any) {
      console.error('Failed to fetch review comments:', err);
      setErrorMessage(err.message || '댓글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [reviewId, onCommentCountChange]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    const trimmed = newComment.trim();
    if (!trimmed) return;

    if (trimmed.length > 500) {
      alert('댓글은 500자 이내로 작성해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);
      const res = await apiClient.post<{ success: boolean; comment: ReviewComment }>(
        `/api/reviews/${reviewId}/comments`,
        { content: trimmed }
      );

      if (res.comment) {
        setNewComment('');
        const updated = [...comments, res.comment];
        setComments(updated);
        onCommentCountChange?.(updated.length);
      }
    } catch (err: any) {
      console.error('Failed to submit comment:', err);
      alert(err.message || '댓글 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      setDeletingId(commentId);
      await apiClient.delete(`/api/reviews/comments/${commentId}`);
      const updated = comments.filter((c) => c.id !== commentId);
      setComments(updated);
      onCommentCountChange?.(updated.length);
    } catch (err: any) {
      console.error('Failed to delete comment:', err);
      alert(err.message || '댓글 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatCommentDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr.split('T')[0];
    }
  };

  return (
    <div
      data-testid="review-comment-section"
      className="mt-4 pt-4 border-t border-surface-container bg-surface-container-lowest/40 rounded-2xl p-4 sm:p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-primary">
            mode_comment
          </span>
          <span>댓글 {comments.length > 0 ? comments.length : ''}</span>
        </h4>
      </div>

      {/* 댓글 목록 */}
      {loading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin text-sm text-primary">
            progress_activity
          </span>
          <span>댓글을 불러오는 중...</span>
        </div>
      ) : errorMessage ? (
        <div className="py-4 text-center text-xs text-rose-500 bg-rose-50 rounded-xl">
          {errorMessage}
        </div>
      ) : comments.length === 0 ? (
        <div className="py-6 text-center text-xs text-on-surface-variant flex flex-col items-center gap-1">
          <span className="material-symbols-outlined text-2xl text-on-surface-variant/40">
            forum
          </span>
          <span>첫 번째 다정한 감상을 댓글로 남겨보세요 🌱</span>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {comments.map((comment) => {
            const author = comment.author;
            const authorName = author?.nickname || '독서가';
            const authorInitial = authorName.charAt(0).toUpperCase();
            const isMyComment = Boolean(user?.id && comment.user_id === user.id);
            const canDelete = isMyComment || Boolean(user?.id && reviewAuthorId === user.id);

            return (
              <div
                key={comment.id}
                data-testid={`comment-item-${comment.id}`}
                className="group flex items-start gap-3 p-3 rounded-xl bg-surface hover:bg-surface-container-lowest transition-colors border border-surface-container/60 shadow-2xs"
              >
                {/* 작성자 아바타 */}
                {author?.avatar_url ? (
                  <img
                    src={author.avatar_url}
                    alt={authorName}
                    className="w-7 h-7 rounded-full object-cover shadow-2xs border border-primary/20 shrink-0 mt-0.5"
                    onError={(e) => {
                      e.currentTarget.src = '/avatars/avatar_cat.png';
                    }}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-primary text-xs shadow-2xs shrink-0 mt-0.5">
                    {authorInitial}
                  </div>
                )}

                {/* 댓글 본문 및 작성자 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-on-surface">
                        {authorName}
                      </span>
                      {author?.manner_temperature != null && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                          <span className="material-symbols-outlined text-[11px]">thermostat</span>
                          <span>{Number(author.manner_temperature).toFixed(1)}°C</span>
                        </span>
                      )}
                      <span className="text-[11px] text-on-surface-variant">
                        {formatCommentDate(comment.created_at)}
                      </span>
                    </div>

                    {/* 삭제 버튼 */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="text-[11px] text-on-surface-variant hover:text-rose-500 transition-colors opacity-80 group-hover:opacity-100 disabled:opacity-30"
                        title="댓글 삭제"
                      >
                        {deletingId === comment.id ? '삭제 중...' : '삭제'}
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-on-surface mt-1 leading-relaxed whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 댓글 작성 입력 폼 */}
      {user ? (
        <form onSubmit={handleSubmit} className="mt-3">
          <div className="flex items-start gap-2.5">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.nickname || '내 아바타'}
                className="w-7 h-7 rounded-full object-cover shadow-2xs border border-primary/20 shrink-0 mt-1"
                onError={(e) => {
                  e.currentTarget.src = '/avatars/avatar_cat.png';
                }}
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-primary text-xs shadow-2xs shrink-0 mt-1">
                {(user?.nickname || '나').charAt(0).toUpperCase()}
              </div>
            )}

            <div className="flex-1 relative">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="따뜻한 감상과 생각을 댓글로 남겨보세요... (Shift+Enter로 줄바꿈)"
                rows={2}
                maxLength={500}
                disabled={submitting}
                className="w-full text-xs p-2.5 pb-7 rounded-xl border border-surface-container bg-surface text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none transition-all"
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-2">
                <span className="text-[10px] text-on-surface-variant/70">
                  {newComment.length}/500
                </span>
                <button
                  type="submit"
                  disabled={submitting || !newComment.trim()}
                  className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-semibold shadow-2xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {submitting ? (
                    <span className="material-symbols-outlined text-[13px] animate-spin">
                      progress_activity
                    </span>
                  ) : (
                    <span>등록</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-2 py-3 px-4 rounded-xl bg-surface border border-surface-container flex items-center justify-between text-xs text-on-surface-variant">
          <span>로그인하고 다정한 댓글을 남겨보세요.</span>
          <button
            type="button"
            onClick={onOpenAuth}
            className="text-xs font-bold text-primary hover:underline"
          >
            로그인하기
          </button>
        </div>
      )}
    </div>
  );
}
