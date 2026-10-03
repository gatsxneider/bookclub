import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { getOptionalUserId, requireUserId } from '@/infrastructure/http/auth';
import { withErrorHandling } from '@/infrastructure/http/handler';
import { createReviewSchema, updateReviewSchema } from '@/application/validation/schemas';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(req.url);
    const clubId = searchParams.get('club_id') || undefined;
    const scheduleId = searchParams.get('schedule_id') || undefined;
    const userIdFilter = searchParams.get('user_id') || undefined;
    const viewerId = await getOptionalUserId(req);

    const reviews = await container.reviewUseCases.getReviews(
      { club_id: clubId, schedule_id: scheduleId, user_id: userIdFilter },
      viewerId
    );

    return NextResponse.json({ reviews });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const userId = await requireUserId(req);
    const body = await req.json();
    const validated = createReviewSchema.parse(body);

    const result = await container.reviewUseCases.createReview(userId, validated);
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const userId = await requireUserId(req);
    const body = await req.json();
    const validated = updateReviewSchema.parse(body);

    const result = await container.reviewUseCases.updateReview(userId, validated);
    return NextResponse.json({ success: true, ...result });
  });
}
