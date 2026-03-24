-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New Query
-- Adds columns needed for Phase 3 features

-- Bio / tagline on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text DEFAULT NULL;

-- Custom prompt chips per user
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prompts text[] DEFAULT ARRAY[]::text[];

-- Push notification subscription (VAPID)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_subscription jsonb DEFAULT NULL;

-- Reaction emoji column on messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reaction text DEFAULT NULL;

-- Rate limiting table (needed for middleware rate limiter)
CREATE TABLE IF NOT EXISTS rate_limits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL,
  count       int  NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limits_key_idx ON rate_limits (key);

-- Option for sender to reveal their identity
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT true;

-- Soft-delete flags for one-sided deletion
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted_by_receiver boolean DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_deleted_by_sender boolean DEFAULT false; GET /u/pola 200 in 5.5s (next.js: 4.5s, proxy.ts: 326ms, application-code: 676ms)
Supabase Error: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'sender_id' column of 'messages' in the schema cache"
}
 POST /api/messages 500 in 1964ms (next.js: 571ms, proxy.ts: 629ms, application-code: 763ms)
Supabase Error: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'sender_id' column of 'messages' in the schema cache"
}
 POST /api/messages 500 in 1207ms (next.js: 24ms, proxy.ts: 748ms, application-code: 435ms)
Supabase Error: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'sender_id' column of 'messages' in the schema cache"
}
 POST /api/messages 500 in 1616ms (next.js: 29ms, proxy.ts: 991ms, application-code: 596ms)
 GET /u/pola 200 in 754ms (next.js: 81ms, proxy.ts: 385ms, application-code: 289ms)
Supabase Error: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'sender_id' column of 'messages' in the schema cache"
}
 POST /api/messages 500 in 1153ms (next.js: 24ms, proxy.ts: 585ms, application-code: 544ms)
