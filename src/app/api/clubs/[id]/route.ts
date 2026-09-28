import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clubId = params.id;
    const supabase = createServerSupabaseClient();

    const { data: club, error } = await supabase
      .from('clubs')
      .select(`
        *,
        book:books (*),
        leader:profiles!clubs_leader_id_fkey (*),
        members:club_members (*, profile:profiles (*)),
        schedules:club_schedules (*)
      `)
      .eq('id', clubId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ club });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
