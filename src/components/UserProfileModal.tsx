'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth, calculateUserLevel } from '@/context/AuthContext';
import { validateImageFile } from '@/lib/core/fileValidation';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 기본 추천 아바타 프리셋 목록 (여성, 남성, 고양이)
const PRESET_AVATARS = [
  {
    id: 'female',
    label: '여성 독서가',
    tag: '여성',
    src: '/avatars/avatar_female.png',
  },
  {
    id: 'male',
    label: '남성 독서가',
    tag: '남성',
    src: '/avatars/avatar_male.png',
  },
  {
    id: 'cat',
    label: '고양이 독서가',
    tag: '고양이 🐱',
    src: '/avatars/avatar_cat.png',
  },
];

// 레벨 정보 매핑 (완독 1회=레벨1 ~ 완독 5회 이상=레벨5)
const LEVEL_CONFIG: Record<number, { title: string; icon: string; desc: string; color: string }> = {
  1: {
    title: '씨앗 독서가 (Level 1)',
    icon: 'potted_plant',
    desc: '첫 번째 완독의 기쁨을 시작한 독서가',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  2: {
    title: '새싹 독서가 (Level 2)',
    icon: 'spa',
    desc: '문장의 온기를 찾아가는 2회 완독가',
    color: 'bg-teal-100 text-teal-800 border-teal-300',
  },
  3: {
    title: '나무 독서가 (Level 3)',
    icon: 'park',
    desc: '서재의 깊이를 더해가는 3회 완독가',
    color: 'bg-green-100 text-green-800 border-green-300',
  },
  4: {
    title: '숲속 독서가 (Level 4)',
    icon: 'forest',
    desc: '다양한 책의 숲을 누비는 4회 완독가',
    color: 'bg-lime-100 text-lime-800 border-lime-300',
  },
  5: {
    title: '마스터 독서가 (Level 5 - 최고 레벨 👑)',
    icon: 'workspace_premium',
    desc: '5회 이상 완독을 달성한 최고의 독서 마스터',
    color: 'bg-amber-100 text-amber-900 border-amber-300',
  },
};

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState(user?.nickname || '모래고래');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar_url || '/avatars/avatar_female.png');
  const [customAvatarPreview, setCustomAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // user 정보나 모달 열림 상태 변경 시 폼 상태 최신 동기화
  useEffect(() => {
    if (user?.nickname) {
      setNickname(user.nickname);
    }
    if (user?.avatar_url) {
      setSelectedAvatar(user.avatar_url);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  // 완독 횟수 및 레벨 계산 (1~5)
  const completedCount = user?.completed_count ?? 3;
  const currentLevel = calculateUserLevel(completedCount);
  const levelInfo = LEVEL_CONFIG[currentLevel] || LEVEL_CONFIG[1];

  // 로컬 파일 업로드 처리 (JPG, PNG, GIF 엄격 검증 & Magic Bytes 바이너리 시그니처 체크)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error || '유효하지 않은 이미지 파일입니다.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setCustomAvatarPreview(base64Data);
      setSelectedAvatar(base64Data);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (src: string) => {
    setSelectedAvatar(src);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateProfile({
        nickname: nickname.trim(),
        avatar_url: selectedAvatar,
      });

      if (!res.success) {
        throw new Error(res.error || '프로필 저장 실패');
      }

      alert('프로필 아바타와 정보가 성공적으로 변경되었습니다! 🌿');
      onClose();
    } catch (err: any) {
      alert(err.message || '프로필 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-profile-modal-title"
    >
      <div className="bg-surface rounded-3xl w-full max-w-lg max-h-[92vh] shadow-2xl flex flex-col overflow-hidden border border-outline-variant">
        {/* 1. Header */}
        <div className="p-5 border-b border-surface-container flex items-center justify-between bg-surface-container-low shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary shadow-sm">
              <span className="material-symbols-outlined text-[22px]">badge</span>
            </div>
            <div>
              <h2 id="user-profile-modal-title" className="font-headline-sm text-lg font-bold text-on-surface">
                내 프로필 & 아바타 관리
              </h2>
              <p className="text-xs text-on-surface-variant">
                독서 레벨, 매너 온도를 확인하고 프로필 이미지를 변경해보세요
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* 2. Body (Scrollable) */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Card: Current Avatar Preview & Status Meta */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container shadow-xs flex flex-col sm:flex-row items-center gap-5">
            {/* Main Avatar Preview */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden ring-4 ring-primary/20 shadow-md bg-surface-container">
                <img
                  src={selectedAvatar || '/images/avatar.png'}
                  alt="선택된 프로필 아바타"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/avatar.png';
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                title="내 사진 업로드"
              >
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              </button>
            </div>

            {/* Nickname, Level & Manner Temp */}
            <div className="flex flex-col flex-1 min-w-0 text-center sm:text-left gap-1.5 w-full">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임 입력"
                  className="font-headline-sm text-base font-bold text-on-surface bg-surface-container-low px-2.5 py-1 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 max-w-[160px]"
                />
                <span className="text-xs text-on-surface-variant font-medium">님</span>
              </div>

              {/* Manner Temperature */}
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-secondary font-semibold">
                <span className="material-symbols-outlined text-[16px]">thermostat</span>
                <span>매너온도 {user?.manner_temperature ?? 20.0}℃</span>
                <span className="text-[10px] text-on-surface-variant font-normal">
                  ({(user?.manner_temperature ?? 20.0) >= 80 ? '열정 가득' : (user?.manner_temperature ?? 20.0) >= 40 ? '따뜻한 온기' : '시작하는 온기'})
                </span>
              </div>

              {/* Level Badge */}
              <div className="mt-1 flex items-center justify-center sm:justify-start">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${levelInfo.color}`}>
                  <span className="material-symbols-outlined text-[15px]">{levelInfo.icon}</span>
                  <span>{levelInfo.title}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Manner Temperature Meter (0℃ ~ 100℃) */}
          <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-secondary text-[16px]">thermostat</span>
                <span>매너 온도 게이지 (0℃ ~ 100℃)</span>
              </span>
              <span className="font-bold text-secondary">{user?.manner_temperature ?? 20.0}℃ / 100℃</span>
            </div>

            {/* Temperature Progress Bar */}
            <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, user?.manner_temperature ?? 20.0))}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-on-surface-variant font-medium px-0.5">
              <span>0℃ (최저)</span>
              <span>20℃ (시작)</span>
              <span>50℃</span>
              <span>100℃ (최고 🔥)</span>
            </div>

            <p className="text-[11px] text-on-surface-variant leading-relaxed pt-1">
              🌡️ <strong>매너온도 규칙</strong>: 처음 가입 시 <strong>20℃</strong>에서 시작합니다. 독후감을 기한 내에 작성하면 <strong>+2℃</strong>씩 상승(최고 100℃)하며, 기한 내 미작성 시 <strong>-2℃</strong>씩 하강(최저 0℃)합니다.
            </p>
          </div>

          {/* Level Progress Gauge (1 to 5) */}
          <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-[16px]">auto_stories</span>
                <span>독서클럽 완독 레벨 (Lv.1 ~ Lv.5)</span>
              </span>
              <span className="font-bold text-primary">완독 {completedCount}회 완료</span>
            </div>

            {/* 5-Step Visual Level Bar */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((lvl) => {
                const isReached = currentLevel >= lvl;
                const isMax = lvl === 5;
                return (
                  <div key={lvl} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-full h-2 rounded-full transition-all ${
                        isReached
                          ? isMax
                            ? 'bg-amber-500 shadow-xs'
                            : 'bg-primary'
                          : 'bg-surface-container-high'
                      }`}
                    />
                    <span
                      className={`text-[10px] font-semibold ${
                        isReached ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                    >
                      Lv.{lvl} {isMax ? '👑' : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-on-surface-variant leading-relaxed pt-1">
              💡 <strong>레벨 규칙</strong>: 클럽 참여 후 완독 1회 시 <strong>레벨 1</strong>부터 시작하며, 5회 완독 시 최고 레벨인 <strong>레벨 5(마스터 독서가 👑)</strong>에 도달합니다.
            </p>
          </div>

          {/* 3. Avatar Preset Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-primary text-[16px]">face</span>
                <span>추천 아바타 이미지 선택</span>
              </label>
              <span className="text-[11px] text-on-surface-variant">클릭하여 즉시 적용</span>
            </div>

            {/* Preset Avatars Grid */}
            <div className="grid grid-cols-3 gap-3">
              {PRESET_AVATARS.map((preset) => {
                const isSelected = selectedAvatar === preset.src;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.src)}
                    className={`group relative rounded-2xl overflow-hidden flex flex-col items-center border-2 p-1.5 transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30 shadow-md bg-primary-fixed/20'
                        : 'border-surface-container hover:border-primary/50 bg-surface-container-lowest'
                    }`}
                  >
                    <div className="w-full aspect-square rounded-xl overflow-hidden bg-surface-container relative">
                      <img
                        src={preset.src}
                        alt={preset.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.src = '/images/avatar.png';
                        }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md">
                            <span className="material-symbols-outlined text-[14px]">check</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <span className={`text-[11px] font-bold mt-1.5 transition-colors ${
                      isSelected ? 'text-primary' : 'text-on-surface-variant'
                    }`}>
                      {preset.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Custom Photo Upload Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-secondary text-[16px]">upload_file</span>
              <span>나만의 사진 직접 업로드</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/gif,.jpg,.jpeg,.png,.gif"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-4 rounded-2xl border-2 border-dashed border-surface-container-high hover:border-primary/50 bg-surface-container-lowest hover:bg-surface-container-low transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface">내 사진 파일 선택하기</p>
                  <p className="text-[11px] text-on-surface-variant">JPG, PNG, GIF (최대 5MB)</p>
                </div>
              </div>

              <button
                type="button"
                className="px-3.5 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-xs font-semibold text-on-surface transition-colors shrink-0"
              >
                사진 찾기
              </button>
            </div>
          </div>
        </form>

        {/* 5. Footer Actions */}
        <div className="p-4 bg-surface-container-low border-t border-surface-container flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-6 py-2 rounded-full bg-primary text-on-primary hover:bg-primary-container text-xs font-semibold shadow-md transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            <span>{loading ? '저장 중...' : '프로필 저장하기'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
