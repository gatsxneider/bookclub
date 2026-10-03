import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { requireUserId } from '@/infrastructure/http/auth';
import { withErrorHandling } from '@/infrastructure/http/handler';

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const userId = await requireUserId(req);
    const body = await req.json();
    const { review_id } = body;

    if (!review_id) {
      return NextResponse.json({ error: 'review_id가 필요합니다.' }, { status: 400 });
    }

    const result = await container.reviewUseCases.empathizeReview(userId, review_id);
    return NextResponse.json({ success: true, ...result });
  });
}
