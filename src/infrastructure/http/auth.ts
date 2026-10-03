import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/supabase/serverClient';
import { UnauthorizedError } from '@/application/errors';

export async function getOptionalUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  try {
    const supabase = createServerSupabaseClient(authHeader);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

export async function requireUserId(req: NextRequest): Promise<string> {
  const userId = await getOptionalUserId(req);
  if (!userId) {
    throw new UnauthorizedError('로그인이 필요한 기능입니다.');
  }
  return userId;
}
