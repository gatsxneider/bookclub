'use client';

import React, { useId } from 'react';
import { cn } from './cn';

export interface FormFieldProps {
  label: React.ReactNode;
  /** 오류 메시지가 있으면 aria-invalid + aria-describedby 로 연결되고 role="alert"로 읽힘 */
  error?: string | null;
  /** 도움말 텍스트 */
  hint?: React.ReactNode;
  required?: boolean;
  /** 라벨을 시각적으로 숨김(스크린리더에는 유지) */
  hideLabel?: boolean;
  className?: string;
  /**
   * 렌더 함수: 입력 요소에 연결해야 할 접근성 속성을 전달합니다.
   * 예) {(p) => <input {...p} />}
   */
  children: (props: {
    id: string;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
    'aria-required'?: boolean;
    required?: boolean;
  }) => React.ReactNode;
}

/** 라벨 · 도움말 · 오류를 입력 요소와 프로그래밍적으로 연결하는 폼 필드 */
export function FormField({ label, error, hint, required, hideLabel, className, children }: FormFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className={cn('text-sm font-semibold text-on-surface', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <>
            <span className="text-error ml-0.5" aria-hidden="true">
              *
            </span>
            <span className="sr-only">(필수)</span>
          </>
        )}
      </label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
        required,
      })}
      {hint && (
        <p id={hintId} className="text-xs text-on-surface-variant">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}

/** 공통 입력 스타일 (input/textarea/select 에 적용) */
export const inputClass =
  'w-full min-h-[44px] rounded-xl border border-outline-variant bg-surface-container-lowest px-3.5 py-2.5 text-base sm:text-sm text-on-surface placeholder:text-on-surface-variant/80 ' +
  'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 aria-[invalid=true]:border-error aria-[invalid=true]:ring-error/30';

export default FormField;
