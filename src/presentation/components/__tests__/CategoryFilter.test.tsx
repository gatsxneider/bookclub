import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CategoryFilter from '../CategoryFilter';

describe('CategoryFilter Component', () => {
  it('카테고리 목록이 렌더링되고 선택된 카테고리가 aria-pressed 상태를 가진다', () => {
    const handleSelect = vi.fn();
    render(
      <CategoryFilter
        selectedCategory="01. 소설 / 문학"
        onSelectCategory={handleSelect}
      />
    );

    const activeBtn = screen.getByRole('button', { name: '01. 소설 / 문학' });
    expect(activeBtn).toHaveAttribute('aria-pressed', 'true');

    const anotherBtn = screen.getByRole('button', { name: '02. 시 / 에세이' });
    expect(anotherBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(anotherBtn);
    expect(handleSelect).toHaveBeenCalledWith('02. 시 / 에세이');
  });
});
