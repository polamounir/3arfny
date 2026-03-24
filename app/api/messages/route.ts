import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { receiverId, content, isAnonymous = true } = await request.json();

    if (!receiverId || !content) {
      return NextResponse.json({ error: 'Receiver and content are required' }, { status: 400 });
    }

    // STEP A - validate receiverId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(receiverId)) {
      return NextResponse.json({ error: 'Invalid receiver ID format' }, { status: 400 });
    }

    // STEP B - validate content
    if (content.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }
    if (content.length > 500) {
      return NextResponse.json({ error: 'Message too long (max 500 chars)' }, { status: 400 });
    }

    const supabase = await createClient();

    // STEP C - verify receiver exists and is accepting messages
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, receiving_enabled')
      .eq('id', receiverId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    }
    if (profile.receiving_enabled === false) {
      return NextResponse.json({ error: 'هذا المستخدم أوقف استقبال الرسائل' }, { status: 403 });
    }
    
    // Check if sender is authenticated (optional — anonymous senders have no session)
    const { data: { user } } = await supabase.auth.getUser();

    const payload: Record<string, any> = {
      receiver_id: receiverId,
      content: content.trim(),
    };
    if (user) {
      payload.sender_id = user.id;
      // If the user chooses to reveal their identity, set is_anonymous to false
      payload.is_anonymous = isAnonymous;
    }

    let { error } = await supabase.from('messages').insert(payload);

    // If sender_id or is_anonymous columns don't exist yet (migration not run), retry anonymously
    if (error && error.code === 'PGRST204' && (payload.sender_id || payload.is_anonymous !== undefined)) {
      delete payload.sender_id;
      delete payload.is_anonymous;
      ({ error } = await supabase.from('messages').insert(payload));
    }

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
