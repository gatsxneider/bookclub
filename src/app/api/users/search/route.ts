import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/supabase/serverClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const trimmed = query.trim();

    const supabase = createServerSupabaseClient();

    let dbQuery = supabase
      .from('profiles')
      .select('id, nickname, avatar_url, manner_temperature, completed_count, role')
      .limit(10);

    if (trimmed) {
      dbQuery = dbQuery.ilike('nickname', `%${trimmed}%`);
    }

    const { data: users, error } = await dbQuery;

    if (error) {
      console.warn('Users search error:', error);
      return NextResponse.json({ users: [] });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
