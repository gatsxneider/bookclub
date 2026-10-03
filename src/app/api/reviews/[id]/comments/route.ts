import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { getOptionalUserId, requireUserId } from '@/infrastructure/http/auth';
import { withErrorHandling } from '@/infrastructure/http/handler';
import { createReviewCommentSchema } from '@/application/validation/schemas';

export async function GET(
  req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const params = await Promise.resolve(context.params);
    const reviewId = params.id;
    const viewerId = await getOptionalUserId(req);

    const comments = await container.reviewCommentUseCases.getCommentsByReviewId(
      reviewId,
      viewerId
    );

    return NextResponse.json({ comments });
  });
}

export async function POST(
  req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  return withErrorHandling(async () => {
    const params = await Promise.resolve(context.params);
    const reviewId = params.id;
    const userId = await requireUserId(req);

    const body = await req.json();
    const validated = createReviewCommentSchema.parse({
      ...body,
      review_id: reviewId,
    });

    const comment = await container.reviewCommentUseCases.createComment(
      userId,
      validated
    );

    return NextResponse.json({ success: true, comment }, { status: 201 });
  });
}
