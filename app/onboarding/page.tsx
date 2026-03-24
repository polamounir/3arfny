'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  // Create client fresh each render — avoids stale singleton state
  const supabase = createClient();
  const redirected = useRef(false);

  // Resolve user session reliably after a server-side redirect sets cookies
  useEffect(() => {
    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (cancelled) return;

      // INITIAL_SESSION fires once when Supabase boots from cookies — this is what we wait for
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (session?.user) {
          // Check if they already completed onboarding
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile && !redirected.current) {
            redirected.current = true;
            router.replace('/dashboard');
            return;
          }

          setUserId(session.user.id);
          setAuthReady(true);
        } else {
          // INITIAL_SESSION fired with no session → not logged in
          if (!redirected.current) {
            redirected.current = true;
            toast.error('يجب عليك تسجيل الدخول أولاً');
            router.replace('/login');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (!redirected.current) {
          redirected.current = true;
          toast.error('يجب عليك تسجيل الدخول أولاً');
          router.replace('/login');
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced username availability check
  useEffect(() => {
    if (username.length < 3) {
      setIsAvailable(null);
      return;
    }

    const check = async () => {
      setChecking(true);
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      setIsAvailable(!data);
      setChecking(false);
    };

    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [username]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAvailable || loading || !userId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/profile/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, bio }),
      });

      const result = await res.json();

      if (!res.ok) {
        console.error('ONBOARDING API ERROR:', result);
        toast.error(`فشل الحفظ: ${result.error}`);
      } else {
        toast.success('تم حجز اسم المستخدم! أهلاً بك في عرفني 🎉');
        router.replace('/dashboard');
      }
    } catch (err: any) {
      console.error('ONBOARDING UNEXPECTED ERROR:', err);
      toast.error('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  // Loading screen while resolving auth
  if (!authReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-10 h-10 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
        <p className="text-white/40 text-sm">جاري التحقق من جلستك...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-card space-y-8"
      >
        <div className="text-center space-y-2">
          <Sparkles className="w-12 h-12 text-neon-orange mx-auto animate-pulse" />
          <h1 className="text-3xl font-bold">احجز مكانك المميز</h1>
          <p className="text-white/60 text-center">اختر اسم مستخدم فريداً للبدء في تلقي الرسائل المجهولة.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username field */}
          <div className="space-y-2 relative text-right">
            <label className="text-sm font-medium text-white/80 mr-1">اسم المستخدم</label>
            <div className="relative">
              <input
                type="text"
                placeholder="اسم_المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                className={`w-full glass-input pl-12 text-right ${
                  isAvailable === true ? 'focus:ring-green-500/50' :
                  isAvailable === false ? 'focus:ring-red-500/50' : ''
                }`}
                maxLength={15}
                required
                autoFocus
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
                <AnimatePresence mode="wait">
                  {checking ? (
                    <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Loader2 className="w-5 h-5 animate-spin text-white/40" />
                    </motion.div>
                  ) : isAvailable === true ? (
                    <motion.div key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-green-500/20 p-1 rounded-full">
                      <Check className="w-4 h-4 text-green-500" />
                    </motion.div>
                  ) : isAvailable === false ? (
                    <motion.div key="taken" initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-red-500/20 p-1 rounded-full">
                      <X className="w-4 h-4 text-red-500" />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
            <p className="text-xs text-white/40 italic">٣-١٥ حرفاً، أرقام، وشرطة سفلية فقط.</p>
          </div>

          {/* Bio field — shown only when username is available */}
          <AnimatePresence>
            {isAvailable === true && (
              <motion.div
                key="bio"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 relative text-right overflow-hidden"
              >
                <label className="text-sm font-medium text-white/80 mr-1">جملة تعريفية (اختياري)</label>
                <input
                  type="text"
                  placeholder="طالب جامعي · القاهرة · أحب الأسئلة الصعبة"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full glass-input text-right"
                  maxLength={100}
                />
                <div className="text-xs font-mono text-white/30 text-left">{bio.length} / 100</div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={!isAvailable || loading || checking}
            className="w-full py-4 rounded-xl bg-neon-orange hover:bg-neon-orange/80 text-white font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(249,115,22,0.3)]"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'احجز اسم المستخدم الخاص بي'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
