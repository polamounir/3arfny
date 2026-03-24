import { NextResponse } from 'next/server'
// The client you created in Step 1
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  console.log('AUTH CALLBACK: RECEIVED URL', request.url);
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('AUTH CALLBACK: CODE', !!code, 'NEXT', next);

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    console.log('AUTH CALLBACK: EXCHANGE RESULT', { hasData: !!data, hasSession: !!data?.session, error });
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can skip forwarded host check in local dev
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
