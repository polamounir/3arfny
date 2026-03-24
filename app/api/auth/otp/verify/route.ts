import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const { email, code } = await req.json();

  if (!email || !code) return Response.json({ error: 'Email and code are required' }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
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
      return Response.json({ error: 'رمز غير صحيح أو انتهت صلاحيته. الرمز صالح لمدة ١٠ دقائق فقط' }, { status: 400 });
    }

    // 2. Code is valid — delete it so it cannot be reused
    await supabaseAdmin.from('otps').delete().eq('id', data.id);

    // 3. Generate a magic link using the admin SDK
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (linkError || !linkData) {
      console.error('GENERATE LINK ERROR:', linkError);
      return Response.json({ error: 'فشل إنشاء جلسة الدخول' }, { status: 500 });
    }

    // 4. Return the RAW email_otp (pre-hash) to the client.
    //    supabase.auth.verifyOtp() on the client will hash it before comparison,
    //    so we must NOT send the already-hashed 'hashed_token'.
    return Response.json({ emailOtp: linkData.properties.email_otp });
  } catch (err: any) {
    console.error('VERIFY SERVER ERROR:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
