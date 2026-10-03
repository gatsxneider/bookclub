import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { withErrorHandling } from '@/infrastructure/http/handler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email') || '';
    const result = await container.profileUseCases.checkEmail(email);
    const status = result.available ? 200 : 400;
    return NextResponse.json(result, { status });
  });
}
