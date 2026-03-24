'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Clock, 
  ChevronLeft,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTraffic() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchLogs = async (p = page) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/traffic?page=${p}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      toast.error('فشل تحميل سجلات التحليل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(0);
  }, []);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchLogs(p);
  };

  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'mobile': return Smartphone;
      case 'tablet': return Tablet;
      default: return Monitor;
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-black italic tracking-tighter">حركة الزوار</h1>
        <p className="text-white/40">متابعة الزيارات المباشرة وتحليل الأجهزة ({total})</p>
      </header>

      <div className="glass-card overflow-hidden border-white/5 relative">
        <div className="overflow-x-auto text-nowrap">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/30">الوقت</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/30">الجهاز</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/30">العنوان (IP)</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/30">الملف الشخصي</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-white/30">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {loading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-neon-orange border-t-transparent rounded-full animate-spin" />
                        <span className="text-white/20 text-sm">جاري جلب سجلات التحليل...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <p className="text-white/20">لا توجد زيارات مسجلة بعد</p>
                    </td>
                  </tr>
                ) : (
                  logs.map((log, i) => {
                    const DeviceIcon = getDeviceIcon(log.device_type);
                    return (
                      <motion.tr
                        key={log.id}
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
                            {new Date(log.created_at).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white/5 text-white/40 group-hover:text-neon-orange transition-colors">
                              <DeviceIcon size={16} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white/80">{log.browser_name || 'Browser'} / {log.os_name || 'OS'}</span>
                              <span className="text-[10px] text-white/20">{log.device_model || 'Desktop'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-white/30">
                          {log.ip_address}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <UserIcon size={12} className="text-white/20" />
                            <span className="text-xs font-bold text-neon-blue">@{log.profiles?.username || 'GUEST'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-white/20 flex items-center gap-1">
                              <Globe size={10} />
                              {log.language?.split(',')[0] || 'N/A'} • {log.screen_width}x{log.screen_height}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-6 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
          <span className="text-xs font-bold text-white/30 uppercase tracking-widest text-nowrap">
            {logs.length} سجل في هذه الصفحة
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
              disabled={logs.length < 50 || loading}
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
