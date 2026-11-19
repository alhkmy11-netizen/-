import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CartItem, Store, Coupon } from '../types';
import { ProductImage } from './SmartIcon';
import { ShareCartModal } from './ShareCartModal';
import { CartSavingsBreakdown, calculateCartSavings } from './CartSavingsBreakdown';
import { trackEvent } from '../utils/analytics';
import { 
  NOON_CAMPAIGN_COUPONS, 
  isNoonCampaignCoupon, 
  getNoonCouponConfig, 
  distributeOptimalNoonCoupon,
  NOON_AFFILIATE_CONFIG 
} from '../utils/storeLinks';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  TrendingDown, 
  Sparkles, 
  ArrowLeft, 
  Layers, 
  Check, 
  CreditCard, 
  Truck, 
  TicketPercent,
  Building2,
  Zap,
  Share2,
  QrCode,
  Copy,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  PiggyBank
} from 'lucide-react';

interface CartOptimizerViewProps {
  cart: CartItem[];
  stores: Store[];
  coupons: Coupon[];
  appliedCouponCode?: string;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: (cartSummary: {
    total: number;
    subtotal: number;
    savings: number;
    shipping: number;
    appliedCoupon?: Coupon;
    cashbackEarned?: number;
  }) => void;
  onContinueShopping: () => void;
}

