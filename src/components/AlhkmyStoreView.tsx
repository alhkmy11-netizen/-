import React, { useState } from 'react';
import { Product, Store, StorePriceInfo } from '../types';
import { ProductImage, StoreLogoBadge } from './SmartIcon';
import { 
  ShoppingBag, 
  ShoppingCart, 
  ExternalLink, 
  Sparkles, 
  Tag, 
  ShieldCheck, 
  Copy, 
  Check, 
  Truck, 
  CreditCard, 
  Search,
  Flame,
  Award,
  ArrowRight,
  TrendingDown,
  Gift
} from 'lucide-react';
import { getDirectOfferUrl } from '../utils/storeLinks';
import { trackEvent } from '../utils/analytics';

interface AlhkmyStoreViewProps {
  products: Product[];
  store: Store;
  onAddToCart: (product: Product) => void;
  onOpenOfferModal?: (product: Product, store: Store, priceInfo?: StorePriceInfo) => void;
}

export const AlhkmyStoreView: React.FC<AlhkmyStoreViewProps> = ({
  products,
  store,
  onAddToCart,
  onOpenOfferModal,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [addedItemIds, setAddedItemIds] = useState<string[]>([]);

  // Products available in alhkmy.store
  const alhkmyProducts = products.filter((p) => {
    const priceInfo = p.prices[store.id] || p.prices['alhkmystore'] || p.prices['alhkmy'];
    return !!priceInfo && priceInfo.inStock;
  });

  const categories = ['all', ...Array.from(new Set(alhkmyProducts.map((p) => p.category)))];

  const filteredProducts = alhkmyProducts.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCopyCode = (code: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      trackEvent('copy_coupon_code', { coupon_code: code, store: 'alhkmy.store' });
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  const handleAdd = (product: Product) => {
    onAddToCart(product);
    setAddedItemIds((prev) => [...prev, product.id]);
    setTimeout(() => {
      setAddedItemIds((prev) => prev.filter((id) => id !== product.id));
    }, 2000);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 md:pb-12" dir="rtl">
      {/* Flagship Hero Banner */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 text-white p-5 sm:p-8 relative overflow-hidden border border-emerald-500/30 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>المتجر الرقمي الرسمي المعتمد • alhkmy.store</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black">
              <Award className="w-3 h-3 text-amber-400" />
              <span>أقل سعر مضمون + كاش باك فوري</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            تسوق مباشر من متجر حكيم الذكي
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium max-w-2xl">
            استمتع بأسعار الجملة المخفضة، وكاش باك فوري يضاف تلقائياً لرصيدك مع كل طلب، وشحن سريع لجميع مدن ومحافظات المملكة العربية السعودية.
          </p>

          {/* Interactive Coupon Box 570C */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-amber-400/40 rounded-2xl p-2 px-3 shadow-inner">
              <div className="text-right">
                <span className="text-[10px] text-amber-300 font-bold block">كود الخصم الرسمي الفعال:</span>
                <span className="text-base sm:text-lg font-mono font-black text-amber-400 tracking-wider">
                  570C
                </span>
              </div>
              <button
                onClick={() => handleCopyCode('570C')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                  copiedCode === '570C'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                }`}
                title="نسخ كود الخصم 570C لاستخدامه في الشراء المباشر"
              >
                {copiedCode === '570C' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode === '570C' ? 'تم النسخ!' : 'نسخ الكود'}</span>
              </button>
            </div>

            <a
              href="https://alhkmy.store"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm inline-flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-emerald-500/25"
            >
              <span>فتح المتجر المباشر alhkmy.store</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Decorative blur rings */}
        <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/3 w-48 h-48 rounded-full bg-amber-400/15 blur-2xl pointer-events-none" />
      </div>

      {/* Trust & Benefits Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-2.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">شحن سريع ومجاني</h4>
            <p className="text-[10px] text-slate-400">عند الطلب بـ 99 ر.س وأكثر</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-2.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">كاش باك فوري</h4>
            <p className="text-[10px] text-slate-400">يصل حتى 15% لمحفظتك</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-2.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">أصلي ومضمون 100%</h4>
            <p className="text-[10px] text-slate-400">منتجات معتمدة ومفحوصة</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 flex items-center gap-2.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white">طرق دفع آمنة</h4>
            <p className="text-[10px] text-slate-400">Apple Pay، مدى، تمارا</p>
          </div>
        </div>
      </div>

      {/* Internal Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث في منتجات متجر حكيم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold self-end sm:self-center">
            يعرض <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{filteredProducts.length}</span> من عروض alhkmy.store
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-t border-slate-100 dark:border-slate-800 pt-2.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'all' ? 'كافة السلع والعروض' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Products in Alhkmy Store */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <Search className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">لا توجد سلع مطابقة للبحث</h3>
          <p className="text-xs text-slate-500">جرب البحث بكلمة أخرى أو اختر تصنيفاً مختلفاً.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const priceInfo = product.prices[store.id] || product.prices['alhkmystore'] || product.prices['alhkmy'];
            const price = priceInfo?.priceInclVat || 25.0;
            const origPrice = priceInfo?.originalPrice || (priceInfo?.isPromo ? price * 1.25 : undefined);
            const savings = origPrice ? origPrice - price : 0;
            const cashback = product.cashbackPercentage || 8;
            const isJustAdded = addedItemIds.includes(product.id);

            return (
              <div
                key={product.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800/90 hover:border-emerald-500/70 dark:hover:border-emerald-500/70 p-4 flex flex-col justify-between hover:shadow-xl transition-all shadow-xs group"
              >
                <div>
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50">
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                      <span>كاش باك {cashback}%</span>
                    </span>

                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                      <span>كود 570C</span>
                    </span>
                  </div>

                  {/* Product visual & details */}
                  <div className="flex items-start gap-3 my-2">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-800 p-2 shrink-0 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-700/60">
                      <ProductImage src={product.imageUrl} alt={product.nameAr} size="md" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400 font-bold block">{product.category}</span>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug line-clamp-2 mt-0.5 group-hover:text-emerald-600 transition-colors">
                        {product.nameAr}
                      </h3>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{product.nameEn}</p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                        العبوة: <strong className="text-slate-700 dark:text-slate-300">{product.unit}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Pricing Box */}
                  <div className="p-2.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold block">
                        سعر متجر حكيم الذكي:
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono">
                          {price.toFixed(2)} ر.س
                        </span>
                        {origPrice && (
                          <span className="text-xs text-slate-400 line-through font-mono">
                            {origPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {savings > 0 && (
                      <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                        وفر {savings.toFixed(2)} ر.س
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAdd(product)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                        isJustAdded
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {isJustAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                      <span>{isJustAdded ? 'تمت الإضافة للسلة!' : 'أضف لسلة حكيم'}</span>
                    </button>

                    <a
                      href={getDirectOfferUrl(store, product, priceInfo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-600 dark:text-slate-300 hover:text-emerald-700 transition-colors"
                      title="شراء فوري مباشر من alhkmy.store"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <a
                    href={`https://alhkmy.store/search?q=${encodeURIComponent(product.nameAr)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center text-[10px] text-slate-400 hover:text-emerald-600 flex items-center justify-center gap-1 font-bold pt-1 transition-colors"
                  >
                    <span>عرض التفاصيل في alhkmy.store</span>
                    <ArrowRight className="w-2.5 h-2.5 rotate-180" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Direct Order Bottom Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 dark:bg-slate-850 text-white border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white">
              هل تود إتمام طلبك مباشرة عبر الموقع الرسمي؟
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              استخدم كود <strong>570C</strong> عند الدفع في alhkmy.store للاستفادة من أقصى نسبة خصم وتوفير.
            </p>
          </div>
        </div>

        <a
          href="https://alhkmy.store"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs inline-flex items-center gap-2 transition-transform active:scale-95 shrink-0 shadow-md"
        >
          <span>الانتقال إلى alhkmy.store</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
