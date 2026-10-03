import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from '@/application/errors';

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    const message = firstIssue ? `${firstIssue.message}` : '입력 데이터가 유효하지 않습니다.';
    return NextResponse.json({ error: message, code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  console.error('[API Error Uncaught]:', error);
  // 보안: 500 에러 시 내부 스택트레이스나 DB 오류 노출 금지
  return NextResponse.json(
    { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}

export function withErrorHandling(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  return fn().catch((err) => handleRouteError(err));
}
