import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-white" dir="rtl">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-neon-purple/10 blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-12">
        {/* Header */}
        <header className="space-y-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neon-purple font-black text-xl"
          >
            <div className="w-8 h-8 bg-linear-to-br from-neon-purple to-neon-blue rounded-lg flex items-center justify-center">
              <MessageSquare className="text-white w-4 h-4" />
            </div>
            عرفني
          </Link>
          <h1 className="text-4xl md:text-5xl font-black">سياسة الخصوصية</h1>
          <p className="text-white/40">آخر تحديث: مارس ٢٠٢٦</p>
        </header>

        <div className="space-y-10 text-white/70 leading-loose text-[1.05rem]">
          <Section title="١. المعلومات التي نجمعها">
            <p>
              نجمع عنوان بريدك الإلكتروني عند التسجيل لإنشاء حساب. لا نطلب أي معلومات إضافية
              كالاسم أو الهاتف أو العنوان. عند إرسال رسائل مجهولة، لا نخزن أي معلومات تعريفية عن
              المرسل المجهول — لا عنوان IP، ولا بيانات جهاز، ولا هوية.
            </p>
          </Section>

          <Section title="٢. كيف نستخدم معلوماتك">
            <ul className="space-y-2 list-disc list-inside">
              <li>إرسال رمز التحقق (OTP) إلى بريدك لتسجيل الدخول.</li>
              <li>ربط الرسائل المجهولة بحسابك كمستلم.</li>
              <li>تمكينك من إدارة صندوق الوارد الخاص بك.</li>
            </ul>
            <p className="mt-3">لا نبيع بياناتك ولا نشاركها مع أي طرف ثالث لأغراض تسويقية.</p>
          </Section>

          <Section title="٣. تخزين البيانات وأمانها">
            <p>
              يتم تخزين بياناتك بشكل آمن على خوادم Supabase المشفرة. يتم إرسال رموز OTP عبر Gmail
              SMTP المشفر بـ TLS. لا نحتفظ برموز OTP بعد انتهاء صلاحيتها (١٠ دقائق).
            </p>
          </Section>

          <Section title="٤. الاحتفاظ بالبيانات وحذفها">
            <p>
              يمكنك حذف حسابك في أي وقت من صفحة الإعدادات. عند الحذف، تُحذف جميع رسائلك وبيانات
              ملفك الشخصي وحسابك بشكل نهائي وفوري ولا يمكن استرداده.
            </p>
          </Section>

          <Section title="٥. ملفات الارتباط (Cookies)">
            <p>
              نستخدم ملفات ارتباط جلسة محدودة فقط للحفاظ على حالة تسجيل دخولك. لا نستخدم ملفات
              ارتباط تتبعية أو إعلانية.
            </p>
          </Section>

          <Section title="٦. حقوقك">
            <p>
              لك الحق في طلب نسخة من بياناتك أو حذفها في أي وقت. للتواصل معنا:{' '}
              <a
                href="mailto:3arfny.mail@gmail.com"
                className="text-neon-blue hover:underline"
              >
                3arfny.mail@gmail.com
              </a>
            </p>
          </Section>

          <Section title="٧. تغييرات على هذه السياسة">
            <p>
              قد نقوم بتحديث هذه السياسة من وقت لآخر. سيتم الإعلان عن التغييرات الجوهرية على
              صفحة الموقع الرئيسية.
            </p>
          </Section>
        </div>

        <footer className="pt-8 border-t border-white/5 flex flex-wrap gap-6 text-sm text-white/30">
          <Link href="/" className="hover:text-white/60 transition-colors">الرئيسية</Link>
          <Link href="/terms" className="hover:text-white/60 transition-colors">شروط الخدمة</Link>
          <Link href="/login" className="hover:text-white/60 transition-colors">تسجيل الدخول</Link>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
