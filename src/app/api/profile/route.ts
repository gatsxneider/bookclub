import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/container';
import { requireUserId } from '@/infrastructure/http/auth';
import { withErrorHandling } from '@/infrastructure/http/handler';
import { updateProfileSchema } from '@/application/validation/schemas';
import { createServerSupabaseClient } from '@/infrastructure/supabase/serverClient';

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const userId = await requireUserId(req);
    const authHeader = req.headers.get('authorization');
    const supabase = createServerSupabaseClient(authHeader);
    const { data: { user } } = await supabase.auth.getUser();

    const profile = await container.profileUseCases.getProfile(
      userId,
      user?.email,
      user?.user_metadata?.nickname
    );

    return NextResponse.json({ profile });
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const userId = await requireUserId(req);
    const body = await req.json();
    const validated = updateProfileSchema.parse(body);

    const updated = await container.profileUseCases.updateProfile(userId, validated);
    return NextResponse.json({ profile: updated, success: true });
  });
}
