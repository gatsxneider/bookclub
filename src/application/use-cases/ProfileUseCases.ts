import {
  IProfileRepository,
} from '@/domain/repositories';
import { Profile } from '@/domain/entities';
import { INITIAL_MANNER_TEMPERATURE } from '@/domain/rules/mannerTemperature';
import { ConflictError, NotFoundError, ValidationError } from '@/application/errors';
import { sanitizeHtml } from '@/application/validation/schemas';

export class ProfileUseCases {
  constructor(private profileRepo: IProfileRepository) {}

  async getProfile(userId: string, email?: string, defaultNickname?: string): Promise<Profile> {
    let profile = await this.profileRepo.findById(userId);
    if (!profile) {
      const nick = defaultNickname?.trim() || (email ? email.split('@')[0] : '독서가');
      profile = await this.profileRepo.create({
        id: userId,
        email: email || undefined,
        nickname: nick,
        avatar_url: '/avatars/avatar_cat.png',
        manner_temperature: INITIAL_MANNER_TEMPERATURE,
        completed_count: 0,
      });
    }
    return profile;
  }

  async updateProfile(
    userId: string,
    updates: { nickname?: string; avatar_url?: string; bio?: string }
  ): Promise<Profile> {
    const profile = await this.profileRepo.findById(userId);
    if (!profile) {
      throw new NotFoundError('프로필을 찾을 수 없습니다.');
    }

    const payload: Partial<Profile> = {};
    if (updates.nickname !== undefined) {
      const trimmed = sanitizeHtml(updates.nickname.trim());
      if (trimmed.length < 2 || trimmed.length > 20) {
        throw new ValidationError('닉네임은 2자 이상 20자 이하로 입력해주세요.');
      }
      if (trimmed !== profile.nickname) {
        const existing = await this.profileRepo.findByNickname(trimmed);
        if (existing && existing.id !== userId) {
          throw new ConflictError(`'${trimmed}'은(는) 이미 사용 중인 닉네임입니다.`);
        }
      }
      payload.nickname = trimmed;
    }

    if (updates.avatar_url !== undefined) {
      payload.avatar_url = updates.avatar_url;
    }
    if (updates.bio !== undefined) {
      payload.bio = sanitizeHtml(updates.bio.trim());
    }

    return this.profileRepo.update(userId, payload);
  }

  async checkNickname(rawNickname: string): Promise<{ available: boolean; message: string }> {
    const nickname = sanitizeHtml(rawNickname.trim());
    if (!nickname) {
      return { available: false, message: '닉네임을 입력해주세요.' };
    }
    if (nickname.length < 2 || nickname.length > 20) {
      return { available: false, message: '닉네임은 2자 이상 20자 이하로 입력해주세요.' };
    }
    const nicknameRegex = /^[가-힣a-zA-Z0-9_\-\s]+$/;
    if (!nicknameRegex.test(nickname)) {
      return { available: false, message: '닉네임에 특수문자는 사용할 수 없습니다.' };
    }

    const existing = await this.profileRepo.findByNickname(nickname);
    if (existing) {
      return { available: false, message: `'${nickname}'은(는) 이미 사용 중인 닉네임입니다.` };
    }

    return { available: true, message: '사용 가능한 닉네임입니다! ✨' };
  }

  async checkEmail(rawEmail: string): Promise<{ available: boolean; exists: boolean; message: string }> {
    const email = rawEmail.trim().toLowerCase();
    if (!email) {
      return { available: false, exists: false, message: '이메일을 입력해주세요.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { available: false, exists: false, message: '올바른 이메일 형식이 아닙니다.' };
    }

    const existing = await this.profileRepo.findByEmail(email);
    if (existing) {
      return { available: false, exists: true, message: '이미 가입된 회원입니다.' };
    }

    return { available: true, exists: false, message: '가입 가능한 이메일입니다.' };
  }

  async searchUsers(query: string): Promise<Profile[]> {
    return this.profileRepo.searchByNickname(query, 10);
  }
}
