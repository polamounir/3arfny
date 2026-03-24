'use client';

import { useRef, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toPng } from 'html-to-image';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, RefreshCw, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareMessagePage() {
  const { id } = useParams();
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [gradientIndex, setGradientIndex] = useState(0);
  const supabase = createClient();

  const gradients = [
    'from-neon-purple to-neon-blue',
    'from-neon-blue to-neon-orange',
    'from-neon-orange to-neon-purple',
    'from-[#FF0080] to-[#7928CA]',
    'from-[#0070f3] to-[#00dfd8]',
  ];

  useEffect(() => {
    async function fetchMessage() {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles(username)')
        .eq('id', id)
        .single();
      
      if (error || !data) {
        toast.error('الرسالة غير موجودة');
        router.push('/dashboard');
      } else {
        setMessage(data);
      }
      setLoading(false);
    }
    fetchMessage();
  }, [id, supabase, router]);

  const handleDownload = async () => {
    if (!cardRef.current || exporting) return;
    setExporting(true);
    
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 4, // Higher quality for sharing
      });
      
      const link = document.createElement('a');
      link.download = `3arfny-message-${id}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('الصورة جاهزة للمشاركة! 📸');
    } catch (err) {
      console.error(err);
      toast.error('فشل إنشاء الصورة');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="max-w-md w-full space-y-8">
        
        <header className="flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 glass rounded-full hover:bg-white/10">
            <ArrowLeft size={24} className="rotate-180" />
          </button>
          <h1 className="text-xl font-bold uppercase tracking-widest text-white/60">مشاركة الرسالة</h1>
          <button onClick={() => setGradientIndex((v) => (v + 1) % gradients.length)} className="p-2 glass rounded-full hover:bg-white/10">
            <RefreshCw size={24} />
          </button>
        </header>

        {/* The Card to Capture */}
        <div className="relative group">
          <div 
            ref={cardRef}
            className={`w-full aspect-9/16 bg-linear-to-br ${gradients[gradientIndex]} p-8 flex flex-col items-center justify-center text-center space-y-12 relative overflow-hidden rounded-[2.5rem]`}
          >
            {/* Background Texture / Grain */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
            
            <div className="glass-card bg-black/40 backdrop-blur-3xl border-white/20 p-8 py-12 rounded-4xl space-y-6 relative w-full">

              <div className="p-4 bg-white/10 rounded-2xl w-fit mx-auto">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-white/60 text-sm font-black uppercase tracking-[0.3em]">رسالة جديدة</h2>
              
              <p className="text-2xl font-bold text-white leading-tight">
                "{message.content}"
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-white/80 font-black italic text-3xl tracking-tighter uppercase">
                عرفني
              </p>
              <p className="text-white/40 text-xs font-medium uppercase tracking-widest">
                أرسل لي رسالة مجهولة
              </p>
            </div>

            {/* Corner Accents */}
            <div className="absolute top-8 right-8 w-4 h-4 border-t-2 border-r-2 border-white/30" />
            <div className="absolute bottom-8 left-8 w-4 h-4 border-b-2 border-l-2 border-white/30" />
          </div>
        </div>

        <button
          onClick={handleDownload}
          disabled={exporting}
          className="w-full py-5 rounded-2xl bg-white text-black font-black text-xl hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {exporting ? <RefreshCw className="animate-spin" /> : <Download size={24} />}
          {exporting ? 'جاري التحميل...' : 'حفظ للمشاركة'}
        </button>
      </div>
    </div>
  );
}
