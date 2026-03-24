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
  Settings,
  Send,
  Inbox,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ConfirmModal from '@/components/ui/ConfirmModal';

const PAGE_SIZE = 20;

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [messages, setMessages] = useState<any[]>([]);
  const [sentMessages, setSentMessages] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pushPrompt, setPushPrompt] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      if (Notification.permission === 'default') {
        setPushPrompt(true);
      }
    }
  }, []);

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

      // Try to fetch with sender info (fails safely if migration not run)
      let finalMsgs = null;
      const { data: msgs, error: msgsError } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(username)')
        .eq('receiver_id', user.id)
        .eq('is_deleted_by_receiver', false)
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);
      
      if (msgsError && msgsError.code === 'PGRST204') {
        const { data: fallback } = await supabase
          .from('messages')
          .select('*')
          .eq('receiver_id', user.id)
          .eq('is_deleted_by_receiver', false)
          .order('created_at', { ascending: false })
          .range(0, PAGE_SIZE - 1);
        finalMsgs = fallback;
      } else {
        if (msgsError) console.error('INBOX FETCH ERROR:', msgsError);
        finalMsgs = msgs;
      }

      if (finalMsgs && finalMsgs.length < PAGE_SIZE) setHasMore(false);
      setMessages(finalMsgs || []);

      // Fetch sent messages — silently empty if sender_id column not yet created
      try {
        const { data: sent, error: sentError } = await supabase
          .from('messages')
          .select('*')
          .eq('sender_id', user.id)
          .eq('is_deleted_by_sender', false)
          .order('created_at', { ascending: false })
          .limit(50);

        if (sentError && sentError.code !== 'PGRST204') {
          console.error('SENT FETCH ERROR:', sentError);
        }
        setSentMessages(sent || []);
      } catch {
        // column doesn't exist yet — just leave Sent tab empty
      }
      setLoading(false);
    }

    fetchData();
  }, [supabase, router]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    let finalMore = null;
    const { data: more, error: moreError } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(username)')
      .eq('receiver_id', profile.id)
      .eq('is_deleted_by_receiver', false)
      .order('created_at', { ascending: false })
      .range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1);
    
    if (moreError && moreError.code === 'PGRST204') {
      const { data: fallback } = await supabase
        .from('messages')
        .select('*')
        .eq('receiver_id', profile.id)
        .eq('is_deleted_by_receiver', false)
        .order('created_at', { ascending: false })
        .range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1);
      finalMore = fallback;
    } else {
      finalMore = more;
    }

    if (finalMore) {
      setMessages((prev) => [...prev, ...finalMore]);
      setPage(nextPage);
      if (finalMore.length < PAGE_SIZE) setHasMore(false);
    }
    setLoadingMore(false);
  };

  const toggleReaction = async (id: string, currentReaction: string | null, newReaction: string) => {
    const nextReaction = currentReaction === newReaction ? null : newReaction;
    
    // Optimistic UI update
    setMessages(msgs => msgs.map(m => m.id === id ? { ...m, reaction: nextReaction } : m));
    
    const res = await fetch(`/api/messages/${id}`, { 
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction: nextReaction })
    });

    if (!res.ok) {
      toast.error('فشل إضافة التفاعل');
      // Revert optimistic update
      setMessages(msgs => msgs.map(m => m.id === id ? { ...m, reaction: currentReaction } : m));
    }
  };

  const deleteMessage = async (id: string, isSentTab: boolean = false) => {
    const res = await fetch(`/api/messages/${id}`, { method: 'DELETE' });
    if (res.ok) {
      if (isSentTab) {
        setSentMessages(sentMessages.filter((m) => m.id !== id));
      } else {
        setMessages(messages.filter((m) => m.id !== id));
      }
      toast.success('تم حذف الرسالة');
    } else {
      toast.error('فشل حذف الرسالة');
    }
  };

  const clearInbox = async () => {
    const res = await fetch('/api/messages/clear', { method: 'POST' });
    if (res.ok) {
      setMessages([]);
      setPage(0);
      setHasMore(true);
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

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('تم رفض صلاحية الإشعارات');
        setPushPrompt(false);
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
      });
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      if (res.ok) {
        toast.success('تم تفعيل الإشعارات بنجاح!');
        setPushPrompt(false);
      } else { throw new Error('API Error'); }
    } catch (e) {
      console.error(e);
      toast.error('فشل تفعيل الإشعارات. تأكد من إعداد المفاتيح الخاصة بك.');
    }
  };

  // Helper for web-push key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

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
            <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter">
              {activeTab === 'inbox' ? 'صندوق الوارد' : 'الرسائل المُرسَلة'}
            </h1>
            <p className="text-white/40 flex items-center gap-2 justify-end text-sm sm:text-base">
              <span className="text-neon-purple font-bold">@{profile.username}</span>
              • {activeTab === 'inbox' ? `${messages.length} رسالة` : `${sentMessages.length} رسالة`}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 sm:gap-3">
            <button
              onClick={copyLink}
              className="flex-1 min-w-[140px] md:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white text-black font-bold hover:scale-105 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] text-xs sm:text-sm"
            >
              <Copy size={16} sm:size={18} />
              مشاركة الرابط
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsClearModalOpen(true)}
                className="p-2.5 sm:p-3 rounded-xl glass hover:bg-red-500/20 hover:text-red-500 transition-all text-white/40"
                title="مسح الصندوق"
              >
                <Trash size={18} sm:size={20} />
              </button>
              <Link
                href="/settings"
                className="p-2.5 sm:p-3 rounded-xl glass hover:bg-white/10 transition-all text-white/40"
                title="الإعدادات"
              >
                <Settings size={18} sm:size={20} />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2.5 sm:p-3 rounded-xl glass hover:bg-white/10 transition-all text-white/40"
                title="تسجيل الخروج"
              >
                <LogOut size={18} sm:size={20} className="rotate-180" />
              </button>
            </div>
          </div>
        </header>

        {pushPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-neon-orange/30 bg-neon-orange/10 text-white"
          >
            <div className="flex flex-col text-right">
              <span className="font-bold text-neon-orange">إشعارات الرسائل (جديد) 🚀</span>
              <p className="text-sm text-white/70 mt-1">فعّل الإشعارات لتعلم فور وصول رسالة جديدة حتى لو كان التطبيق مغلقاً.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setPushPrompt(false)} className="text-sm text-white/50 hover:text-white transition-colors">تخطي</button>
              <button 
                onClick={subscribeToPush} 
                className="px-6 py-2 rounded-lg bg-neon-orange hover:bg-neon-orange/80 font-bold transition-all text-sm shrink-0 shadow-[0_0_15px_rgba(249,115,22,0.4)]"
              >
                تفعيل الإشعارات
              </button>
            </div>
          </motion.div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all text-sm ${
              activeTab === 'inbox'
                ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Inbox size={16} />
            الوارد ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all text-sm ${
              activeTab === 'sent'
                ? 'bg-neon-blue text-white shadow-[0_0_15px_rgba(0,112,243,0.4)]'
                : 'text-white/40 hover:text-white'
            }`}
          >
            <Send size={16} />
            المُرسَل ({sentMessages.length})
          </button>
        </div>

        {/* Messages Feed */}
        {activeTab === 'inbox' ? (
          <>
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
                        {msg.sender?.username && msg.is_anonymous === false && (
                          <span className="text-neon-purple/80 font-bold normal-case tracking-normal">
                            من @{msg.sender.username}
                          </span>
                        )}
                      </div>
                      <p className="text-lg leading-relaxed text-white/90 whitespace-pre-wrap">{msg.content}</p>
                      
                      <div className="pt-2 flex items-center justify-end relative group/reaction">
                        <div className="flex items-center gap-1 opacity-0 group-hover/reaction:opacity-100 transition-opacity absolute right-10 bottom-0 bg-background/90 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 z-10 shadow-xl" dir="ltr">
                          {['👏', '😮', '🔥', '😂', '❤️'].map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(msg.id, msg.reaction, emoji)}
                              className={`text-xl hover:scale-125 transition-transform w-8 h-8 flex items-center justify-center ${msg.reaction === emoji ? 'bg-white/10 rounded-full' : 'opacity-70 hover:opacity-100'}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-xl cursor-default transition-colors hover:bg-white/10">
                          {msg.reaction ? (
                            <span className="opacity-90">{msg.reaction}</span>
                          ) : (
                            <span className="text-white/30 text-lg">+</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity relative z-0">
                      <button
                        onClick={() => router.push(`/dashboard/share/${msg.id}`)}
                        className="p-2.5 sm:p-3 rounded-lg bg-neon-blue/20 text-neon-blue hover:bg-neon-blue transition-all hover:text-white"
                        title="إنشاء صورة للمشاركة"
                      >
                        <Share2 size={16} sm:size={18} />
                      </button>
                      <button
                        onClick={() => deleteMessage(msg.id, false)}
                        className="p-2.5 sm:p-3 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 transition-all hover:text-white"
                        title="حذف"
                      >
                        <Trash2 size={16} sm:size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Visual Accent */}
                  <div className="absolute top-0 right-0 w-1 h-full bg-linear-to-b from-neon-purple to-neon-blue opacity-30" />
                </motion.div>
              ))
            )}
          </AnimatePresence>
          {messages.length > 0 && hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full mt-4 py-4 rounded-xl bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple font-bold transition-all disabled:opacity-50 flex items-center justify-center border border-neon-purple/30"
            >
              {loadingMore ? 'جاري التحميل...' : 'تحميل المزيد'}
            </button>
          )}
          </>
        ) : (
          /* Sent Tab */
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {sentMessages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-20 text-center space-y-4"
                >
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="w-10 h-10 text-white/20" />
                  </div>
                  <h2 className="text-xl font-medium text-white/40">لم تُرسِل أي رسالة بعد</h2>
                  <p className="text-white/20 max-w-xs mx-auto text-center">
                    الرسائل المُرسَلة من حسابك ستظهر هنا، أما الرسائل المجهولة التي أُرسِلت بدون حساب فلا تُسجَّل.
                  </p>
                </motion.div>
              ) : (
                sentMessages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.04 }}
                    className="glass-card group relative p-6 border-white/5 hover:border-white/10 transition-all overflow-hidden text-right"
                  >
                    <div className="flex justify-between gap-4">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center justify-end gap-2 text-xs font-mono text-white/30 uppercase tracking-widest">
                          <Clock size={12} />
                          {new Date(msg.created_at).toLocaleDateString('ar-EG')} في {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                          {msg.receiver?.username && (
                            <span className="text-neon-blue/70 font-bold normal-case tracking-normal">
                              إلى @{msg.receiver.username}
                            </span>
                          )}
                        </div>
                        <p className="text-lg leading-relaxed text-white/90 whitespace-pre-wrap">{msg.content}</p>

                        {msg.reaction && (
                          <div className="pt-2 flex items-center justify-end">
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-xl cursor-default text-white/90">
                              {msg.reaction}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity relative z-0">
                        <button
                          onClick={() => deleteMessage(msg.id, true)}
                          className="p-2.5 sm:p-3 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 transition-all hover:text-white"
                          title="حذف من السجل"
                        >
                          <Trash2 size={16} sm:size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-1 h-full bg-linear-to-b from-neon-blue to-neon-orange opacity-40" />
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Decorative Blur */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-neon-purple/10 blur-[100px] pointer-events-none -z-10" />

      {/* Footer */}
      <footer className="max-w-4xl mx-auto mt-8 py-6 border-t border-white/5 flex justify-center gap-6 text-xs text-white/20">
        <Link href="/settings" className="hover:text-white/40 transition-colors">الإعدادات</Link>
        <Link href="/privacy" className="hover:text-white/40 transition-colors">الخصوصية</Link>
        <Link href="/terms" className="hover:text-white/40 transition-colors">الشروط</Link>
      </footer>
      <ConfirmModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={clearInbox}
        variant="danger"
        title="مسح صندوق الوارد"
        message="هل أنت متأكد من مسح جميع الرسائل في صندوق الوارد؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="نعم، امسح الكل"
        cancelText="إلغاء"
      />
    </div>
  );
}
