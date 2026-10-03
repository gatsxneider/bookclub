'use client';

import { supabase } from '@/infrastructure/supabase/browserClient';

/**
 * 프레젠테이션 계층 전용 HTTP 클라이언트.
 * - 현재 Supabase 세션의 access token을 `Authorization: Bearer` 헤더로 첨부합니다.
 * - 서버는 이 토큰으로만 사용자를 식별하므로, 요청 본문에 user_id를 넣을 필요가 없습니다.
 * - 동일 출처(/api/*) 요청만 허용해 토큰이 외부로 유출되지 않도록 합니다.
 */
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, query?: Query): string {
  if (!path.startsWith('/api/')) {
    throw new Error('apiClient는 내부 /api 경로에만 사용할 수 있습니다.');
  }
  if (!query) return path;
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  });
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  options: { query?: Query; body?: unknown } = {}
): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(buildUrl(path, options.query), {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: 'same-origin',
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) ||
      (res.status === 401 ? '로그인이 필요합니다. 다시 로그인해 주세요.' : '요청을 처리하지 못했습니다.');
    throw new ApiError(String(message), res.status);
  }
  return data as T;
}

export const apiClient = {
  get: <T>(path: string, query?: Query) => request<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  delete: <T>(path: string, query?: Query) => request<T>('DELETE', path, { query }),
};
