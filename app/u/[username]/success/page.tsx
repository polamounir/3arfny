'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, MessageSquare, Sparkles, ArrowLeft } from 'lucide-react';
import { use, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Props {
  params: Promise<{ username: string }>;
}

export default function SuccessPage({ params }: Props) {
  const { username } = use(params);
  const [hasSession, setHasSession] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session) setHasSession(true);
    });
  }, [supabase]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden"
      dir="rtl"
    >
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-purple/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-blue/20 blur-[120px] rounded-full animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'backOut' }}
        className="w-full max-w-md relative z-10 text-center space-y-8"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mx-auto w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            background:
              'radial-gradient(circle, rgba(168,85,247,0.3) 0%, rgba(59,130,246,0.1) 100%)',
            boxShadow: '0 0 60px rgba(168,85,247,0.4)',
          }}
        >
          <CheckCircle2 className="w-14 h-14 text-neon-purple" strokeWidth={1.5} />
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-3"
        >
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
            🎉 تم الإرسال بنجاح!
          </h1>
          <p className="text-white/50 text-lg leading-relaxed">
            وصلت رسالتك المجهولة إلى{' '}
            <span className="text-neon-purple font-bold">@{username}</span> بشكل آمن وسري.
          </p>
        </motion.div>

        {/* Viral CTA Card / Dashboard Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card space-y-5 border border-neon-purple/20 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-neon-purple via-neon-blue to-neon-orange" />

          {hasSession ? (
            <>
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="text-neon-orange w-6 h-6" />
                <p className="text-white font-bold text-lg">شكراً لاستخدامك عرفني!</p>
              </div>
              <p className="text-white/40 text-sm">
                يمكنك العودة إلى حسابك لمشاهدة رسائلك أو الإعدادات.
              </p>
              <Link
                href="/dashboard"
                className="block w-full py-4 rounded-xl text-center text-white font-black text-lg transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                  boxShadow: '0 0 30px rgba(168,85,247,0.4)',
                }}
              >
                العودة إلى لوحة التحكم
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-3">
                <Sparkles className="text-neon-orange w-6 h-6" />
                <p className="text-white font-bold text-lg">أنت أيضاً تستحق رسائل مجهولة!</p>
              </div>

              <p className="text-white/40 text-sm">
                احصل على رابطك الخاص وشاركه مع أصدقائك لتلقي آرائهم الصريحة.
              </p>

              <Link
                href="/login"
                className="block w-full py-4 rounded-xl text-center text-white font-black text-lg transition-all hover:scale-[1.02] active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                  boxShadow: '0 0 30px rgba(168,85,247,0.4)',
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <MessageSquare size={20} />
                  احصل على رابطك الخاص مجاناً
                </span>
              </Link>
            </>
          )}
        </motion.div>

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Link
            href={`/u/${username}`}
            className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-sm"
          >
            <ArrowLeft size={14} />
            إرسال رسالة أخرى لـ @{username}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
