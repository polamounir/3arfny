import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function checkRateLimit(
  ip: string,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const key = `${ip}:${endpoint}`;

  // Clean old windows and upsert current count
  const { data } = await adminClient
    .from('rate_limits')
    .select('count, window_start')
    .eq('key', key)
    .gte('window_start', windowStart)
    .single();

  if (!data) {
    await adminClient.from('rate_limits').upsert({ key, count: 1, window_start: new Date().toISOString() });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (data.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  await adminClient.from('rate_limits').update({ count: data.count + 1 }).eq('key', key);
  return { allowed: true, remaining: maxRequests - data.count - 1 };
}
