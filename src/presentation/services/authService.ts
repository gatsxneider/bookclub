import { supabase } from '@/infrastructure/supabase/browserClient';
import { apiClient } from '@/presentation/lib/apiClient';
import { UserProfile } from '@/domain/entities';

export interface AuthResponse {
  success: boolean;
  error?: string;
  isExistingEmail?: boolean;
}

export const authService = {
  async getSession() {
    return supabase.auth.getSession();
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || '로그인 중 오류가 발생했습니다.' };
    }
  },

  async signUp(email: string, password: string, nickname: string): Promise<AuthResponse> {
    try {
      const trimmedNick = nickname.trim();
      const trimmedEmail = email.trim().toLowerCase();

      // 1. 닉네임 중복 사전 검사
      const nickRes = await apiClient.get<{ available: boolean; message: string }>('/api/auth/check-nickname', {
        nickname: trimmedNick,
      }).catch((err) => ({ available: false, message: err.message }));

      if (!nickRes.available) {
        return {
          success: false,
          error: nickRes.message || `'${trimmedNick}'은(는) 이미 사용 중인 닉네임입니다.`,
        };
      }

      // 2. 이메일 중복 사전 검사
      const emailRes = await apiClient.get<{ available: boolean; exists: boolean; message: string }>('/api/auth/check-email', {
        email: trimmedEmail,
      }).catch((err) => ({ available: false, exists: true, message: err.message }));

      if (emailRes.exists) {
        return {
          success: false,
          isExistingEmail: true,
          error: '이미 가입된 회원입니다. 로그인 화면으로 이동합니다.',
        };
      }

      // 3. Supabase Auth 가입 실행
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            nickname: trimmedNick,
          },
        },
      });

      if (error) {
        const isAlreadyRegistered =
          error.message.includes('already registered') ||
          error.message.includes('already in use') ||
          error.message.includes('User already exists');

        if (isAlreadyRegistered) {
          return {
            success: false,
            isExistingEmail: true,
            error: '이미 가입된 회원입니다. 로그인 화면으로 이동합니다.',
          };
        }

        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || '회원가입 중 오류가 발생했습니다.' };
    }
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  async fetchCurrentProfile(): Promise<UserProfile | null> {
    try {
      const res = await apiClient.get<{ profile: UserProfile }>('/api/profile');
      return res.profile;
    } catch {
      return null;
    }
  },

  async updateProfile(updates: { nickname?: string; avatar_url?: string; bio?: string }): Promise<UserProfile> {
    const res = await apiClient.patch<{ profile: UserProfile }>('/api/profile', updates);
    return res.profile;
  },
};
