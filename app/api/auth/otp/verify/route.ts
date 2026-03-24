import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const { email, code } = await req.json();

  if (!email || !code) return Response.json({ error: 'Email and code are required' }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('VERIFY: MISSING ENV VARS');
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Check DB for matching code
    const { data, error } = await supabaseAdmin
      .from('otps')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      console.error('VERIFY ERROR:', error || 'Code not found/expired');
      return Response.json({ error: 'رمز غير صحيح أو انتهت صلاحيته (١٥ ثانية)' }, { status: 400 });
    }

    // 2. Code is valid! Delete it so it can't be reused
    await supabaseAdmin.from('otps').delete().eq('id', data.id);

    // 3. Generate a magic link for the user (Signs them in)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${new URL(req.url).origin}/auth/callback`,
      },
    });

    if (linkError) {
      console.error('GENERATE LINK ERROR:', linkError);
      return Response.json({ error: 'فشل إنشاء جلسة الدخول' }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      action_link: linkData.properties.action_link 
    });
  } catch (err: any) {
    console.error('VERIFY SERVER ERROR:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
