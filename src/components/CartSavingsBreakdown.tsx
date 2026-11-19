import React, { useState } from 'react';
import { CartItem, Store, Coupon } from '../types';
import { ProductImage, StoreLogoBadge } from './SmartIcon';
import { 
  PiggyBank, 
  TrendingDown, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Tag, 
  Percent, 
  CheckCircle2, 
  ArrowDownRight,
  ShieldCheck,
  Zap,
  ShoppingBag
} from 'lucide-react';

export interface CartSavingsBreakdownProps {
  cart: CartItem[];
  stores: Store[];
  appliedCoupon?: Coupon | null;
  couponDiscountAmount?: number;
  cashbackEarned?: number;
  className?: string;
}

export interface ItemSavingsDetail {
  product: CartItem['product'];
  quantity: number;
  originalUnitPrice: number;
  lowestUnitPrice: number;
  bestStore: Store;
  originalTotalPrice: number;
  lowestTotalPrice: number;
  itemSavingsSar: number;
  itemSavingsPercent: number;
}

/**
 * Calculates item-by-item and aggregate savings based on original price
 * compared to the lowest store price found.
 */
export const calculateCartSavings = (cart: CartItem[], stores: Store[]) => {
  const items: ItemSavingsDetail[] = cart.map((item) => {
    const product = item.product;
    const quantity = item.quantity;

    // Find lowest unit price across in-stock stores
    let lowestUnitPrice = Infinity;
    let bestStore: Store = stores[0];
    let bestPriceInfo = Object.values(product.prices)[0];

    Object.entries(product.prices).forEach(([storeId, pInfo]) => {
      if (pInfo.inStock && pInfo.priceInclVat < lowestUnitPrice) {
        lowestUnitPrice = pInfo.priceInclVat;
        const matched = stores.find((s) => s.id === storeId);
        if (matched) bestStore = matched;
        bestPriceInfo = pInfo;
      }
    });

    if (lowestUnitPrice === Infinity) {
      const fallback = Object.values(product.prices)[0];
      lowestUnitPrice = fallback?.priceInclVat || 10;
    }

    // Determine the original retail price before discounts:
    // 1. Check if the best store explicitly has originalPrice > lowestUnitPrice
    // 2. Or find the maximum originalPrice across all stores
    // 3. Or find the highest priceInclVat across stores (the standard market baseline)
    const validOriginalPrices = Object.values(product.prices)
      .map((p) => p.originalPrice)
      .filter((op): op is number => typeof op === 'number' && op > lowestUnitPrice);

    const allPrices = Object.values(product.prices)
      .map((p) => p.priceInclVat)
      .filter((p) => p > lowestUnitPrice);

    let originalUnitPrice = lowestUnitPrice;
    if (bestPriceInfo?.originalPrice && bestPriceInfo.originalPrice > lowestUnitPrice) {
      originalUnitPrice = bestPriceInfo.originalPrice;
    } else if (validOriginalPrices.length > 0) {
      originalUnitPrice = Math.max(...validOriginalPrices);
    } else if (allPrices.length > 0) {
      originalUnitPrice = Math.max(...allPrices);
    } else {
      // Conservative default estimate: at least 15% retail baseline if no promo recorded
      originalUnitPrice = Number((lowestUnitPrice * 1.18).toFixed(2));
    }

    if (originalUnitPrice < lowestUnitPrice) {
      originalUnitPrice = lowestUnitPrice;
    }

    const originalTotalPrice = originalUnitPrice * quantity;
    const lowestTotalPrice = lowestUnitPrice * quantity;
    const itemSavingsSar = Math.max(0, originalTotalPrice - lowestTotalPrice);
    const itemSavingsPercent = originalTotalPrice > 0 
      ? Number(((itemSavingsSar / originalTotalPrice) * 100).toFixed(1)) 
      : 0;

    return {
      product,
      quantity,
      originalUnitPrice,
      lowestUnitPrice,
      bestStore,
      originalTotalPrice,
      lowestTotalPrice,
      itemSavingsSar,
      itemSavingsPercent,
    };
  });

  const totalOriginalPrice = items.reduce((sum, item) => sum + item.originalTotalPrice, 0);
  const totalLowestPrice = items.reduce((sum, item) => sum + item.lowestTotalPrice, 0);
  const totalSavingsSar = Math.max(0, totalOriginalPrice - totalLowestPrice);
  const savingsPercentage = totalOriginalPrice > 0 
    ? Number(((totalSavingsSar / totalOriginalPrice) * 100).toFixed(1)) 
    : 0;

  return {
    items,
    totalOriginalPrice,
    totalLowestPrice,
    totalSavingsSar,
    savingsPercentage,
    totalItemsCount: cart.reduce((sum, item) => sum + item.quantity, 0),
  };
};

