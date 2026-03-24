'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  Copy,
  ExternalLink,
  ArrowRight,
  MessageSquare,
  PowerOff,
  Trash2,
  LogOut,
  Settings2,
  Check,
  User,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [savingPrompts, setSavingPrompts] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);
  const [bio, setBio] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'deleteAccount' | 'updateUsername' | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        // No profile yet → send to onboarding
        router.push('/onboarding');
        return;
      }

      setProfile(data);
      setNewUsername(data.username);
      setBio(data.bio || '');
      setPrompts(data.prompts && data.prompts.length > 0 ? data.prompts : [
        'ما رأيك بي بصدق؟',
        'قيّم أسلوبي من ١ إلى ١٠',
        'شيء تتمنى أن أعرفه عنك',
        'ما الشيء الذي يميزني؟'
      ]);
      setLoading(false);
    }

    fetchProfile();
  }, [supabase, router]);

  // Handle username availability check
  useEffect(() => {
    if (!profile || newUsername === profile.username) {
      setIsAvailable(null);
      return;
    }

    if (newUsername.length < 3) {
      setIsAvailable(false);
      return;
    }

    const check = async () => {
      setCheckingUsername(true);
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', newUsername.toLowerCase())
        .maybeSingle();

      setIsAvailable(!data);
      setCheckingUsername(false);
    };

    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, [newUsername, profile, supabase]);

  const shareLink =
    typeof window !== 'undefined' && profile
      ? `${window.location.origin}/u/${profile.username}`
      : '';

  const copyLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success('تم نسخ الرابط! 🚀');
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleReceiving = async () => {
    if (!profile) return;
    setToggling(true);

    const newVal = !profile.receiving_enabled;
    const { error } = await supabase
      .from('profiles')
      .update({ receiving_enabled: newVal })
      .eq('id', profile.id);

    if (error) {
      toast.error('فشل تحديث الإعداد');
    } else {
      setProfile({ ...profile, receiving_enabled: newVal });
      toast.success(newVal ? 'تم تفعيل استقبال الرسائل ✅' : 'تم إيقاف استقبال الرسائل ⏸️');
    }
    setToggling(false);
  };

  const handleDeleteAccount = async () => {
    setIsConfirmModalOpen(true);
    setPendingAction('deleteAccount');
  };

  const performDeleteAccount = async () => {
    setDeleting(true);
    const res = await fetch('/api/account/delete', { method: 'DELETE' });

    if (res.ok) {
      toast.success('تم حذف الحساب. نتمنى أن نراك مجدداً!');
      await supabase.auth.signOut();
      router.push('/');
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || 'فشل حذف الحساب');
      setDeleting(false);
    }
  };

  const updatePrompt = (index: number, val: string) => {
    const newP = [...prompts];
    newP[index] = val;
    setPrompts(newP);
  };

  const addPrompt = () => {
    if (prompts.length >= 5) return;
    setPrompts([...prompts, '']);
  };

  const removePrompt = (index: number) => {
    const newP = [...prompts];
    newP.splice(index, 1);
    setPrompts(newP);
  };

  const saveBio = async () => {
    setSavingBio(true);
    const validBio = bio.trim();
    const finalBio = validBio.length > 0 ? validBio : null;
    const { error } = await supabase.from('profiles').update({ bio: finalBio }).eq('id', profile.id);
    if (error) {
      toast.error('فشل حفظ النبذة التعريفية');
    } else {
      setBio(finalBio || '');
      toast.success('تم الحفظ بنجاح!');
    }
    setSavingBio(false);
  };

  const savePrompts = async () => {
    setSavingPrompts(true);
    const validPrompts = prompts.map((p) => p.trim()).filter((p) => p.length > 0);
    const { error } = await supabase.from('profiles').update({ prompts: validPrompts }).eq('id', profile.id);
    if (error) {
      toast.error('فشل حفظ الأسئلة المقترحة');
    } else {
      setPrompts(validPrompts);
      toast.success('تم حفظ الأسئلة بنجاح!');
    }
    setSavingPrompts(false);
  };

  const handleUpdateUsername = async () => {
    if (!isAvailable || savingUsername || !profile) return;
    setIsConfirmModalOpen(true);
    setPendingAction('updateUsername');
  };

  const performUpdateUsername = async () => {
    setSavingUsername(true);
    try {
      const res = await fetch('/api/profile/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername, bio: profile.bio }),
      });

      const result = await res.json();
      if (res.ok) {
        setProfile({ ...profile, username: result.username });
        toast.success('تم تحديث اسم المستخدم بنجاح! 🎊');
        setIsAvailable(null);
      } else {
        toast.error(result.error || 'فشل تحديث اسم المستخدم');
      }
    } catch (err) {
      toast.error('حدث خطأ غير متوقع');
    } finally {
      setSavingUsername(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-neon-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-4 sm:p-8" dir="rtl">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-neon-purple/10 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
          >
            <ArrowRight size={16} className="rotate-180" />
            <span className="hidden sm:inline">العودة للوحة التحكم</span>
          </Link>

          <div className="flex items-center gap-2 text-white font-black text-lg sm:text-xl">
            <Settings2 size={22} className="text-neon-purple" />
            الإعدادات
          </div>
        </header>

        {/* 1 - Share Link */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card space-y-4 border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1 h-full bg-linear-to-b from-neon-purple to-neon-blue" />
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare size={18} className="text-neon-blue" />
            رابط مشاركتك
          </h2>

          <p className="text-white/40 text-sm">
            شارك هذا الرابط مع أصدقائك ليرسلوا لك رسائل مجهولة.
          </p>

          <div className="flex gap-3">
            <div className="flex-1 glass-input text-sm text-white/70 truncate" dir="ltr">
              {shareLink}
            </div>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-purple hover:bg-neon-purple/80 text-white font-bold transition-all shrink-0"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'تم!' : 'نسخ'}
            </button>
            <a
              href={shareLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl glass border border-white/10 hover:bg-white/10 transition-all text-white/50"
              title="فتح صفحتك"
            >
              <ExternalLink size={18} />
            </a>
          </div>
        </motion.section>

        {/* 1.2 - Username Change */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="glass-card space-y-4 border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1 h-full bg-linear-to-b from-neon-orange to-neon-purple" />
          <h2 className="text-lg font-bold flex items-center gap-2">
            <User size={18} className="text-neon-orange" />
            اسم المستخدم ورابط الصفحة
          </h2>
          <p className="text-white/40 text-sm">
            يمكنك تغيير اسم المستخدم الخاص بك (الرابط: /u/اسم_المستخدم). 
            <span className="text-red-400/80 block mt-1">⚠️ تحذير: تغيير الاسم سيعطل رابطك القديم.</span>
          </p>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className={`w-full glass-input text-right pl-12 ${
                  isAvailable === true ? 'border-green-500/50' :
                  isAvailable === false ? 'border-red-500/50' : ''
                }`}
                placeholder="اسم_المستخدم_الجديد"
                maxLength={15}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {checkingUsername ? (
                  <Loader2 size={16} className="animate-spin text-white/40" />
                ) : isAvailable === true ? (
                  <Check size={16} className="text-green-500" />
                ) : isAvailable === false ? (
                  <X size={16} className="text-red-500" />
                ) : null}
              </div>
            </div>

            {isAvailable === false && newUsername !== profile.username && (
              <p className="text-xs text-red-500 flex items-center gap-1 justify-end">
                {newUsername.length < 3 ? 'الاسم قصير جداً' : 'هذا الاسم محجوز بالفعل'}
                <AlertCircle size={12} />
              </p>
            )}

            <button
              onClick={handleUpdateUsername}
              disabled={isAvailable !== true || savingUsername || newUsername === profile.username}
              className="w-full py-3 rounded-xl bg-white text-black font-black text-sm hover:scale-[1.01] transition-all disabled:opacity-30 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {savingUsername ? <Loader2 size={16} className="animate-spin" /> : 'تحديث اسم المستخدم'}
            </button>
          </div>
        </motion.section>

        {/* 1.5 - Bio */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card space-y-4 border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1 h-full bg-linear-to-b from-neon-blue to-neon-purple" />
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare size={18} className="text-neon-blue" />
            النبذة التعريفية (Bio)
          </h2>
          <p className="text-white/40 text-sm">
            أضف نبذة قصيرة تظهر في صفحتك العامة (بحد أقصى 100 حرف).
          </p>
          <div className="space-y-2 text-right">
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              onBlur={saveBio}
              className="w-full glass-input text-sm text-right"
              placeholder="طالب جامعي · القاهرة · أحب الأسئلة الصعبة"
              maxLength={100}
            />
            <div className="flex justify-between items-center text-xs text-white/30">
              <span>{savingBio ? 'جاري الحفظ...' : ''}</span>
              <span className="font-mono">{bio.length} / 100</span>
            </div>
          </div>
        </motion.section>

        {/* 2 - Toggle receiving */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card space-y-4 border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1 h-full bg-linear-to-b from-neon-blue to-neon-orange" />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <PowerOff size={18} className="text-neon-orange" />
                استقبال الرسائل
              </h2>
              <p className="text-white/40 text-sm">
                {profile.receiving_enabled
                  ? 'مفعّل — أصدقاؤك يستطيعون إرسال رسائل إليك.'
                  : 'متوقف مؤقتاً — لن يستطيع أحد إرسال رسائل إليك.'}
              </p>
            </div>

            {/* Toggle switch */}
            <button
              onClick={toggleReceiving}
              disabled={toggling}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 shrink-0 disabled:opacity-50 ${
                profile.receiving_enabled ? 'bg-neon-purple' : 'bg-white/10'
              }`}
              style={
                profile.receiving_enabled
                  ? { boxShadow: '0 0 12px rgba(168,85,247,0.5)' }
                  : {}
              }
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform duration-300 ${
                  profile.receiving_enabled ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </motion.section>

        {/* 2.5 - Prompts editor */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card space-y-4 border border-white/5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1 h-full bg-linear-to-b from-neon-blue to-neon-purple" />
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare size={18} className="text-neon-blue" />
            الأسئلة المقترحة (Prompts)
          </h2>
          <p className="text-white/40 text-sm">
            أضف أسئلة تظهر كخيارات سريعة للزوار لتسهيل كتابة الرسائل (بحد أقصى 5).
          </p>
          <div className="space-y-3">
            {prompts.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={p}
                  onChange={(e) => updatePrompt(i, e.target.value)}
                  className="flex-1 glass-input text-sm text-right"
                  placeholder="اكتب سؤالاً مقترحاً..."
                  maxLength={60}
                />
                <button
                  onClick={() => removePrompt(i)}
                  className="p-3 text-red-500 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all border border-red-500/10"
                  title="حذف"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={addPrompt}
              disabled={prompts.length >= 5}
              className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all disabled:opacity-50 border border-white/10 text-sm"
            >
              إضافة سؤال +
            </button>
            <button
              onClick={savePrompts}
              disabled={savingPrompts}
              className="flex-1 py-3 rounded-xl bg-neon-purple/20 hover:bg-neon-purple/40 text-neon-purple border border-neon-purple/30 font-bold transition-all disabled:opacity-50 text-sm focus:outline-hidden"
            >
              {savingPrompts ? 'جاري الحفظ...' : 'حفظ الأسئلة'}
            </button>
          </div>
        </motion.section>

        {/* 3 - Danger zone */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card space-y-4 border border-red-500/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1 h-full bg-red-500/60" />
          <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
            <Trash2 size={18} />
            منطقة الخطر
          </h2>
          <p className="text-white/40 text-sm">
            حذف الحساب نهائي ولا يمكن التراجع عنه. ستفقد جميع رسائلك وإعداداتك.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deleting}
            className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 font-bold transition-all disabled:opacity-50"
          >
            {deleting ? 'جاري الحذف...' : 'حذف حسابي نهائياً'}
          </button>
        </motion.section>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-sm"
          >
            <LogOut size={14} />
            تسجيل الخروج
          </button>
        </motion.div>

        {/* Footer links */}
        <div className="flex justify-center gap-6 text-xs text-white/20 pb-8">
          <Link href="/privacy" className="hover:text-white/40 transition-colors">
            سياسة الخصوصية
          </Link>
          <Link href="/terms" className="hover:text-white/40 transition-colors">
            شروط الخدمة
          </Link>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setPendingAction(null);
        }}
        onConfirm={() => {
          if (pendingAction === 'deleteAccount') performDeleteAccount();
          if (pendingAction === 'updateUsername') performUpdateUsername();
        }}
        variant={pendingAction === 'deleteAccount' ? 'danger' : 'info'}
        title={pendingAction === 'deleteAccount' ? 'حذف الحساب نهائياً' : 'تحديث اسم المستخدم'}
        message={
          pendingAction === 'deleteAccount'
            ? 'هل أنت متأكد تماماً؟ سيتم حذف حسابك وجميع رسائلك بشكل نهائي ولا يمكن التراجع عنه.'
            : 'تغيير اسم المستخدم سيؤدي إلى تغيير رابطك العام. الروابط القديمة لن تعمل بعد الآن. هل أنت متأكد؟'
        }
        confirmText={pendingAction === 'deleteAccount' ? 'نعم، احذف حسابي' : 'تحديث الآن'}
        cancelText="إلغاء"
      />
    </div>
  );
}
