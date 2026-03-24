'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  Share2, 
  Trash, 
  Copy, 
  ExternalLink,
  MessageSquare,
  Clock,
  Ghost,
  LogOut,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!profileData) {
        router.push('/onboarding');
        return;
      }
      setProfile(profileData);

      // Fetch Messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });
      
      setMessages(msgs || []);
      setLoading(false);
    }

    fetchData();
  }, [supabase, router]);

  const deleteMessage = async (id: string) => {
    const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setMessages(messages.filter((m) => m.id !== id));
      toast.success('تم حذف الرسالة');
    } else {
      toast.error('فشل حذف الرسالة');
    }
  };

  const clearInbox = async () => {
    if (!confirm('هل أنت متأكد من مسح جميع الرسائل في صندوق الوارد؟')) return;
    
    const res = await fetch('/api/messages/clear', { method: 'POST' });
    if (res.ok) {
      setMessages([]);
      toast.success('تم مسح صندوق الوارد!');
    } else {
      toast.error('فشل مسح الصندوق');
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/u/${profile.username}`;
    navigator.clipboard.writeText(link);
    toast.success('تم نسخ الرابط! 🚀');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-white p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card border-neon-purple/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-linear-to-b from-neon-purple to-neon-blue" />
          
          <div className="space-y-1 text-right">
            <h1 className="text-3xl font-black italic tracking-tighter">صندوق الوارد</h1>
            <p className="text-white/40 flex items-center gap-2 justify-end">
              <span className="text-neon-purple font-bold">@{profile.username}</span>
              • {messages.length} رسالة مستلمة
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={copyLink}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-bold hover:scale-105 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <Copy size={18} />
              مشاركة الرابط
            </button>
            <button
              onClick={clearInbox}
              className="p-3 rounded-xl glass hover:bg-red-500/20 hover:text-red-500 transition-all text-white/40"
              title="مسح الصندوق"
            >
              <Trash size={20} />
            </button>
            <Link
              href="/settings"
              className="p-3 rounded-xl glass hover:bg-white/10 transition-all text-white/40"
              title="الإعدادات"
            >
              <Settings size={20} />
            </Link>
            <button
              onClick={handleLogout}
              className="p-3 rounded-xl glass hover:bg-white/10 transition-all text-white/40"
              title="تسجيل الخروج"
            >
              <LogOut size={20} className="rotate-180" />
            </button>
          </div>
        </header>

        {/* Messages Feed */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Ghost className="w-10 h-10 text-white/20" />
                </div>
                <h2 className="text-xl font-medium text-white/40">صندوقك فارغ حالياً</h2>
                <p className="text-white/20 max-w-xs mx-auto text-center">شارك رابطك للبدء في تلقي الرسائل المجهولة من أصدقائك!</p>
                <button
                  onClick={copyLink}
                  className="text-neon-blue font-bold hover:underline underline-offset-4"
                >
                  نسخ رابط المشاركة الخاص بك
                </button>
              </motion.div>
            ) : (
              messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card group relative p-6 border-white/5 hover:border-white/10 transition-all overflow-hidden text-right"
                >
                  <div className="flex justify-between gap-4">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-2 justify-end text-xs font-mono text-white/30 uppercase tracking-widest">
                        <Clock size={12} />
                        {new Date(msg.created_at).toLocaleDateString('ar-EG')} في {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <p className="text-lg leading-relaxed text-white/90 whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => router.push(`/dashboard/share/${msg.id}`)}
                        className="p-3 rounded-lg bg-neon-blue/20 text-neon-blue hover:bg-neon-blue transition-all hover:text-white"
                        title="إنشاء صورة للمشاركة"
                      >
                        <Share2 size={18} />
                      </button>
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="p-3 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 transition-all hover:text-white"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Visual Accent */}
                  <div className="absolute top-0 right-0 w-1 h-full bg-linear-to-b from-neon-purple to-neon-blue opacity-30" />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Decorative Blur */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-neon-purple/10 blur-[100px] pointer-events-none -z-10" />

      {/* Footer */}
      <footer className="max-w-4xl mx-auto mt-8 py-6 border-t border-white/5 flex justify-center gap-6 text-xs text-white/20">
        <Link href="/settings" className="hover:text-white/40 transition-colors">الإعدادات</Link>
        <Link href="/privacy" className="hover:text-white/40 transition-colors">الخصوصية</Link>
        <Link href="/terms" className="hover:text-white/40 transition-colors">الشروط</Link>
      </footer>
    </div>
  );
}
