import React, { useMemo, useState } from 'react';
import { CartItem, PastOrder, Product, Store } from '../types';
import {
  computePersonalizedRecommendations,
  RecommendationMode,
} from '../utils/recommendationsEngine';
import { ProductImage, StoreLogoBadge } from './SmartIcon';
import { StarRating, getProductRatingData } from './StarRating';
import {
  ShoppingCart,
  Plus,
  RotateCcw,
  X,
  Scale,
  History,
  Eye,
  TrendingDown,
  SlidersHorizontal,
  ArrowLeft,
} from 'lucide-react';

interface PersonalizedRecommendationsSectionProps {
  products: Product[];
  stores: Store[];
  pastOrders: PastOrder[];
  recentlyViewedIds: string[];
  cart: CartItem[];
  cartItemQuantities: Record<string, number>;
  onAddToCart: (product: Product) => void;
  onOpenOfferModal: (product: Product, store: Store) => void;
  onOpenStoreComparison: (product: Product) => void;
  onRecordView: (productId: string) => void;
  onOpenHistory?: () => void;
}

const DISMISSED_STORAGE_KEY = 'hkeeem_dismissed_recommendations';

const MODE_OPTIONS: { id: RecommendationMode; labelAr: string }[] = [
  { id: 'all', labelAr: 'الكل لك' },
  { id: 'history', labelAr: 'من سجل مشترياتك' },
  { id: 'views', labelAr: 'حسب مشاهداتك' },
  { id: 'deals', labelAr: 'أعلى توفير لفئاتك' },
];

export const PersonalizedRecommendationsSection: React.FC<
  PersonalizedRecommendationsSectionProps
