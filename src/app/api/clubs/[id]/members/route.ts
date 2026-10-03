import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { requireUserId } from '@/infrastructure/http/auth';
import { withErrorHandling } from '@/infrastructure/http/handler';
import { addMemberSchema, updateMemberStatusSchema } from '@/application/validation/schemas';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const members = await container.memberUseCases.getMembers(params.id);
    return NextResponse.json({ members });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const userId = await requireUserId(req);
    const body = await req.json().catch(() => ({}));
    const validated = addMemberSchema.parse(body);

    const member = await container.memberUseCases.addMember(params.id, userId, validated.nickname);
    return NextResponse.json({ success: true, member }, { status: 201 });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const userId = await requireUserId(req);
    const body = await req.json();
    const { memberId, status } = body;
    const validated = updateMemberStatusSchema.parse({ status });

    const member = await container.memberUseCases.updateMemberStatus(
      params.id,
      userId,
      memberId,
      validated.status
    );
    return NextResponse.json({ success: true, member });
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const userId = await requireUserId(req);
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    if (!memberId) {
      return NextResponse.json({ error: 'memberId가 필요합니다.' }, { status: 400 });
    }

    await container.memberUseCases.removeMember(params.id, userId, memberId);
    return NextResponse.json({ success: true });
  });
}
