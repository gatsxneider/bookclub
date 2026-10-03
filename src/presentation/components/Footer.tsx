'use client';

import React, { useState } from 'react';
import CozyLogo from './CozyLogo';
import { Icon } from './ui/Icon';
import { useToast } from './ui/Toast';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export default function Footer() {
  const { notify } = useToast();
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const handlePrivacyClick = () => {
    notify('개인정보처리방침 상세 내용이 준비 중입니다.', 'info');
    setIsPrivacyOpen(true);
  };

  return (
    <footer className="w-full bg-surface-container-low border-t border-surface-container mt-auto pb-mobile-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <CozyLogo variant="horizontal" size="sm" />
          </div>
          <p className="text-xs text-on-surface-variant text-center md:text-left">
            함께 읽고 따뜻하게 기록하는 아늑한 독서 커뮤니티 · 다정한 사람들의 온기 있는 서재
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-on-surface-variant">
          <button
            type="button"
            onClick={handlePrivacyClick}
            className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer text-xs"
            aria-label="개인정보처리방침"
          >
            <Icon name="shield_with_heart" label="shield_with_heart" className="text-[16px] text-primary" />
            <span>개인정보처리방침</span>
          </button>
          <span>·</span>
          <span>이용약관</span>
          <span>·</span>
          <span>문의하기: cozy@bookclub.com</span>
        </div>

        <div className="text-[11px] text-on-surface-variant/70 text-center">
          © 2026 Cozy Book Club. All rights reserved.
        </div>
      </div>

      <Modal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
        title="개인정보처리방침 안내"
        size="md"
        icon="shield_with_heart"
        footer={
          <Button variant="primary" size="sm" onClick={() => setIsPrivacyOpen(false)}>
            확인
          </Button>
        }
      >
        <div className="text-sm text-on-surface leading-relaxed flex flex-col gap-3">
          <p>개인정보처리방침 상세 내용이 준비 중입니다.</p>
          <p className="text-xs text-on-surface-variant">
            코지 독서 클럽은 사용자의 소중한 개인정보(이메일, 닉네임, 독서 기록 등)를 안전하게 보호하며, 관계 법령을 준수합니다.
          </p>
        </div>
      </Modal>
    </footer>
  );
}
