import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Hard-delete entirely anonymous messages or those already deleted by the sender
    await supabase
      .from('messages')
      .delete()
      .eq('receiver_id', user.id)
      .is('sender_id', null);

    // 2. Soft-delete messages with a known sender
    const { error } = await supabase
      .from('messages')
      .update({ is_deleted_by_receiver: true })
      .eq('receiver_id', user.id)
      .not('sender_id', 'is', null);

    // graceful fallback if DB column not created
    if (error && error.code === 'PGRST204') {
      await supabase
        .from('messages')
        .delete()
        .eq('receiver_id', user.id);
    } else if (error) {
      return NextResponse.json({ error: 'Failed to clear inbox' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
