'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  User as UserIcon, 
  Calendar, 
  Shield, 
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchUsers = async (p = page, s = search) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(s)}&page=${p}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      toast.error('فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchUsers(0, search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchUsers(p, search);
  };

  return (
    <div className="space-y-8" dir="rtl">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black italic tracking-tighter">المستخدمين</h1>
          <p className="text-white/40">استعرض وابحث في قائمة مستخدمي المنصة ({total})</p>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-neon-blue transition-colors" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو المعرّف (ID)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pr-12 pl-4 text-sm focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/20 transition-all text-white placeholder:text-white/20"
          />
        </div>
      </header>

      <div className="glass-card overflow-hidden border-white/5 relative">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/30 text-right">المستخدم</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/30 text-right">الرقم التعريفي (ID)</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/30 text-right text-nowrap">تاريخ الانضمام</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/30 text-right">الصلاحية</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/30 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-neon-blue border-t-transparent rounded-full animate-spin" />
                      <span className="text-white/20 text-sm">جاري جلب القائمة...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-neon-purple/20 to-neon-blue/20 flex items-center justify-center text-neon-purple font-black border border-white/5 group-hover:scale-105 transition-transform">
                          {u.username?.[0].toUpperCase() || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-white group-hover:text-neon-blue transition-colors">@{u.username}</span>
                          <span className="text-xs text-white/20 truncate max-w-[150px]">{u.full_name || 'بدون اسم'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-white/20 group-hover:text-white/60 transition-colors">
                      {u.id}
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40 text-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-white/20" />
                        {new Date(u.created_at).toLocaleDateString('ar-EG')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_admin ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neon-purple/20 text-neon-purple text-[10px] font-black tracking-wide border border-neon-purple/20">
                          <Shield size={10} />
                          مسؤول
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-white/40 text-[10px] font-bold border border-white/5">
                          <UserIcon size={10} />
                          عضو
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={`/u/${u.username}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2.5 rounded-xl bg-white/5 text-white/20 hover:text-neon-blue hover:bg-neon-blue/10 transition-all inline-flex items-center gap-2 text-xs font-bold"
                        title="عرض الملف"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </td>
                  </motion.tr>
                ))
              )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {!loading && users.length === 0 && (
          <div className="py-24 text-center space-y-4">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
              <Users className="w-8 h-8 text-white/10" />
            </div>
            <p className="text-white/20 font-medium">لم يتم العثور على مستخدمين يطابقون بحثك</p>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
          <span className="text-xs font-bold text-white/30 uppercase tracking-widest">
            {users.length} مستخدم في الصفحة {page + 1}
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
              disabled={users.length < 20 || loading}
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
