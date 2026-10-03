'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { cn } from './cn';
import { Icon } from './Icon';

type ToastTone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  /** 화면과 스크린리더(aria-live)에 동시에 알림을 표시합니다. alert() 대체용. */
  notify: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyle: Record<ToastTone, { cls: string; icon: string }> = {
  success: { cls: 'bg-primary text-on-primary', icon: 'check_circle' },
  error: { cls: 'bg-error text-on-error', icon: 'error' },
  info: { cls: 'bg-inverse-surface text-inverse-on-surface', icon: 'info' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = ++seq.current;
      setItems((prev) => [...prev.slice(-2), { id, message, tone }]);
      // 충분히 읽을 시간을 주기 위해 오류는 더 오래 유지 (WCAG 2.2.1)
      window.setTimeout(() => dismiss(id), tone === 'error' ? 8000 : 5000);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {/* polite: 일반 알림 / assertive 영역은 오류만 사용 */}
      <div
        className="pointer-events-none fixed inset-x-0 z-[200] flex flex-col items-center gap-2 px-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-6"
        aria-live="polite"
        aria-atomic="false"
        role="status"
      >
        {items.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : undefined}
            className={cn(
              'pointer-events-auto flex w-full max-w-md items-start gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-lg motion-safe:animate-cozy-fade-up',
              toneStyle[t.tone].cls
            )}
          >
            <Icon name={toneStyle[t.tone].icon} className="text-[20px]" />
            <p className="flex-1 break-keep">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="-my-1 -mr-2 flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/10"
              aria-label="알림 닫기"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Provider 밖(예: 단위 테스트)에서도 안전하게 동작하도록 window.alert 로 폴백 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (ctx) return ctx;
  return {
    notify: (message: string) => {
      if (typeof window !== 'undefined' && typeof window.alert === 'function') {
        try {
          window.alert(message);
        } catch {
          /* jsdom 등 alert 미구현 환경 */
        }
      }
    },
  };
}
