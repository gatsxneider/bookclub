import React from 'react';
import { cn } from './cn';

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Material Symbols 아이콘 이름 (예: 'search') */
  name: string;
  /** 채움 스타일 */
  filled?: boolean;
  /**
   * 의미 있는 아이콘일 때만 지정. 지정하지 않으면 장식용으로 간주되어
   * 스크린리더가 아이콘 글자("search" 등)를 읽지 않도록 aria-hidden 처리합니다.
   */
  label?: string;
}

/** 접근성을 고려한 Material Symbols 아이콘 */
export function Icon({ name, filled, label, className, style, ...rest }: IconProps) {
  return (
    <span
      className={cn('material-symbols-outlined select-none shrink-0', className)}
      style={filled ? { fontVariationSettings: "'FILL' 1", ...style } : style}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
      {...rest}
    >
      {name}
    </span>
  );
}

export default Icon;
