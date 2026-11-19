import React, { useState } from 'react';
import { Product, Store, StorePriceInfo } from '../types';
import { ProductImage, StoreLogoBadge } from './SmartIcon';
import { getMarketPriceStats } from '../utils/marketPrice';
import { getDirectOfferUrl, NOON_AFFILIATE_CONFIG } from '../utils/storeLinks';
import { trackEvent } from '../utils/analytics';
import { 
  X, 
  Scale, 
  TrendingDown, 
  Sparkles, 
  ShoppingCart, 
  ExternalLink, 
  Check, 
  Copy, 
  Clock, 
  ShieldCheck, 
  Tag, 
  ArrowUpRight,
  Info,
  CheckCircle2,
  Percent
} from 'lucide-react';

interface StorePriceComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  stores: Store[];
  onAddToCart: (product: Product, storeId?: string) => void;
  onOpenStoreOffer?: (product: Product, store: Store, priceInfo: StorePriceInfo) => void;
}

export const StorePriceComparisonModal: React.FC<StorePriceComparisonModalProps> = ({
  isOpen,
  onClose,
  product,
  stores,
  onAddToCart,
  onOpenStoreOffer,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [addedStoreId, setAddedStoreId] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const stats = getMarketPriceStats(product, stores);
  const { minPrice, minStore, avgPrice, maxPrice, savingsVsAvg, savingsPercentVsAvg, storePrices } = stats;

  const handleCopyNoonCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      trackEvent('copy_coupon_comparison_modal', { code });
    } catch {}
  };

  const handleAddFromStore = (storeId?: string) => {
    onAddToCart(product);
    setAddedStoreId(storeId || 'lowest');
    setTimeout(() => setAddedStoreId(null), 2000);
    trackEvent('add_to_cart_from_comparison', {
      product_id: product.id,
      store_id: storeId || minStore?.id,
      price: minPrice,
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Container: Styled as Native iPhone Bottom-Sheet on Mobile & Centered Dialog on Desktop */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-slate-200/90 dark:border-slate-800 max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
      >
        {/* iOS Drag Handle Grabber (Visible on Mobile) */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-4 sm:px-6 pt-2 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                مقارنة أسعار المتاجر بمتوسط السوق
              </h2>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block truncate">
                فحص مباشر في كافة منافذ البيع بالمملكة
              </span>
            </div>
          </div>

          {/* iOS Rounded Dismiss Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors active:scale-90 cursor-pointer shrink-0"
            title="إغلاق النافذة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body with iOS Inertia Scrolling */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 text-right no-scrollbar">
          {/* Product Summary Header Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850/70 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center border border-slate-200/60 dark:border-slate-700 shrink-0 shadow-2xs">
              <ProductImage src={product.imageUrl} alt={product.nameAr} size="md" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                  {product.category}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  العبوة: {product.unit}
                </span>
              </div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white mt-1 leading-snug truncate">
                {product.nameAr}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {product.nameEn}
              </p>
            </div>
          </div>

          {/* Key Market Comparison Metrics: 3 iOS Cards */}
          <div className="grid grid-cols-3 gap-2">
            {/* Card 1: Best Price Currently */}
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 dark:from-emerald-950/40 dark:to-slate-900 border border-emerald-400/50 dark:border-emerald-600/50 shadow-2xs text-center flex flex-col justify-between">
              <div className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-0.5">
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>أفضل سعر حالياً</span>
              </div>
              <div className="mt-1 font-mono text-base sm:text-lg font-black text-emerald-800 dark:text-emerald-200">
                {minPrice.toFixed(2)} <span className="text-[9px] font-sans font-bold">ر.س</span>
              </div>
              <div className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {minStore?.name || 'أقل متجر'}
              </div>
            </div>

            {/* Card 2: Market Average Price */}
            <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-2xs text-center flex flex-col justify-between">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-0.5">
                <Info className="w-3 h-3 text-slate-400" />
                <span>متوسط السوق</span>
              </div>
              <div className="mt-1 font-mono text-base sm:text-lg font-black text-slate-700 dark:text-slate-300">
                {avgPrice.toFixed(2)} <span className="text-[9px] font-sans font-bold">ر.س</span>
              </div>
              <div className="text-[9px] font-bold text-slate-400 truncate mt-0.5">
                عبر {stats.availableStoresCount} متاجر
              </div>
            </div>

            {/* Card 3: Savings vs Average */}
            <div className="p-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-400/50 dark:border-amber-600/50 shadow-2xs text-center flex flex-col justify-between">
              <div className="text-[10px] font-black text-amber-800 dark:text-amber-300 flex items-center justify-center gap-0.5">
                <TrendingDown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>وفرك عن المتوسط</span>
              </div>
              <div className="mt-1 font-mono text-base sm:text-lg font-black text-amber-700 dark:text-amber-300">
                {savingsVsAvg > 0 ? `-${savingsVsAvg.toFixed(2)}` : '0.00'}{' '}
                <span className="text-[9px] font-sans font-bold">ر.س</span>
              </div>
              <div className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 truncate mt-0.5">
                {savingsPercentVsAvg > 0 ? `أقل بـ ${savingsPercentVsAvg}%` : 'سعر موحد'}
              </div>
            </div>
          </div>

          {/* Visual Market Price Spectrum Bar */}
          <div className="p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-300/30 dark:border-emerald-800/30 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Percent className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>توزيع أسعار السوق للسلعة:</span>
              </span>
              <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">
                أفضل فرصة شراء: {minPrice.toFixed(2)} ر.س
              </span>
            </div>
            
            {/* Visual Bar */}
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex relative">
              <div className="w-1/3 bg-emerald-500 flex items-center justify-center text-[8px] text-white font-black">
                الأرخص
              </div>
              <div className="w-1/3 bg-amber-400 flex items-center justify-center text-[8px] text-slate-950 font-black">
                المتوسط
              </div>
              <div className="w-1/3 bg-rose-400 flex items-center justify-center text-[8px] text-white font-black">
                الأعلى
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">الأدنى: {minPrice.toFixed(2)} ر.س</span>
              <span className="text-amber-800 dark:text-amber-300 font-bold">المتوسط: {avgPrice.toFixed(2)} ر.س</span>
              <span className="text-rose-700 dark:text-rose-400 font-bold">الأعلى: {maxPrice.toFixed(2)} ر.س</span>
            </div>
          </div>

          {/* Store-by-Store Detailed Price List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>قائمة الأسعار المباشرة في المتاجر ({storePrices.length} متاجر متوفرة):</span>
              <span className="text-[10px] text-slate-400">مرتبة من الأقل سعراً</span>
            </div>

            <div className="space-y-2">
              {storePrices.map((sp) => {
                const isNoon = sp.store.id === 'noon' || sp.store.id.includes('noon');
                const isAlhkmy = sp.store.id.includes('alhkmy');
                const isLowest = sp.isLowest;

                return (
                  <div
                    key={sp.store.id}
                    className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      isLowest
                        ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-transparent border-emerald-400 dark:border-emerald-600/70 shadow-xs'
                        : 'bg-white dark:bg-slate-850/80 border-slate-200/90 dark:border-slate-800'
                    }`}
                  >
                    {/* Store Info Row */}
                    <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <StoreLogoBadge storeId={sp.store.id} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                              {sp.store.name}
                            </span>
                            {isLowest && (
                              <span className="text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.2 rounded-md shadow-2xs">
                                الأرخص بالسوق ★
                              </span>
                            )}
                            {sp.priceInfo.isPromo && (
                              <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-md shadow-2xs">
                                عرض ترويجي
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>توصيل: {sp.store.deliveryTime}</span>
                          </div>
                        </div>
                      </div>

                      {/* On Mobile: Price is on the top right */}
                      <div className="sm:hidden text-left shrink-0">
                        {sp.priceInfo.originalPrice && sp.priceInfo.originalPrice > sp.price && (
                          <div className="text-[10px] text-slate-400 line-through font-mono">
                            {sp.priceInfo.originalPrice.toFixed(2)} ر.س
                          </div>
                        )}
                        <div className="font-mono text-sm font-black text-slate-900 dark:text-white">
                          {sp.price.toFixed(2)} <span className="text-[9px] font-sans font-bold">ر.س</span>
                        </div>
                      </div>
                    </div>

                    {/* Comparison Pill vs Average & Store Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* Comparison vs Market Average Indicator */}
                      <div className="text-right">
                        {sp.diffFromAvg < 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-300/50">
                            <TrendingDown className="w-2.5 h-2.5" />
                            <span>أقل بـ {Math.abs(sp.diffFromAvg).toFixed(2)} ر.س ({Math.abs(sp.diffPercent)}%)</span>
                          </span>
                        ) : sp.diffFromAvg > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                            <span>أعلى بـ {sp.diffFromAvg.toFixed(2)} ر.س (+{sp.diffPercent}%)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">مطابق لمتوسط السوق</span>
                        )}
                      </div>

                      {/* Desktop Price */}
                      <div className="hidden sm:block text-left min-w-[70px]">
                        {sp.priceInfo.originalPrice && sp.priceInfo.originalPrice > sp.price && (
                          <div className="text-[10px] text-slate-400 line-through font-mono">
                            {sp.priceInfo.originalPrice.toFixed(2)} ر.س
                          </div>
                        )}
                        <div className="font-mono text-sm font-black text-slate-900 dark:text-white">
                          {sp.price.toFixed(2)} <span className="text-[9px] font-sans font-bold">ر.س</span>
                        </div>
                      </div>

                      {/* Quick Add or Link */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isNoon && (
                          <button
                            type="button"
                            onClick={() => handleCopyNoonCode('HKEEEM2')}
                            className="px-2 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-[10px] font-black flex items-center gap-1 active:scale-95 transition-all shadow-2xs cursor-pointer"
                            title="نسخ كود خصم نون HKEEEM2"
                          >
                            <span>{copiedCode === 'HKEEEM2' ? 'تم النسخ!' : 'كود HKEEEM2'}</span>
                            {copiedCode === 'HKEEEM2' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleAddFromStore(sp.store.id)}
                          className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95 shadow-xs ${
                            addedStoreId === sp.store.id
                              ? 'bg-emerald-700 text-white'
                              : isLowest
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                          title={`إضافة من ${sp.store.name} بسعر ${sp.price.toFixed(2)} ر.س`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span className="text-[11px] sm:hidden">أضف</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Bottom iOS Sticky Action Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-850/90 border-t border-slate-200 dark:border-slate-800 shrink-0 pb-6 sm:pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddFromStore(minStore?.id)}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>
                {addedStoreId === (minStore?.id || 'lowest')
                  ? 'تمت الإضافة للسلة بنجاح!'
                  : `أضف للسلة بأفضل سعر (${minPrice.toFixed(2)} ر.س من ${minStore?.name || 'الأرخص'})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
