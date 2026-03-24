'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MessageSquare, Shield, Zap, Heart, Share2, Sparkles } from 'lucide-react';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data } : any) => {
      setUser(data.user);
    });
  }, [supabase]);

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-blue/20 blur-[120px] rounded-full animate-pulse delay-700" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navbar */}
        <nav className="flex items-center justify-between py-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-linear-to-br from-neon-purple to-neon-blue rounded-xl flex items-center justify-center shadow-lg shadow-neon-purple/20">
              <MessageSquare className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter">عرفني</span>
          </div>
          {user ? (
            <Link 
              href="/dashboard"
              className="glass px-6 py-2 rounded-full text-white font-bold hover:bg-white/10 transition-all border border-neon-purple/50"
            >
              لوحة التحكم
            </Link>
          ) : (
            <Link 
              href="/login"
              className="glass px-6 py-2 rounded-full text-white font-bold hover:bg-white/10 transition-all"
            >
              تسجيل الدخول
            </Link>
          )}
        </nav>

        {/* Hero Section */}
        <main className="pt-20 pb-32 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-block px-4 py-1.5 mb-6 rounded-full glass border border-white/10 text-neon-blue text-sm font-bold tracking-wide"
          >
            🚀 منصة الرسائل الصريحة رقم #1 للشباب
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-8xl font-black text-white mb-6 leading-tight"
          >
            أرسل رسائل <span className="text-neon-gradient">سرية</span> <br />
            بكل حرية.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-white/60 max-w-2xl mb-12 leading-relaxed"
          >
            عرفني هو المكان المثالي لتلقي آراء أصدقائك بصدق وبدون قيود. 100% مجاني، 100% مجهول، ومصمم لجيل المستقبل.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            {user ? (
              <Link
                href="/dashboard"
                className="px-10 py-5 rounded-2xl bg-neon-purple text-white text-xl font-black shadow-[0_0_30px_-5px_var(--color-neon-purple)] hover:scale-105 transition-transform flex items-center gap-2"
              >
                دخول لوحة التحكم
                <Zap size={20} className="fill-white" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-10 py-5 rounded-2xl bg-neon-purple text-white text-xl font-black shadow-[0_0_30px_-5px_var(--color-neon-purple)] hover:scale-105 transition-transform"
              >
                ابدأ الآن مجاناً
              </Link>
            )}
            <div className="px-10 py-5 rounded-2xl glass text-white text-xl font-bold border border-white/10 hidden sm:block">
              أكثر من ١٠٠ ألف مستخدم
            </div>
          </motion.div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-40 w-full text-right" dir="rtl">
            <FeatureCard 
              icon={<Shield className="text-neon-purple" />}
              title="أمان تام"
              description="خصوصيتك هي أولويتنا القصوى. جميع الرسائل مشفرة ومجهولة بالكامل."
            />
            <FeatureCard 
              icon={<Zap className="text-neon-blue" />}
              title="سرعة فائقة"
              description="تقنيات حديثة تضمن لك وصول الرسائل في أجزاء من الثانية مع تجربة مستخدم سلسة."
            />
            <FeatureCard 
              icon={<Sparkles className="text-neon-orange" />}
              title="تصميم مبهر"
              description="واجهة عصرية مستوحاة من أحدث اتجاهات التصميم العالمي لتجربة بصرية لا تُنسى."
            />
          </div>
        </main>
      </div>

      {/* Decorative Circles */}
      <div className="absolute top-[20%] right-[-5%] w-64 h-64 bg-neon-purple/10 blur-[80px] rounded-full" />
      <div className="absolute bottom-[10%] left-[-5%] w-96 h-96 bg-neon-blue/10 blur-[100px] rounded-full" />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass-card p-8 border border-white/5 hover:border-white/10 transition-colors group"
    >
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-white/50 leading-relaxed">{description}</p>
    </motion.div>
  );
}
