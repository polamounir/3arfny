import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

// Basic in-memory rate limiting (Note: This is per-edge-instance, not global)
const RATELIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 5;
const ipRequests = new Map<string, { count: number; lastReset: number }>();

// Next.js 16: renamed from `middleware` to `proxy`
export async function proxy(request: NextRequest) {
  // 1. Refresh Supabase Session
  const authResponse = await updateSession(request);

  // 2. Rate Limiting for Message Submission
  if (request.nextUrl.pathname.startsWith('/api/messages') && request.method === 'POST') {
    const ip = (request as any).ip || 'anonymous';
    const now = Date.now();
    const record = ipRequests.get(ip);

    if (!record || (now - record.lastReset) > RATELIMIT_WINDOW) {
      ipRequests.set(ip, { count: 1, lastReset: now });
    } else {
      if (record.count >= MAX_REQUESTS) {
        return new NextResponse(
          JSON.stringify({ error: 'Too many messages. Please wait a minute.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
      record.count += 1;
    }
  }

  return authResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
