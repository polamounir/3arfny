import { NextRequest, NextResponse, userAgent } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      profileId, 
      platform, 
      language, 
      screenWidth, 
      screenHeight, 
      cpuCores, 
      ramGb,
      referrer
    } = body;

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    const ua = userAgent(req);
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    const supabase = await createClient();
    
    const { error } = await supabase
      .from('visitor_logs')
      .insert({
        profile_id: profileId,
        ip_address: ip,
        user_agent: req.headers.get('user-agent'),
        browser_name: ua.browser.name,
        os_name: ua.os.name,
        device_type: ua.device.type || 'desktop',
        device_model: ua.device.model,
        platform,
        language,
        screen_width: screenWidth,
        screen_height: screenHeight,
        cpu_cores: cpuCores,
        ram_gb: ramGb,
        referrer: referrer || req.headers.get('referer'),
      });

    if (error) {
      console.error('VISITOR LOG DB ERROR:', error);
      // We don't want to fail the request for the user, just log it
      return NextResponse.json({ success: false, message: 'Database error' }, { status: 200 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('VISITOR LOG API CATCH:', err);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
