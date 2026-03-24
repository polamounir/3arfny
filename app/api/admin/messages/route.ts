import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '0');
    const search = searchParams.get('search') || '';
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

    // Using exact relations if possible, otherwise fallback to basic select
    let query = supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(username), receiver:profiles!messages_receiver_id_fkey(username)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * LIMIT, (page + 1) * LIMIT - 1);

    if (search) {
      query = query.ilike('content', `%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) {
       console.error('QUERY ERROR:', error);
       // Fallback without joins if schema cache hasn't updated or relations are different
       const { data: fallback, count: fallbackCount, error: fallbackError } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * LIMIT, (page + 1) * LIMIT - 1);
       
       if (fallbackError) throw fallbackError;
       return NextResponse.json({ messages: fallback, total: fallbackCount, hasMore: (fallbackCount || 0) > (page + 1) * LIMIT });
    }

    return NextResponse.json({
      messages: data || [],
      total: count || 0,
      hasMore: (count || 0) > (page + 1) * LIMIT
    });
  } catch (error) {
    console.error('ADMIN MESSAGES API ERROR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
