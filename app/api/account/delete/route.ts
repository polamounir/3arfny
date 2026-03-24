import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function DELETE() {
  // 1. Get the authenticated user
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  // 2. Use admin client (service role) to delete auth user + cascade
  const adminClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // Delete messages first (in case no CASCADE on FK)
  await adminClient.from('messages').delete().eq('receiver_id', user.id);
  // Delete profile
  await adminClient.from('profiles').delete().eq('id', user.id);
  // Hard-delete the auth user
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
