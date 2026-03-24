import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-white" dir="rtl">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-neon-blue/10 blur-[100px] pointer-events-none -z-10" />

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
          <h1 className="text-4xl md:text-5xl font-black">شروط الخدمة</h1>
          <p className="text-white/40">آخر تحديث: مارس ٢٠٢٦</p>
        </header>

        <div className="space-y-10 text-white/70 leading-loose text-[1.05rem]">
          <Section title="١. القبول بالشروط">
            <p>
              باستخدامك لمنصة عرفني، فإنك توافق على الالتزام بهذه الشروط. إذا كنت لا توافق على
              أي بند منها، يرجى التوقف عن استخدام الخدمة.
            </p>
          </Section>

          <Section title="٢. وصف الخدمة">
            <p>
              عرفني هي منصة تتيح لك استقبال رسائل مجهولة من أشخاص يملكون رابطك الشخصي. المرسلون
              مجهولون تماماً ولا يتيح النظام الكشف عن هوياتهم.
            </p>
          </Section>

          <Section title="٣. الاستخدام المقبول">
            <p>يُحظر استخدام المنصة في أي من الأغراض التالية:</p>
            <ul className="space-y-2 list-disc list-inside mt-2">
              <li>إرسال محتوى يتضمن تهديدات أو إيذاء أو تحرش.</li>
              <li>إرسال محتوى عنصري أو مسيء أو يدعو إلى الكراهية.</li>
              <li>نشر معلومات شخصية لأشخاص آخرين دون موافقتهم.</li>
              <li>أي نشاط يخالف القانون المحلي أو الدولي.</li>
            </ul>
            <p className="mt-3">
              يحق لنا إزالة أي محتوى وتعطيل أي حساب يخالف هذه الشروط دون إشعار مسبق.
            </p>
          </Section>

          <Section title="٤. الخصوصية والأمان">
            <p>
              لا نكشف عن هوية مرسلي الرسائل. لمزيد من التفاصيل حول كيفية تعاملنا مع بياناتك،
              يرجى مراجعة{' '}
              <Link href="/privacy" className="text-neon-blue hover:underline">
                سياسة الخصوصية
              </Link>
              .
            </p>
          </Section>

          <Section title="٥. إنهاء الحساب">
            <p>
              يمكنك حذف حسابك في أي وقت من صفحة الإعدادات. كما يحق لنا تعليق أو حذف أي حساب
              يخالف هذه الشروط.
            </p>
          </Section>

          <Section title="٦. إخلاء المسؤولية">
            <p>
              تُقدَّم الخدمة "كما هي" دون ضمانات من أي نوع. لسنا مسؤولين عن أي محتوى يرسله
              المستخدمون عبر المنصة.
            </p>
          </Section>

          <Section title="٧. التعديلات على الشروط">
            <p>
              نحتفظ بالحق في تعديل هذه الشروط في أي وقت. استمرارك في استخدام الخدمة بعد نشر
              التعديلات يعني موافقتك عليها.
            </p>
          </Section>

          <Section title="٨. التواصل معنا">
            <p>
              لأي استفسار:{' '}
              <a
                href="mailto:3arfny.mail@gmail.com"
                className="text-neon-blue hover:underline"
              >
                3arfny.mail@gmail.com
              </a>
            </p>
          </Section>
        </div>

        <footer className="pt-8 border-t border-white/5 flex flex-wrap gap-6 text-sm text-white/30">
          <Link href="/" className="hover:text-white/60 transition-colors">الرئيسية</Link>
          <Link href="/privacy" className="hover:text-white/60 transition-colors">سياسة الخصوصية</Link>
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
