import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { withErrorHandling } from '@/infrastructure/http/handler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query')?.trim() || '';
    const result = await container.bookUseCases.searchBooks(query);
    return NextResponse.json(result);
  });
}