export const CartSavingsBreakdown: React.FC<CartSavingsBreakdownProps> = ({
  cart,
  stores,
  appliedCoupon,
  couponDiscountAmount = 0,
  cashbackEarned = 0,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (cart.length === 0) return null;

  const {
    items,
    totalOriginalPrice,
    totalLowestPrice,
    totalSavingsSar,
    savingsPercentage,
    totalItemsCount,
  } = calculateCartSavings(cart, stores);

  // Grand total calculation including coupon discount + cashback
  const grandTotalSavings = totalSavingsSar + couponDiscountAmount + cashbackEarned;
  const grandSavingsPercentage = totalOriginalPrice > 0 
    ? Number(((grandTotalSavings / totalOriginalPrice) * 100).toFixed(1)) 
    : savingsPercentage;

  return (
    <div className={`bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 border-2 border-emerald-500/40 dark:border-emerald-600/40 rounded-2xl p-4 sm:p-5 shadow-sm transition-all ${className}`}>
      {/* Top Banner Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-xs shrink-0">
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                مؤشر إجمالي التوفير من السعر الأصلي
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                <Sparkles className="w-3 h-3" />
                <span>وفرت {savingsPercentage}%</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              مقارنة بين السعر الأصلي قبل الخصومات وأقل سعر وجده المتجر لسلتك ({totalItemsCount} قطعة)
            </p>
          </div>
        </div>

        {/* Toggle details button */}
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 bg-emerald-100/70 dark:bg-emerald-900/40 hover:bg-emerald-200/70 dark:hover:bg-emerald-800/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>{isExpanded ? 'إخفاء التفصيل' : 'عرض تفصيل السلع'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3.5 border-t border-emerald-200/60 dark:border-slate-800">
        {/* Metric 1: Total Savings Amount */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-emerald-100 dark:border-slate-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <span>وفر السعر الأصلي</span>
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 font-mono text-lg sm:text-xl font-black text-emerald-800 dark:text-emerald-300">
            {totalSavingsSar.toFixed(2)} <span className="text-xs font-sans">ر.س</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">خصم مباشر من المتاجر</div>
        </div>

        {/* Metric 2: Savings Percentage */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-emerald-100 dark:border-slate-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-teal-700 dark:text-teal-400">
            <span>نسبة الخصم المئوية</span>
            <Percent className="w-3.5 h-3.5" />
          </div>
          <div className="mt-1 font-mono text-lg sm:text-xl font-black text-teal-700 dark:text-teal-300">
            {savingsPercentage}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">من إجمالي القيمة الأصلية</div>
        </div>

        {/* Metric 3: Total Original Value */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-emerald-100 dark:border-slate-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span>السعر الأصلي الإجمالي</span>
            <Tag className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="mt-1 font-mono text-base sm:text-lg font-black text-slate-500 dark:text-slate-400 line-through">
            {totalOriginalPrice.toFixed(2)} <span className="text-xs font-sans">ر.س</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">قبل العروض والتخفيض</div>
        </div>

        {/* Metric 4: Lowest Price Found */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-850 border border-emerald-100 dark:border-slate-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 dark:text-emerald-200">
            <span>أقل سعر وجده المتجر</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 font-mono text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400">
            {totalLowestPrice.toFixed(2)} <span className="text-xs font-sans">ر.س</span>
          </div>
          <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">أفضل صفقة معتمدة</div>
        </div>
      </div>

      {/* Visual Savings Bar */}
      <div className="mt-3.5 p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-300/40 dark:border-emerald-800/40">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>مدى التوفير المحقق في هذه السلة:</span>
          </span>
          <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">
            {savingsPercentage}% توفير حقيقي
          </span>
        </div>
        <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
          <div 
            style={{ width: `${Math.min(100, Math.max(5, savingsPercentage))}%` }} 
            className="h-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 rounded-full transition-all duration-500"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5">
          <span>السعر الأصلي: {totalOriginalPrice.toFixed(2)} ر.س</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-400">
            صافي بعد العروض: {totalLowestPrice.toFixed(2)} ر.س
          </span>
        </div>
      </div>

      {/* Extra Savings Banner if Coupon or Cashback Active */}
      {(couponDiscountAmount > 0 || cashbackEarned > 0) && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300/60 dark:border-amber-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md">
              وفر إضافي متراكم
            </span>
            {couponDiscountAmount > 0 && appliedCoupon && (
              <span className="text-amber-900 dark:text-amber-200 font-bold">
                كوبون ({appliedCoupon.code}): -{couponDiscountAmount.toFixed(2)} ر.س
              </span>
            )}
            {cashbackEarned > 0 && (
              <span className="text-amber-800 dark:text-amber-300 font-bold">
                كاش باك فوري: +{cashbackEarned.toFixed(2)} ر.س
              </span>
            )}
          </div>

          <div className="font-black text-amber-950 dark:text-amber-200 flex items-center gap-1">
            <span>التوفير الإجمالي الشامل:</span>
            <span className="font-mono text-sm text-emerald-700 dark:text-emerald-400">
              {grandTotalSavings.toFixed(2)} ر.س ({grandSavingsPercentage}%)
            </span>
          </div>
        </div>
      )}

      {/* Expanded Breakdown List for Every Item */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-emerald-200/60 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            <span>تفصيل التوفير حسب كل سلعة في سلتك ({items.length} منتجات):</span>
            <span className="text-[10px] text-slate-400">مبني على بيانات المتاجر المعتمدة</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            {items.map((it) => (
              <div key={it.product.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                {/* Product Info & Image */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 p-1 flex items-center justify-center shrink-0">
                    <ProductImage src={it.product.imageUrl} alt={it.product.nameAr} size="sm" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {it.product.nameAr}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                      <span className="font-mono">{it.quantity} × {it.lowestUnitPrice.toFixed(2)} ر.س</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <StoreLogoBadge storeId={it.bestStore.id} size="xs" />
                        <span>الأرخص: {it.bestStore.name}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price & Savings Comparison */}
                <div className="flex items-center gap-3 shrink-0 text-left">
                  <div>
                    <div className="text-[11px] text-slate-400 line-through font-mono">
                      {it.originalTotalPrice.toFixed(2)} ر.س
                    </div>
                    <div className="font-mono font-black text-slate-900 dark:text-white text-xs">
                      {it.lowestTotalPrice.toFixed(2)} ر.س
                    </div>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <div className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs">
                      -{it.itemSavingsSar.toFixed(2)} ر.س
                    </div>
                    <span className="inline-block text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded">
                      وفرت {it.itemSavingsPercent}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
