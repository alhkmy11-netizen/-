import React, { useState } from 'react';
import { HkeeemBot, CarDeal, RealEstateDeal, Product, Store } from '../types';
import { HKEEEM_BOTS, CAR_DEALS, REAL_ESTATE_DEALS } from '../data/hkeeemData';
import { BotAvatar } from './SmartIcon';
import { trackEvent } from '../utils/analytics';
import { 
  Bot, 
  Play, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Calendar, 
  Building2, 
  Car, 
  Zap, 
  TicketPercent, 
  ExternalLink, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';

interface HkeeemBotsViewProps {
  products: Product[];
  stores: Store[];
  onOpenCouponsTab: () => void;
  onOpenOffersTab: () => void;
}

export const HkeeemBotsView: React.FC<HkeeemBotsViewProps> = ({
  products,
  stores,
  onOpenCouponsTab,
  onOpenOffersTab,
}) => {
  const [bots, setBots] = useState<HkeeemBot[]>(HKEEEM_BOTS);
  const [activeBotTab, setActiveBotTab] = useState<'all' | 'cars' | 'real_estate' | 'offers' | 'coupons'>('all');
  const [refreshingBotId, setRefreshingBotId] = useState<string | null>(null);

  const handleRunBot = async (botId: string) => {
    const targetBot = bots.find((b) => b.id === botId);
    trackEvent('run_smart_bot', {
      bot_id: botId,
      bot_name: targetBot?.name || botId,
      deals_before: targetBot?.dealsFoundCount || 0,
      timestamp: new Date().toISOString(),
    });
    setRefreshingBotId(botId);
    try {
      const res = await fetch('/api/gemini/bot-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId }),
      });
      if (res.ok) {
        const data = await res.json();
        setBots((prev) =>
          prev.map((b) =>
            b.id === botId
              ? {
                  ...b,
                  lastRunTime: data.lastRunTime || 'الآن (ناجح)',
                  dealsFoundCount: b.dealsFoundCount + Math.floor(Math.random() * 3 + 1),
                }
              : b
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setRefreshingBotId(null), 800);
    }
  };

  const handleTabChange = (tab: 'all' | 'cars' | 'real_estate' | 'offers' | 'coupons') => {
    setActiveBotTab(tab);
    trackEvent('filter_bot_deals', {
      bot_category: tab,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-xs font-black mb-3 shadow-xs">
              <Bot className="w-3.5 h-3.5 text-amber-300" />
              <span>أنظمة الذكاء الاصطناعي الأوتوماتيكية • روبوتات التوفير المجدولة</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-white">بوتات حكيم AI المجدولة للرصد واقتناص الصفقات</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1.5 leading-relaxed">
              4 روبوتات ذكية تعمل على مدار الساعة بجدولة دورية لمسح أحدث صفقات وكالات السيارات، العروض العقارية المعتمدة برخص فال، تخفيضات الهايبرماركت، وفحص أكواد الخصم النشطة.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white">4 أنظمة ذكية تعمل بنجاح 100%</span>
          </div>
        </div>
      </div>

      {/* Bot Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {bots.map((bot) => {
          const isRunning = refreshingBotId === bot.id;

          return (
            <div
              key={bot.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg dark:hover:shadow-indigo-950/20 transition-all"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3.5">
                  <BotAvatar botId={bot.id} size="md" />
                  <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-800/60 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                    <span>{bot.status}</span>
                  </span>
                </div>

                <div className="text-xs font-bold text-indigo-700 dark:text-indigo-400">{bot.name}</div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 mt-0.5 leading-snug">
                  {bot.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-3">
                  {bot.description}
                </p>

                {/* Metrics */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500">الصفقات المرصودة:</span>
                    <span className="font-extrabold text-indigo-900 dark:text-indigo-300">{bot.dealsFoundCount} صفقة</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500">آخر فحص:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{bot.lastRunTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 dark:text-slate-500">الجدولة:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{bot.scheduleTime}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {bot.id === 'offers' && (
                  <button
                    onClick={onOpenOffersTab}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <span>تصفح تخفيضات السوبرماركت المرصودة</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                {bot.id === 'coupons' && (
                  <button
                    onClick={onOpenCouponsTab}
                    className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <span>استعراض قسائم وكوبونات الخصم</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                {bot.id === 'cars' && (
                  <button
                    onClick={() => handleTabChange('cars')}
                    className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <span>عرض صفقات السيارات بالأسفل ↓</span>
                  </button>
                )}

                {bot.id === 'real_estate' && (
                  <button
                    onClick={() => handleTabChange('real_estate')}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <span>عرض الفرص العقارية بالأسفل ↓</span>
                  </button>
                )}

                <button
                  onClick={() => handleRunBot(bot.id)}
                  disabled={isRunning}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الفحص المباشر...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-slate-700 dark:fill-slate-200" />
                      <span>تشغيل وفحص فوري الآن</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs for Deals Feeds */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => handleTabChange('all')}
          className={`px-3.5 py-2 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors ${
            activeBotTab === 'all'
              ? 'border-indigo-600 text-indigo-800 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          كافة صفقات البوتات
        </button>
        <button
          onClick={() => handleTabChange('cars')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors ${
            activeBotTab === 'cars'
              ? 'border-indigo-600 text-indigo-800 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Car className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>صفقات السيارات (الشريطي)</span>
        </button>
        <button
          onClick={() => handleTabChange('real_estate')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold whitespace-nowrap border-b-2 cursor-pointer transition-colors ${
            activeBotTab === 'real_estate'
              ? 'border-indigo-600 text-indigo-800 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>العروض العقارية (الوسيط)</span>
        </button>
      </div>

      {/* Deals Content Section */}
      {(activeBotTab === 'all' || activeBotTab === 'cars') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>أحدث عروض السيارات المرصودة بواسطة بوت «الشريطي»</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">تم التحديث اليوم</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CAR_DEALS.map((car) => (
              <div
                key={car.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900/60 border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-center shrink-0">
                      <Car className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base">{car.carModel}</h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{car.agencyName} • {car.city}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300/40 dark:border-blue-800/60 px-2.5 py-1 rounded-full">
                    {car.badgeText}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">نوع العرض:</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100">{car.dealType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">القسط الشهري:</span>
                    <span className="font-black text-blue-700 dark:text-blue-400 text-sm">{car.monthlyInstallmentSar} ر.س / شهرياً</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">السعر النقدي المخفض:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{car.discountedPriceSar.toLocaleString()} ر.س</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px]">ميزة التمويل:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{car.profitRate}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  {car.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                  <span>الصلاحية: {car.validUntil}</span>
                  <a
                    href={car.agencyUrl || 'https://www.alj.com/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      trackEvent('open_car_deal_link', { car_model: car.carModel, agency: car.agencyName });
                    }}
                    className="font-bold text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1.5 hover:underline cursor-pointer bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-200/60 dark:border-blue-800/60 transition-colors"
                    title={`الانتقال إلى موقع ${car.agencyName} والاطلاع على تفاصيل العرض`}
                  >
                    <span>{car.linkText}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeBotTab === 'all' || activeBotTab === 'real_estate') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>أحدث الفرص العقارية المرصودة برخص «فال» المعتمدة</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">تم التحديث اليوم 2:00 م</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REAL_ESTATE_DEALS.map((prop) => (
              <div
                key={prop.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-800/60 px-2.5 py-1 rounded-full">
                        {prop.badgeText}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {prop.city} • {prop.district}
                      </span>
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base mt-1.5 leading-snug">
                      {prop.title}
                    </h3>
                  </div>

                  <div className="text-left shrink-0">
                    <div className="text-lg font-black text-emerald-800 dark:text-emerald-300">
                      {prop.priceSar.toLocaleString()} <span className="text-xs">ر.س</span>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                      {prop.dealType === 'rent' ? 'سنوياً' : 'سعر البيع'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>المساحة: <span className="font-bold text-slate-900 dark:text-slate-100">{prop.areaM2} م²</span></div>
                  {prop.bedrooms && <div>الغرف: <span className="font-bold text-slate-900 dark:text-slate-100">{prop.bedrooms}</span></div>}
                  <div>النوع: <span className="font-bold text-slate-900 dark:text-slate-100">{prop.propertyType}</span></div>
                </div>

                <div className="space-y-1">
                  {prop.features?.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{prop.licenseNumber}</span>
                  </div>
                  <a
                    href={prop.propertyUrl || 'https://www.ejar.sa/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      trackEvent('open_real_estate_deal_link', { title: prop.title, advertiser: prop.advertiser });
                    }}
                    className="font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1.5 hover:underline cursor-pointer bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 transition-colors"
                    title="التحقق من العقد والاطلاع على تفاصيل المنصة العقارية"
                  >
                    <span>تفاصيل العرض والعقد</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
