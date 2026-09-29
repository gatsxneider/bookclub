import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Footer from '../Footer';

describe('Footer Component', () => {
  it('푸터 브랜드명과 슬로건, 저작권 문구가 렌더링되어야 한다', () => {
    render(<Footer />);

    expect(screen.getByText('Cozy Book Club')).toBeInTheDocument();
    expect(screen.getByText(/다정한 사람들의 온기 있는 서재/)).toBeInTheDocument();
    expect(screen.getByText(/© 2026 Cozy Book Club. All rights reserved./)).toBeInTheDocument();
  });

  it('개인정보처리방침 아이콘 및 버튼이 렌더링되어야 한다', () => {
    render(<Footer />);

    const privacyBtn = screen.getByRole('button', { name: '개인정보처리방침' });
    expect(privacyBtn).toBeInTheDocument();
    expect(screen.getByText('개인정보처리방침')).toBeInTheDocument();
    expect(screen.getByText('shield_with_heart')).toBeInTheDocument();
  });

  it('개인정보처리방침 버튼 클릭 시 안내 토스트가 표시되어야 한다', () => {
    render(<Footer />);

    const privacyBtn = screen.getByRole('button', { name: '개인정보처리방침' });
    fireEvent.click(privacyBtn);

    expect(screen.getByText('개인정보처리방침 상세 내용이 준비 중입니다.')).toBeInTheDocument();
  });
});
