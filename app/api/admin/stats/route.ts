import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
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

    // Aggregate Stats
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: totalMessages } = await supabase.from('messages').select('*', { count: 'exact', head: true });
    const { count: totalVisits } = await supabase.from('visitor_logs').select('*', { count: 'exact', head: true });

    // Recent Activity (last 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentVisits } = await supabase
      .from('visitor_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday);

    const { count: recentMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalMessages: totalMessages || 0,
      totalVisits: totalVisits || 0,
      recentVisits: recentVisits || 0,
      recentMessages: recentMessages || 0,
    });
  } catch (error) {
    console.error('ADMIN STATS ERROR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
