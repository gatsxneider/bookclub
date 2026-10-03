import React from 'react';
import { cn } from './cn';
import { Icon } from './Icon';

type Variant = 'primary' | 'secondary' | 'tonal' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variantClass: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-container',
  secondary: 'bg-secondary text-on-secondary hover:bg-on-secondary-fixed-variant',
  tonal: 'bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim',
  ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
  danger: 'bg-error text-on-error hover:bg-on-error-container',
  outline: 'bg-surface-container-lowest text-on-surface border border-outline-variant hover:bg-surface-container',
};

// 모든 크기에서 최소 높이 44px(모바일 터치 타깃 기준) 보장
const sizeClass: Record<Size, string> = {
  sm: 'min-h-[44px] px-3.5 text-sm gap-1.5',
  md: 'min-h-[44px] px-5 text-sm gap-2',
  lg: 'min-h-[52px] px-6 text-base gap-2',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** 앞쪽 아이콘 이름 */
  icon?: string;
  /** 로딩 중이면 비활성화하고 aria-busy 표시 */
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, loading, fullWidth, className, children, disabled, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold transition-colors',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variantClass[variant],
        sizeClass[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading ? (
        <Icon name="progress_activity" className="text-[18px] motion-safe:animate-spin" />
      ) : (
        icon && <Icon name={icon} className="text-[18px]" />
      )}
      {children}
    </button>
  );
});

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Material Symbols 아이콘 이름 */
  icon: string;
  /** 필수: 스크린리더용 버튼 이름 */
  label: string;
  variant?: 'ghost' | 'tonal' | 'outline';
  filled?: boolean;
}

/** 아이콘만 있는 버튼. 44x44px 터치 영역과 접근 가능한 이름을 강제합니다. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = 'ghost', filled, className, type = 'button', title, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={title ?? label}
      className={cn(
        'tap-target rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variantClass[variant],
        className
      )}
      {...rest}
    >
      <Icon name={icon} filled={filled} className="text-[22px]" />
    </button>
  );
});

export default Button;
