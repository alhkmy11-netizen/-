import React, { useState } from 'react';
import { CalendarClock, Calendar, Clock, Bell, Sparkles, CheckCircle2, AlertCircle, Star, AlertTriangle, ShieldCheck } from 'lucide-react';

export const ShoppingTimesView: React.FC = () => {
  const [reminderSaved, setReminderSaved] = useState(false);

  const bestShoppingWindows = [
    {
      day: 'الأربعاء (صباحاً)',
      timeWindow: '9:00 ص - 1:00 م',
      status: 'أفضل توقيت على الإطلاق',
      statusType: 'star',
      reason: 'نزول المجلات التسويقية وعروض الأسبوع الجديدة مع توفر كامل المخزون وخلو المتاجر من الزحام.',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    },
    {
      day: 'الإثنين والخميس (مهرجان الطازج بالعثيم وبنده)',
      timeWindow: '8:30 ص - 11:30 ص',
      status: 'توفير خضار وفواكه ولحوم',
      statusType: 'check',
      reason: 'وصول الشحنات اليومية الطازجة مع أسعار مخفضة للكيلو (عرض الخضار والفواكه).',
      badgeColor: 'bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    },
    {
      day: 'أيام الرواتب (27 من كل شهر ميلادي)',
      timeWindow: 'تجنب ساعات المساء (6 م - 11 م)',
      status: 'أوقات ذروة وزحام شديد',
      statusType: 'warning',
      reason: 'زحام عند كاونترات الكاشير ونفاد بعض عروض المؤن الكبرى، يُفضل الطلب أونلاين أو التسوق ظهراً.',
      badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    },
    {
      day: 'الجمعة بعد صلاة العصر',
      timeWindow: '4:30 م - 10:00 م',
      status: 'أعلى وقت ذروة عائلي',
      statusType: 'warning',
      reason: 'تجنب هذا الوقت إن كنت تبحث عن تسوق سريع وسلس.',
      badgeColor: 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    },
  ];

  const handleSetReminder = () => {
    setReminderSaved(true);
    setTimeout(() => setReminderSaved(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-800 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-black mb-2">
              <CalendarClock className="w-3.5 h-3.5 text-amber-300" />
              <span>دليل الذكاء الاستهلاكي وأوقات الهدوء</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold">أوقات التسوق الذكية وتذكير العروض الأسبوعية</h1>
            <p className="text-xs sm:text-sm text-sky-100 max-w-2xl mt-1 leading-relaxed">
              تجنب طوابير الانتظار الطويلة واستفد من البضائع الطازجة بأقصى تخفيض عبر معرفة أفضل أوقات زيارة الهايبرماركت في السعودية.
            </p>
          </div>

          <button
            onClick={handleSetReminder}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-transform active:scale-95 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span>تفعيل تذكير عروض الأربعاء</span>
          </button>
        </div>

        {reminderSaved && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/30 border border-emerald-400/40 text-xs font-bold text-white flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>تم تفعيل تنبيه تقويم حكيم AI لموسم عروض الأربعاء القادم!</span>
          </div>
        )}
      </div>

      {/* Guide Cards */}
      <div className="space-y-4">
        {bestShoppingWindows.map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-sky-300 dark:hover:border-sky-600 transition-all shadow-xs"
          >
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md border ${item.badgeColor}`}>
                  {item.statusType === 'star' && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                  {item.statusType === 'warning' && <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                  {item.statusType === 'check' && <ShieldCheck className="w-3 h-3 text-teal-600 dark:text-teal-400" />}
                  <span>{item.status}</span>
                </span>
                <h3 className="font-black text-base text-slate-900 dark:text-white">{item.day}</h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{item.reason}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 px-4 py-2.5 rounded-xl text-left shrink-0">
              <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span>الفترة الزمنية الموصى بها:</span>
              </div>
              <div className="text-xs sm:text-sm font-black text-slate-800 dark:text-white mt-0.5">{item.timeWindow}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Saving Golden Rule Box */}
      <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-950 dark:text-amber-200 flex items-start gap-3.5">
        <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">القاعدة الذهبية للتسوق من حكيم AI:</h4>
          <p className="text-xs leading-relaxed text-amber-900 dark:text-amber-300">
            «لا تتسوق وأنت جائع أبداً، والتزم بقائمتك المحددة مسبقاً في التطبيق؛ تشير الدراسات إلى أن الالتزام بقائمة الشراء يوفر ما بين 25% إلى 35% من الفاتورة الإجمالية مقارنة بالتسوق العشوائي.»
          </p>
        </div>
      </div>
    </div>
  );
};
