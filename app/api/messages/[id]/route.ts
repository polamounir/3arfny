import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: msg } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, is_deleted_by_sender, is_deleted_by_receiver')
      .eq('id', id)
      .single();

    if (!msg) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (msg.receiver_id === user.id) {
      if (!msg.sender_id || msg.is_deleted_by_sender) {
        // Hard delete if sender is anonymous or sender already deleted their copy
        const { error } = await supabase.from('messages').delete().eq('id', id);
        if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 });
      } else {
        // Soft delete for receiver
        const { error } = await supabase.from('messages').update({ is_deleted_by_receiver: true }).eq('id', id);
        // Fallback to hard delete if soft-delete fails (e.g., column doesn't exist yet before migration)
        if (error && error.code === 'PGRST204') {
          await supabase.from('messages').delete().eq('id', id);
        } else if (error) {
          return NextResponse.json({ error: 'Failed' }, { status: 500 });
        }
      }
    } else if (msg.sender_id === user.id) {
      if (msg.is_deleted_by_receiver) {
        // Hard delete if receiver already deleted their copy
        const { error } = await supabase.from('messages').delete().eq('id', id);
        if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 });
      } else {
        // Soft delete for sender
        const { error } = await supabase.from('messages').update({ is_deleted_by_sender: true }).eq('id', id);
        if (error && error.code === 'PGRST204') {
          await supabase.from('messages').delete().eq('id', id);
        } else if (error) {
          return NextResponse.json({ error: 'Failed' }, { status: 500 });
        }
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { reaction } = await request.json();
    const allowed = ['❤️', '😂', '🔥', '😮', '👏', null];
    if (reaction !== undefined && !allowed.includes(reaction)) {
      return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('messages')
      .update({ reaction })
      .eq('id', id)
      .eq('receiver_id', user.id);

    if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
