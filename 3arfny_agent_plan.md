# 3arfny — AI Agent Development Plan

> **Project**: 3arfny Anonymous Messaging App (Next.js 16 + Supabase + Tailwind v4)
> **Target**: Zero-cost deployment (Vercel Hobby + Supabase Free + Gmail SMTP)
> **Agent Role**: Full-stack developer — read, edit, create, and verify files across the repo
> **Execution Model**: Work phase-by-phase. Complete and verify each task before moving to the next. Never skip verification steps.

---

## Agent Rules (Read Before Every Task)

```
- Always read the target file in full before editing it
- After every file edit, re-read the changed section to confirm correctness
- Never delete logic without confirming it is truly unused
- If a task touches auth or security, double-check the change does not introduce a new vulnerability
- Prefer the smallest possible change that fixes the issue
- Run `npm run build` mentally against any TypeScript change — if it would fail, fix the types first
- All user-facing strings that are Arabic must remain Arabic; do not translate them
- Environment variable names: never hardcode secrets, always use process.env.*
```

---

## Phase 1 — Critical Fixes (Do These First, In Order)

**Objective**: Make the app work correctly and securely. Nothing in Phase 2 or 3 should begin until all Phase 1 tasks are marked done.

---

### TASK-001 · Rename middleware file

**Priority**: CRITICAL
**Effort**: 1 minute
**Files**: `proxy.ts` → `middleware.ts`

**Problem**
Next.js only executes a file named exactly `middleware.ts` at the project root. The current file is named `proxy.ts` and has a comment claiming it was "renamed" — but this is incorrect. The file is never executed, meaning:
- Supabase auth sessions are never refreshed on requests
- The rate limiter code never runs
- All protected routes are unguarded at the middleware layer

**Instructions**
```
1. Read proxy.ts in full
2. Rename the file to middleware.ts at the project root
3. Inside the file, rename the exported function from `proxy` back to `middleware`
   - Change: export async function proxy(request: NextRequest)
   - To:     export async function middleware(request: NextRequest)
4. Verify the export config block at the bottom is unchanged:
   export const config = { matcher: [...] }
5. Confirm no other file imports from proxy.ts (grep for "from './proxy'" and "from '../proxy'")
```

**Verification**
```
- File exists at: /middleware.ts (project root, not inside /app or /lib)
- Exported function name is exactly: middleware
- The config.matcher array is intact
- npm run build produces no errors related to middleware
```

---

### TASK-002 · Fix async params in dynamic route handler

**Priority**: CRITICAL
**Effort**: 5 minutes
**Files**: `app/api/messages/[id]/route.ts`

**Problem**
Next.js 16 changed route segment params to be a Promise. Accessing `params.id` synchronously throws a runtime error on every request to `DELETE /api/messages/:id`. Every single message delete in the dashboard is currently broken.

**Instructions**
```
1. Read app/api/messages/[id]/route.ts in full
2. Update the DELETE function signature and param access:

   BEFORE:
   export async function DELETE(
     request: Request,
     { params }: { params: { id: string } }
   ) {
     ...
     const { error } = await supabase
       .from('messages')
       .delete()
       .eq('id', params.id)

   AFTER:
   export async function DELETE(
     request: Request,
     { params }: { params: Promise<{ id: string }> }
   ) {
     const { id } = await params
     ...
     const { error } = await supabase
       .from('messages')
       .delete()
       .eq('id', id)

3. Scan all other files under app/api/ for any other dynamic route handlers
   that use { params }: { params: { ... } } — apply the same fix to each
```

**Verification**
```
- params type is Promise<{ id: string }>
- await params is called before id is used
- No TypeScript errors in the file
- Test mentally: DELETE /api/messages/some-uuid should reach the supabase delete call
```

---

### TASK-003 · Add server-side validation to anonymous message send

**Priority**: CRITICAL
**Effort**: 20 minutes
**Files**: `app/api/messages/route.ts`

**Problem**
`POST /api/messages` has no authentication check and no validation that the target user exists or has receiving enabled. Any script can:
- Spam any inbox with a known `receiverId` UUID
- Burn through Supabase free-tier write quota
- Harass users even when they have `receiving_enabled = false`

