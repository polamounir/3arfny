import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { receiverId, content } = await request.json();

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Receiver and content are required' }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: 'Message too long (max 500 chars)' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Insert the message anonymously
    const { error } = await supabase
      .from('messages')
      .insert({
        receiver_id: receiverId,
        content: content.trim(),
      });

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
