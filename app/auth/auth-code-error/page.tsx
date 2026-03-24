'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function AuthCodeError() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check if there is an access token in the hash (Implicit Flow)
    // Supabase sometimes redirects errors here, but if there's a token, it might be a success!
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      // It's actually a successful login via fragment!
      // Supabase client handles this automatically if we're on the right page
      toast.success('تم تسجيل الدخول بنجاح! جارٍ التحويل...');
      router.push('/onboarding'); // or /dashboard
    } else {
      toast.error('حدث خطأ أثناء المصادقة. يرجى المحاولة مرة أخرى.');
      setTimeout(() => router.push('/login'), 3000);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 text-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">جاري معالجة الدخول...</h1>
        <p className="text-white/40">إذا لم يتم تحويلك تلقائياً خلال ثوانٍ، يرجى إعادة المحاولة من صفحة الدخول.</p>
      </div>
    </div>
  );
}
