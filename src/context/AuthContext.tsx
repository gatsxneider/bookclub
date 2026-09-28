'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { INITIAL_MANNER_TEMPERATURE } from '@/lib/core/mannerTemperature';

export interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  avatar_url?: string;
  manner_temperature?: number;
  completed_count?: number;
  level?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, nickname: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 레벨 계산: 완독 1회=레벨1 ~ 완독 5회 이상=레벨5 (최고 레벨)
export const calculateUserLevel = (completedCount: number = 1): number => {
  return Math.min(5, Math.max(1, completedCount || 1));
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 프로필 정보 조회 헬퍼
  const fetchProfile = async (userId: string, email: string, fallbackNickname?: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const completedCount = profile?.completed_count ?? 3; // 기본 예시 완독 3회 (레벨 3)
      const level = calculateUserLevel(completedCount);

      if (profile && profile.nickname) {
        setUser({
          id: userId,
          email,
          nickname: profile.nickname,
          avatar_url: profile.avatar_url || '/images/avatar.png',
          manner_temperature: profile.manner_temperature ?? INITIAL_MANNER_TEMPERATURE,
          completed_count: completedCount,
          level,
        });
      } else {
        const defaultNick = fallbackNickname || email.split('@')[0] || '린건맘';
        // 프로필이 없으면 생성
        await supabase.from('profiles').upsert({
          id: userId,
          nickname: defaultNick,
          manner_temperature: INITIAL_MANNER_TEMPERATURE,
        });

        setUser({
          id: userId,
          email,
          nickname: defaultNick,
          avatar_url: '/images/avatar.png',
          manner_temperature: INITIAL_MANNER_TEMPERATURE,
          completed_count: completedCount,
          level,
        });
      }
    } catch (err) {
      console.warn('Profile fetch error:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. 기존 세션 확인
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const userMetaNick = session.user.user_metadata?.nickname;
          await fetchProfile(session.user.id, session.user.email || '', userMetaNick);
        } else if (mounted) {
          // 로컬 스토리지에 남아있던 레거시 게스트 세션 확인
          const savedLocal = typeof window !== 'undefined' ? localStorage.getItem('cozy_user') : null;
          if (savedLocal) {
            try {
              const parsed = JSON.parse(savedLocal);
              if (parsed?.id && parsed?.nickname) {
                setUser(parsed);
              }
            } catch {}
          }
        }
      } catch (err) {
        console.warn('Auth session check error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkSession();

    // 2. 인증 상태 변화 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userMetaNick = session.user.user_metadata?.nickname;
        await fetchProfile(session.user.id, session.user.email || '', userMetaNick);
      } else {
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
  }, []);

  // 로그인
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const userMetaNick = data.user.user_metadata?.nickname;
        await fetchProfile(data.user.id, data.user.email || '', userMetaNick);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || '로그인 중 오류가 발생했습니다.' };
    }
  };

  // 회원가입
  const signUp = async (email: string, password: string, nickname: string) => {
    try {
      const trimmedNick = nickname.trim();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nickname: trimmedNick,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // profiles 테이블에 필명 생성
        await supabase.from('profiles').upsert({
          id: data.user.id,
          nickname: trimmedNick,
          manner_temperature: INITIAL_MANNER_TEMPERATURE,
        });

        setUser({
          id: data.user.id,
          email: data.user.email || email,
          nickname: trimmedNick,
          avatar_url: '/images/avatar.png',
          manner_temperature: INITIAL_MANNER_TEMPERATURE,
          completed_count: 1,
          level: 1,
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || '회원가입 중 오류가 발생했습니다.' };
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cozy_user');
      }
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  };

  // 프로필 업데이트 (아바타, 닉네임 등)
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const currentUserId = user?.id || '00000000-0000-0000-0000-000000000001';
      
      const payload: any = {
        updated_at: new Date().toISOString(),
      };
      if (updates.nickname !== undefined) payload.nickname = updates.nickname;
      if (updates.avatar_url !== undefined) payload.avatar_url = updates.avatar_url;
      if (updates.manner_temperature !== undefined) payload.manner_temperature = updates.manner_temperature;
      if (updates.completed_count !== undefined) payload.completed_count = updates.completed_count;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: currentUserId,
          ...payload,
        });

      if (error) {
        console.warn('Profile DB update error, falling back to local state:', error);
      }

      // 로컬 유저 상태 즉시 동기화
      setUser((prev) => {
        if (!prev) return null;
        const newCompletedCount = updates.completed_count ?? prev.completed_count ?? 3;
        const newLevel = calculateUserLevel(newCompletedCount);
        const updated = {
          ...prev,
          ...updates,
          completed_count: newCompletedCount,
          level: newLevel,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem('cozy_user', JSON.stringify(updated));
        }
        return updated;
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || '프로필 업데이트 중 오류가 발생했습니다.' };
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id, user.email, user.nickname);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile, refreshProfile }}>
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
