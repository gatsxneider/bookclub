import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { requireUserId } from '@/infrastructure/http/auth';
import { withErrorHandling } from '@/infrastructure/http/handler';

export async function DELETE(
  req: NextRequest,
  context: { params: { commentId: string } | Promise<{ commentId: string }> }
) {
  return withErrorHandling(async () => {
    const params = await Promise.resolve(context.params);
    const commentId = params.commentId;
    const userId = await requireUserId(req);

    await container.reviewCommentUseCases.deleteComment(userId, commentId);

    return NextResponse.json({ success: true, message: '댓글이 삭제되었습니다.' });
  });
}
