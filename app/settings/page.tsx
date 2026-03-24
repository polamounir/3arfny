'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  Copy,
  ExternalLink,
  ArrowRight,
  MessageSquare,
  PowerOff,
  Trash2,
  LogOut,
  Settings2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        // No profile yet → send to onboarding
        router.push('/onboarding');
        return;
      }

      setProfile(data);
      setLoading(false);
    }

    fetchProfile();
  }, [supabase, router]);

  const shareLink =
    typeof window !== 'undefined' && profile
      ? `${window.location.origin}/u/${profile.username}`
      : '';

  const copyLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success('تم نسخ الرابط! 🚀');
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleReceiving = async () => {
    if (!profile) return;
    setToggling(true);

    const newVal = !profile.receiving_enabled;
    const { error } = await supabase
      .from('profiles')
      .update({ receiving_enabled: newVal })
      .eq('id', profile.id);

    if (error) {
      toast.error('فشل تحديث الإعداد');
    } else {
      setProfile({ ...profile, receiving_enabled: newVal });
      toast.success(newVal ? 'تم تفعيل استقبال الرسائل ✅' : 'تم إيقاف استقبال الرسائل ⏸️');
    }
    setToggling(false);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'هل أنت متأكد تماماً؟ سيتم حذف حسابك وجميع رسائلك بشكل نهائي ولا يمكن التراجع عنه.',
    );
    if (!confirmed) return;

    setDeleting(true);
    const res = await fetch('/api/account/delete', { method: 'DELETE' });

    if (res.ok) {
      toast.success('تم حذف الحساب. نتمنى أن نراك مجدداً!');
      await supabase.auth.signOut();
      router.push('/');
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'فشل حذف الحساب');
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-4 md:p-8" dir="rtl">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-neon-purple/10 blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
          >
            <ArrowRight size={16} className="rotate-180" />
            العودة للوحة التحكم
          </Link>

          <div className="flex items-center gap-2 text-white font-black text-xl">
            <Settings2 size={22} className="text-neon-purple" />
            الإعدادات
          </div>
        </header>

        {/* 1 - Share Link */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card space-y-4 border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1 h-full bg-linear-to-b from-neon-purple to-neon-blue" />
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare size={18} className="text-neon-blue" />
            رابط مشاركتك
          </h2>

          <p className="text-white/40 text-sm">
            شارك هذا الرابط مع أصدقائك ليرسلوا لك رسائل مجهولة.
          </p>

          <div className="flex gap-3">
            <div className="flex-1 glass-input text-sm text-white/70 truncate" dir="ltr">
              {shareLink}
            </div>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-purple hover:bg-neon-purple/80 text-white font-bold transition-all shrink-0"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'تم!' : 'نسخ'}
            </button>
            <a
              href={shareLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl glass border border-white/10 hover:bg-white/10 transition-all text-white/50"
              title="فتح صفحتك"
            >
              <ExternalLink size={18} />
            </a>
          </div>
        </motion.section>

        {/* 2 - Toggle receiving */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card space-y-4 border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1 h-full bg-linear-to-b from-neon-blue to-neon-orange" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <PowerOff size={18} className="text-neon-orange" />
                استقبال الرسائل
              </h2>
              <p className="text-white/40 text-sm">
                {profile.receiving_enabled
                  ? 'مفعّل — أصدقاؤك يستطيعون إرسال رسائل إليك.'
                  : 'متوقف مؤقتاً — لن يستطيع أحد إرسال رسائل إليك.'}
              </p>
            </div>

            {/* Toggle switch */}
            <button
              onClick={toggleReceiving}
              disabled={toggling}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 shrink-0 disabled:opacity-50 ${
                profile.receiving_enabled ? 'bg-neon-purple' : 'bg-white/10'
              }`}
              style={
                profile.receiving_enabled
                  ? { boxShadow: '0 0 12px rgba(168,85,247,0.5)' }
                  : {}
              }
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform duration-300 ${
                  profile.receiving_enabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </motion.section>

        {/* 3 - Danger zone */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card space-y-4 border border-red-500/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1 h-full bg-red-500/60" />
          <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
            <Trash2 size={18} />
            منطقة الخطر
          </h2>
          <p className="text-white/40 text-sm">
            حذف الحساب نهائي ولا يمكن التراجع عنه. ستفقد جميع رسائلك وإعداداتك.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-bold transition-all disabled:opacity-50"
          >
            {deleting ? 'جاري الحذف...' : 'حذف حسابي نهائياً'}
          </button>
        </motion.section>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-sm"
          >
            <LogOut size={14} />
            تسجيل الخروج
          </button>
        </motion.div>

        {/* Footer links */}
        <div className="flex justify-center gap-6 text-xs text-white/20 pb-8">
          <Link href="/privacy" className="hover:text-white/40 transition-colors">
            سياسة الخصوصية
          </Link>
          <Link href="/terms" className="hover:text-white/40 transition-colors">
            شروط الخدمة
          </Link>
        </div>
      </div>
    </div>
  );
}
