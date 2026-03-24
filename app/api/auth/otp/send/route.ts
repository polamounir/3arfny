import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const FROM_NAME = '3arfny (عرفني)';
// ---------------------

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) return Response.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!supabaseUrl || !supabaseServiceKey || !gmailUser || !gmailPass) {
    console.error('MISSING ENV VARS:', { 
      supabase: !!supabaseUrl && !!supabaseServiceKey,
      gmail: !!gmailUser && !!gmailPass 
    });
    return Response.json({ 
      error: 'خطأ في إعدادات الخادم (Gmail/Supabase Keys missing)' 
    }, { status: 500 });
  }

  const fromName = process.env.EMAIL_FROM_NAME || '3arfny (عرفني)';
  const expirySeconds = parseInt(process.env.OTP_EXPIRY_SECONDS || '600');
  const expiryText = expirySeconds === 600 ? '10 دقائق' : `${expirySeconds} ثانية`;

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Generate 4-digit OTP
  const code = Math.floor(1000 + Math.random() * 9000).toString();

  try {
    // 2. Transporter for Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    // 3. Store in DB (Manual OTP table)
    await supabaseAdmin.from('otps').delete().eq('email', email);
    const { error: dbError } = await supabaseAdmin.from('otps').insert({
      email,
      code,
      expires_at: new Date(Date.now() + expirySeconds * 1000).toISOString(),
    });

    if (dbError) {
      console.error('DB ERROR:', dbError);
      return Response.json({ error: 'فشل حفظ الكود في قاعدة البيانات' }, { status: 500 });
    }

    // 4. Send via Nodemailer (Gmail)
    await transporter.sendMail({
      from: `"${fromName}" <${gmailUser}>`,
      to: email,
      subject: 'رمز التحقق الخاص بك - عرفني',
      html: `
        <div style="font-family: sans-serif; text-align: center; background: #0a0a0a; color: white; padding: 40px; border-radius: 20px;">
          <h1 style="color: #a855f7;">عرفني</h1>
          <p style="font-size: 18px;">رمز التحقق الخاص بك هو:</p>
          <div style="font-size: 48px; font-weight: 900; letter-spacing: 10px; margin: 20px 0; color: #0070f3;">${code}</div>
          <p style="color: #666;">تنتهي صلاحية هذا الرمز خلال ${expiryText}.</p>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (err: any) {
    console.error('MAIL/SERVER ERROR:', err);
    return Response.json({ error: 'فشل إرسال البريد: ' + err.message }, { status: 500 });
  }
}
