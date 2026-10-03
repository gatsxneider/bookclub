'use client';

import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';
import { Icon } from './Icon';

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 스크린리더가 읽는 대화상자 제목 (화면에도 표시) */
  title: React.ReactNode;
  /** 제목 아래 보조 설명 (aria-describedby 로 연결) */
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 처음 포커스를 받을 요소 */
  initialFocusRef?: React.RefObject<HTMLElement>;
  /** 배경 클릭으로 닫기 허용 여부 */
  closeOnBackdrop?: boolean;
  /** 제목 앞 아이콘 (Material Symbols 이름) */
  icon?: string;
  className?: string;
  /** 헤더를 숨기고 children이 전체를 그리는 경우 (제목은 sr-only로 유지) */
  hideHeader?: boolean;
}

const sizeClass = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

/**
 * 웹 접근성(KWCAG 2.2 / WCAG 2.1) 기준 모달
 * - role="dialog" + aria-modal + aria-labelledby/aria-describedby
 * - 열릴 때 내부로 포커스 이동, Tab 순환(포커스 트랩), ESC로 닫기
 * - 닫힐 때 모달을 연 요소로 포커스 복귀
 * - 배경 스크롤 잠금, 모바일에서는 하단 시트(bottom sheet) 형태 + safe-area 대응
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  initialFocusRef,
  closeOnBackdrop = true,
  icon,
  className,
  hideHeader = false,
}: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const target =
        initialFocusRef?.current ||
        panelRef.current?.querySelector<HTMLElement>('[data-autofocus]') ||
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE) ||
        panelRef.current;
      target?.focus();
    }, 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (nodes.length === 0) {
        e.preventDefault();
        panelRef.current.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflow;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isOpen, initialFocusRef]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="absolute inset-0 bg-on-surface/50 backdrop-blur-sm motion-safe:animate-cozy-fade-in"
        aria-hidden="true"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full bg-surface-container-lowest text-on-surface shadow-2xl flex flex-col',
          'rounded-t-3xl sm:rounded-2xl max-h-[92dvh] sm:max-h-[90dvh] outline-none',
          'pb-[env(safe-area-inset-bottom)] motion-safe:animate-cozy-sheet-up sm:motion-safe:animate-cozy-pop',
          sizeClass[size],
          className
        )}
      >
        {/* 모바일 시트 손잡이 (장식) */}
        <div className="sm:hidden mx-auto mt-2.5 mb-1 h-1.5 w-12 rounded-full bg-outline-variant" aria-hidden="true" />

        {hideHeader ? (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : (
          <div className="flex items-start gap-3 px-5 sm:px-6 pt-3 sm:pt-5 pb-3 border-b border-surface-container">
            {icon && <Icon name={icon} className="text-primary text-[24px] mt-0.5" />}
            <div className="flex-1 min-w-0">
              <h2 id={titleId} className="font-headline-sm text-lg sm:text-xl font-bold text-on-surface break-keep">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-sm text-on-surface-variant break-keep">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="tap-target -mr-2 -mt-1 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              aria-label="대화상자 닫기"
            >
              <Icon name="close" className="text-[22px]" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4">{children}</div>

        {footer && (
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-5 sm:px-6 py-4 border-t border-surface-container">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
