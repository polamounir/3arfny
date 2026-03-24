import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Verify the caller is authenticated via the session cookie
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username, bio } = await req.json();

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleaned = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleaned.length < 3 || cleaned.length > 15) {
      return NextResponse.json({ error: 'اسم المستخدم يجب أن يكون بين 3 و 15 حرفاً' }, { status: 400 });
    }

    // 2. Check username availability
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('username', cleaned)
      .neq('id', user.id) // allow the same user to re-submit
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'اسم المستخدم محجوز، جرب اسماً آخر' }, { status: 409 });
    }

    // 3. Upsert profile using admin client (bypasses RLS)
    const payload: Record<string, any> = {
      id: user.id,
      username: cleaned,
      receiving_enabled: true,
    };
    if (bio && typeof bio === 'string' && bio.trim().length > 0) {
      payload.bio = bio.trim().slice(0, 100);
    }

    const { error: upsertError } = await supabaseAdmin
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (upsertError) {
      console.error('PROFILE CREATE ERROR:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, username: cleaned });
  } catch (err: any) {
    console.error('PROFILE CREATE UNEXPECTED:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
