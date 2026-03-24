'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, MessageSquare } from 'lucide-react';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden"
      dir="rtl"
    >
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-neon-purple/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neon-blue/10 blur-[120px] rounded-full" />

      <div className="relative z-10 text-center space-y-8">
        {/* Glitchy 404 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative select-none"
        >
          <span
            className="text-[10rem] md:text-[14rem] font-black leading-none"
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 50%, #f97316 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px rgba(168,85,247,0.4))',
            }}
          >
            404
          </span>
          {/* Ghost glitch layer */}
          <motion.span
            animate={{ x: [0, -4, 4, -2, 0], opacity: [0, 0.4, 0, 0.3, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            className="absolute inset-0 text-[10rem] md:text-[14rem] font-black leading-none text-neon-blue/30 pointer-events-none"
          >
            404
          </motion.span>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h1 className="text-3xl md:text-4xl font-black text-white">الصفحة غير موجودة</h1>
          <p className="text-white/40 max-w-sm mx-auto leading-relaxed">
            يبدو أن هذه الصفحة لا وجود لها. ربما تم حذفها أو الرابط به خطأ.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
              boxShadow: '0 0 25px rgba(168,85,247,0.3)',
            }}
          >
            <Home size={20} />
            العودة للرئيسية
          </Link>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl glass text-white font-bold text-lg border border-white/10 hover:bg-white/10 transition-all"
          >
            <MessageSquare size={20} />
            تسجيل الدخول
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