**Instructions**
```
1. Read app/api/messages/route.ts in full
2. After parsing the request body, add these validation steps IN ORDER:

   STEP A — validate receiverId format
   If receiverId is not a valid UUID format, return 400 immediately.
   Use a simple regex: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

   STEP B — validate content
   Already present. Keep the existing length check (max 500 chars).
   Add: if content.trim().length === 0, return 400.

   STEP C — verify receiver exists and is accepting messages
   Query the profiles table:
     const { data: profile, error: profileError } = await supabase
       .from('profiles')
       .select('id, receiving_enabled')
       .eq('id', receiverId)
       .single()

   If profileError or !profile → return 404 with Arabic error: 'المستخدم غير موجود'
   If profile.receiving_enabled === false → return 403 with Arabic error: 'هذا المستخدم أوقف استقبال الرسائل'

   STEP D — insert the message (existing code, unchanged)

3. The final function shape should be:
   - Parse body
   - Validate UUID format → 400 if invalid
   - Validate content length and emptiness → 400 if invalid
   - Fetch profile → 404 or 403 if blocked
   - Insert message → 500 if DB error
   - Return 200 success
```

**Verification**
```
- POST with a fake UUID returns 400
- POST to a user with receiving_enabled=false returns 403 with Arabic message
- POST to a non-existent user returns 404
- POST with empty content returns 400
- POST with valid data and valid receiver returns 200
- No auth token is required (anonymous sends must remain possible)
```

---

### TASK-004 · Fix OTP magic-link security exposure

**Priority**: CRITICAL
**Effort**: 30 minutes
**Files**: `app/api/auth/otp/verify/route.ts`, `app/login/page.tsx`

**Problem**
The verify endpoint returns a raw `action_link` JWT to the browser. The login page then calls `window.location.assign(data.action_link)`. This means the signed JWT appears in:
- Browser address bar (briefly)
- Browser history
- Server access logs via Referer header
- Any browser extension monitoring navigation

**Instructions**
```
1. Read app/api/auth/otp/verify/route.ts in full

2. Change the verify endpoint to redirect server-side instead of returning the link:

   REMOVE the last return statement:
     return Response.json({ success: true, action_link: linkData.properties.action_link })

   REPLACE with a server-side redirect:
     return Response.redirect(linkData.properties.action_link, 302)

   NOTE: Response.redirect in Next.js route handlers works correctly here.
   The browser will follow the redirect to the Supabase action link, exchange
   the token, and then Supabase redirects to /auth/callback which is already
   set up in app/auth/callback/route.ts.

3. Read app/login/page.tsx

4. In handleVerifyOtp, update the success branch:

   REMOVE:
     window.location.assign(data.action_link)

   REPLACE with:
     // The server now redirects directly — the fetch will follow the redirect
     // and the browser will land on /auth/callback automatically.
     // If the fetch was followed by redirect, we just need to handle the final URL.
     // Since fetch follows redirects by default, trigger a manual navigation to dashboard:
     toast.success('جارٍ تسجيل الدخول... 🚀')
     router.push('/dashboard')

   IMPORTANT: Because the POST body triggers a server redirect (302) to the
   Supabase magic link URL which in turn redirects to /auth/callback, the fetch
   call will follow these redirects. The actual session cookie will be set by
   Supabase during /auth/callback processing.

   A cleaner alternative (preferred): Change the fetch call to use
   redirect: 'follow' and then check response.url for the final destination,
   or simply navigate to /dashboard and let the middleware handle the session.

5. Remove the now-unused `action_link` handling from the login page entirely.
```

**Verification**
```
- The action_link JWT never appears in the browser URL bar
- The action_link JWT never appears in the JSON response body
- Completing OTP flow lands the user on /dashboard (via /auth/callback)
- The auth session cookie is correctly set after verification
- Browser history does not contain the action_link URL
```

---

### TASK-005 · Fix OTP error message copy

**Priority**: HIGH
**Effort**: 2 minutes
**Files**: `app/api/auth/otp/verify/route.ts`

**Problem**
The error message returned when an OTP is invalid says "١٥ ثانية" (15 seconds) but the actual expiry is 600 seconds (10 minutes). This is confusing — a user who enters a correct code after 20 seconds will get an error saying it expired in 15 seconds, which makes no sense.

**Instructions**
```
1. Read app/api/auth/otp/verify/route.ts
2. Find this line:
   return Response.json({ error: 'رمز غير صحيح أو انتهت صلاحيته (١٥ ثانية)' }, { status: 400 })
3. Replace with:
   return Response.json({ error: 'رمز غير صحيح أو انتهت صلاحيته. الرمز صالح لمدة ١٠ دقائق فقط' }, { status: 400 })
4. Also remove the dead code constant in app/api/auth/otp/send/route.ts:
   REMOVE: const FROM_NAME = '3arfny (عرفني)'
   (It is declared on line 4 but immediately overridden by process.env.EMAIL_FROM_NAME)
```

