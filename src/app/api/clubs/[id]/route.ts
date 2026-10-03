import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { withErrorHandling } from '@/infrastructure/http/handler';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandling(async () => {
    const club = await container.clubUseCases.getClubById(params.id);
    return NextResponse.json({ club });
  });
}
