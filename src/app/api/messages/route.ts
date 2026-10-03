import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { requireUserId } from '@/infrastructure/http/auth';
import { withErrorHandling } from '@/infrastructure/http/handler';
import { createMessageSchema } from '@/application/validation/schemas';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const userId = await requireUserId(req);
    const { searchParams } = new URL(req.url);
    const box = searchParams.get('box') || 'inbox';

    if (box === 'unread_count') {
      const count = await container.messageUseCases.getUnreadCount(userId);
      return NextResponse.json({ unreadCount: count });
    }

    if (box === 'sent') {
      const messages = await container.messageUseCases.getSent(userId);
      return NextResponse.json({ messages });
    }

    const messages = await container.messageUseCases.getInbox(userId);
    return NextResponse.json({ messages });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const senderId = await requireUserId(req);
    const body = await req.json();
    const validated = createMessageSchema.parse(body);

    const message = await container.messageUseCases.sendMessage(senderId, validated);
    return NextResponse.json({ success: true, message }, { status: 201 });
  });
}
