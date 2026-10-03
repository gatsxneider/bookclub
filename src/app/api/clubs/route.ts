import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { requireUserId } from '@/infrastructure/http/auth';
import { withErrorHandling } from '@/infrastructure/http/handler';
import { createClubSchema } from '@/application/validation/schemas';

export async function GET() {
  return withErrorHandling(async () => {
    const clubs = await container.clubUseCases.getAllClubs();
    return NextResponse.json({ clubs });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const leaderId = await requireUserId(req);
    const body = await req.json();
    const validated = createClubSchema.parse(body);

    const newClub = await container.clubUseCases.createClub(leaderId, validated);
    return NextResponse.json({ success: true, club: newClub }, { status: 201 });
  });
}