**Verification**
```
- Error string no longer mentions ١٥ ثانية
- Error string correctly says ١٠ دقائق
- Dead FROM_NAME constant is removed
- No other references to FROM_NAME exist in the file
```

---

## Phase 2 — Stability & Performance

**Objective**: Prevent production failures, improve scalability within free-tier limits.

---

### TASK-006 · Paginate dashboard message fetch

**Priority**: HIGH
**Effort**: 45 minutes
**Files**: `app/dashboard/page.tsx`

**Problem**
The dashboard fetches all messages with `.select('*')` and no limit. A user who receives 500+ messages (possible with viral growth) will:
- Load all messages into memory at once
- Hit Supabase free-tier bandwidth limits faster
- Experience a noticeably slow dashboard load

**Instructions**
```
1. Read app/dashboard/page.tsx in full

2. Define a page size constant at the top of the component:
   const PAGE_SIZE = 20

3. Add a page state variable:
   const [page, setPage] = useState(0)
   const [hasMore, setHasMore] = useState(true)
   const [loadingMore, setLoadingMore] = useState(false)

4. Change the initial fetch to use range:
   const { data: msgs } = await supabase
     .from('messages')
     .select('*')
     .order('created_at', { ascending: false })
     .range(0, PAGE_SIZE - 1)

   After fetch: if (msgs && msgs.length < PAGE_SIZE) setHasMore(false)

5. Create a loadMore function:
   const loadMore = async () => {
     if (loadingMore || !hasMore) return
     setLoadingMore(true)
     const nextPage = page + 1
     const { data: more } = await supabase
       .from('messages')
       .select('*')
       .order('created_at', { ascending: false })
       .range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1)
     if (more) {
       setMessages(prev => [...prev, ...more])
       setPage(nextPage)
       if (more.length < PAGE_SIZE) setHasMore(false)
     }
     setLoadingMore(false)
   }

6. Add a "Load more" button at the bottom of the messages list:
   {hasMore && (
     <button onClick={loadMore} disabled={loadingMore}>
       {loadingMore ? 'جاري التحميل...' : 'تحميل المزيد'}
     </button>
   )}

7. When a message is deleted, update only the local state (already done).
   When inbox is cleared, reset page to 0 and hasMore to true (already cleared messages).
```

**Verification**
```
- First load fetches exactly 20 messages (or fewer if inbox has < 20)
- "Load more" button appears when there are more messages
- "Load more" button disappears when all messages are loaded
- Deleting a message removes it from the current list without refetching
- Clearing inbox resets to empty state correctly
```

---

### TASK-007 · Fix onboarding auth race condition

**Priority**: HIGH
**Effort**: 20 minutes
**Files**: `app/onboarding/page.tsx`

**Problem**
The current auth guard uses a `setTimeout(1000)` as a fallback for slow cookie sync. This is a race condition — on a slow connection or slow device, 1 second may not be enough, causing authenticated users to be redirected to `/login`. The fix is to use only `onAuthStateChange` which fires reliably when the session is confirmed.

**Instructions**
```
1. Read app/onboarding/page.tsx in full

2. Remove the entire setTimeout block inside the getUser() .then() callback:
   REMOVE this block entirely:
     setTimeout(() => {
       supabase.auth.getUser().then(({ data: { user: retryUser } }) => {
         if (!retryUser) {
           toast.error('يجب عليك تسجيل الدخول أولاً')
           router.push('/login')
         } else {
           setUser(retryUser)
         }
       })
     }, 1000)

3. Add a loading state for the auth check:
   const [authChecking, setAuthChecking] = useState(true)

4. Update the useEffect to set authChecking to false once the auth state is known:
   In onAuthStateChange callback:
     setAuthChecking(false)
   In the initial getUser() .then():
     setAuthChecking(false)

5. Add a loading guard at the top of the render:
   if (authChecking) return (
     <div className="min-h-screen flex items-center justify-center bg-background">
       <div className="w-8 h-8 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
     </div>
   )

6. The onAuthStateChange handler should remain as the primary auth guard.
   Only redirect to /login when _event === 'SIGNED_OUT' or when getUser returns null
   AND authChecking is false (meaning the check has completed, not just not yet run).
```

