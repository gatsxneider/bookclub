'use client';

import React, { useId, useRef } from 'react';
import { cn } from './cn';
import { Icon } from './Icon';

export interface TabItem<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: string;
  /** 탭 옆 개수 뱃지 */
  count?: number;
}

export interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 스크린리더용 탭 목록 이름 */
  label: string;
  className?: string;
  /** 각 탭이 제어하는 패널 id 접두사. 패널에 id={`${idPrefix}-${value}`} 지정 */
  idPrefix?: string;
}

/**
 * WAI-ARIA Tabs 패턴
 * - role="tablist"/"tab", aria-selected, roving tabindex
 * - ←/→/Home/End 키로 이동
 * - 모바일에서 가로 스크롤 가능
 */
export function Tabs<T extends string>({ items, value, onChange, label, className, idPrefix }: TabsProps<T>) {
  const autoId = useId();
  const prefix = idPrefix ?? autoId;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % items.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else return;
    e.preventDefault();
    refs.current[next]?.focus();
    onChange(items[next].value);
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('flex gap-1 overflow-x-auto scrollbar-none rounded-full bg-surface-container-low p-1', className)}
    >
      {items.map((item, i) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${prefix}-tab-${item.value}`}
            aria-selected={selected}
            aria-controls={idPrefix ? `${prefix}-${item.value}` : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'inline-flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors',
              selected
                ? 'bg-surface-container-lowest text-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            )}
          >
            {item.icon && <Icon name={item.icon} className="text-[18px]" />}
            {item.label}
            {typeof item.count === 'number' && (
              <span className={cn('rounded-full px-2 py-0.5 text-xs', selected ? 'bg-primary/10' : 'bg-surface-container-high')}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
