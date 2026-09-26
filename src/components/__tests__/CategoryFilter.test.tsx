import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import CategoryFilter from '../CategoryFilter';

describe('CategoryFilter Component', () => {
  it('12개 카테고리와 "전체" 버튼이 모두 렌더링되어야 한다', () => {
    const onSelect = vi.fn();
    render(<CategoryFilter selectedCategory="전체" onSelectCategory={onSelect} />);

    expect(screen.getByText('전체')).toBeInTheDocument();
    expect(screen.getByText(/소설/)).toBeInTheDocument();
    expect(screen.getByText(/경제/)).toBeInTheDocument();
    expect(screen.getByText(/IT/)).toBeInTheDocument();
    expect(screen.getByText(/어학/)).toBeInTheDocument();
  });

  it('카테고리 클릭 시 onSelectCategory 콜백이 호출되어야 한다', () => {
    const onSelect = vi.fn();
    render(<CategoryFilter selectedCategory="전체" onSelectCategory={onSelect} />);

    const novelBtn = screen.getByText(/소설/);
    fireEvent.click(novelBtn);
    expect(onSelect).toHaveBeenCalled();
  });

  it('하단 탐색바 및 네비게이션 화살표가 렌더링되어야 한다', () => {
    const onSelect = vi.fn();
    render(<CategoryFilter selectedCategory="전체" onSelectCategory={onSelect} />);

    expect(screen.getByLabelText('이전 카테고리 보기')).toBeInTheDocument();
    expect(screen.getByLabelText('다음 카테고리 보기')).toBeInTheDocument();
    expect(screen.getByRole('scrollbar')).toBeInTheDocument();
    expect(screen.getByText(/12개 전체 분야 탐색/)).toBeInTheDocument();
  });
});
