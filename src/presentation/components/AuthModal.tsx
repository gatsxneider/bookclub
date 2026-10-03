'use client';

import React, { useState } from 'react';
import { useAuth, UserProfile } from '@/presentation/context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserProfile) => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}: AuthModalProps) {
  const { signIn, signUp, user } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState<{ available: boolean; message: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // 닉네임 중복 검사 핸들러
  const handleCheckNickname = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setErrorMsg('확인할 닉네임을 먼저 입력해주세요.');
      return;
    }

    if (trimmed.length < 2 || trimmed.length > 20) {
      setErrorMsg('닉네임은 2자 이상 20자 이하로 입력해주세요.');
      return;
    }

    setErrorMsg('');
    setCheckingNickname(true);
    try {
      const res = await fetch(`/api/auth/check-nickname?nickname=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setNicknameStatus({
        available: Boolean(data.available),
        message: data.message || '',
      });
      setNicknameChecked(Boolean(data.available));
      if (!data.available) {
        setErrorMsg(data.message || '이미 사용 중인 닉네임입니다.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '닉네임 확인 중 오류가 발생했습니다.');
      setNicknameChecked(false);
    } finally {
      setCheckingNickname(false);
    }
  };

  // 일반 이메일 로그인 / 회원가입 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (mode === 'signup') {
      if (!nickname.trim()) {
        setErrorMsg('독서클럽에서 사용할 닉네임을 필수로 입력해주세요.');
        return;
      }

      if (!nicknameChecked) {
        setErrorMsg('닉네임 중복 확인을 먼저 진행해주세요.');
        return;
      }
    }

    if (password.length < 6) {
      setErrorMsg('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const res = await signUp(email.trim(), password, nickname.trim());
        if (!res.success) {
          // 이미 등록된 이메일인 경우
          if (res.isExistingEmail) {
            setErrorMsg('이미 가입된 회원입니다. 로그인 화면으로 이동합니다.');
            setPassword('');
            setTimeout(() => {
              setMode('login');
              setErrorMsg('이미 가입된 이메일 계정입니다. 비밀번호를 입력하여 로그인해 주세요.');
            }, 1200);
            return;
          }

          setErrorMsg(res.error || '회원가입에 실패했습니다.');
          return;
        }
        setSuccessMsg(`'${nickname.trim()}' 님으로 회원가입이 완료되었습니다! 🐱🌿`);
      } else {
        const res = await signIn(email.trim(), password);
        if (!res.success) {
          setErrorMsg(res.error || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
          return;
        }
        setSuccessMsg('로그인되었습니다!');
      }

      setTimeout(() => {
        if (onSuccess && user) {
          onSuccess(user);
        }
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || '인증 처리 중 오류가 발생했습니다.');
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
      <div className="relative w-full max-w-[440px] bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden border border-outline-variant">
        {/* Top Accent Strip */}
        <div className="h-1.5 bg-gradient-to-r from-primary-fixed via-primary to-secondary-container" />

        <div className="p-6 sm:p-7 flex flex-col gap-5">
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
              className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
              type="button"
              aria-label="닫기"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Segmented Switcher (2-tabs: 로그인 / 회원가입) */}
          <div className="flex items-center justify-center p-1 bg-surface-container rounded-full text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2 rounded-full transition-all ${
                mode === 'login'
                  ? 'bg-primary text-on-primary shadow-sm'
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
                setSuccessMsg('');
                setNicknameChecked(false);
                setNicknameStatus(null);
              }}
              className={`flex-1 py-2 rounded-full transition-all ${
                mode === 'signup'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              회원가입
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs flex items-center gap-1.5 animate-shake">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-primary-fixed text-on-primary-fixed text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}

          {/* Standard Email Form (Login / Signup) */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {mode === 'signup' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-primary">draw</span>
                    <span>독서클럽 닉네임 (필수) <span className="text-secondary">*</span></span>
                  </span>
                  {nicknameStatus && (
                    <span
                      className={`text-[11px] font-semibold ${
                        nicknameStatus.available ? 'text-primary' : 'text-error'
                      }`}
                    >
                      {nicknameStatus.available ? '✓ 확인 완료' : '✗ 중복'}
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => {
                      setNickname(e.target.value);
                      setNicknameChecked(false);
                      setNicknameStatus(null);
                    }}
                    placeholder="예: 모래고래, 달빛서재"
                    required
                    className="flex-1 bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface border border-surface-container"
                  />
                  <button
                    type="button"
                    onClick={handleCheckNickname}
                    disabled={checkingNickname || !nickname.trim()}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                      nicknameChecked
                        ? 'bg-primary-fixed text-on-primary-fixed'
                        : 'bg-surface-container-high hover:bg-surface-container-highest text-primary'
                    } disabled:opacity-40`}
                  >
                    {checkingNickname ? (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                        <span>확인 중</span>
                      </span>
                    ) : nicknameChecked ? (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check</span>
                        <span>확인됨</span>
                      </span>
                    ) : (
                      '중복 확인'
                    )}
                  </button>
                </div>
                {nicknameStatus && (
                  <p
                    className={`text-[11px] mt-0.5 ${
                      nicknameStatus.available ? 'text-primary font-medium' : 'text-error font-medium'
                    }`}
                  >
                    {nicknameStatus.message}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">mail</span>
                <span>이메일 주소 <span className="text-secondary">*</span></span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cozy@bookclub.com"
                required
                className="w-full bg-surface-container-low text-on-surface px-3.5 py-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface border border-surface-container"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">lock</span>
                <span>비밀번호 <span className="text-secondary">*</span></span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6자 이상 입력"
                  required
                  className="w-full bg-surface-container-low text-on-surface pl-3.5 pr-10 py-2.5 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:bg-surface border border-surface-container"
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

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 rounded-full bg-primary text-on-primary hover:bg-primary-container text-xs font-bold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                  <span>처리 중...</span>
                </>
              ) : mode === 'login' ? (
                '로그인하고 서재 입장'
              ) : (
                '가입 완료하고 북클럽 시작'
              )}
            </button>
          </form>

          {/* Bottom Switcher Helper */}
          <div className="text-center pt-1 border-t border-surface-container">
            {mode === 'login' ? (
              <p className="text-xs text-on-surface-variant">
                아직 회원이 아니신가요?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  회원가입하기
                </button>
              </p>
            ) : (
              <p className="text-xs text-on-surface-variant">
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  로그인하기
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