**Verification**
```
- No setTimeout calls remain in onboarding/page.tsx
- Authenticated users are never redirected to /login spuriously
- Unauthenticated users are still redirected to /login
- A spinner is shown while the auth state is being resolved
- authChecking flips to false exactly once, after the first auth resolution
```

---

### TASK-008 · Replace in-memory rate limiter with Supabase-backed rate limiting

**Priority**: MEDIUM
**Effort**: 45 minutes
**Files**: `middleware.ts` (was proxy.ts), Supabase schema

**Problem**
The current rate limiter uses a `Map<string, { count, lastReset }>` stored in module-level memory. On Vercel, each serverless function invocation may be a fresh cold start, making the rate limiter reset constantly. The `ipRequests` Map provides zero protection in production.

**Instructions**
```
1. In Supabase dashboard, create a new table:
   Table name: rate_limits
   Columns:
     id          uuid        primary key default gen_random_uuid()
     key         text        not null unique  (format: "ip:endpoint:window")
     count       integer     not null default 1
     window_start timestamptz not null default now()
   
   Enable RLS: OFF (this table is written by service role only)
   
   Add index: CREATE INDEX ON rate_limits (key, window_start);

2. Create a helper function in lib/rateLimit.ts:

   import { createClient } from '@supabase/supabase-js'

   const adminClient = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
   )

   export async function checkRateLimit(
     ip: string,
     endpoint: string,
     maxRequests: number,
     windowSeconds: number
   ): Promise<{ allowed: boolean; remaining: number }> {
     const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString()
     const key = `${ip}:${endpoint}`

     // Clean old windows and upsert current count
     const { data } = await adminClient
       .from('rate_limits')
       .select('count, window_start')
       .eq('key', key)
       .gte('window_start', windowStart)
       .single()

     if (!data) {
       await adminClient.from('rate_limits').upsert({ key, count: 1, window_start: new Date().toISOString() })
       return { allowed: true, remaining: maxRequests - 1 }
     }

     if (data.count >= maxRequests) {
       return { allowed: false, remaining: 0 }
     }

     await adminClient.from('rate_limits').update({ count: data.count + 1 }).eq('key', key)
     return { allowed: true, remaining: maxRequests - data.count - 1 }
   }

3. Update middleware.ts to use this helper:
   REMOVE the ipRequests Map and all related code
   REPLACE the rate limit block with:
     const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous'
     const { allowed } = await checkRateLimit(ip, 'messages', 5, 60)
     if (!allowed) {
       return new NextResponse(
         JSON.stringify({ error: 'كثير من الرسائل. انتظر دقيقة.' }),
         { status: 429, headers: { 'Content-Type': 'application/json' } }
       )
     }

NOTE: The middleware runs on every request. Only apply rate limiting when
pathname.startsWith('/api/messages') && request.method === 'POST'.
Wrap the checkRateLimit call in that condition to avoid unnecessary DB calls.

ALTERNATIVE (simpler, zero schema changes): If adding a DB table is too
complex for this sprint, replace the Map with a Vercel KV or Upstash Redis
call. Upstash free tier: 10,000 requests/day, zero cold-start issues.
The Upstash REST API works from Edge middleware with a single fetch call.
```

**Verification**
```
- Sending 6 POST requests to /api/messages within 60 seconds from the same IP
  results in the 6th returning 429
- After 60 seconds, the counter resets and requests are allowed again
- The in-memory Map is completely removed from middleware.ts
- Cold-starting the function does not reset the rate limit counter
```

---

### TASK-009 · Standardize Supabase environment variable naming

**Priority**: MEDIUM
**Effort**: 10 minutes
**Files**: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `.env.example` (create if missing)

**Problem**
The app uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` which is a non-standard name invented by this project. The official Supabase SSR documentation and all community resources use `NEXT_PUBLIC_SUPABASE_ANON_KEY`. When developers follow official docs to set up a new environment, the key is missing and auth silently fails with a confusing undefined error.

**Instructions**
```
1. Read each of the three supabase client files

2. In each file, change:
   process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
   to:
   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

3. Create a file .env.example at the project root with this content:
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Gmail SMTP
   GMAIL_USER=your-gmail@gmail.com
   GMAIL_APP_PASSWORD=your-16-char-app-password

   # OTP settings
   OTP_EXPIRY_SECONDS=600
   NEXT_PUBLIC_RESEND_COOLDOWN_SECONDS=15

   # Email branding
   EMAIL_FROM_NAME=3arfny (عرفني)

4. Update README.md to document the env var setup steps

