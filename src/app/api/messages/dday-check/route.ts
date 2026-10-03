import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { requireUserId } from '@/infrastructure/http/auth';
import { withErrorHandling } from '@/infrastructure/http/handler';

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const userId = await requireUserId(req);
    const sentCount = await container.messageUseCases.runDdayCheck(userId);
    return NextResponse.json({ sentCount });
  });
}
