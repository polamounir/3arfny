'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, MessageSquareHeart } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function fetchProfile() {
      const resolvedParams = await params;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, receiving_enabled')
        .eq('username', resolvedParams.username.toLowerCase())
        .single();

      if (!mounted) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data);
      }
    }
    fetchProfile();
    return () => { mounted = false; };
  }, [params, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !message.trim() || loading) return;

    setLoading(true);
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverId: profile.id,
        content: message,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      // Redirect to success page — the key viral step
      router.push(`/u/${profile.username}/success`);
    } else {
      toast.error(data.error || 'فشل إرسال الرسالة');
      setLoading(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background" dir="rtl">
        <div className="text-center space-y-6">
          <div
            className="text-[8rem] font-black leading-none"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            🚫
          </div>
          <h1 className="text-3xl font-bold text-white">المستخدم غير موجود</h1>
          <p className="text-white/40 max-w-xs mx-auto">
            هذا الرابط غير صالح أو تم حذف الحساب.
          </p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // Receiving disabled
  if (profile.receiving_enabled === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-sm"
        >
          <MessageSquareHeart className="w-16 h-16 text-white/20 mx-auto" />
          <h1 className="text-2xl font-bold text-white/50">
            @{profile.username} أوقف استقبال الرسائل مؤقتاً
          </h1>
          <p className="text-white/30 text-sm">عد لاحقاً وحاول مرة أخرى.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden" dir="rtl">
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-purple/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-blue/20 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="glass-card p-8 md:p-12 text-center space-y-8 relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
            <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-neon-purple to-neon-blue p-1 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <div className="w-full h-full rounded-[20px] bg-background flex items-center justify-center">
                <MessageSquareHeart className="w-12 h-12 text-neon-purple" />
              </div>
            </div>
          </div>

          <div className="pt-8 space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">
              أرسل رسالة إلى
            </h1>
            <div className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10">
              <span className="text-neon-gradient font-bold text-xl">@{profile.username}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group text-right">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب شيئاً صريحاً، مضحكاً، أو غامضاً..."
                className="w-full h-48 glass-input resize-none focus:ring-neon-blue/50 text-lg text-right"
                maxLength={500}
                required
              />
              <div className="absolute bottom-4 left-4 text-xs font-mono text-white/30">
                {message.length} / 500
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="group relative w-full py-5 rounded-2xl bg-white text-black font-black text-xl overflow-hidden hover:scale-[1.02] transition-all disabled:opacity-50 disabled:scale-100"
            >
              <div className="absolute inset-0 bg-linear-to-r from-neon-purple via-neon-blue to-neon-orange opacity-0 group-hover:opacity-100 transition-opacity" />

              <span className="relative z-10 flex items-center justify-center gap-3 group-hover:text-white transition-colors">
                {loading ? (
                  <Sparkles className="animate-spin" />
                ) : (
                  <>
                    أرسل بهوية مجهولة
                    <Send size={20} className="scale-x-[-1]" />
                  </>
                )}
              </span>
            </button>
          </form>

          <p className="text-white/30 text-xs italic">
            عرفني مجهول ١٠٠٪. لن يرى المستلم عنوان IP الخاص بك أو هويتك.
          </p>
        </div>
      </motion.div>

      {/* Footer / Watermark */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 text-center"
      >
        <p className="text-white/20 text-sm font-medium tracking-widest uppercase">
          بدعم من <span className="text-white/40">عرفني</span>
        </p>
      </motion.div>
    </div>
  );
}
