'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, AuthResponse } from '@/presentation/services/authService';
import { calculateUserLevel, INITIAL_MANNER_TEMPERATURE } from '@/domain/rules/mannerTemperature';

export { calculateUserLevel };

export interface UserProfile {
  id: string;
  email?: string;
  nickname: string;
  avatar_url?: string;
  bio?: string;
  manner_temperature?: number;
  completed_count?: number;
  level?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (email: string, password: string, nickname: string) => Promise<AuthResponse>;
  quickLogin: (nickname: string, avatarUrl?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 프로필 정보 동기화
  const fetchProfile = useCallback(async () => {
    try {
      const profile = await authService.fetchCurrentProfile();
      if (profile) {
        const completedCount = profile.completed_count != null ? Number(profile.completed_count) : 0;
        const mannerTemp = profile.manner_temperature != null ? Number(profile.manner_temperature) : INITIAL_MANNER_TEMPERATURE;
        const level = calculateUserLevel(completedCount);

        const updated: UserProfile = {
          ...profile,
          manner_temperature: mannerTemp,
          completed_count: completedCount,
          level,
        };

        setUser(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cozy_user', JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.warn('Profile fetch error:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await authService.getSession();
        if (session?.user && mounted) {
          await fetchProfile();
        } else if (mounted) {
          // 세션이 없으면 캐시 제거
          if (typeof window !== 'undefined') {
            localStorage.removeItem('cozy_user');
          }
          setUser(null);
        }
      } catch (err) {
        console.warn('Auth session check error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = authService.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchProfile();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('cozy_user');
        }
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const res = await authService.signIn(email, password);
    if (res.success) {
      await fetchProfile();
    }
    return res;
  };

  const signUp = async (email: string, password: string, nickname: string) => {
    const res = await authService.signUp(email, password, nickname);
    if (res.success) {
      await fetchProfile();
    }
    return res;
  };

  // 간편 닉네임 전환 (하위 호환성)
  const quickLogin = async (nickname: string) => {
    return {
      success: false,
      error: '안전한 서비스 이용을 위해 이메일 회원가입 또는 로그인을 이용해주세요.',
    };
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cozy_user');
        window.location.href = '/';
      }
    } catch {
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cozy_user');
        window.location.href = '/';
      }
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const updated = await authService.updateProfile({
        nickname: updates.nickname,
        avatar_url: updates.avatar_url,
        bio: updates.bio,
      });

      const completedCount = updated.completed_count != null ? Number(updated.completed_count) : (user?.completed_count ?? 0);
      const mannerTemp = updated.manner_temperature != null ? Number(updated.manner_temperature) : (user?.manner_temperature ?? INITIAL_MANNER_TEMPERATURE);
      const level = calculateUserLevel(completedCount);

      const fullUser: UserProfile = {
        ...updated,
        manner_temperature: mannerTemp,
        completed_count: completedCount,
        level,
      };

      setUser(fullUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('cozy_user', JSON.stringify(fullUser));
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || '프로필 업데이트 중 오류가 발생했습니다.' };
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        quickLogin,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
