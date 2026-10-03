'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/presentation/context/AuthContext';
import { Modal } from './ui/Modal';
import { FormField, inputClass } from './ui/FormField';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import { validateImageFile } from '@/domain/rules/fileValidation';
import { Icon } from './ui/Icon';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  { id: 'cat', url: '/avatars/avatar_cat.png', label: '코지 고양이' },
  { id: 'preset_1', url: '/avatars/avatar_preset_1.png', label: '단정한 독서가' },
  { id: 'preset_2', url: '/avatars/avatar_preset_2.png', label: '따뜻한 책방지기' },
  { id: 'female', url: '/avatars/avatar_female.png', label: '초록빛 독서가' },
  { id: 'male', url: '/avatars/avatar_male.png', label: '가을빛 독서가' },
];

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const { notify } = useToast();

  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('/avatars/avatar_cat.png');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setSelectedAvatar(user.avatar_url || '/avatars/avatar_cat.png');
      setBio(user.bio || '');
    }
  }, [user, isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validateImageFile(file);
    if (!validation.valid) {
      notify(validation.error || '지원하지 않는 이미지 파일입니다.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      if (base64Url) {
        setSelectedAvatar(base64Url);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setErrorMsg('닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await updateProfile({
        nickname: nickname.trim(),
        avatar_url: selectedAvatar,
        bio: bio.trim(),
      });

      if (res.success) {
        notify('프로필이 성공적으로 변경되었습니다.', 'success');
        onClose();
      } else {
        setErrorMsg(res.error || '프로필 수정에 실패했습니다.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="내 프로필 관리"
      description="필명과 아바타를 변경하여 나만의 독서 아이덴티티를 만들어보세요."
      icon="account_circle"
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {errorMsg && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium flex items-start gap-2"
          >
            <Icon name="error" className="text-[18px] shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. 현재 아바타 미리보기 및 등급 안내 */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low border border-surface-container">
          <div className="relative w-16 h-16 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-md bg-surface shrink-0">
            <img
              src={selectedAvatar}
              alt="선택된 프로필 아바타"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = '/avatars/avatar_cat.png';
              }}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-on-surface">{user?.nickname}</span>
              <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-xs font-extrabold shadow-sm">
                Lv.{user?.level || 1}
              </span>
            </div>
            <p className="text-xs text-primary font-semibold mt-0.5">
              감성 온도 {user?.manner_temperature ?? 20.0}℃ · 완독 {user?.completed_count ?? 0}회 달성
            </p>
            <p className="text-[11px] text-on-surface-variant mt-1">
              기한 내에 독후감을 작성하면 감성 온도가 올라갑니다 (+2.0℃).
            </p>
          </div>
        </div>

        {/* 2. 아바타 선택 라디오 그룹 */}
        <div>
          <label className="text-sm font-bold text-on-surface block mb-2">
            기본 아바타 선택
          </label>
          <div
            role="radiogroup"
            aria-label="아바타 목록"
            className="grid grid-cols-5 gap-2.5"
          >
            {PRESET_AVATARS.map((preset) => {
              const isSelected = selectedAvatar === preset.url;
              return (
                <button
                  key={preset.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={preset.label}
                  onClick={() => setSelectedAvatar(preset.url)}
                  className={`relative flex flex-col items-center p-1.5 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20'
                      : 'border-surface-container hover:border-outline-variant hover:bg-surface-container'
                  }`}
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-surface shadow-xs">
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-medium text-on-surface-variant mt-1 truncate max-w-full text-center">
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 직접 사진 업로드 */}
          <div className="mt-3 flex items-center justify-between gap-3 pt-2">
            <span className="text-xs text-on-surface-variant">
              내 사진이나 소장한 이미지를 직접 등록할 수도 있습니다.
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
              id="avatar-file-upload"
            />
            <label
              htmlFor="avatar-file-upload"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold bg-surface-container-high hover:bg-surface-variant text-on-surface cursor-pointer transition-colors shrink-0 shadow-xs"
            >
              <Icon name="upload" className="text-[16px]" />
              <span>사진 업로드</span>
            </label>
          </div>
        </div>

        {/* 3. 닉네임 입력 */}
        <FormField label="필명 / 닉네임" required hint="2자 이상 20자 이하로 설정해주세요.">
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="예: 다정한독서가"
              className={inputClass}
            />
          )}
        </FormField>

        {/* 4. 한 줄 소개 */}
        <FormField label="한 줄 소개 (선택)" hint="독서 클럽 멤버들에게 보여줄 나만의 소개글입니다.">
          {(fieldProps) => (
            <input
              {...fieldProps}
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="예: 따뜻한 차 한 잔과 소설을 좋아합니다."
              maxLength={100}
              className={inputClass}
            />
          )}
        </FormField>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-2 pt-2 border-t border-surface-container">
          <Button type="button" variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            프로필 저장
          </Button>
        </div>
      </form>
    </Modal>
  );
}