5. Search the entire codebase for any remaining references to
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY and update them
```

**Verification**
```
- grep -r "PUBLISHABLE_DEFAULT_KEY" . returns zero results
- All three supabase client files use NEXT_PUBLIC_SUPABASE_ANON_KEY
- .env.example exists and documents all required variables
- npm run build succeeds (TypeScript does not care about env var names, but confirm no runtime undefined errors)
```

---

## Phase 3 — New Features

**Objective**: Increase engagement, retention, and viral growth. All features must work within the free-tier cost model.

---

### TASK-010 · Question prompts on public send page

**Priority**: HIGH (highest ROI growth feature)
**Effort**: 2 hours
**Files**: `app/u/[username]/page.tsx`, Supabase schema

**Problem / Opportunity**
The send page shows a blank textarea. Many visitors don't know what to write and leave without sending. Showing prompt chips ("What's one thing you wish I knew?", "Rate my vibe 1-10") dramatically increases send completion rate.

**Instructions**
```
1. Add a prompts column to the profiles table in Supabase:
   ALTER TABLE profiles ADD COLUMN prompts text[] DEFAULT ARRAY[
     'ما رأيك بي بصدق؟',
     'قيّم أسلوبي من ١ إلى ١٠',
     'شيء تتمنى أن أعرفه عنك',
     'ما الشيء الذي يميزني؟'
   ]::text[];

2. Update the profile fetch in app/u/[username]/page.tsx to include prompts:
   .select('id, username, receiving_enabled, prompts')

3. Add a prompt chips UI above the textarea:
   - Show 3 random prompts from the array (shuffle and take first 3)
   - Each chip is a button: clicking it sets the textarea value to that prompt
   - Style: small pill buttons, slightly transparent, RTL layout
   - Label above: "أو اختر سؤالاً لتجيب عليه"

4. In app/settings/page.tsx, add a prompts editor section:
   - Show the current prompts as editable text inputs (up to 5)
   - Add/remove prompt buttons
   - Save button calls a PATCH endpoint or direct Supabase update
   - Default prompts are shown if the user has not customized them

5. The prompt chips must be client-side only (no SSR needed).
   Shuffle logic: Fisher-Yates on the prompts array, take slice(0, 3).
```

**Verification**
```
- Public send page shows 3 prompt chips above the textarea
- Clicking a chip populates the textarea with that prompt text
- Chips shuffle on each page load (not always the same 3)
- Settings page allows editing custom prompts
- Custom prompts appear on the user's public send page
- Default prompts are used when no custom prompts are set
- All prompt text is right-to-left aligned
```

---

### TASK-011 · Message reactions

**Priority**: MEDIUM
**Effort**: 2 hours
**Files**: `app/dashboard/page.tsx`, `app/api/messages/[id]/route.ts`, Supabase schema

**Problem / Opportunity**
Currently the inbox owner can only delete messages. Adding a single-emoji reaction creates a lightweight feedback loop that makes senders feel heard, increasing the likelihood they send more messages.

**Instructions**
```
1. Add a reaction column to the messages table:
   ALTER TABLE messages ADD COLUMN reaction text DEFAULT NULL;
   -- Allowed values: null, '❤️', '😂', '🔥', '😮', '👏'

2. Add a PATCH handler to app/api/messages/[id]/route.ts:
   export async function PATCH(
     request: Request,
     { params }: { params: Promise<{ id: string }> }
   ) {
     const { id } = await params
     const { reaction } = await request.json()
     const allowed = ['❤️', '😂', '🔥', '😮', '👏', null]
     if (!allowed.includes(reaction)) {
       return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 })
     }
     const supabase = await createClient()
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

     const { error } = await supabase
       .from('messages')
       .update({ reaction })
       .eq('id', id)
       .eq('receiver_id', user.id)

     if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 })
     return NextResponse.json({ success: true })
   }

3. In app/dashboard/page.tsx, add a reaction picker to each message card:
   - Show the current reaction (if any) as a badge on the message
   - On hover (desktop) or tap (mobile), show a row of 5 emoji buttons
   - Clicking an emoji calls PATCH /api/messages/:id with the reaction
   - Clicking the active emoji again clears it (sends null)
   - Update local state immediately (optimistic update), revert on error

4. Reaction display:
   - Reacted messages show the emoji in the bottom-left corner of the card
   - The emoji is 20px, slightly transparent if no hover
   - Unreacted messages show a faint "+" icon that becomes the picker on hover
