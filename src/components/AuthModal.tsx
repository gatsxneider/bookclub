'use client';

import React, { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { id: string; nickname: string; email: string }) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (mode === 'signup' && !nickname.trim()) {
      setErrorMsg('독서클럽에서 사용할 닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 로컬 스토리지 및 세션 상태 보관 (보안: 인증 토큰 또는 프로필 상태)
      const user = {
        id: '00000000-0000-0000-0000-000000000001',
        nickname: nickname.trim() || '지우 님',
        email: email.trim(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('cozy_user', JSON.stringify(user));
      }

      onSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '인증 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-[460px] bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-outline-variant">
        {/* Top Accent Strip */}
        <div className="h-1.5 bg-gradient-to-r from-primary-fixed via-primary to-secondary-container" />

        <div className="p-6 sm:p-8 flex flex-col gap-5">
          {/* Header Title & Emblem */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shadow-sm">
                <span className="material-symbols-outlined text-[22px]">auto_stories</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-lg font-bold text-primary">코지 북클럽</h2>
                <p className="text-xs text-on-surface-variant italic">
                  “책 한 권으로 연결되는 우리들의 따뜻한 숲”
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Segmented Switcher */}
          <div className="flex items-center justify-center p-1 bg-surface-container rounded-full">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`w-1/2 py-2 rounded-full text-xs font-semibold transition-all ${
                mode === 'login'
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
              }}
              className={`w-1/2 py-2 rounded-full text-xs font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              회원가입
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {mode === 'signup' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">draw</span>
                  <span>닉네임 (독서클럽 필명)</span>
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="예: 달빛서재, 책 읽는 다람쥐"
                  className="w-full bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">mail</span>
                <span>이메일 주소</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cozybook@reading.com"
                className="w-full bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface"
              />
            </div>

            {mode === 'signup' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-primary">call</span>
                  <span>전화번호</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">lock</span>
                <span>비밀번호</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="영문, 숫자 포함 8자 이상"
                  className="w-full bg-surface-container-low text-on-surface pl-3.5 pr-10 py-2.5 rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-on-surface-variant">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded text-primary focus:ring-0 accent-primary cursor-pointer"
                />
                <span>
                  <span className="text-secondary font-semibold">[필수]</span> 이용약관 및 개인정보
                  처리방침 동의
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-full bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              {loading
                ? '처리 중...'
                : mode === 'login'
                ? '로그인하고 서재 들어가기'
                : '가입 완료하고 북클럽 시작하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
