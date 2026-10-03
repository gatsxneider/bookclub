import { NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { withErrorHandling } from '@/infrastructure/http/handler';

export async function GET() {
  return withErrorHandling(async () => {
    const ratings = await container.reviewUseCases.getBookRatings();
    return NextResponse.json({ ratings });
  });
}