> = ({
  products,
  stores,
  pastOrders,
  recentlyViewedIds,
  cart,
  cartItemQuantities,
  onAddToCart,
  onOpenOfferModal,
  onOpenStoreComparison,
  onRecordView,
  onOpenHistory,
}) => {
  const [mode, setMode] = useState<RecommendationMode>('all');
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(DISMISSED_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  const handleDismiss = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => {
      const next = prev.includes(productId) ? prev : [...prev, productId];
      try {
        localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const handleResetDismissed = () => {
    setDismissedIds([]);
    try {
      localStorage.removeItem(DISMISSED_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  };

  const { recommendations, profile } = useMemo(
    () =>
      computePersonalizedRecommendations({
        products,
        stores,
        pastOrders,
        recentlyViewedIds,
        cart,
        dismissedIds,
        mode,
        limit: 4,
      }),
    [products, stores, pastOrders, recentlyViewedIds, cart, dismissedIds, mode]
  );

  const getReasonMeta = (reasonType: string) => {
    switch (reasonType) {
      case 'restock':
        return {
          icon: <History className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />,
          textClass: 'text-emerald-800 dark:text-emerald-300',
        };
      case 'history':
        return {
          icon: <History className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />,
          textClass: 'text-teal-800 dark:text-teal-300',
        };
      case 'views':
        return {
          icon: <Eye className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />,
          textClass: 'text-amber-800 dark:text-amber-300',
        };
      default:
        return {
          icon: <TrendingDown className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />,
          textClass: 'text-emerald-800 dark:text-emerald-300',
        };
    }
  };

  return (
    <section
      aria-labelledby="personalized-recommendations-heading"
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 transition-colors"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2
              id="personalized-recommendations-heading"
              className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight"
            >
              توصيات مخصصة لك
            </h2>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
              Personalized Recommendations
            </span>
          </div>

          {/* Clean unboxed inline analysis metadata (no pill clutter) */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="tabular-nums">
              تحليل محلي لـ <strong className="font-semibold text-slate-700 dark:text-slate-200">{profile.ordersAnalyzed}</strong> طلبات سابقة
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              <strong className="font-semibold text-slate-700 dark:text-slate-200">{profile.viewsAnalyzed}</strong> مشاهدات أخيرة
            </span>
            {profile.topCategories.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate max-w-md">
                  أبرز اهتماماتك: <strong className="font-semibold text-slate-700 dark:text-slate-200">{profile.topCategories.join('، ')}</strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Interactive Mode Segmented Control & Utility Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            role="tablist"
            aria-label="تصفية التوصيات المخصصة"
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto no-scrollbar"
          >
            {MODE_OPTIONS.map((opt) => {
              const isActive = mode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setMode(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {opt.labelAr}
                </button>
              );
            })}
          </div>

          {dismissedIds.length > 0 && (
            <button
              type="button"
              onClick={handleResetDismissed}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              title="استعادة التوصيات التي تم إخفاؤها"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة المخفي ({dismissedIds.length})</span>
            </button>
          )}

          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>سجل مشترياتك</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Recommendations Grid or Empty State */}
      {recommendations.length === 0 ? (
        <div className="py-10 text-center space-y-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            تم إخفاء جميع التوصيات الحالية
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            يمكنك استعادة القائمة المخفية أو تصفح المزيد من السلع لتحديث التوصيات تلقائياً.
          </p>
          <button
            type="button"
            onClick={handleResetDismissed}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            استعادة التوصيات المخصصة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {recommendations.map((rec) => {
            const { product, minPrice, avgPrice, minStore, savingsPercentVsAvg, reasonTextAr } =
              rec;
            const quantity = cartItemQuantities[product.id] || 0;
            const ratingData = getProductRatingData(product);
            const reasonMeta = getReasonMeta(rec.reasonType);

            return (
              <article
                key={`rec-${product.id}`}
                onClick={() => {
                  onRecordView(product.id);
                  onOpenOfferModal(product, minStore || stores[0]);
                }}
                className="group relative bg-slate-50/70 dark:bg-slate-950/50 hover:bg-white dark:hover:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/50 p-3.5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              >
                {/* Subtle Dismiss Button */}
                <button
                  type="button"
                  onClick={(e) => handleDismiss(product.id, e)}
                  className="absolute top-2.5 left-2.5 w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center justify-center transition-colors z-10 cursor-pointer"
                  aria-label={`إخفاء توصية ${product.nameAr}`}
                  title="غير مهتم بهذا الاقتراح"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div>
                  {/* Product Visual Frame */}
                  <div className="aspect-[4/3] w-full rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-3 flex items-center justify-center mb-3 overflow-hidden">
                    <ProductImage
                      src={product.imageUrl}
                      alt={product.nameAr}
                      size="md"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>

                  {/* Clean Metadata Line (Zero-Pill Discipline) */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    <span className="truncate">{product.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{product.unit}</span>
                  </div>

                  {/* Product Name */}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {product.nameAr}
                  </h3>

                  {/* Rating Row */}
                  <div className="mt-1.5">
                    <StarRating
                      rating={ratingData.rating}
                      reviewsCount={ratingData.reviewsCount}
                      size="xs"
                    />
                  </div>

                  {/* Personalized Algorithm Reason */}
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 flex items-start gap-1.5">
                    {reasonMeta.icon}
                    <p className={`text-[11px] font-medium leading-relaxed line-clamp-2 ${reasonMeta.textClass}`}>
                      {reasonTextAr}
                    </p>
                  </div>
                </div>

                {/* Price & Action Footer */}
                <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {minStore && <StoreLogoBadge storeId={minStore.id} size="xs" />}
                        <span className="truncate">{minStore?.name || 'أقل سعر'}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-0.5 font-mono tabular-nums">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">
                          {minPrice.toFixed(2)}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          ر.س
                        </span>
                        {savingsPercentVsAvg > 0 && avgPrice > minPrice && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 line-through">
                            {avgPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {savingsPercentVsAvg > 0 && (
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums whitespace-nowrap shrink-0">
                        وفر {savingsPercentVsAvg}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {quantity === 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRecordView(product.id);
                          onAddToCart(product);
                        }}
                        className="flex-1 py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                        <span>أضف للسلة</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRecordView(product.id);
                          onAddToCart(product);
                        }}
                        className="flex-1 py-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap tabular-nums"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        <span>في السلة ({quantity})</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenStoreComparison(product);
                      }}
                      className="py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="مقارنة أسعار المتاجر"
                      aria-label={`مقارنة أسعار ${product.nameAr}`}
                    >
                      <Scale className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