export const CartOptimizerView: React.FC<CartOptimizerViewProps> = ({
  cart,
  stores,
  coupons,
  appliedCouponCode,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onContinueShopping,
}) => {
  const [optimizationMode, setOptimizationMode] = useState<'single' | 'split'>('split');
  const [selectedSingleStoreId, setSelectedSingleStoreId] = useState<string>('othaim');
  const [couponCode, setCouponCode] = useState(appliedCouponCode || '');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    if (appliedCouponCode) {
      return coupons.find((c) => c.code.toUpperCase() === appliedCouponCode.toUpperCase()) || null;
    }
    return null;
  });
  const [couponError, setCouponError] = useState<string | null>(null);
  const [copiedCouponCode, setCopiedCouponCode] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Sync appliedCouponCode prop if updated externally
  React.useEffect(() => {
    if (appliedCouponCode) {
      const found = coupons.find((c) => c.code.toUpperCase() === appliedCouponCode.toUpperCase());
      if (found) {
        setAppliedCoupon(found);
        setCouponCode(found.code);
      }
    }
  }, [appliedCouponCode, coupons]);

  if (cart.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="max-w-2xl mx-auto py-16 text-center space-y-4"
      >
        <motion.div 
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 20 }}
          className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-200/50 dark:border-emerald-800/40"
        >
          <ShoppingCart className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </motion.div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">سلتك فارغة حالياً</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          أضف مقاضيك من قسم «الرئيسية والعروض» أو استخدم «القائمة السريعة» لتوليد سلة توفير ذكية في ثوانٍ.
        </p>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onContinueShopping}
          className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
        >
          تصفح العروض والسلع الآن
        </motion.button>
      </motion.div>
    );
  }

  // Calculate single store totals
  const singleStoreTotals = stores.map((store) => {
    let subtotal = 0;
    let missingItems = 0;

    cart.forEach((item) => {
      const price = item.product.prices[store.id];
      if (price && price.inStock) {
        subtotal += price.priceInclVat * item.quantity;
      } else {
        missingItems++;
        subtotal += 20 * item.quantity; // estimate
      }
    });

    const isFreeShipping = subtotal >= store.freeDeliveryThreshold;
    const shipping = isFreeShipping ? 0 : store.deliveryFee;
    const total = subtotal + shipping;

    return {
      store,
      subtotal,
      shipping,
      isFreeShipping,
      total,
      missingItems,
    };
  }).sort((a, b) => a.total - b.total);

  const bestSingleStore = singleStoreTotals[0];
  const worstSingleStore = singleStoreTotals[singleStoreTotals.length - 1];

  // Calculate Split Basket (Best store for each item)
  let splitSubtotal = 0;
  const storeItemMap: Record<string, { store: Store; items: { item: CartItem; price: number }[] }> = {};

  cart.forEach((item) => {
    let minPrice = Infinity;
    let minStore = stores[0];

    Object.entries(item.product.prices).forEach(([sId, pInfo]) => {
      if (pInfo.inStock && pInfo.priceInclVat < minPrice) {
        minPrice = pInfo.priceInclVat;
        const matched = stores.find((s) => s.id === sId);
        if (matched) minStore = matched;
      }
    });

    splitSubtotal += minPrice * item.quantity;

    if (!storeItemMap[minStore.id]) {
      storeItemMap[minStore.id] = { store: minStore, items: [] };
    }
    storeItemMap[minStore.id].items.push({ item, price: minPrice });
  });

  // Calculate split shipping
  const participatingStores = Object.values(storeItemMap);
  let splitShipping = 0;
  participatingStores.forEach((group) => {
    const groupSubtotal = group.items.reduce((acc, curr) => acc + curr.price * curr.item.quantity, 0);
    if (groupSubtotal < group.store.freeDeliveryThreshold) {
      splitShipping += group.store.deliveryFee;
    }
  });

  const splitTotal = splitSubtotal + splitShipping;
  const rawSavings = worstSingleStore ? Math.max(0, worstSingleStore.total - (optimizationMode === 'split' ? splitTotal : (bestSingleStore?.total || 0))) : 0;

  // Coupon handling with automatic Noon Campaign support
  const handleApplyCoupon = (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    setCouponError(null);
    const targetCode = (customCode || couponCode).trim().toUpperCase();
    if (!targetCode) return;

    let found = coupons.find((c) => c.code.toUpperCase() === targetCode);
    if (!found && isNoonCampaignCoupon(targetCode)) {
      const cfg = getNoonCouponConfig(targetCode);
      if (cfg) {
        found = {
          id: `c-noon-${targetCode.toLowerCase()}`,
          storeId: 'noon',
          storeName: 'نون السعودية (Noon KSA)',
          storeLogo: 'noon',
          code: cfg.code,
          discount: cfg.discountText,
          description: cfg.description,
          verified: true,
          expiry: cfg.expiry,
          minSpend: 50,
          category: 'مقاضي وسوبرماركت',
          usesCount: 3500,
          storeUrl: cfg.storeUrl,
        };
      }
    }

    if (found) {
      setAppliedCoupon(found);
      setCouponCode(found.code);
      trackEvent('apply_coupon', {
        coupon_code: found.code,
        store_name: found.storeName,
        discount: found.discount,
      });
    } else {
      setCouponError('كود الخصم غير صحيح أو منتهي الصلاحية');
    }
  };

  const handleSmartNoonDistribute = () => {
    const optimal = distributeOptimalNoonCoupon(activeSubtotal || cart.length);
    handleApplyCoupon(undefined, optimal.code);
    try {
      navigator.clipboard.writeText(optimal.code);
      setCopiedCouponCode(optimal.code);
      setTimeout(() => setCopiedCouponCode(null), 2500);
    } catch {}
    trackEvent('smart_noon_coupon_distributed', { code: optimal.code });
  };

  const activeSubtotal = optimizationMode === 'split' ? splitSubtotal : (singleStoreTotals.find(s => s.store.id === selectedSingleStoreId)?.subtotal || bestSingleStore?.subtotal || 0);
  const activeShipping = optimizationMode === 'split' ? splitShipping : (singleStoreTotals.find(s => s.store.id === selectedSingleStoreId)?.shipping || bestSingleStore?.shipping || 0);

  // Dynamic discount calculation based on coupon code
  let couponDiscountAmount = 0;
  if (appliedCoupon) {
    const code = appliedCoupon.code.toUpperCase();
    if (isNoonCampaignCoupon(code)) {
      // 5 Official Noon Campaign Codes: 10% cashback up to 75 SAR (سارية حتى 31 ديسمبر 2026)
      couponDiscountAmount = Math.min(75, activeSubtotal * 0.10);
    } else if (code === 'ALHKMY_VIP') {
      couponDiscountAmount = activeSubtotal * 0.20; // 20% golden code
    } else if (code === 'TECH2026') {
      couponDiscountAmount = activeSubtotal * 0.15; // 15% tech code
    } else if (code === 'HAKEEM_OUD') {
      couponDiscountAmount = activeSubtotal * 0.25; // 25% oud & perfumes
    } else if (code === 'HAKEEM10') {
      couponDiscountAmount = activeSubtotal * 0.10; // 10%
    } else if (code === '570C') {
      couponDiscountAmount = Math.max(25, activeSubtotal * 0.15); // 15% or min 25 SAR
    } else {
      couponDiscountAmount = 15;
    }
  }

  // Calculate cashback earned from this cart
  const cashbackEarned = cart.reduce((acc, curr) => {
    const pct = curr.product.cashbackPercentage || 5; // default 5%
    const price = curr.product.prices['alhkmystore']?.priceInclVat || Object.values(curr.product.prices)[0]?.priceInclVat || 0;
    return acc + (price * curr.quantity * (pct / 100));
  }, 0);

  const cartSavings = calculateCartSavings(cart, stores);
  const finalTotal = Math.max(0, activeSubtotal + activeShipping - couponDiscountAmount);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>مُحسّن السلة الذكي (Smart Cart Optimizer)</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold">تحسين سلة المشتريات ومقارنة المتاجر</h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mt-1 leading-relaxed">
              يقوم حكيم AI بتحليل سلتك ومقارنة إجمالي الفاتورة بين الشراء من متجر واحد بالكامل أو تقسيم السلة بين متجرين لاقتناص أقوى العروض.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl text-left flex flex-col justify-between">
            <div>
              <div className="text-xs text-emerald-200">إجمالي التوفير المتوقع:</div>
              <div className="text-2xl font-black text-amber-300 mt-0.5">
                {rawSavings.toFixed(2)} <span className="text-xs">ر.س</span>
              </div>
              <div className="text-[10px] text-emerald-300 mt-0.5">مقارنة بأعلى متجر لنفس السلع</div>
            </div>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="mt-3 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة السلة ورابط QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cart Optimization Strategy Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>اختر استراتيجية الشراء والتوفير:</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Strategy 1: Split Cart */}
          <div
            onClick={() => setOptimizationMode('split')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              optimizationMode === 'split'
                ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">تقسيم السلة الذكي (الأعلى توفيراً)</span>
              </div>
              <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                توفير مضاعف
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              شراء كل سلعة من المتجر الأرخص فيها ({participatingStores.length} متاجر). مناسب للطلبات الكبيرة التي تحقق الشحن المجاني.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">المجموع الصافي:</span>
              <span className="font-black text-emerald-800 dark:text-emerald-300 text-base">{splitTotal.toFixed(2)} ر.س</span>
            </div>
          </div>

          {/* Strategy 2: Single Store */}
          <div
            onClick={() => setOptimizationMode('single')}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
              optimizationMode === 'single'
                ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">متجر واحد فقط (توصيل موحد)</span>
              </div>
              <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                راحة تامة
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              طلب جميع المقاضي من متجر واحد فقط في شحنة واحدة ودفع رسوم توصيل واحدة.
            </p>
            <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">الأرخص: {bestSingleStore?.store.name}</span>
              <span className="font-black text-slate-900 dark:text-white text-base">{bestSingleStore?.total.toFixed(2)} ر.س</span>
            </div>
          </div>
        </div>
      </div>

      {/* New Component: Cart Savings Breakdown based on Original vs Lowest Store Price */}
      <CartSavingsBreakdown 
        cart={cart}
        stores={stores}
        appliedCoupon={appliedCoupon}
        couponDiscountAmount={couponDiscountAmount}
        cashbackEarned={cashbackEarned}
      />

      {/* Main Grid: Cart Items List & Summary Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600 px-1">
            <span className="font-bold">محتويات السلة ({cart.length} سلع)</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>مشاركة السلة</span>
              </button>
              <button
                onClick={onClearCart}
                className="text-rose-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>إفراغ السلة</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
            <AnimatePresence mode="popLayout" initial={false}>
              {cart.map((item) => {
                // Find best price for this item
                let minPrice = Infinity;
                let minStore = stores[0];
                Object.entries(item.product.prices).forEach(([sId, pInfo]) => {
                  if (pInfo.inStock && pInfo.priceInclVat < minPrice) {
                    minPrice = pInfo.priceInclVat;
                    const matched = stores.find((s) => s.id === sId);
                    if (matched) minStore = matched;
                  }
                });

                const savingsDetail = cartSavings.items.find((it) => it.product.id === item.product.id);
                const originalUnitPrice = savingsDetail?.originalUnitPrice || minPrice;
                const hasItemSavings = originalUnitPrice > minPrice;

                return (
                  <motion.div
                    key={item.product.id}
                    layout
                    initial={{ opacity: 0, y: 18, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ 
                      opacity: 0, 
                      x: -90, 
                      scale: 0.9, 
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      transition: { duration: 0.22, ease: 'easeInOut' } 
                    }}
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    className="p-4 flex items-center justify-between gap-3 overflow-hidden"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <motion.div 
                        whileHover={{ scale: 1.05 }} 
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="shrink-0"
                      >
                        <ProductImage src={item.product.imageUrl} alt={item.product.nameAr} size="sm" />
                      </motion.div>
                      <div className="min-w-0">
                        <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {item.product.nameAr}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>الأرخص:</span>
                          <span className="font-bold text-emerald-800 dark:text-emerald-400">{minStore.name}</span>
                          <span>({minPrice.toFixed(2)} ر.س)</span>
                          {hasItemSavings && (
                            <span className="text-slate-400 line-through text-[10px]">
                              الأصلي: {originalUnitPrice.toFixed(2)} ر.س
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">العبوة: {item.product.unit}</div>
                      </div>
                    </div>

                    {/* Quantity Stepper & Price with Micro-interactions */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                          title="إنقاص الكمية"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.span
                          key={item.quantity}
                          initial={{ scale: 1.3, color: '#059669' }}
                          animate={{ scale: 1, color: 'inherit' }}
                          transition={{ duration: 0.18 }}
                          className="w-8 text-center text-xs font-black text-slate-900 dark:text-white"
                        >
                          {item.quantity}
                        </motion.span>
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.85 }}
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                          title="زيادة الكمية"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>

                      <div className="text-left min-w-[70px] sm:min-w-[90px]">
                        {hasItemSavings && (
                          <div className="text-[10px] text-slate-400 line-through font-mono">
                            {(originalUnitPrice * item.quantity).toFixed(2)} ر.س
                          </div>
                        )}
                        <motion.div 
                          key={item.quantity * minPrice}
                          initial={{ opacity: 0.6, y: -2 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="font-black text-sm text-slate-900 dark:text-white"
                        >
                          {(minPrice * item.quantity).toFixed(2)} ر.س
                        </motion.div>
                        {hasItemSavings && savingsDetail && (
                          <div className="text-[9px] font-black text-emerald-700 dark:text-emerald-400">
                            وفرت {savingsDetail.itemSavingsPercent}% (-{savingsDetail.itemSavingsSar.toFixed(2)})
                          </div>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-[10px] text-rose-500 hover:text-rose-600 font-bold hover:underline cursor-pointer block mt-0.5"
                        >
                          حذف
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Order Summary & Checkout Box */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <h3 className="font-extrabold text-sm text-slate-900">ملخص فاتورة التوفير:</h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>مجموع السلع ({cart.reduce((a, b) => a + b.quantity, 0)} قطعة):</span>
                <span className="font-bold text-slate-900">{activeSubtotal.toFixed(2)} ر.س</span>
              </div>

              {/* Savings from Original Prices vs Store Lowest */}
              {cartSavings.totalSavingsSar > 0 && (
                <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1.5 rounded-lg font-bold text-xs">
                  <span className="flex items-center gap-1">
                    <PiggyBank className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>وفر السعر الأصلي ({cartSavings.savingsPercentage}%):</span>
                  </span>
                  <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">
                    -{cartSavings.totalSavingsSar.toFixed(2)} ر.س
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>رسوم التوصيل المقدرة:</span>
                </span>
                <span className="font-bold text-slate-900">
                  {activeShipping === 0 ? (
                    <span className="text-emerald-700 font-black">مجاني (مشمول)</span>
                  ) : (
                    `${activeShipping.toFixed(2)} ر.س`
                  )}
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex items-center justify-between text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded-lg font-bold">
                  <span>كوبون مفعّل ({appliedCoupon.code}):</span>
                  <span>- {couponDiscountAmount.toFixed(2)} ر.س</span>
                </div>
              )}

              {/* Instant Cashback Earned */}
              {cashbackEarned > 0 && (
                <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/60 px-2.5 py-1.5 rounded-lg font-bold text-xs">
                  <span>كاش باك فوري يضاف لمحفظتك:</span>
                  <span className="font-mono font-black text-amber-600 dark:text-amber-400">+{cashbackEarned.toFixed(2)} ر.س</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                <span className="font-black text-slate-900">المبلغ الإجمالي النهائي:</span>
                <span className="font-black text-xl text-emerald-800">{finalTotal.toFixed(2)} ر.س</span>
              </div>
              <div className="text-[10px] text-slate-400 text-left">شامل ضريبة القيمة المضافة 15%</div>
            </div>

            {/* Coupon Box */}
            <form onSubmit={handleApplyCoupon} className="pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="أدخل كود الخصم (مثل HKEEEM2 أو 570C)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 uppercase"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  تطبيق
                </button>
              </div>
              {couponError && <p className="text-[11px] text-rose-600 mt-1">{couponError}</p>}
            </form>

            {/* Noon 2026 Campaign 5-Coupon Shelf & Distribution */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-400/15 to-amber-500/5 border border-amber-300 dark:border-amber-700/60 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-lg bg-yellow-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                    noon
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      أكواد حملة نون السعودية الرسمية (2026)
                    </h4>
                    <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold block">
                      كاش باك 10% حتى 75 ر.س • سارية حتى 31 ديسمبر 2026
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSmartNoonDistribute}
                  className="px-2.5 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-[11px] font-black flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
                  title="توزيع واقتراح ذكي لأحد الأكواد الخمسة وتطبيقه فوراً على السلة"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>توزيع آلي للكوبون</span>
                </button>
              </div>

              {/* 5 Codes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {NOON_CAMPAIGN_COUPONS.map((nc) => {
                  const isCurrentApplied = appliedCoupon?.code.toUpperCase() === nc.code.toUpperCase();
                  const isCopied = copiedCouponCode === nc.code;

                  return (
                    <div
                      key={nc.code}
                      className={`p-2 rounded-xl bg-white dark:bg-slate-900 border transition-all flex items-center justify-between gap-1.5 ${
                        isCurrentApplied
                          ? 'border-emerald-500 ring-2 ring-emerald-400/30 dark:border-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 hover:border-amber-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs font-black text-slate-900 dark:text-white tracking-wide">
                            {nc.code}
                          </span>
                          <span className="text-[9px] text-amber-700 dark:text-amber-300 font-bold truncate">
                            {nc.badgeAr}
                          </span>
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                          كاش باك 10% حتى 75 ر.س
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Quick Copy Button */}
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              navigator.clipboard.writeText(nc.code);
                              setCopiedCouponCode(nc.code);
                              setTimeout(() => setCopiedCouponCode(null), 2000);
                            } catch {}
                            trackEvent('quick_copy_cart_noon_coupon', { code: nc.code });
                          }}
                          className={`p-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                          title={`نسخ كود ${nc.code}`}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        {/* Apply to Cart Button */}
                        <button
                          type="button"
                          onClick={() => handleApplyCoupon(undefined, nc.code)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                            isCurrentApplied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 shadow-2xs'
                          }`}
                          title={`تطبيق كود ${nc.code} على السلة`}
                        >
                          {isCurrentApplied ? 'مُفعّل' : 'تطبيق'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Direct Noon Purchase with Tracking link */}
              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">
                  هل تريد إتمام الطلب مباشرة داخل نون؟
                </span>
                <a
                  href="https://s.noon.com/RZu4tvxjJ8Q"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    const code = appliedCoupon?.code || 'HKEEEM2';
                    try {
                      navigator.clipboard.writeText(code);
                    } catch {}
                    trackEvent('click_cart_checkout_noon_direct', { coupon: code });
                  }}
                  className="font-bold text-amber-900 dark:text-yellow-400 hover:underline flex items-center gap-1"
                >
                  <span>شراء من نون برابط التتبع</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Share Cart Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>مشاركة السلة (رابط مباشر / رمز QR)</span>
            </button>

            {/* Checkout Button */}
            <button
              onClick={() =>
                onProceedToCheckout({
                  total: finalTotal,
                  subtotal: activeSubtotal,
                  savings: Math.max(rawSavings, cartSavings.totalSavingsSar),
                  shipping: activeShipping,
                  appliedCoupon: appliedCoupon || undefined,
                  cashbackEarned: Number(cashbackEarned.toFixed(2)),
                })
              }
              className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>إتمام الطلب وتأكيد السلة الأوفر</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Cart Modal */}
      <ShareCartModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        cart={cart}
        stores={stores}
        optimizationMode={optimizationMode}
        totalAmount={finalTotal}
        savingsAmount={rawSavings}
        selectedStoreName={singleStoreTotals.find((s) => s.store.id === selectedSingleStoreId)?.store.name}
      />
    </div>
  );
};
