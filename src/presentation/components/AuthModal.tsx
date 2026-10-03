'use client';

import React, { useState } from 'react';
import { useAuth } from '@/presentation/context/AuthContext';
import { Modal } from './ui/Modal';
import { Tabs } from './ui/Tabs';
import { FormField, inputClass } from './ui/FormField';
import { Button, IconButton } from './ui/Button';
import { useToast } from './ui/Toast';
import { apiClient } from '@/presentation/lib/apiClient';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const { notify } = useToast();

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameCheckMsg, setNicknameCheckMsg] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setNickname('');
    setErrorMsg(null);
    setNicknameCheckMsg(null);
    setNicknameChecked(false);
  };

  const handleTabChange = (tab: 'login' | 'signup') => {
    setActiveTab(tab);
    resetForm();
  };

  const handleCheckNickname = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setNicknameCheckMsg('닉네임을 입력해주세요.');
      setNicknameChecked(false);
      return;
    }

    try {
      const res = await apiClient.get<{ available: boolean; message: string }>('/api/auth/check-nickname', {
        nickname: trimmed,
      });
      setNicknameChecked(res.available);
      setNicknameCheckMsg(res.message);
    } catch (err: any) {
      setNicknameChecked(false);
      setNicknameCheckMsg(err.message || '중복 확인 중 오류가 발생했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (activeTab === 'login') {
        const res = await signIn(email, password);
        if (res.success) {
          notify('반갑습니다! 로그인되었습니다.', 'success');
          onSuccess?.();
          onClose();
          resetForm();
        } else {
          setErrorMsg(res.error || '이메일 또는 비밀번호가 올바르지 않습니다.');
        }
      } else {
        if (!nickname.trim()) {
          setErrorMsg('닉네임을 입력해주세요.');
          setLoading(false);
          return;
        }

        const res = await signUp(email, password, nickname);
        if (res.success) {
          notify('가입을 환영합니다! 책과 함께 따뜻한 여정을 시작해보세요.', 'success');
          onSuccess?.();
          onClose();
          resetForm();
        } else if (res.isExistingEmail) {
          notify(res.error || '이미 가입된 이메일입니다.', 'info');
          setActiveTab('login');
          setErrorMsg(res.error || null);
        } else {
          setErrorMsg(res.error || '회원가입 중 오류가 발생했습니다.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || '인증 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeTab === 'login' ? '로그인' : '회원가입'}
      description={
        activeTab === 'login'
          ? '코지 독서 클럽의 서재에 오신 것을 환영합니다.'
          : '다정한 사람들과 함께 책을 읽고 기록을 남겨보세요.'
      }
      icon="auto_stories"
      size="sm"
    >
      <div className="flex flex-col gap-4">
        {/* 로그인 / 회원가입 탭 */}
        <Tabs
          label="인증 방식 선택"
          value={activeTab}
          onChange={handleTabChange}
          items={[
            { value: 'login', label: '로그인', icon: 'login' },
            { value: 'signup', label: '회원가입', icon: 'person_add' },
          ]}
          className="w-full"
        />

        {errorMsg && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium flex items-start gap-2"
          >
            <span className="material-symbols-outlined text-[18px] shrink-0" aria-hidden="true">
              error
            </span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {activeTab === 'signup' && (
            <FormField label="필명 / 닉네임" required hint="독서 클럽에서 사용할 2~20자 닉네임입니다.">
              {(fieldProps) => (
                <div className="flex gap-2">
                  <input
                    {...fieldProps}
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      setNicknameChecked(false);
                      setNicknameCheckMsg(null);
                    }}
                    placeholder="예: 별헤는밤"
                    autoComplete="nickname"
                    className={inputClass}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCheckNickname}
                    className="shrink-0 text-xs px-3"
                  >
                    중복확인
                  </Button>
                </div>
              )}
            </FormField>
          )}

          {activeTab === 'signup' && nicknameCheckMsg && (
            <p
              className={`text-xs font-medium -mt-2 ${
                nicknameChecked ? 'text-primary font-bold' : 'text-error'
              }`}
            >
              {nicknameCheckMsg}
            </p>
          )}

          <FormField label="이메일 주소" required>
            {(fieldProps) => (
              <input
                {...fieldProps}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cozy@bookclub.com"
                autoComplete="email"
                className={inputClass}
              />
            )}
          </FormField>

          <FormField label="비밀번호" required hint={activeTab === 'signup' ? '6자 이상 입력해주세요.' : undefined}>
            {(fieldProps) => (
              <div className="relative">
                <input
                  {...fieldProps}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                  className={`${inputClass} pr-12`}
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <IconButton
                    type="button"
                    icon={showPassword ? 'visibility_off' : 'visibility'}
                    label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    onClick={() => setShowPassword(!showPassword)}
                    className="w-10 h-10 text-on-surface-variant hover:text-on-surface"
                  />
                </div>
              </div>
            )}
          </FormField>

          <div className="mt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              {activeTab === 'login' ? '로그인하기' : '회원가입 완료'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
