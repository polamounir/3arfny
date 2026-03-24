import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '0');
    const LIMIT = 50;

    const supabase = await createClient();
    
    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, count, error } = await supabase
      .from('visitor_logs')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false })
      .range(page * LIMIT, (page + 1) * LIMIT - 1);

    if (error) throw error;

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      hasMore: (count || 0) > (page + 1) * LIMIT
    });
  } catch (error) {
    console.error('ADMIN TRAFFIC ERROR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
