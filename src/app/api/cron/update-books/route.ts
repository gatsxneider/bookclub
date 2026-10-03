import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { withErrorHandling } from '@/infrastructure/http/handler';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const authHeader = req.headers.get('authorization');
    const result = await container.bookUseCases.runCronUpdate(authHeader);
    return NextResponse.json({
      success: true,
      message: 'Category top 10 bestsellers updated successfully',
      ...result,
    });
  });
}
