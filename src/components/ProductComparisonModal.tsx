import React, { useState } from 'react';
import { Product, Store, StorePriceInfo } from '../types';
import { ProductImage, StoreLogoBadge } from './SmartIcon';
import { 
  X, 
  Scale, 
  Plus, 
  Check, 
  ShoppingCart, 
  ShoppingBag,
  ExternalLink, 
  TrendingDown, 
  Award, 
  Sparkles, 
  Trash2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  Share2,
  Tag,
  ArrowRight,
  ChevronDown,
  Copy
} from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import { getDirectOfferUrl, NOON_CAMPAIGN_COUPONS } from '../utils/storeLinks';
import { StarRating, getProductRatingData } from './StarRating';

interface ProductComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparedProducts: Product[];
  allProducts: Product[];
  stores: Store[];
  onAddToCart: (product: Product) => void;
  onAddAllToCart?: (products: Product[]) => void;
  onRemoveProduct: (productId: string) => void;
  onAddProductToCompare: (product: Product) => void;
  onClearAll: () => void;
}

export const ProductComparisonModal: React.FC<ProductComparisonModalProps> = ({
  isOpen,
  onClose,
  comparedProducts,
  allProducts,
  stores,
  onAddToCart,
  onAddAllToCart,
  onRemoveProduct,
  onAddProductToCompare,
  onClearAll,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);
  const [addedAllSuccess, setAddedAllSuccess] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper to find lowest price and best store with explicit typing
  const getLowestPriceInfo = (product: Product): { price: number | null; store: Store | null; promo?: string } => {
    let minPrice = Infinity;
    let bestStore: Store | null = null;
    let promo: string | undefined;

    Object.entries(product.prices).forEach(([storeId, info]) => {
      if (info.inStock && info.priceInclVat < minPrice) {
        minPrice = info.priceInclVat;
        bestStore = stores.find((s) => s.id === storeId) || null;
        promo = info.promoTitle;
      }
    });

    return {
      price: minPrice === Infinity ? null : minPrice,
      store: bestStore,
      promo,
    };
  };

  // Find overall cheapest among compared products
  const lowestPrices = comparedProducts.map((p) => getLowestPriceInfo(p).price || Infinity);
  const minOverallPrice = Math.min(...lowestPrices);

  // Available products to add (not already selected)
  const availableToAdd = allProducts.filter(
    (p) => !comparedProducts.some((cp) => cp.id === p.id)
  );

  const filteredPickerProducts = availableToAdd.filter(
    (p) =>
      !pickerSearch.trim() ||
      p.nameAr.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(pickerSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const handleShare = () => {
    if (navigator?.clipboard?.writeText) {
      const summary = `مقارنة سلع حكيم AI: ${comparedProducts.map((p) => p.nameAr).join(' ضد ')}`;
      navigator.clipboard.writeText(`${summary} - ${window.location.href}`);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 3000);
    }
  };

  // Add all compared products to cart
  const handleAddAllToCart = () => {
    if (comparedProducts.length === 0) return;

    if (onAddAllToCart) {
      onAddAllToCart(comparedProducts);
    } else {
      comparedProducts.forEach((p) => onAddToCart(p));
    }

    trackEvent('compare_add_all_to_cart', {
      products_count: comparedProducts.length,
      product_names: comparedProducts.map((p) => p.nameAr),
    });

    setAddedAllSuccess(true);
    setTimeout(() => {
      setAddedAllSuccess(false);
    }, 2800);
  };

  // Automated smart verdict
  const generateVerdict = () => {
    if (comparedProducts.length < 2) {
      return 'أضف سلعة أخرى على الأقل لاحتساب الفروقات والتوفير الدقيق بين السلع والمتاجر.';
    }

    const sortedByPrice = [...comparedProducts].sort((a, b) => {
      const priceA = getLowestPriceInfo(a).price || 999999;
      const priceB = getLowestPriceInfo(b).price || 999999;
      return priceA - priceB;
    });

    const cheapest = sortedByPrice[0];
    const mostExpensive = sortedByPrice[sortedByPrice.length - 1];
    const cheapestPrice = getLowestPriceInfo(cheapest).price || 0;
    const mostExpensivePrice = getLowestPriceInfo(mostExpensive).price || 0;
    const diff = mostExpensivePrice - cheapestPrice;

    return `الخيار الأوفر اقتصادياً هو "${cheapest.nameAr}" بفارق توفير يبلغ ${diff.toFixed(2)} ر.س مقارنة بـ "${mostExpensive.nameAr}". مع العلم أن متجر حكيم الذكي alhkmy.store يوفر كود الخصم 570C مع كاش باك فوري.`;
  };

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shrink-0 flex items-center justify-between border-b border-indigo-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  جدول مقارنة السلع جنباً إلى جنب (Side-by-Side)
                </h2>
                <span className="text-xs font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 px-2 py-0.5 rounded-full">
                  {comparedProducts.length} من 3 سلع
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5 hidden sm:block">
                قارن الأسعار الرسمية، التوفير، توفر المتاجر والمواصفات الغذائية والذكية بوضوح
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Header Add All to Cart Button */}
            {comparedProducts.length > 0 && (
              <button
                onClick={handleAddAllToCart}
                className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  addedAllSuccess
                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
                title="إضافة كافة السلع المقارنة مباشرة إلى السلة"
              >
                {addedAllSuccess ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                <span>{addedAllSuccess ? 'تمت إضافة الكل!' : `أضف الكل للسلة (${comparedProducts.length})`}</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="مشاركة رابط المقارنة"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{copiedShare ? 'تم النسخ!' : 'مشاركة'}</span>
            </button>

            {comparedProducts.length > 0 && (
              <button
                onClick={onClearAll}
                className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-500/30"
                title="تفريغ كل المقارنة"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">مسح الكل</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Smart Verdict Box */}
          {comparedProducts.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-indigo-950/40 border border-emerald-300/60 dark:border-emerald-700/60 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs sm:text-sm">
                <strong className="text-emerald-800 dark:text-emerald-300 block mb-1 font-black">
                  خلاصة توصية حكيم الذكية:
                </strong>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {generateVerdict()}
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {comparedProducts.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-500 flex items-center justify-center mx-auto">
                <Scale className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">
                  لم يتم تحديد أي سلع للمقارنة بعد
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  اضغط على زر "قارن" الموجود على بطاقة أي سلعة في الصفحة الرئيسية أو اختر سلعة الآن لبدء المقارنة.
                </p>
              </div>
              <button
                onClick={() => setIsPickerOpen(true)}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>اختر سلعة للمقارنة الآن</span>
              </button>
            </div>
          ) : (
            /* Comparison Table / Grid */
            <div className="space-y-2">
              {/* Mobile Horizontal Swipe Hint */}
              <div className="sm:hidden flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <span>اسحب أفقياً لمشاهدة جميع الأعمدة</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-black">← تمرير →</span>
              </div>

              <div className="overflow-x-auto pb-4">
                <div className="min-w-[680px]">
                
                {/* 1. Header Cards Grid */}
                <div className="grid grid-cols-4 gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                  {/* Row Label Column */}
                  <div className="flex flex-col justify-end p-3 space-y-2">
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      السلعة والمواصفات
                    </span>
                    {/* Add All to Cart Button for whole table */}
                    <button
                      onClick={handleAddAllToCart}
                      className={`w-full py-2.5 px-3 rounded-2xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                        addedAllSuccess
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white'
                      }`}
                      title="إضافة كافة السلع المقارنة للسلة في آن واحد"
                    >
                      {addedAllSuccess ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                      <span>{addedAllSuccess ? 'تمت إضافة الكل!' : `أضف الكل (${comparedProducts.length})`}</span>
                    </button>
                  </div>

                  {/* 3 Product Columns */}
                  {[0, 1, 2].map((idx) => {
                    const product = comparedProducts[idx];

                    if (product) {
                      const lowest = getLowestPriceInfo(product);
                      const isCheapestOverall = lowest.price !== null && lowest.price === minOverallPrice;
                      const isJustAdded = lastAddedId === product.id;

                      return (
                        <div
                          key={product.id}
                          className={`relative p-4 rounded-3xl border flex flex-col justify-between transition-all bg-white dark:bg-slate-850 ${
                            isCheapestOverall
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {/* Remove button */}
                          <button
                            onClick={() => onRemoveProduct(product.id)}
                            className="absolute top-3 left-3 p-1 rounded-full bg-slate-100 hover:bg-rose-100 dark:bg-slate-700 dark:hover:bg-rose-900/60 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="إزالة من المقارنة"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          <div>
                            {/* Best Badge */}
                            {isCheapestOverall && (
                              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black mb-2 shadow-xs">
                                <Award className="w-3 h-3" />
                                <span>الأرخص سعراً</span>
                              </div>
                            )}

                            {/* Product Image */}
                            <div className="aspect-square w-full rounded-2xl bg-slate-50 dark:bg-slate-800 p-2 flex items-center justify-center mb-3 overflow-hidden">
                              <ProductImage src={product.imageUrl} alt={product.nameAr} size="lg" />
                            </div>

                            <span className="text-[10px] font-bold text-slate-400 block mb-1">
                              {product.category}
                            </span>
                            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
                              {product.nameAr}
                            </h3>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                              العبوة: <strong>{product.unit}</strong>
                            </span>
                            <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                              <StarRating 
                                rating={getProductRatingData(product).rating} 
                                reviewsCount={getProductRatingData(product).reviewsCount} 
                                size="xs" 
                              />
                            </div>
                          </div>

                          {/* Quick Column Buttons: Add This Item + Add All to Cart */}
                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            {/* Add This Product to Cart */}
                            <button
                              onClick={() => {
                                onAddToCart(product);
                                setLastAddedId(product.id);
                                setTimeout(() => setLastAddedId(null), 2000);
                              }}
                              className={`w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                                isJustAdded
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              {isJustAdded ? <Check className="w-3.5 h-3.5" /> : <ShoppingCart className="w-3.5 h-3.5" />}
                              <span>{isJustAdded ? 'تمت الإضافة!' : 'أضف هذه السلعة'}</span>
                            </button>

                            {/* ADD ALL TO CART BUTTON IN EACH COLUMN */}
                            <button
                              onClick={handleAddAllToCart}
                              className={`w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer border ${
                                addedAllSuccess
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400'
                              }`}
                              title="إضافة كافة السلع المقارنة للسلة في نفس الوقت"
                            >
                              {addedAllSuccess ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ShoppingBag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                              <span>{addedAllSuccess ? 'تمت إضافة الكل!' : `أضف الكل (${comparedProducts.length}) للسلة`}</span>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    {/* Empty Slot Card to Add Product */}
                    return (
                      <div
                        key={`empty-col-${idx}`}
                        onClick={() => setIsPickerOpen(true)}
                        className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 p-6 flex flex-col items-center justify-center text-center gap-3 cursor-pointer group transition-all min-h-[260px] bg-slate-50/50 dark:bg-slate-850/50"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 text-indigo-500 flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform">
                          <Plus className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                            + إضافة سلعة {idx + 1}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            انقر لاختيار سلعة من الكتالوج للمقارنة
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Key Metrics Rows */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  
                  {/* Lowest Price Row */}
                  <div className="grid grid-cols-4 gap-3 py-3 items-center">
                    <div className="font-bold text-slate-600 dark:text-slate-400">
                      أفضل سعر متاح:
                    </div>
                    {[0, 1, 2].map((idx) => {
                      const product = comparedProducts[idx];
                      if (!product) return <div key={idx} className="text-slate-300 dark:text-slate-700 text-center">-</div>;

                      const lowest = getLowestPriceInfo(product);
                      return (
                        <div key={product.id} className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                          <div className="font-mono text-base font-black">
                            {lowest.price ? `${lowest.price.toFixed(2)} ر.س` : 'غير متوفر'}
                          </div>
                          {lowest.store && (
                            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block mt-0.5">
                              لدى {lowest.store.name}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Customer Rating & Reviews Row */}
                  <div className="grid grid-cols-4 gap-3 py-3 items-center">
                    <div className="font-bold text-slate-600 dark:text-slate-400">
                      تقييم المشترين والنجوم:
                    </div>
                    {[0, 1, 2].map((idx) => {
                      const product = comparedProducts[idx];
                      if (!product) return <div key={idx} className="text-slate-300 dark:text-slate-700 text-center">-</div>;

                      const rData = getProductRatingData(product);
                      return (
                        <div key={product.id} className="space-y-1">
                          <StarRating rating={rData.rating} reviewsCount={rData.reviewsCount} size="sm" />
                          <span className="text-[10px] text-slate-400 block font-medium">
                            متوسط {rData.rating} من 5 نجوم
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cash Back Row */}
                  <div className="grid grid-cols-4 gap-3 py-3 items-center">
                    <div className="font-bold text-slate-600 dark:text-slate-400">
                      كاش باك فوري:
                    </div>
                    {[0, 1, 2].map((idx) => {
                      const product = comparedProducts[idx];
                      if (!product) return <div key={idx} className="text-slate-300 dark:text-slate-700 text-center">-</div>;

                      const cb = product.cashbackPercentage || 5;
                      return (
                        <div key={product.id} className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{cb}% كاش باك لمحفظتك</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* NutriScore / Health Score Row */}
                  <div className="grid grid-cols-4 gap-3 py-3 items-center">
                    <div className="font-bold text-slate-600 dark:text-slate-400">
                      التقييم الغذائي (NutriScore):
                    </div>
                    {[0, 1, 2].map((idx) => {
                      const product = comparedProducts[idx];
                      if (!product) return <div key={idx} className="text-slate-300 dark:text-slate-700 text-center">-</div>;

                      const score = product.nutrition?.nutriScore || 'A';
                      const scoreColors: Record<string, string> = {
                        A: 'bg-emerald-600 text-white',
                        B: 'bg-teal-600 text-white',
                        C: 'bg-amber-500 text-slate-950',
                        D: 'bg-orange-500 text-white',
                        E: 'bg-rose-600 text-white',
                      };

                      return (
                        <div key={product.id} className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center shadow-xs ${scoreColors[score] || 'bg-slate-500 text-white'}`}>
                            {score}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {score === 'A' ? 'صحي وممتاز' : score === 'B' ? 'جيد جداً' : 'متوسط'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Calories Row */}
                  <div className="grid grid-cols-4 gap-3 py-3 items-center">
                    <div className="font-bold text-slate-600 dark:text-slate-400">
                      السعرات الحرارية:
                    </div>
                    {[0, 1, 2].map((idx) => {
                      const product = comparedProducts[idx];
                      if (!product) return <div key={idx} className="text-slate-300 dark:text-slate-700 text-center">-</div>;

                      const cal = product.nutrition?.calories;
                      return (
                        <div key={product.id} className="font-bold text-slate-800 dark:text-slate-200">
                          {cal !== undefined ? `${cal} سعرة (${product.nutrition?.servingSize || 'لكل حصة'})` : 'غير محدد'}
                        </div>
                      );
                    })}
                  </div>

                  {/* Protein & Nutrients Row */}
                  <div className="grid grid-cols-4 gap-3 py-3 items-center">
                    <div className="font-bold text-slate-600 dark:text-slate-400">
                      البروتين والدهون:
                    </div>
                    {[0, 1, 2].map((idx) => {
                      const product = comparedProducts[idx];
                      if (!product) return <div key={idx} className="text-slate-300 dark:text-slate-700 text-center">-</div>;

                      const n = product.nutrition;
                      return (
                        <div key={product.id} className="text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5">
                          {n?.protein !== undefined && <div>بروتين: <strong>{n.protein} جم</strong></div>}
                          {n?.fat !== undefined && <div>دهون: <strong>{n.fat} جم</strong></div>}
                          {n?.sodium !== undefined && <div>صوديوم: <strong>{n.sodium} ملجم</strong></div>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Health Highlights Row */}
                  <div className="grid grid-cols-4 gap-3 py-3 items-start">
                    <div className="font-bold text-slate-600 dark:text-slate-400">
                      أبرز المميزات الصحية:
                    </div>
                    {[0, 1, 2].map((idx) => {
                      const product = comparedProducts[idx];
                      if (!product) return <div key={idx} className="text-slate-300 dark:text-slate-700 text-center">-</div>;

                      const highlights = product.nutrition?.healthHighlights || ['منتج عالي الجودة ومعتمد'];
                      return (
                        <div key={product.id} className="space-y-1">
                          {highlights.map((h, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* Section Title: Store Prices Breakdown */}
                  <div className="py-3 bg-slate-50 dark:bg-slate-800/60 -mx-4 px-4 font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-indigo-500" />
                    <span>مقارنة الأسعار التفصيلية في كافة المتاجر:</span>
                  </div>

                  {/* Store-by-Store Matrix */}
                  {stores.map((store) => {
                    const isNoon = store.id === 'noon' || store.id.toLowerCase().includes('noon');
                    return (
                      <div key={store.id} className={`grid grid-cols-4 gap-3 py-2.5 items-center transition-colors rounded-xl px-1.5 ${
                        isNoon 
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300/40 dark:border-amber-800/40 my-1' 
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                      }`}>
                        <div className="flex items-center gap-2">
                          <StoreLogoBadge storeId={store.id} size="sm" />
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                              {store.name}
                            </span>
                            {isNoon ? (
                              <div className="flex items-center gap-1 mt-1 flex-wrap max-w-[190px]">
                                {NOON_CAMPAIGN_COUPONS.map((nc) => {
                                  const isCopied = copiedCouponCode === nc.code;
                                  return (
                                    <button
                                      key={nc.code}
                                      type="button"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          await navigator.clipboard.writeText(nc.code);
                                          setCopiedCouponCode(nc.code);
                                          setTimeout(() => setCopiedCouponCode(null), 2000);
                                        } catch {}
                                      }}
                                      className={`inline-flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 rounded shadow-2xs cursor-pointer active:scale-95 transition-all ${
                                        isCopied
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950'
                                      }`}
                                      title={`نسخ كود نون ${nc.code} (كاش باك 10% حتى 75 ر.س)`}
                                    >
                                      <span>{isCopied ? 'تم!' : nc.code}</span>
                                      {isCopied ? <Check className="w-2 h-2" /> : <Copy className="w-2 h-2" />}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400">
                                {store.deliveryTime}
                              </span>
                            )}
                          </div>
                        </div>

                        {[0, 1, 2].map((idx) => {
                          const product = comparedProducts[idx];
                          if (!product) return <div key={idx} className="text-slate-300 dark:text-slate-700 text-center">-</div>;

                          const priceInfo = product.prices[store.id];

                          if (!priceInfo || !priceInfo.inStock) {
                            return (
                              <div key={product.id} className="text-slate-400 text-[11px]">
                                غير متوفر حالياً
                              </div>
                            );
                          }

                          const lowest = getLowestPriceInfo(product);
                          const isCheapestStoreForProduct = lowest.price === priceInfo.priceInclVat;

                          return (
                            <div key={product.id} className="flex items-center justify-between gap-1">
                              <div>
                                <span className={`font-mono font-bold ${isCheapestStoreForProduct ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {priceInfo.priceInclVat.toFixed(2)} ر.س
                                </span>
                                {priceInfo.isPromo && (
                                  <span className="block text-[9px] text-amber-600 dark:text-amber-400 font-bold">
                                    تخفيض ترويجي
                                  </span>
                                )}
                              </div>

                              <a
                                href={getDirectOfferUrl(store, product, priceInfo)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={async () => {
                                  if (isNoon) {
                                    try {
                                      await navigator.clipboard.writeText('HKEEEM2');
                                    } catch {}
                                  }
                                  trackEvent('click_compare_store_link', {
                                    store_id: store.id,
                                    product_id: product.id,
                                    coupon: isNoon ? 'HKEEEM2' : undefined,
                                  });
                                }}
                                className={`p-1 rounded-md transition-colors ${
                                  isNoon
                                    ? 'bg-yellow-400 text-slate-950 hover:bg-yellow-300 shadow-2xs'
                                    : 'bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-950 text-slate-500 hover:text-emerald-700'
                                }`}
                                title={`فتح السلعة في ${store.name}${isNoon ? ' (تطبيق كود HKEEEM2)' : ''}`}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* BOTTOM ACTION ROW IN TABLE WITH 'ADD ALL TO CART' IN EACH COLUMN */}
                  <div className="grid grid-cols-4 gap-3 py-4 items-center bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl p-2 mt-4">
                    <div className="font-black text-slate-800 dark:text-slate-200">
                      إجراءات السلة السريعة:
                    </div>
                    {[0, 1, 2].map((idx) => {
                      const product = comparedProducts[idx];
                      if (!product) return <div key={idx} className="text-slate-300 dark:text-slate-700 text-center">-</div>;

                      return (
                        <div key={product.id} className="space-y-1.5">
                          <button
                            onClick={handleAddAllToCart}
                            className={`w-full py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer ${
                              addedAllSuccess
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                            }`}
                            title="إضافة كافة السلع المقارنة للسلة"
                          >
                            {addedAllSuccess ? <Check className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                            <span>{addedAllSuccess ? 'تمت إضافة الكل!' : `أضف الكل (${comparedProducts.length}) للسلة`}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {comparedProducts.length === 3 
              ? 'تم استيفاء الحد الأقصى للمقارنة (3 سلع)' 
              : `يمكنك إضافة ${3 - comparedProducts.length} سلع إضافية للمقارنة`}
          </div>

          <div className="flex items-center gap-2">
            {comparedProducts.length > 0 && (
              <button
                onClick={handleAddAllToCart}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  addedAllSuccess
                    ? 'bg-emerald-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {addedAllSuccess ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                <span>{addedAllSuccess ? 'تمت إضافة الكل!' : `أضف كل السلع للسلة (${comparedProducts.length})`}</span>
              </button>
            )}

            {comparedProducts.length < 3 && (
              <button
                onClick={() => setIsPickerOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سلعة للمقارنة</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>

      {/* In-Modal Product Picker Dropdown / Submodal */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-500" />
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  اختر سلعة لإضافتها إلى المقارنة
                </h4>
              </div>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Box */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ابحث عن سلعة لإضافتها للمقارنة..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Products List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredPickerProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  لا توجد سلع أخرى مطابقة
                </div>
              ) : (
                filteredPickerProducts.map((p) => {
                  const lowest = getLowestPriceInfo(p);
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onAddProductToCompare(p);
                        setIsPickerOpen(false);
                        setPickerSearch('');
                      }}
                      className="p-2.5 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-300 flex items-center justify-between cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 p-1 shrink-0">
                          <ProductImage src={p.imageUrl} alt={p.nameAr} size="xs" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
                            {p.nameAr}
                          </h5>
                          <span className="text-[10px] text-slate-400">
                            {p.category} • {p.unit}
                          </span>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        {lowest.price && (
                          <span className="text-xs font-mono font-black text-emerald-600 block">
                            {lowest.price.toFixed(2)} ر.س
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                          + إضافة
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