```

**Verification**
```
- Each message card shows a reaction picker on hover
- Clicking an emoji sets the reaction and updates the UI immediately
- Clicking the same emoji again removes the reaction
- The reaction persists after page refresh (stored in DB)
- Only the message owner can set reactions (PATCH validates receiver_id)
- Invalid emoji values are rejected with 400
```

---

### TASK-012 · User bio / profile tagline

**Priority**: MEDIUM
**Effort**: 1 hour
**Files**: `app/u/[username]/page.tsx`, `app/settings/page.tsx`, `app/onboarding/page.tsx`, Supabase schema

**Problem / Opportunity**
The public send page shows only "@username" with no context about who this person is. A short bio ("CS student · Cairo · asks too many questions") makes the profile feel personal and increases the chance a visitor sends a message.

**Instructions**
```
1. Add bio column to profiles table:
   ALTER TABLE profiles ADD COLUMN bio text DEFAULT NULL;
   -- Max length enforced: 100 characters

2. Update the profile fetch in app/u/[username]/page.tsx:
   .select('id, username, receiving_enabled, prompts, bio')

3. On the public send page, show the bio below the username:
   {profile.bio && (
     <p className="text-white/50 text-sm text-center max-w-xs mx-auto">
       {profile.bio}
     </p>
   )}
   Position: between the username badge and the form.

4. In app/settings/page.tsx, add a bio editor section:
   - Text input (single line), max 100 chars
   - Character counter: "{bio.length} / 100"
   - Auto-save on blur OR explicit save button
   - Empty bio = no bio shown on public page (not an empty string)

5. In app/onboarding/page.tsx, add an optional bio step:
   - After username is confirmed available, show a second optional field
   - Label: "أضف جملة تعريفية (اختياري)"
   - Placeholder: "طالب جامعي · القاهرة · أحب الأسئلة الصعبة"
   - "تخطي" (skip) link below
   - Both bio and username are saved together in the upsert

6. Sanitize bio: trim whitespace, reject if only whitespace
```

**Verification**
```
- Bio appears on the public send page below the username
- Bio does not appear if it is null or empty
- Settings page allows editing and saving the bio
- Bio enforces 100 character maximum (both client and server)
- Onboarding has an optional bio step with a skip option
- Bio is included in the profiles upsert during onboarding
```

---

### TASK-013 · Push notifications via PWA

**Priority**: MEDIUM
**Effort**: 3 hours
**Files**: `app/sw.ts`, `app/dashboard/page.tsx`, Supabase Edge Functions (new), `app/api/push/route.ts` (new)

**Problem / Opportunity**
The service worker is already wired via Serwist. Adding Web Push means users get notified when a new anonymous message arrives, even when the app is closed. This is a major retention driver and is fully free (no external push service needed — Web Push is a browser standard).

**Instructions**
```
1. Generate VAPID keys (one-time setup):
   npx web-push generate-vapid-keys
   Add to environment variables:
     NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
     VAPID_PRIVATE_KEY=...
     VAPID_SUBJECT=mailto:3arfny.mail@gmail.com

2. Add push_subscription column to profiles table:
   ALTER TABLE profiles ADD COLUMN push_subscription jsonb DEFAULT NULL;

3. Create app/api/push/subscribe/route.ts:
   Accepts POST with a PushSubscription object from the browser.
   Validates the user is authenticated.
   Stores the subscription in profiles.push_subscription for their user ID.

4. Create app/api/push/route.ts (internal, called by Supabase webhook):
   Accepts POST with { userId, message } from a Supabase Database Webhook.
   Looks up push_subscription for the user.
   Sends a push notification using the web-push npm package.
   Notification payload: { title: 'عرفني', body: 'وصلتك رسالة جديدة! 💌' }
   NOTE: Install web-push: npm install web-push @types/web-push

5. In Supabase Dashboard, create a Database Webhook:
   Table: messages
   Event: INSERT
   URL: https://your-domain.vercel.app/api/push
   Headers: { Authorization: Bearer SUPABASE_WEBHOOK_SECRET }

6. In app/sw.ts, add push event handler:
   sw.addEventListener('push', (event) => {
     const data = event.data?.json() ?? {}
     event.waitUntil(
       (self as any).registration.showNotification(data.title || 'عرفني', {
         body: data.body || 'وصلتك رسالة جديدة!',
         icon: '/icons/icon-192x192.png',
         badge: '/icons/icon-192x192.png',
         dir: 'rtl',
         lang: 'ar',
         data: { url: '/dashboard' }
       })
     )
   })

   sw.addEventListener('notificationclick', (event) => {
     event.notification.close()
     event.waitUntil(
       (self as any).clients.openWindow(event.notification.data?.url || '/dashboard')
     )
   })

