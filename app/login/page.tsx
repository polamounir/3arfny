'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, LogIn, Mail, ArrowRight, RefreshCw, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session) {
        router.push('/dashboard');
      }
    });

    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer, router, supabase]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'فشل إرسال الرمز');
      } else {
        setStep('code');
        const cooldown = parseInt(process.env.NEXT_PUBLIC_RESEND_COOLDOWN_SECONDS || '15');
        setTimer(cooldown); 
        toast.success('تم إرسال رمز التحقق (4 أرقام) إلى بريدك!');
      }
    } catch (err) {
      toast.error('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Step 1: Validate the 4-digit code on the server and get a hashed magic-link token
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'رمز غير صحيح');
        return;
      }

      // Step 2: Use the browser Supabase client to verify the token and create a session.
      // email_otp is the RAW token — verifyOtp hashes it before the DB lookup.
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: data.emailOtp,
        type: 'email',
      });

      if (verifyError) {
        console.error('verifyOtp error:', verifyError);
        toast.error('فشل تفعيل الجلسة: ' + verifyError.message);
        return;
      }

      toast.success('جارٍ تسجيل الدخول... 🚀');

      // Step 3: Check if this user already has a profile and route accordingly
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      router.push(profile ? '/dashboard' : '/onboarding');
    } catch (err) {
      toast.error('خطأ في التحقق');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card space-y-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-neon-purple via-neon-blue to-neon-orange" />
        
        <div className="text-center space-y-2">
          <div className="inline-block p-3 rounded-2xl bg-neon-purple/20 mb-2">
            <MessageSquare className="w-8 h-8 text-neon-purple" />
          </div>
          <h1 className="text-4xl font-bold text-neon-gradient">مرحباً بك في عرفني</h1>
          <p className="text-white/60">تسجيل دخول سريع وآمن (Gmail)</p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.form
              key="email-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOtp}
              className="space-y-6"
            >
              <div className="space-y-2 text-right">
                <label className="text-sm font-medium text-white/80 mr-1 flex items-center gap-2 justify-end">
                  <span>البريد الإلكتروني</span>
                  <Mail size={16} className="text-white/40" />
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass-input text-right text-lg"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-neon-purple hover:bg-neon-purple/80 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                {loading ? <RefreshCw className="animate-spin" /> : <ArrowRight size={20} className="rotate-180" />}
                إرسال رمز التحقق
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="code-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleVerifyOtp}
              className="space-y-6"
            >
              <div className="space-y-4 text-right">
                <button 
                  type="button" 
                  onClick={() => setStep('email')}
                  className="text-xs text-white/40 hover:text-white flex items-center gap-1 mb-2 transition-colors"
                >
                  <ChevronLeft size={14} className="rotate-180" />
                  تغيير البريد ({email})
                </button>
                <label className="text-sm font-medium text-white/80 mr-1 block text-center italic">أدخل الرمز المكون من 4 أرقام (صالح لـ 10 دقائق)</label>
                <input
                  type="text"
                  placeholder="0000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full glass-input text-center text-4xl tracking-[1em] font-black"
                  maxLength={4}
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full py-4 rounded-xl bg-neon-blue hover:bg-neon-blue/80 text-white font-bold transition-all disabled:opacity-50 text-lg shadow-[0_0_20px_rgba(0,112,243,0.3)]"
              >
                {loading ? <RefreshCw className="animate-spin mx-auto" /> : 'تأكيد الرمز والدخول'}
              </button>
              
              <button
                type="button"
                disabled={timer > 0 || loading}
                onClick={handleSendOtp}
                className="w-full text-sm text-white/40 hover:text-white transition-colors disabled:opacity-50"
              >
                {timer > 0 ? `إعادة الإرسال خلال ${timer} ثانية` : 'إعادة إرسال الرمز'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <p className="text-center text-xs text-white/40 leading-relaxed px-8">
          من خلال الاستمرار، فإنك توافق على{' '}
          <Link href="/terms" className="text-neon-blue/60 hover:text-neon-blue underline underline-offset-2">
            شروط الخدمة
          </Link>{' '}
          و{' '}
          <Link href="/privacy" className="text-neon-blue/60 hover:text-neon-blue underline underline-offset-2">
            سياسة الخصوصية
          </Link>
          . يتم إرسال البريد عبر Gmail SMTP.
        </p>
      </motion.div>
    </div>
  );
}
