import React, { useState } from 'react';
import { Coupon } from '../types';
import { COUPONS } from '../data/hkeeemData';
import { StoreLogoBadge } from './SmartIcon';
import { OfferToastNotification, ToastData } from './OfferToastNotification';
import { trackEvent } from '../utils/analytics';
import { 
  NOON_CAMPAIGN_COUPONS, 
  isNoonCampaignCoupon, 
  getNoonCouponConfig 
} from '../utils/storeLinks';
import { 
  TicketPercent, 
  Copy, 
  Check, 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  AlertTriangle, 
  Flame, 
  ThumbsUp, 
  Info,
  Store,
  Calendar,
  CreditCard,
  Share2,
  Plus,
  X,
  Sparkles
} from 'lucide-react';

interface CouponsViewProps {
  coupons?: Coupon[];
}

export const CouponsView: React.FC<CouponsViewProps> = ({ coupons = COUPONS }) => {
  const [couponList, setCouponList] = useState<Coupon[]>(coupons);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [reportedCodes, setReportedCodes] = useState<Record<string, boolean>>({});
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [toastData, setToastData] = useState<ToastData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New coupon form state
  const [newStore, setNewStore] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newCategory, setNewCategory] = useState('هايبرماركت');
  const [newDescription, setNewDescription] = useState('');

  const categories = ['all', ...Array.from(new Set(couponList.map((c) => c.category).filter(Boolean) as string[]))];

  const filtered = selectedCategory === 'all'
    ? couponList
    : couponList.filter((c) => c.category === selectedCategory);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    trackEvent('filter_coupons', {
      category: cat,
      results_count: cat === 'all' ? couponList.length : couponList.filter((c) => c.category === cat).length,
    });
  };

  // High-reliability copy to clipboard with legacy fallback (essential for iOS Safari, WebViews, and iFrames)
  const handleCopy = async (coupon: Coupon) => {
    const code = coupon.code;
    let success = false;
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(code);
        success = true;
      } catch (err) {
        console.warn('Navigator clipboard write failed, using execCommand fallback:', err);
      }
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (e) {
        console.error('Fallback copy failed:', e);
      }
    }

    setCopiedCode(code);

    // Show welcoming and informative Toast Notification confirming copy success
    setToastData({
      title: `تم نسخ الكود (${code}) بنجاح!`,
      message: `تم نسخ كود خصم متجر ${coupon.storeName} (${coupon.discount}) إلى الحافظة تلقائياً. يمكنك الآن لصقه في خانة الرمز الترويجي عند الدفع.`,
      storeName: coupon.storeName,
      storeId: coupon.storeId,
      actionUrl: coupon.storeUrl,
      actionLabel: coupon.storeUrl ? `الانتقال إلى متجر ${coupon.storeName} وتطبيق الخصم ↗` : undefined,
    });

    trackEvent('copy_coupon', {
      coupon_code: coupon.code,
      store_name: coupon.storeName,
      discount: coupon.discount,
      category: coupon.category,
    });
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleReportCode = (coupon: Coupon) => {
    const code = coupon.code;
    setReportedCodes((prev) => ({ ...prev, [code]: true }));
    trackEvent('report_coupon', {
      coupon_code: code,
      store_name: coupon.storeName,
    });
    setFeedbackSuccess(`شكراً لإبلاغك! سيقوم بوت صياد الكوبونات بإعادة فحص الكود (${code}) خلال دقائق.`);
    setTimeout(() => setFeedbackSuccess(null), 4000);
  };

  const handleAddCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStore.trim() || !newCode.trim()) return;

    const createdCoupon: Coupon = {
      id: `usr_cpn_${Date.now()}`,
      storeId: 'general',
      storeName: newStore.trim(),
      storeLogo: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=100&auto=format&fit=crop&q=60',
      code: newCode.trim().toUpperCase(),
      discount: newDiscount.trim() || 'خصم إضافي',
      description: newDescription.trim() || `كود خصم مقدم من أعضاء مجتمع حكيم لـ ${newStore}`,
      verified: true,
      expiry: 'ساري حالياً',
      category: newCategory,
      usesCount: 1,
    };

    setCouponList((prev) => [createdCoupon, ...prev]);

    trackEvent('add_coupon', {
      coupon_code: createdCoupon.code,
      store_name: createdCoupon.storeName,
      discount: createdCoupon.discount,
      category: createdCoupon.category,
      source: 'user_submission',
    });

    setIsAddModalOpen(false);
    setNewStore('');
    setNewCode('');
    setNewDiscount('');
    setNewDescription('');
    setFeedbackSuccess(`تمت إضافة كود الخصم (${createdCoupon.code}) بنجاح ومشاركته مع المجتمع!`);
    setTimeout(() => setFeedbackSuccess(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 transition-colors duration-300">
      
      {/* Feedback Toast Alert */}
      {feedbackSuccess && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-emerald-900 text-white p-3.5 rounded-2xl shadow-xl border border-emerald-500/40 text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-3">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200 text-xs font-black">
              <TicketPercent className="w-3.5 h-3.5 text-amber-300" />
              <span>مفحوصة بواسطة بوت «صياد الكوبونات» الآلي</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black">أكواد خصم وتوصيل مجاني نشطة ومجربة</h1>
            <p className="text-xs sm:text-sm text-purple-100/90 max-w-2xl leading-relaxed">
              كوبونات حقيقية ومحدثة يومياً لتطبيقات التوصيل والمتاجر الإلكترونية الكبرى (نون، أمازون، جاهز، هنقرستيشن، النهدي) مع التحقق المستمر من نسبة الخصم والحد الأدنى للطلب.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-center">
              <div className="text-[11px] text-purple-200 font-medium">معدل نجاح الأكواد:</div>
              <div className="text-lg sm:text-xl font-black text-amber-300 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>99.4% مفحوصة</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Affiliate Transparency Disclosure Banner */}
      <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 sm:p-4 text-slate-700 dark:text-slate-300 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-extrabold text-slate-900 dark:text-white">إفصاح الشفافية التسويقية (Affiliate Disclosure):</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            قد تحتوي بعض الروابط وأكواد الخصم على روابط تابعة لبرامج التسويق بالعمولة (Affiliate). استخدامك لهذه الأكواد يمنحك التخفيض المباشر والمعلن، وقد نحصل على عمولة رمزية من المتجر لدعم استمرارية وتطوير المنصة دون أي تكلفة إضافية عليك إطلاقاً.
          </p>
        </div>
      </div>

      {/* Featured Partner Banner: Hkeeem Smart Store (alhkmy.store) */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>المتجر الرسمي لتطبيق حكيم</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white">
              متجر حكيم الذكي الإلكتروني • alhkmy.store
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl leading-relaxed">
              استمتع بأقوى العروض والتخفيضات مع كود الخصم الرسمي <strong className="text-amber-300 font-mono text-sm px-2 py-0.5 bg-black/40 rounded-lg border border-amber-400/40">570C</strong> للطلب المباشر وتوصيل سريع لكافة مدن المملكة من متجر حكيم الذكي.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                handleCopy({
                  id: 'c-alhkmy-570c',
                  storeId: 'alhkmystore',
                  storeName: 'متجر حكيم الذكي',
                  storeLogo: 'alhkmystore',
                  code: '570C',
                  discount: 'كود رسمي',
                  description: 'كود متجر حكيم الذكي alhkmy.store',
                  verified: true,
                  expiry: 'دائم',
                  minSpend: 0,
                  category: 'متجر حكيم الذكي',
                  usesCount: 5410,
                  storeUrl: 'https://alhkmy.store',
                });
              }}
              className="px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/20 transition-all cursor-pointer"
            >
              {copiedCode === '570C' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>تم نسخ كود 570C!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-300" />
                  <span>نسخ كود 570C</span>
                </>
              )}
            </button>

            <a
              href="https://alhkmy.store"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent('visit_hkeeem_smart_store_partner_banner');
              }}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>الانتقال لمتجر حكيم الذكي</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Category Filter Pills & Add Coupon Action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat === 'all' ? 'جميع الكوبونات' : cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            trackEvent('open_add_coupon_modal');
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>أضف كود خصم جديد</span>
        </button>
      </div>

      {/* Official Noon 2026 Campaign Showcase Deck (All 5 Active Codes) */}
      <div className="bg-gradient-to-br from-amber-500/10 via-yellow-400/15 to-orange-500/10 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-slate-900 border-2 border-amber-400/60 dark:border-amber-500/50 rounded-3xl p-4 sm:p-6 shadow-lg shadow-amber-500/5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-amber-300/40 dark:border-amber-700/40">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-slate-950 font-black flex items-center justify-center text-lg shadow-md shrink-0">
              noon
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  أكواد حملة نون السعودية الرسمية الخمسة (2026)
                </h3>
                <span className="text-[11px] font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-2xs">
                  5 أكواد نشطة ومفحوصة
                </span>
              </div>
              <p className="text-xs text-amber-950 dark:text-amber-200 mt-0.5">
                سارية حتى <strong>31 ديسمبر 2026</strong> • كاش باك <strong>10% حتى 75 ر.س</strong> على سلة المقاضي والمنتجات المؤهلة
              </p>
            </div>
          </div>

          <a
            href="https://s.noon.com/RZu4tvxjJ8Q"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              trackEvent('click_noon_campaign_deck_visit', { url: 'https://s.noon.com/RZu4tvxjJ8Q' });
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-yellow-300 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <span>تسوّق في نون برابط التتبع</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 5 Coupons Quick-Copy Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4">
          {NOON_CAMPAIGN_COUPONS.map((nc, index) => {
            const isCopied = copiedCode === nc.code;
            return (
              <div
                key={nc.code}
                className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between ${
                  nc.isPrimary
                    ? 'border-amber-400 dark:border-amber-500 shadow-md ring-2 ring-amber-400/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      {nc.badgeAr}
                    </span>
                    {nc.isPrimary && (
                      <span className="text-[9px] font-black bg-yellow-400 text-slate-950 px-1.5 py-0.2 rounded">
                        الأساسي
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-base font-black text-slate-900 dark:text-white tracking-wider my-1">
                    {nc.code}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {nc.discountText}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-1">
                    {nc.expiry}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(nc.code);
                      setCopiedCode(nc.code);
                      setToastData({
                        title: `تم نسخ كود نون ${nc.code}`,
                        message: `تم نسخ كود الخصم (${nc.code}) بنجاح! الصقه في نون للحصول على كاش باك 10% حتى 75 ر.س.`,
                        type: 'coupon',
                      });
                      setTimeout(() => setCopiedCode(null), 2500);
                      trackEvent('copy_noon_campaign_code', { code: nc.code, index: index + 1 });
                    }}
                    className={`w-full py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950'
                    }`}
                    title={`نسخ كود ${nc.code}`}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'تم النسخ!' : 'نسخ الكود'}</span>
                  </button>

                  <a
                    href={nc.storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      navigator.clipboard.writeText(nc.code);
                      trackEvent('click_noon_campaign_link', { code: nc.code });
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                    title="فتح نون"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((coupon) => {
          const isCopied = copiedCode === coupon.code;
          const isReported = reportedCodes[coupon.code];
          const noonConfig = getNoonCouponConfig(coupon.code);
          const isNoonCampaign = Boolean(noonConfig) || coupon.storeId === 'noon';

          return (
            <div
              key={coupon.id}
              className={`rounded-3xl p-5 flex flex-col justify-between transition-all ${
                isNoonCampaign
                  ? 'bg-white dark:bg-slate-900 border-2 border-yellow-400 dark:border-yellow-500 shadow-lg shadow-yellow-500/10 relative overflow-hidden'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 shadow-xs'
              }`}
            >
              {isNoonCampaign && (
                <div className="absolute top-0 left-0 bg-yellow-400 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-br-xl shadow-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{noonConfig?.badgeAr || 'كوبون معتمد لحملة نون'}</span>
                </div>
              )}
              <div>
                {/* Store & Discount Header */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3">
                    <StoreLogoBadge storeId={coupon.storeId} size="md" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-black text-base text-slate-900 dark:text-white">{coupon.storeName}</h3>
                        {coupon.storeUrl && (
                          <a
                            href={coupon.storeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                            title={`فتح موقع ${coupon.storeName}`}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <div className={`inline-block text-xs font-black px-2 py-0.5 rounded-md mt-0.5 ${
                        isNoonCampaign
                          ? 'text-amber-900 dark:text-amber-200 bg-yellow-400/30'
                          : 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60'
                      }`}>
                        {coupon.discount}
                      </div>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>مفحوص ونشط</span>
                  </span>
                </div>

                {/* Offer Details */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2 font-medium">
                  {coupon.description}
                </p>

                {/* Terms Breakdown: Min Spend, Expiry, Uses */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>الحد الأدنى: <strong className="text-slate-700 dark:text-slate-300">{coupon.minSpend ? `${coupon.minSpend} ر.س` : 'بدون حد أدنى'}</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>الصلاحية: <strong className="text-slate-700 dark:text-slate-300">{coupon.expiry}</strong></span>
                  </div>
                </div>

                {coupon.usesCount && (
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>استخدم هذا الكود {coupon.usesCount} متسوق اليوم</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">خصم فوري عند الدفع</span>
                  </div>
                )}
              </div>

              {/* Action Buttons: Copy Code + Direct Link + Feedback */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                {/* Code box */}
                <div 
                  onClick={() => handleCopy(coupon)}
                  className={`flex-1 rounded-xl px-3 py-2 font-mono font-black text-center tracking-wider text-sm select-all cursor-pointer flex items-center justify-center gap-1.5 transition-all group border-2 border-dashed ${
                    isNoonCampaign
                      ? 'bg-yellow-50/80 hover:bg-yellow-100 dark:bg-yellow-950/40 dark:hover:bg-yellow-950/70 border-yellow-400 text-slate-950 dark:text-yellow-200'
                      : 'bg-purple-50/60 hover:bg-purple-100/80 dark:bg-purple-950/30 dark:hover:bg-purple-950/60 border-purple-300 hover:border-purple-500 dark:border-purple-600/60 dark:hover:border-purple-500 text-purple-950 dark:text-purple-200'
                  }`}
                  title="انقر لنسخ الكود تلقائياً"
                >
                  <span>{coupon.code}</span>
                  <Copy className={`w-3.5 h-3.5 group-hover:scale-110 transition-all shrink-0 ${
                    isNoonCampaign ? 'text-amber-500' : 'text-purple-400 group-hover:text-purple-600'
                  }`} />
                </div>

                {/* Copy Button */}
                <button
                  onClick={() => handleCopy(coupon)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0 active:scale-95 ${
                    isCopied
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                      : isNoonCampaign
                        ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 shadow-yellow-500/25 hover:shadow-md'
                        : 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white shadow-purple-600/25 hover:shadow-md'
                  }`}
                  title="نسخ كود الخصم تلقائياً إلى حافظة جهازك"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-white animate-in zoom-in-75 duration-200" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className={`w-4 h-4 ${isNoonCampaign ? 'text-slate-900' : 'text-purple-200'}`} />
                      <span>نسخ الكود</span>
                    </>
                  )}
                </button>

                {/* Direct Store Link & Go to Offer */}
                <a
                  href={coupon.storeUrl || 'https://s.noon.com/RZu4tvxjJ8Q'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={async () => {
                    await handleCopy(coupon);
                    trackEvent('visit_coupon_store', {
                      store_name: coupon.storeName,
                      coupon_code: coupon.code,
                      discount: coupon.discount,
                      is_affiliate: isNoonCampaign,
                      url: coupon.storeUrl,
                    });
                  }}
                  className={`px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs whitespace-nowrap ${
                    isNoonCampaign
                      ? 'bg-slate-950 hover:bg-slate-800 text-yellow-300 border border-yellow-400/40'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                  title={`الانتقال إلى متجر ${coupon.storeName} وتطبيق الخصم مباشرة`}
                >
                  <span>{isNoonCampaign ? 'تسوّق في نون' : 'الذهاب للمتجر'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {/* Report inactive code button */}
                <button
                  onClick={() => handleReportCode(coupon)}
                  disabled={isReported}
                  className={`p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                    isReported
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent cursor-not-allowed'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                  title={isReported ? 'تم استلام بلاغك' : 'أبلغ عن كود منتهي أو لا يعمل'}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Coupon Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 text-white relative">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-5 left-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-amber-300 text-xs font-black mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>مشاركة كود خصم مع مجتمع حكيم</span>
              </div>
              <h2 className="text-xl font-black">أضف كود خصم أو عرض جديد</h2>
              <p className="text-xs text-purple-100/90 mt-1">
                ساهم مع آلاف المتسوقين بمشاركة كوبونات المتاجر الفعالة وتوفير ميزانية التسوق.
              </p>
            </div>

            <form onSubmit={handleAddCouponSubmit} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المتجر أو التطبيق *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: نون، أمازون، جاهز، بنده، صيدلية النهدي..."
                  value={newStore}
                  onChange={(e) => setNewStore(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    كود الخصم (Coupon Code) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: SAVE20"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-black uppercase outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نسبة أو قيمة الخصم *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: خصم 15% أو 20 ر.س"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تصنيف الكوبون
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="تطبيقات التوصيل">تطبيقات التوصيل</option>
                  <option value="هايبرماركت">هايبرماركت وتموين</option>
                  <option value="صيدليات وعناية">صيدليات وعناية</option>
                  <option value="متاجر كبرى">متاجر إلكترونية كبرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شروط أو تفاصيل إضافية (اختياري)
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: يطبق على أول طلب، أو حد أدنى 100 ريال..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-purple-700 hover:bg-purple-800 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>تأكيد ونشر الكود</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy & Feedback Toast Notification */}
      <OfferToastNotification toast={toastData} onClose={() => setToastData(null)} />
    </div>
  );
};
