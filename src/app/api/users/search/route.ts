import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { withErrorHandling } from '@/infrastructure/http/handler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const users = await container.profileUseCases.searchUsers(query);
    return NextResponse.json({ users });
  });
}