7. In app/dashboard/page.tsx, add push subscription prompt:
   After the user loads the dashboard for the first time, check:
     if ('Notification' in window && Notification.permission === 'default') {
       // Show a subtle banner: "فعّل الإشعارات لتعلم فور وصول رسالة جديدة"
       // With a "تفعيل" button that calls requestNotificationPermission()
     }
   
   requestNotificationPermission():
     const permission = await Notification.requestPermission()
     if (permission === 'granted') {
       const reg = await navigator.serviceWorker.ready
       const sub = await reg.pushManager.subscribe({
         userVisibleOnly: true,
         applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
       })
       await fetch('/api/push/subscribe', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(sub)
       })
     }
```

**Verification**
```
- Dashboard shows notification permission prompt on first visit
- Granting permission stores the subscription in the DB
- Sending a message to a subscribed user triggers a push notification
- Clicking the notification opens /dashboard
- Notification text is Arabic and right-to-left
- Users who deny permission are not prompted again (browser handles this)
- VAPID keys are in environment variables, never hardcoded
```

---

### TASK-014 · Content reporting / block system

**Priority**: MEDIUM
**Effort**: 2 hours
**Files**: `app/dashboard/page.tsx`, `app/api/messages/[id]/route.ts`, Supabase schema

**Problem / Opportunity**
Users currently have no way to flag abusive messages. Without this, malicious users can repeatedly harass someone with no recourse. A report button satisfies the Terms of Service ("يحق لنا إزالة أي محتوى") and gives users agency.

**Instructions**
```
1. Add a reports table to Supabase:
   CREATE TABLE reports (
     id          uuid primary key default gen_random_uuid(),
     message_id  uuid not null references messages(id) on delete cascade,
     reporter_id uuid not null references profiles(id) on delete cascade,
     reason      text,
     created_at  timestamptz default now(),
     UNIQUE(message_id, reporter_id)
   );
   Enable RLS: users can INSERT their own reports, no SELECT/UPDATE/DELETE.

2. Add POST handler for reporting to app/api/messages/[id]/route.ts:
   export async function POST(
     request: Request,
     { params }: { params: Promise<{ id: string }> }
   ) {
     // Handle the /report sub-action via request body
     const { id } = await params
     const { action } = await request.json()
     if (action !== 'report') return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

     const supabase = await createClient()
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

     const { error } = await supabase
       .from('reports')
       .insert({ message_id: id, reporter_id: user.id })

     if (error?.code === '23505') {
       return NextResponse.json({ error: 'Already reported' }, { status: 409 })
     }
     if (error) return NextResponse.json({ error: 'Failed' }, { status: 500 })
     return NextResponse.json({ success: true })
   }

   ALTERNATIVE: Create a separate /api/messages/[id]/report/route.ts file
   to keep the handlers clean. Preferred.

