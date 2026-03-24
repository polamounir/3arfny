import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:3arfny.mail@gmail.com';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    } else {
      console.warn('VAPID keys missing, push notifications may fail');
    }

    // Basic auth using Supabase webhook secret if provided
    const authHeader = req.headers.get('authorization');
    const secret = process.env.SUPABASE_WEBHOOK_SECRET;
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    
    // Support Supabase payload formats
    const receiverId = payload.record?.receiver_id || payload.userId;

    if (!receiverId) return NextResponse.json({ error: 'No receiver_id in payload' }, { status: 400 });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('push_subscription')
      .eq('id', receiverId)
      .single();

    if (profile?.push_subscription) {
      await webpush.sendNotification(
        profile.push_subscription,
        JSON.stringify({ title: 'عرفني', body: 'وصلتك رسالة جديدة! 💌', url: '/dashboard' })
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
