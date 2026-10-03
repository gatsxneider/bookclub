import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { requireUserId } from '@/infrastructure/http/auth';
import { withErrorHandling } from '@/infrastructure/http/handler';
import { messageActionSchema } from '@/application/validation/schemas';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const userId = await requireUserId(req);
    const body = await req.json();
    const validated = messageActionSchema.parse(body);

    const result = await container.messageUseCases.handleAction(
      userId,
      params.id,
      validated.action
    );
    return NextResponse.json(result);
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const userId = await requireUserId(req);
    const { searchParams } = new URL(req.url);
    const box = (searchParams.get('box') || 'inbox') as 'inbox' | 'sent';

    await container.messageUseCases.deleteMessage(userId, params.id, box);
    return NextResponse.json({ success: true });
  });
}
