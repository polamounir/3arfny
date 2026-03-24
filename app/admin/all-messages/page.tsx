'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Clock, 
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
  Inbox
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAllMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchMessages = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/messages?search=${encodeURIComponent(s)}&page=${p}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(data.messages);
      setTotal(data.total);
    } catch (err) {
      toast.error('فشل تحميل الرسائل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchMessages(0, search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchMessages(p, search);
  };

  return (
    <div className="space-y-8" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black italic tracking-tighter">جميع الرسائل</h1>
          <p className="text-white/40">مراقبة كافة الرسائل عبر المنصة ({total})</p>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-neon-purple transition-colors" />
          <input
            type="text"
            placeholder="ابحث في محتوى الرسائل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-sm focus:outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/20 transition-all text-white placeholder:text-white/20"
          />
        </div>
      </header>

      <div className="glass-card overflow-hidden border-white/5 relative">
        <div className="overflow-x-auto text-nowrap">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/30 text-right">الوقت</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/30 text-right">المرسل</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/30 text-right">المستقبل</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/30 text-right">المحتوى</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/30 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {loading && messages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
                        <span className="text-white/20 text-sm">جاري جلب الرسائل...</span>
                      </div>
                    </td>
                  </tr>
                ) : messages.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5 mb-4">
                        <Inbox className="w-8 h-8 text-white/10" />
                      </div>
                      <p className="text-white/20">لا توجد رسائل للعرض</p>
                    </td>
                  </tr>
                ) : (
                  messages.map((msg, i) => (
                    <motion.tr
                      key={msg.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.01 }}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="px-6 py-4 text-xs text-white/40">
                        <div className="flex items-center gap-2">
                          <Clock size={12} className="text-white/20" />
                          {new Date(msg.created_at).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <UserIcon size={12} className="text-white/20" />
                          <span className={`text-xs font-bold ${msg.is_anonymous ? 'text-white/30' : 'text-neon-purple'}`}>
                            {msg.sender?.username ? `@${msg.sender.username}` : (msg.is_anonymous ? 'مجهول' : 'ضيف')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <UserIcon size={12} className="text-white/20" />
                          <span className="text-xs font-bold text-neon-blue">@{msg.receiver?.username || 'مستخدم'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-md truncate">
                        <span className="text-sm text-white/80" title={msg.content}>{msg.content}</span>
                      </td>
                      <td className="px-6 py-4">
                        {msg.reaction ? (
                          <span className="text-lg" title={`تفاعل: ${msg.reaction}`}>{msg.reaction}</span>
                        ) : (
                          <span className="text-[10px] text-white/10 italic">لا يوجد تفاعل</span>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="px-6 py-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
          <span className="text-xs font-bold text-white/30 uppercase tracking-widest text-nowrap">
            {messages.length} رسالة في هذه الصفحة
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0 || loading}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white/5"
            >
              <ChevronRight size={20} />
            </button>
            <div className="bg-white/10 px-4 py-2 rounded-xl text-sm font-black border border-white/10 min-w-[40px] text-center">
              {page + 1}
            </div>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={messages.length < 50 || loading}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white/5"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
