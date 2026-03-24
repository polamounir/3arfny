'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Activity, 
  TrendingUp, 
  Clock 
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-48 bg-white/5 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { label: 'إجمالي المستخدمين', value: stats.totalUsers, icon: Users, color: 'text-neon-blue', bg: 'bg-neon-blue/10', accent: 'bg-neon-blue' },
    { label: 'إجمالي الرسائل', value: stats.totalMessages, icon: MessageSquare, color: 'text-neon-purple', bg: 'bg-neon-purple/10', accent: 'bg-neon-purple' },
    { label: 'إجمالي الزيارات', value: stats.totalVisits, icon: Activity, color: 'text-neon-orange', bg: 'bg-neon-orange/10', accent: 'bg-neon-orange' },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-black italic tracking-tighter">نظرة عامة</h1>
        <p className="text-white/40">إحصائيات المنصة المباشرة</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 border-white/5 relative overflow-hidden group"
            >
              <div className={`absolute top-0 right-0 w-1 h-full ${card.accent}`} />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-white/40 text-sm font-medium">{card.label}</p>
                  <h2 className="text-3xl font-black tabular-nums">{card.value.toLocaleString()}</h2>
                </div>
                <div className={`p-4 rounded-2xl ${card.bg} ${card.color}`}>
                  <Icon size={24} />
                </div>
              </div>
              <div className={`absolute -bottom-4 -left-4 w-24 h-24 blur-3xl opacity-20 ${card.bg}`} />
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Segment */}
        <div className="glass-card p-6 border-white/5 space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <TrendingUp size={18} className="text-green-500" />
            نشاط الـ 24 ساعة الماضية
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-white/60">رسائل جديدة</span>
              <span className="font-black text-neon-purple">+{stats.recentMessages}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-white/60">زيارات جديدة</span>
              <span className="font-black text-neon-orange">+{stats.recentVisits}</span>
            </div>
          </div>
        </div>

        {/* Server status */}
        <div className="glass-card p-6 border-white/5 space-y-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock size={18} className="text-neon-blue" />
            حالة النظام
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            <span className="text-white/60">جميع الأنظمة تعمل بكفاءة عالية</span>
          </div>
          <p className="text-xs text-white/20 leading-relaxed">
            يتم تحديث الإحصائيات بشكل مباشر من قاعدة البيانات. تأكد من مراجعة سجلات الزوار بانتظام لاكتشاف أي أنماط غير طبيعية.
          </p>
        </div>
      </div>
    </div>
  );
}
