'use client';

import AdminGuard from '@/components/auth/AdminGuard';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users,
  Activity, 
  ArrowRight,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: '/admin/users', label: 'المستخدمين', icon: Users },
    { href: '/admin/all-messages', label: 'جميع الرسائل', icon: MessageSquare },
    { href: '/admin/traffic', label: 'حركة الزوار', icon: Activity },
  ];

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background text-white flex flex-col md:flex-row" dir="rtl">
        {/* Sidebar */}
        <aside className="w-full md:w-64 glass-card border-l border-white/5 md:h-screen sticky top-0 z-20 flex flex-col p-4 rounded-none border-y-0 border-r-0">
          <div className="flex items-center gap-3 px-2 py-6">
            <div className="p-2 rounded-xl bg-neon-purple/20 text-neon-purple">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-xl font-black italic tracking-tighter">لوحة الإدارة</h1>
          </div>

          <nav className="flex-1 space-y-1 mt-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-white/5 pt-6 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-white/40 hover:text-white transition-colors"
            >
              <ArrowRight size={16} className="rotate-180" />
              <span>العودة للرئيسية</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden min-h-screen">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
