import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  Star, 
  Gift, 
  CheckCircle2, 
  TicketPercent, 
  Zap, 
  Leaf, 
  Crown,
  ChevronLeft,
  ShoppingBag,
  TrendingUp,
  Percent,
  Truck,
  ShieldCheck,
  Flame,
  ArrowRight
} from 'lucide-react';

interface RewardsViewProps {
  currentSpend?: number;
  targetSpendForElite?: number;
  onExploreOffers?: () => void;
}

export const RewardsView: React.FC<RewardsViewProps> = ({
  currentSpend: initialCurrentSpend = 320,
  targetSpendForElite = 500,
  onExploreOffers,
}) => {
  const [currentSpend, setCurrentSpend] = useState<number>(initialCurrentSpend);

  const remainingToSpend = Math.max(0, targetSpendForElite - currentSpend);
  const progressPercent = Math.min(100, Math.round((currentSpend / targetSpendForElite) * 100));
  const isEliteReached = currentSpend >= targetSpendForElite;

  const elitePerks = [
    {
      icon: Percent,
      title: 'كاش باك مضاعف يصل 15%',
      description: 'استرداد نقدي فوري أعلى على كافة مشترياتك من متجر حكيم الذكي alhkmy.store',
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: Truck,
      title: 'شحن مجاني لا محدود',
      description: 'توصيل مجاني فوري لجميع طلبياتك بدون اشتراط حد أدنى للطلب',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: Flame,
      title: 'أسبقية العروض الحصرية (Early Access)',
      description: 'الوصول المسبق لخصومات وتخفيضات الجمعة والعروض الأسبوعية قبل الجميع بـ 24 ساعة',
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    },
    {
      icon: Gift,
      title: 'قسيمة ترحيبية بقيمة 50 ر.س',
      description: 'تضاف تلقائياً إلى محفظتك الإلكترونية بمجرد ترقيتك لمستوى النخبة',
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    },
  ];

  const badges = [
    {
      title: 'صائد الكوبونات المحترف',
      description: 'استخدمت أكثر من 5 كوبونات خصم معتمدة بنجاح ووفرت 75+ ريال',
      icon: TicketPercent,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/50',
      unlocked: true,
      points: 250,
    },
    {
      title: 'خبير تقسيم السلال (Split Master)',
      description: 'قمت بتوفير أكثر من 120 ريال عبر ميزة تقسيم السلة الذكي',
      icon: Zap,
      iconColor: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50',
      unlocked: true,
      points: 400,
    },
    {
      title: 'سفير البدائل الصحية',
      description: 'استبدلت 3 سلع مصنعة ببدائل صحية وموفرة محلية الصنع',
      icon: Leaf,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50',
      unlocked: true,
      points: 180,
    },
    {
      title: 'عميل حكيم الماسي (VIP Saver)',
      description: 'توفير تراكمي يفوق 500 ريال سعودي على مدار مشتريات الشهر',
      icon: Crown,
      iconColor: 'text-yellow-500 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800/50',
      unlocked: isEliteReached,
      points: 1000,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-28 md:pb-12" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-amber-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 text-amber-300 text-xs font-black mb-2 shadow-xs">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>مكافآت وبرنامج ولاء حكيم AI</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white">جوائز وأوسمة التوفير الذكي</h1>
            <p className="text-xs sm:text-sm text-amber-100 max-w-xl mt-1 leading-relaxed">
              كل ريال توفره أو تنفقه عبر مقارنة الأسعار واستخدام الكوبونات يمنحك نقاطاً ويوصلك لمستويات حصرية بمزايا استثنائية.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 px-6 rounded-2xl border border-white/20 text-center shadow-lg">
            <div className="text-xs text-amber-100 font-bold">رصيد نقاطك الحالي:</div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-0.5">830 نقطة</div>
            <div className="text-[11px] text-amber-200 mt-0.5 font-bold">تساوي 41.50 ر.س رصيد مجاني</div>
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Artisanal Elite Loyalty Tier Progress Bar Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-400/50 dark:border-amber-500/40 p-5 sm:p-7 shadow-xl space-y-6 relative overflow-hidden">
        {/* Background Decorative Crest */}
        <div className="absolute -top-12 -left-12 w-44 h-44 bg-gradient-to-br from-amber-400/10 to-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header of the Tier Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center shadow-md shrink-0">
              <Crown className="w-6 h-6 fill-slate-950 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">مستوى الولاء المستهدف:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-400/40">
                  Artisanal Elite • النخبة الحرفية
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                طريقك إلى رتبة «Artisanal Elite»
              </h2>
            </div>
          </div>

          {/* Current Tier Badge */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">رتبتك الحالية:</span>
            <span className="px-3 py-1 rounded-xl text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              🥈 المتسوق الذكي (Silver)
            </span>
          </div>
        </div>

        {/* Visual Progress Bar Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>نسبة الإنجاز نحو المستوى:</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60">
                {progressPercent}% مكتمل
              </span>
              <span className="font-black text-slate-900 dark:text-white font-mono text-xs sm:text-sm">
                {currentSpend.toFixed(2)} / {targetSpendForElite.toFixed(2)} ر.س
              </span>
            </div>
          </div>

          {/* The Visual Progress Bar Container */}
          <div className="relative w-full h-4 sm:h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner border border-slate-200 dark:border-slate-700">
            {/* Animated Gradient Fill */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 transition-all duration-700 ease-out shadow-sm relative"
              style={{ width: `${progressPercent}%` }}
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
            </div>
          </div>

          {/* Milestone markers */}
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 dark:text-slate-500 pt-0.5">
            <span>0.00 ر.س</span>
            <span className="text-amber-700 dark:text-amber-400 font-black">
              {currentSpend.toFixed(2)} ر.س (إنفاقك الحالي)
            </span>
            <span className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-0.5">
              <Crown className="w-3 h-3 text-amber-500" />
              <span>{targetSpendForElite.toFixed(2)} ر.س (Artisanal Elite)</span>
            </span>
          </div>
        </div>

        {/* Dynamic Spend Notice & Callout */}
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
          isEliteReached
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
            : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isEliteReached
                ? 'bg-emerald-500 text-white'
                : 'bg-amber-400 text-slate-950 shadow-xs'
            }`}>
              {isEliteReached ? <CheckCircle2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>

            <div>
              {isEliteReached ? (
                <div>
                  <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                    تهانينا! لقد حققت مستوى Artisanal Elite بنجاح 🎉
                  </h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                    جميع مزايا النخبة الحرفية مفعلة الآن تلقائياً في حسابك وعلى طلبياتك.
                  </p>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    تحتاج لإنفاق{' '}
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-base sm:text-lg font-black underline decoration-amber-400 underline-offset-4">
                      {remainingToSpend.toFixed(2)} ر.س
                    </span>{' '}
                    إضافية فقط للوصول إلى رتبة «Artisanal Elite»
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    قم بإتمام مقاضيك القادمة عبر مقارن الأسعار لترقية عضويتك وفتح كاش باك 15% وشحن مجاني دائم!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action button */}
          {!isEliteReached && onExploreOffers && (
            <button
              onClick={onExploreOffers}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md transition-transform active:scale-95 whitespace-nowrap cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>تسوّق واستكمل الـ {remainingToSpend.toFixed(0)} ر.س</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Artisanal Elite Exclusive Perks Grid */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
              المزايا الحصرية التي تنتظرك في فئة Artisanal Elite:
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {elitePerks.map((perk, i) => {
              const PerkIcon = perk.icon;
              return (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750 flex items-start gap-3 hover:border-amber-400 transition-colors"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${perk.color}`}>
                    <PerkIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                      {perk.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                      {perk.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>الأوسمة والمهمات التوفيرية المكتملة</span>
          </h2>
          <span className="text-xs text-slate-400 font-bold">
            {badges.filter((b) => b.unlocked).length} من {badges.length} مكتمل
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {badges.map((b, idx) => {
            const IconComponent = b.icon;
            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                  b.unlocked
                    ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700/60 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner ${b.bgColor}`}>
                  <IconComponent className={`w-7 h-7 ${b.iconColor}`} />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">{b.title}</h3>
                    {b.unlocked ? (
                      <span className="text-[9px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded-md border border-emerald-200 dark:border-emerald-800">
                        مكتمل
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.2 rounded-md">
                        قيد التقدم
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{b.description}</p>
                  <div className="text-xs font-black text-amber-700 dark:text-amber-400 pt-1">+{b.points} نقطة توفير</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
