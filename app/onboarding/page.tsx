'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

export default function OnboardingPage() {
  const [username, setUsername] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  
  // Create a stable supabase client
  const supabase = createClient();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      if (session?.user) {
        setUser(session.user);
      } else if (_event === 'SIGNED_OUT') {
        toast.error('يجب عليك تسجيل الدخول أولاً');
        router.push('/login');
      }
    });

    // Also check once on mount
    supabase.auth.getUser().then(({ data: { user: currentUser } }: { data: { user: any } }) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Give it a second to settle in case of slow cookie sync
        setTimeout(() => {
          supabase.auth.getUser().then(({ data: { user: retryUser } }: { data: { user: any } }) => {
            if (!retryUser) {
              toast.error('يجب عليك تسجيل الدخول أولاً');
              router.push('/login');
            } else {
              setUser(retryUser);
            }
          });
        }, 1000);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  // Debounced username check
  useEffect(() => {
    if (username.length < 3) {
      setIsAvailable(null);
      return;
    }

    const checkUsername = async () => {
      setChecking(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .single();

      setIsAvailable(!data);
      setChecking(false);
    };

    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [username, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAvailable || loading) return;

    setLoading(true);
    if (!user) {
      // Final attempt to get user if state is somehow behind
      const { data: { user: finalUser } } = await supabase.auth.getUser();
      if (!finalUser) {
        toast.error('يجب عليك تسجيل الدخول أولاً');
        router.push('/login');
        return;
      }
      setUser(finalUser);
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user?.id || (await supabase.auth.getUser()).data.user?.id,
        username: username.toLowerCase(),
      });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('تم حجز اسم المستخدم! أهلاً بك في عرفني.');
      router.push('/dashboard');
    }
    setLoading(false);
  };

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
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
                <AnimatePresence mode="wait">
                  {checking ? (
                    <motion.div
                      key="checking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Loader2 className="w-5 h-5 animate-spin text-white/40" />
                    </motion.div>
                  ) : isAvailable === true ? (
                    <motion.div
                      key="available"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-green-500/20 p-1 rounded-full"
                    >
                      <Check className="w-4 h-4 text-green-500" />
                    </motion.div>
                  ) : isAvailable === false ? (
                    <motion.div
                      key="taken"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-red-500/20 p-1 rounded-full"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
            
            <p className="text-xs text-white/40 italic">
              ٣-١٥ حرفاً، أرقام، وشرطة سفلية فقط.
            </p>
          </div>

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