3. In app/dashboard/page.tsx, add a report button to each message card:
   - Small flag icon (use Lucide's Flag component)
   - Appears alongside the existing Share and Delete buttons on hover
   - On click: show a confirmation toast "هل تريد الإبلاغ عن هذه الرسالة؟"
     with Confirm/Cancel actions (use sonner's toast with action buttons)
   - On confirm: POST to /api/messages/:id/report
   - On success: show "تم الإبلاغ عن الرسالة" and disable the report button

4. After reporting, optionally hide the message from the inbox (local state only):
   Add a "reportedIds" Set to state. Reported message IDs are filtered out of the display.
   The message is NOT deleted from the DB (it may be reviewed by admin).
```

**Verification**
```
- Each message card shows a report (flag) button on hover
- Clicking report shows a confirmation before submitting
- Successfully reported messages show a "reported" indicator
- Reporting the same message twice returns 409 (already reported)
- Reports are stored in the reports table in Supabase
- The message is not deleted, only hidden from the user's view locally
- Unauthenticated users cannot report (401)
```

---

### TASK-015 · Arabic font upgrade

**Priority**: LOW (but high visual impact)
**Effort**: 15 minutes
**Files**: `app/layout.tsx`, `app/globals.css`

**Problem / Opportunity**
Geist Sans has poor Arabic glyph support. Arabic characters in the current app render with incorrect spacing, missing letterforms, and inconsistent baseline. Switching to a proper Arabic font (Noto Sans Arabic or Cairo) dramatically improves readability for the target audience.

**Instructions**
```
1. Read app/layout.tsx in full

2. Replace the Geist font imports with a bilingual pair:
   REMOVE:
     import { Geist, Geist_Mono } from 'next/font/google'
     const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
     const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

   ADD:
     import { Cairo, Geist_Mono } from 'next/font/google'
     const cairo = Cairo({
       variable: '--font-cairo',
       subsets: ['arabic', 'latin'],
       weight: ['400', '500', '700', '900'],
       display: 'swap'
     })
     const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

3. Update the html className in layout.tsx:
   REMOVE: ${geistSans.variable}
   ADD:    ${cairo.variable}

4. Update app/globals.css:
   In @theme:
   REMOVE: --font-sans: var(--font-geist-sans)
   ADD:    --font-sans: var(--font-cairo)

   In body:
   ADD: font-family: var(--font-cairo), sans-serif;

5. The Geist_Mono stays for code blocks (OTP input uses tracking, which works fine with mono)

NOTE: Cairo supports Arabic + Latin in a single font, so mixed-language
content (email inputs, usernames) will render correctly without font stacks.
```

**Verification**
```
- Arabic text on all pages uses Cairo font
- No fallback to system Arabic font (verify in browser DevTools > Computed styles)
- The OTP input still uses monospace for the 4-digit code
- Font weight 900 is available (used for headlines in the current design)
- Latin characters (email, username) also render correctly with Cairo
- npm run build succeeds with no font loading errors
```

---

## Appendix A — Supabase Schema Summary

All schema changes required by this plan, in execution order:

```sql
-- TASK-008: Rate limiting table
CREATE TABLE rate_limits (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique,
  count        integer not null default 1,
  window_start timestamptz not null default now()
);
CREATE INDEX ON rate_limits (key, window_start);

-- TASK-010: Question prompts
ALTER TABLE profiles ADD COLUMN prompts text[] DEFAULT ARRAY[
  'ما رأيك بي بصدق؟',
  'قيّم أسلوبي من ١ إلى ١٠',
  'شيء تتمنى أن أعرفه عنك',
  'ما الشيء الذي يميزني؟'
]::text[];

-- TASK-011: Message reactions
ALTER TABLE messages ADD COLUMN reaction text DEFAULT NULL;

-- TASK-012: User bio
ALTER TABLE profiles ADD COLUMN bio text DEFAULT NULL;

-- TASK-013: Push subscriptions
ALTER TABLE profiles ADD COLUMN push_subscription jsonb DEFAULT NULL;

-- TASK-014: Reports
CREATE TABLE reports (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references messages(id) on delete cascade,
  reporter_id uuid not null references profiles(id) on delete cascade,
  reason      text,
  created_at  timestamptz default now(),
  UNIQUE(message_id, reporter_id)
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can insert own reports"
  ON reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
```

---

## Appendix B — New Environment Variables

Variables added by this plan that must be set in Vercel dashboard:

```bash
# TASK-013 — Web Push VAPID keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=   # generated by: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=              # keep secret, server-only
VAPID_SUBJECT=mailto:3arfny.mail@gmail.com

# TASK-013 — Supabase webhook secret (set in Supabase Webhooks dashboard)
SUPABASE_WEBHOOK_SECRET=        # any random 32-char string

# Renamed from TASK-009 (existing variable, new name)
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # was: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
```

---

## Appendix C — Task Execution Checklist

```
Phase 1 — Critical (all must be done before Phase 2)
  [ ] TASK-001  Rename proxy.ts → middleware.ts
  [ ] TASK-002  Fix async params in delete route
  [ ] TASK-003  Add server-side validation to message send
  [ ] TASK-004  Fix OTP magic-link security
  [ ] TASK-005  Fix OTP error message copy

Phase 2 — Stability
  [ ] TASK-006  Paginate dashboard message fetch
  [ ] TASK-007  Fix onboarding auth race condition
  [ ] TASK-008  Replace in-memory rate limiter
  [ ] TASK-009  Standardize Supabase env var names

Phase 3 — Features
  [ ] TASK-010  Question prompts on send page
  [ ] TASK-011  Message reactions
  [ ] TASK-012  User bio / tagline
  [ ] TASK-013  Push notifications
  [ ] TASK-014  Content reporting / block
  [ ] TASK-015  Arabic font upgrade
```

---

*Plan version: 1.0 · Generated for 3arfny v0.1.0 · Next.js 16.2.1 · Supabase SSR 0.9.0*
