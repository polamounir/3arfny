import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';
import { checkRateLimit } from './lib/rateLimit';

// Next.js 16: renamed from `middleware` to `proxy`
export async function middleware(request: NextRequest) {
  // 1. Refresh Supabase Session
  const authResponse = await updateSession(request);

  // 2. Rate Limiting for Message Submission
  if (request.nextUrl.pathname.startsWith('/api/messages') && request.method === 'POST') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous';
    const { allowed } = await checkRateLimit(ip, 'messages', 5, 60);
    
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'كثير من الرسائل. انتظر دقيقة.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return authResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
