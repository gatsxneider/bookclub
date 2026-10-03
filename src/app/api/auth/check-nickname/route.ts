import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { withErrorHandling } from '@/infrastructure/http/handler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(req.url);
    const nickname = searchParams.get('nickname') || '';
    const result = await container.profileUseCases.checkNickname(nickname);
    const status = result.available ? 200 : 400;
    return NextResponse.json(result, { status });
  });
}
