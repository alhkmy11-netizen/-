import React, { useState, useEffect, useMemo } from 'react';
import { CartItem, PastOrder, Product, Store, StoreCategoryType, StoreMarketType, StorePriceInfo } from '../types';
import { STORE_CATEGORIES, STORE_MARKET_OPTIONS } from '../data/hkeeemData';
import { ProductGridSkeleton } from './Skeletons';
import { StoreLogoBadge, ProductImage, GlassCategoryIcon } from './SmartIcon';
import { NutritionLabel } from './NutritionLabel';
import { OfferDetailsModal } from './OfferDetailsModal';
import { StorePriceComparisonModal } from './StorePriceComparisonModal';
import { OfferToastNotification, ToastData } from './OfferToastNotification';
import { PersonalizedRecommendationsSection } from './PersonalizedRecommendationsSection';
import { trackEvent } from '../utils/analytics';
import { getDirectOfferUrl, NOON_CAMPAIGN_COUPONS } from '../utils/storeLinks';
import { getMarketPriceStats } from '../utils/marketPrice';
import { StarRating, getProductRatingData } from './StarRating';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  TrendingDown, 
  Bell, 
  Heart, 
  Sparkles, 
  Tag, 
  Check, 
  Clock, 
  Layers, 
  ArrowUpRight, 
  RefreshCw, 
  Search, 
  ListOrdered, 
  Camera, 
  Flame, 
  ExternalLink, 
  Scale,
  SlidersHorizontal,
  ArrowDownUp,
  Star,
  Percent,
  Filter,
  X,
  ShoppingBag,
  Copy,
  History,
  Eye,
  LayoutGrid,
  Rows3,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export type SortOptionType = 'lowest-price' | 'highest-rated' | 'most-demanded' | 'biggest-discount';
export type QuickFilterType = 'all' | 'promos' | 'cashback' | 'healthy' | 'budget' | 'alhkmy';

interface HomeOffersViewProps {
  products: Product[];
  stores: Store[];
  searchQuery: string;
  onAddToCart: (product: Product) => void;
  cartItemQuantities: Record<string, number>;
  onToggleAlert: (product: Product) => void;
  alertProductIds: string[];
  onOpenQuickList: () => void;
  onOpenImageSearch: () => void;
  isLoading?: boolean;
  compareProductIds?: string[];
  onToggleCompare?: (product: Product) => void;
  onOpenAlhkmyStore?: () => void;
  wishlistProductIds?: string[];
  onToggleWishlist?: (product: Product) => void;
  onOpenProductReviews?: (product: Product) => void;
  pastOrders?: PastOrder[];
  cart?: CartItem[];
  onOpenHistory?: () => void;
}

export const HomeOffersView: React.FC<HomeOffersViewProps> = ({
  products,
  stores,
  searchQuery,
  onAddToCart,
  cartItemQuantities,
  onToggleAlert,
  alertProductIds,
  onOpenQuickList,
  onOpenImageSearch,
  isLoading = false,
  compareProductIds = [],
  onToggleCompare,
  onOpenAlhkmyStore,
  wishlistProductIds = [],
  onToggleWishlist,
  onOpenProductReviews,
  pastOrders = [],
  cart = [],
  onOpenHistory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<StoreCategoryType>('all');
  const [selectedMarket, setSelectedMarket] = useState<StoreMarketType>('all');
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [onlyPromosFilter, setOnlyPromosFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOptionType>('lowest-price');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');
  const [isFilterTransition, setIsFilterTransition] = useState(false);
  const [catalogViewMode, setCatalogViewMode] = useState<'by-store-type' | 'grid'>('by-store-type');
  const [expandedStoreTypeIds, setExpandedStoreTypeIds] = useState<Record<string, boolean>>({});

  // Modal State for Offer Direct Access
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [modalStore, setModalStore] = useState<Store | null>(null);
  const [modalPriceInfo, setModalPriceInfo] = useState<StorePriceInfo | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState<boolean>(false);
  const [toastData, setToastData] = useState<ToastData | null>(null);

  // Store Price Comparison Modal State (iPhone / Mobile Optimized)
  const [comparisonProduct, setComparisonProduct] = useState<Product | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);

  const handleOpenStoreComparison = (product: Product) => {
    recordRecentlyViewed(product.id);
    setComparisonProduct(product);
    setIsComparisonModalOpen(true);
    trackEvent('open_store_price_comparison_modal', {
      product_id: product.id,
      product_name: product.nameAr,
    });
  };

  // Recently Viewed Products Persistence & State
  const RECENTLY_VIEWED_KEY = 'hkeeem_recently_viewed_products';
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return ['p1', 'p2', 'p3', 'p4'];
  });

  const recordRecentlyViewed = (productId: string) => {
    setRecentlyViewedIds((prev) => {
      const next = [productId, ...prev.filter((id) => id !== productId)].slice(0, 10);
      try {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearRecentlyViewed = () => {
    setRecentlyViewedIds([]);
    try {
      localStorage.removeItem(RECENTLY_VIEWED_KEY);
    } catch {}
    trackEvent('clear_recently_viewed');
  };

  const removeRecentlyViewedItem = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentlyViewedIds((prev) => {
      const next = prev.filter((id) => id !== productId);
      try {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    trackEvent('remove_recently_viewed_item', { product_id: productId });
  };

  const handleOpenOfferModal = (product: Product, store: Store, priceInfo?: StorePriceInfo) => {
    recordRecentlyViewed(product.id);
    setModalProduct(product);
    setModalStore(store);
    const resolvedPriceInfo = priceInfo || product.prices[store.id] || null;
    setModalPriceInfo(resolvedPriceInfo);
    setIsOfferModalOpen(true);

    // Welcoming Toast Notification confirming direct routing to offer details
    setToastData({
      title: 'مرحباً بك! تم توجيهك إلى تفاصيل العرض',
      message: `تم فتح تفاصيل العرض الترويجي الرسمي لـ "${product.nameAr}" في ${store.name}. استمتع بالتوفير!`,
      storeName: store.name,
      storeId: store.id,
      productName: product.nameAr,
    });

    trackEvent('open_offer_details', {
      product_name: product.nameAr,
      store_name: store.name,
    });
  };

  const handleFilterPromosOnly = () => {
    const nextState = !onlyPromosFilter;
    setOnlyPromosFilter(nextState);
    trackEvent('filter_promotions_only', { enabled: nextState });
    if (nextState) {
      setTimeout(() => {
        document.getElementById('products-grid-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  // Smooth perceived performance transition when switching filters
  const handleSelectStoreCategory = (cat: StoreCategoryType) => {
    if (cat === selectedCategory) return;
    setIsFilterTransition(true);
    setSelectedCategory(cat);
    setSelectedStoreId('all');
    trackEvent('select_store_type', { store_type: cat });
    setTimeout(() => setIsFilterTransition(false), 220);
  };

  const handleSelectStore = (sId: string) => {
    if (sId === selectedStoreId) return;
    setIsFilterTransition(true);
    setSelectedStoreId(sId);
    setTimeout(() => setIsFilterTransition(false), 250);
  };

  const handleSelectProductCategory = (pCat: string) => {
    if (pCat === productCategoryFilter) return;
    setIsFilterTransition(true);
    setProductCategoryFilter(pCat);
    setTimeout(() => setIsFilterTransition(false), 250);
  };

  const isViewLoading = isLoading || isFilterTransition;

  // Calculate lowest price helper (optionally scoped to a specific set of store IDs)
  const getLowestPrice = (
    product: Product,
    scopedStoreIds?: Set<string>
  ): { minPrice: number; minStore: Store | null; promo: boolean } => {
    let minPrice = Infinity;
    let minStore: Store | null = null;
    let promo = false;

    for (const [storeId, priceInfo] of Object.entries(product.prices)) {
      if (scopedStoreIds && !scopedStoreIds.has(storeId)) continue;
      if (priceInfo.inStock && priceInfo.priceInclVat < minPrice) {
        minPrice = priceInfo.priceInclVat;
        minStore = stores.find((s) => s.id === storeId) || null;
        promo = !!priceInfo.isPromo || !!(priceInfo.originalPrice && priceInfo.originalPrice > priceInfo.priceInclVat);
      }
    }

    if (minPrice === Infinity && scopedStoreIds) {
      return getLowestPrice(product);
    }

    return { minPrice, minStore, promo };
  };

  // Calculate composite customer rating (4.6 - 5.0)
  const getProductRating = (product: Product): number => {
    const availableStores = Object.entries(product.prices)
      .filter(([_, info]) => info.inStock)
      .map(([sId]) => stores.find((s) => s.id === sId)?.rating || 4.6);

    const baseRating = availableStores.length > 0
      ? availableStores.reduce((acc, curr) => acc + curr, 0) / availableStores.length
      : 4.7;

    const nutriBonus = product.nutrition?.nutriScore === 'A' ? 0.2 : product.nutrition?.nutriScore === 'B' ? 0.1 : 0;
    return Math.min(5.0, Number((baseRating + nutriBonus).toFixed(1)));
  };

  // Calculate demand score for 'الأكثر طلباً'
  const getProductDemandScore = (product: Product): number => {
    let score = 50;
    // Essential food staples in Saudi households
    const stapleKeywords = ['حليب', 'أرز', 'زيت', 'سكر', 'شاي', 'قهوة', 'دجاج', 'لبن', 'بيض', 'جبن', 'خبز', 'طماطم'];
    if (stapleKeywords.some((w) => product.nameAr.includes(w) || product.tags.some((t) => t.includes(w)))) {
      score += 35;
    }
    // High store availability means staple distribution
    const inStockCount = Object.values(product.prices).filter((p) => p.inStock).length;
    score += inStockCount * 6;
    // Active promotion drives higher consumer demand
    const { promo } = getLowestPrice(product);
    if (promo) score += 25;
    // Instant cashback adds demand
    if (product.cashbackPercentage) score += product.cashbackPercentage * 2.5;
    return score;
  };

  // Calculate maximum savings SAR amount
  const getMaxDiscount = (product: Product): number => {
    let maxDiff = 0;
    Object.values(product.prices).forEach((info) => {
      if (info.inStock && info.originalPrice && info.originalPrice > info.priceInclVat) {
        const diff = info.originalPrice - info.priceInclVat;
        if (diff > maxDiff) maxDiff = diff;
      }
    });
    return maxDiff;
  };

  const handleSortChange = (newSort: SortOptionType) => {
    setIsFilterTransition(true);
    setSortBy(newSort);
    trackEvent('filter_sort_changed', { sort_by: newSort });
    setTimeout(() => setIsFilterTransition(false), 200);
  };

  // Filter products by search, store, category, active promo offers, and quick filters
  const filteredProducts = products
    .filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStoreCategory =
        selectedCategory === 'all' ||
        stores.some((s) => s.category === selectedCategory && p.prices[s.id]?.inStock);

      const matchesMarket =
        selectedMarket === 'all' ||
        stores.some(
          (s) => (s.market || 'saudi') === selectedMarket && p.prices[s.id]?.inStock
        );

      const matchesSpecificStore =
        selectedStoreId === 'all' || p.prices[selectedStoreId]?.inStock;

      const matchesProdCategory =
        productCategoryFilter === 'all' || p.category === productCategoryFilter;

      const matchesPromo =
        !onlyPromosFilter ||
        Object.values(p.prices).some(
          (pr) => pr.inStock && (pr.isPromo || (pr.originalPrice && pr.originalPrice > pr.priceInclVat))
        );

      const matchesQuick =
        quickFilter === 'all' ||
        (quickFilter === 'alhkmy' &&
          (!!p.prices['alhkmystore']?.inStock || !!p.prices['alhkmy']?.inStock)) ||
        (quickFilter === 'promos' &&
          Object.values(p.prices).some(
            (pr) => pr.inStock && (pr.isPromo || (pr.originalPrice && pr.originalPrice > pr.priceInclVat))
          )) ||
        (quickFilter === 'cashback' && (p.cashbackPercentage || 0) > 0) ||
        (quickFilter === 'healthy' && (p.nutrition?.nutriScore === 'A' || p.nutrition?.nutriScore === 'B' || !!p.healthyAlternative)) ||
        (quickFilter === 'budget' && getLowestPrice(p).minPrice <= 25);

      return matchesSearch && matchesStoreCategory && matchesMarket && matchesSpecificStore && matchesProdCategory && matchesPromo && matchesQuick;
    })
    .sort((a, b) => {
      if (sortBy === 'lowest-price') {
        const priceA = getLowestPrice(a).minPrice;
        const priceB = getLowestPrice(b).minPrice;
        return priceA - priceB;
      }
      if (sortBy === 'highest-rated') {
        const ratingA = getProductRatingData(a).rating;
        const ratingB = getProductRatingData(b).rating;
        return ratingB - ratingA;
      }
      if (sortBy === 'most-demanded') {
        const demandA = getProductDemandScore(a);
        const demandB = getProductDemandScore(b);
        return demandB - demandA;
      }
      if (sortBy === 'biggest-discount') {
        const discountA = getMaxDiscount(a);
        const discountB = getMaxDiscount(b);
        return discountB - discountA;
      }
      return 0;
    });

  const productCategories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  // Stores matching current market & store type filter
  const visibleStoresForBar = useMemo(() => {
    return stores.filter((s) => {
      const marketMatch = selectedMarket === 'all' || (s.market || 'saudi') === selectedMarket;
      const typeMatch = selectedCategory === 'all' || s.category === selectedCategory;
      return marketMatch && typeMatch;
    });
  }, [stores, selectedMarket, selectedCategory]);

  // Live store count & product count per Store Type (Hypermarkets, Local Artisanal, Organic Shops, etc.)
  const storeTypeStats = useMemo(() => {
    const map: Record<string, { storeCount: number; productCount: number }> = {};
    STORE_CATEGORIES.forEach((cat) => {
      const matchingStores = stores.filter((s) => {
        const marketMatch = selectedMarket === 'all' || (s.market || 'saudi') === selectedMarket;
        const typeMatch = cat.id === 'all' || s.category === cat.id;
        return marketMatch && typeMatch;
      });
      const storeIds = new Set(matchingStores.map((s) => s.id));
      const prodCount = products.filter((p) =>
        Object.entries(p.prices).some(([sid, info]) => info.inStock && storeIds.has(sid))
      ).length;
      map[cat.id] = { storeCount: matchingStores.length, productCount: prodCount };
    });
    return map;
  }, [stores, products, selectedMarket]);

  // Group filtered products by Store Type for structured browsing
  const groupedProductsByStoreType = useMemo(() => {
    const targetCategories =
      selectedCategory === 'all'
        ? STORE_CATEGORIES.filter((c) => c.id !== 'all')
        : STORE_CATEGORIES.filter((c) => c.id === selectedCategory);

    return targetCategories
      .map((cat) => {
        const typeStores = stores.filter((s) => {
          const marketMatch = selectedMarket === 'all' || (s.market || 'saudi') === selectedMarket;
          const specificStoreMatch = selectedStoreId === 'all' || s.id === selectedStoreId;
          return s.category === cat.id && marketMatch && specificStoreMatch;
        });
        const typeStoreIds = new Set(typeStores.map((s) => s.id));
        const typeProducts = filteredProducts.filter((p) =>
          Object.entries(p.prices).some(([sid, info]) => info.inStock && typeStoreIds.has(sid))
        );
        return {
          category: cat,
          stores: typeStores,
          storeIds: typeStoreIds,
          products: typeProducts,
        };
      })
      .filter((group) => group.products.length > 0);
  }, [stores, filteredProducts, selectedCategory, selectedMarket, selectedStoreId]);

  const shouldShowGroupedByStoreType =
    catalogViewMode === 'by-store-type' &&
    selectedCategory === 'all' &&
    selectedStoreId === 'all' &&
    !searchQuery.trim();

  const toggleExpandStoreType = (catId: string) => {
    setExpandedStoreTypeIds((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-28 md:pb-12">
      {/* Hero Offers Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 text-white p-5 sm:p-8 shadow-xl border border-emerald-500/20">
        <div className="relative z-10 max-w-3xl">
          <button
            onClick={handleFilterPromosOnly}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] sm:text-xs font-black mb-3 shadow-sm transition-transform active:scale-95 cursor-pointer max-w-full"
            title="اضغط لتصفية عروض وتخفيضات الأسبوع"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">نشرة عروض الأسبوع الذكية • تخفيضات حتى 45% ↗</span>
          </button>
          <h1 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2 text-white leading-tight">
            وفّر مقاضيك الشهرية بأذكى مقارن أسعار في السعودية
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-medium leading-relaxed mb-5 max-w-2xl">
            نقارن لك أسعار آلاف السلع الأساسية بين بنده، العثيم، كارفور، الدانوب، لولو وأمازون لحظياً لنضمن لك أقل فاتورة مع إمكانية تقسيم السلة الذكي.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={handleFilterPromosOnly}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${
                onlyPromosFilter
                  ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-white/50'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950'
              }`}
            >
              <Flame className={`w-4 h-4 shrink-0 ${onlyPromosFilter ? 'text-white' : 'text-slate-950'}`} />
              <span className="truncate">{onlyPromosFilter ? 'عرض جميع السلع (إلغاء الفلتر)' : 'عروض وتخفيضات الأسبوع (خصم 45%)'}</span>
            </button>
            <button
              onClick={onOpenQuickList}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 backdrop-blur-md border border-white/20 transition-all cursor-pointer"
            >
              <ListOrdered className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>القائمة السريعة</span>
            </button>
            <button
              onClick={onOpenImageSearch}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 backdrop-blur-md border border-white/20 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>ابحث بصورة</span>
            </button>
          </div>
        </div>

        {/* Decorative Graphic Element */}
        <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/2 w-48 h-48 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
      </div>

      {/* Alhkmy.store Integration Highlight Banner */}
      <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 text-white border border-emerald-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center shrink-0 shadow-xs">
            <ShoppingBag className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-white">
                متجر حكيم الذكي المعتمد (alhkmy.store)
              </h3>
              <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-2xs">
                كود 570C
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                كاش باك فوري 15%
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">
              تسوق كافة المنتجات الغذائية والمؤن والإلكترونيات بأسعار الجملة المخفضة مع شحن سريع لجميع مدن المملكة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <button
            onClick={() => {
              if (onOpenAlhkmyStore) {
                onOpenAlhkmyStore();
              } else {
                setQuickFilter('alhkmy');
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>تصفح متجر حكيم</span>
          </button>
          <a
            href="https://alhkmy.store"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap border border-white/15"
            title="الانتقال للموقع الرسمي alhkmy.store"
          >
            <span>الموقع الرسمي</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Personalized Recommendations (Client-Side Algorithm) */}
      {!searchQuery.trim() && (
        <PersonalizedRecommendationsSection
          products={products}
          stores={stores}
          pastOrders={pastOrders}
          recentlyViewedIds={recentlyViewedIds}
          cart={cart}
          cartItemQuantities={cartItemQuantities}
          onAddToCart={onAddToCart}
          onOpenOfferModal={handleOpenOfferModal}
          onOpenStoreComparison={handleOpenStoreComparison}
          onRecordView={recordRecentlyViewed}
          onOpenHistory={onOpenHistory}
        />
      )}

      {/* Store Type Categories Filter (Hypermarkets, Local Artisanal, Organic Shops, etc.) */}
      <section aria-label="تصنيف المنتجات حسب نوع المتجر" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>تصفح المنتجات حسب نوع المتجر</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              هايبر ماركت · حرفية ومحلية (Local Artisanal) · متاجر عضوية (Organic Shops) · سوبرماركت ومنصات عالمية
            </p>
          </div>

          {/* Market Origin List Filter: سعودي / صيني / أمريكي */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {STORE_MARKET_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setIsFilterTransition(true);
                  setSelectedMarket(opt.id);
                  setSelectedStoreId('all');
                  setTimeout(() => setIsFilterTransition(false), 200);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap shrink-0 border transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedMarket === opt.id
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{opt.flag}</span>
                <span>{opt.labelAr}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5">
          {STORE_CATEGORIES.map((cat) => {
            const stats = storeTypeStats[cat.id] || { storeCount: 0, productCount: 0 };
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleSelectStoreCategory(cat.id)}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200/90 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <GlassCategoryIcon categoryId={cat.id} className="w-5 h-5" />
                    <span className="text-[10px] font-mono tabular-nums font-semibold text-slate-500 dark:text-slate-400">
                      {stats.productCount}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-1">
                    {cat.labelAr}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {cat.labelEn}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tabular-nums pt-1 border-t border-slate-100 dark:border-slate-800/80 truncate">
                  {stats.storeCount} متاجر · {stats.productCount} سلعة
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Store Logos Quick Filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <span>
            تصفية حسب المتجر
            {selectedCategory !== 'all'
              ? ` (${STORE_CATEGORIES.find((c) => c.id === selectedCategory)?.labelAr})`
              : ''}
            :
          </span>
          {(selectedStoreId !== 'all' || selectedCategory !== 'all') && (
            <button
              type="button"
              onClick={() => {
                handleSelectStore('all');
                if (selectedCategory !== 'all') handleSelectStoreCategory('all');
              }}
              className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
            >
              عرض جميع المتاجر
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => handleSelectStore('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              selectedStoreId === 'all'
                ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            كافة المتاجر ({visibleStoresForBar.length})
          </button>
          {visibleStoresForBar.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleSelectStore(s.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                selectedStoreId === s.id
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <StoreLogoBadge storeId={s.id} size="sm" />
              <span>{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Product Categories Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={handleFilterPromosOnly}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black whitespace-nowrap transition-all border-b-2 cursor-pointer ${
            onlyPromosFilter
              ? 'border-rose-600 text-rose-700 dark:text-rose-400 dark:border-rose-400 bg-rose-50/60 dark:bg-rose-950/30 rounded-t-lg'
              : 'border-transparent text-rose-600 dark:text-rose-400 hover:bg-rose-50/40 dark:hover:bg-rose-950/20'
          }`}
        >
          <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
          <span>العروض والتخفيضات النشطة</span>
          <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.2 rounded-full font-black">
            خصومات
          </span>
        </button>

        {productCategories.map((c) => (
          <button
            key={c}
            onClick={() => {
              if (onlyPromosFilter) setOnlyPromosFilter(false);
              handleSelectProductCategory(c);
            }}
            className={`px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
              !onlyPromosFilter && productCategoryFilter === c
                ? 'border-emerald-600 text-emerald-800 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {c === 'all' ? 'جميع السلع' : c}
          </button>
        ))}
      </div>

      {/* Smart Filters & Sorting Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Main Sorting Pills: الأقل سعراً | الأعلى تقييماً | الأكثر طلباً | أعلى خصم */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 lg:pb-0 scrollbar-none">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0 ml-1.5">
              <ArrowDownUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>ترتيب المنتجات:</span>
            </span>

            {/* الأقل سعراً */}
            <button
              onClick={() => handleSortChange('lowest-price')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                sortBy === 'lowest-price'
                  ? 'bg-emerald-700 text-white shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
              }`}
              title="عرض المنتجات ذات السعر الأرخص أولاً"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>الأقل سعراً</span>
            </button>

            {/* الأعلى تقييماً */}
            <button
              onClick={() => handleSortChange('highest-rated')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                sortBy === 'highest-rated'
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/30'
                  : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
              }`}
              title="عرض المنتجات الأعلى تقييماً وجودة أولاً"
            >
              <Star className="w-3.5 h-3.5 fill-current text-amber-950 dark:text-amber-950" />
              <span>الأعلى تقييماً</span>
            </button>

            {/* الأكثر طلباً */}
            <button
              onClick={() => handleSortChange('most-demanded')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                sortBy === 'most-demanded'
                  ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-500/30'
                  : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
              }`}
              title="عرض السلع الأساسية والأكثر إقبالاً وشراءً"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>الأكثر طلباً</span>
            </button>

            {/* أعلى خصم وتوفير */}
            <button
              onClick={() => handleSortChange('biggest-discount')}
              className={`px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                sortBy === 'biggest-discount'
                  ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-500/30'
                  : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
              }`}
              title="عرض السلع التي تحتوي على أكبر فارق توفير وخصم نقدي"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>أعلى توفير وخصم</span>
            </button>
          </div>

          {/* Quick Filter Tag Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="text-xs font-black text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0 ml-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>تصفية سريعة:</span>
            </span>

            {/* Toggle Alhkmy Store Exclusive */}
            <button
              onClick={() => setQuickFilter(quickFilter === 'alhkmy' ? 'all' : 'alhkmy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                quickFilter === 'alhkmy'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                  : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:border-emerald-500'
              }`}
              title="عرض السلع المتوفرة في متجر حكيم الذكي alhkmy.store بكود 570C"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
              <span>متجر حكيم (alhkmy.store)</span>
              <span className="text-[10px] bg-amber-400 text-slate-950 px-1 py-0.2 rounded font-black shadow-2xs">
                570C
              </span>
              {quickFilter === 'alhkmy' && <Check className="w-3 h-3 text-white" />}
            </button>

            {/* Toggle Promos */}
            <button
              onClick={() => handleFilterPromosOnly()}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                onlyPromosFilter
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:border-amber-400'
              }`}
            >
              <Tag className="w-3 h-3 text-amber-500" />
              <span>عروض وتخفيضات</span>
              {onlyPromosFilter && <Check className="w-3 h-3 text-slate-950" />}
            </button>

            {/* Toggle Cashback */}
            <button
              onClick={() => setQuickFilter(quickFilter === 'cashback' ? 'all' : 'cashback')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                quickFilter === 'cashback'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>كاش باك فوري</span>
              {quickFilter === 'cashback' && <Check className="w-3 h-3 text-white" />}
            </button>

            {/* Toggle Healthy */}
            <button
              onClick={() => setQuickFilter(quickFilter === 'healthy' ? 'all' : 'healthy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                quickFilter === 'healthy'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:border-teal-400'
              }`}
            >
              <span>🥗 صحي (A/B)</span>
              {quickFilter === 'healthy' && <Check className="w-3 h-3 text-white" />}
            </button>

            {/* Reset Filters if any active */}
            {(sortBy !== 'lowest-price' || onlyPromosFilter || quickFilter !== 'all') && (
              <button
                onClick={() => {
                  setSortBy('lowest-price');
                  setOnlyPromosFilter(false);
                  setQuickFilter('all');
                }}
                className="text-[11px] font-black text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 transition-colors px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 cursor-pointer shrink-0"
                title="إعادة تعيين كافة الفلاتر والترتيب للوضع الافتراضي"
              >
                <X className="w-3 h-3" />
                <span>إلغاء الفلاتر</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Count Header & Store-Type Browse Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div>
          {isViewLoading ? (
            <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span>جاري تحميل ومطابقة أحدث أسعار الفروع وترتيب المنتجات...</span>
            </span>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="tabular-nums">
                تم العثور على <span className="font-extrabold text-slate-900 dark:text-white">{filteredProducts.length}</span> سلعة
              </span>
              {selectedCategory !== 'all' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {STORE_CATEGORIES.find((c) => c.id === selectedCategory)?.labelAr} (
                    {STORE_CATEGORIES.find((c) => c.id === selectedCategory)?.labelEn})
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {sortBy === 'lowest-price' && 'الأقل سعراً'}
                {sortBy === 'highest-rated' && 'الأعلى تقييماً'}
                {sortBy === 'most-demanded' && 'الأكثر طلباً'}
                {sortBy === 'biggest-discount' && 'أعلى نسبة توفير وخصم'}
              </span>
              {onlyPromosFilter && (
                <span className="text-amber-600 dark:text-amber-400 font-bold">
                  (عروض وتخفيضات نشطة)
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented View Switcher: Grouped by Store Type vs Unified Grid */}
          {selectedCategory === 'all' && selectedStoreId === 'all' && !searchQuery.trim() && (
            <div
              role="tablist"
              aria-label="طريقة عرض المنتجات"
              className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800"
            >
              <button
                type="button"
                role="tab"
                aria-selected={catalogViewMode === 'by-store-type'}
                onClick={() => setCatalogViewMode('by-store-type')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  catalogViewMode === 'by-store-type'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Rows3 className="w-3.5 h-3.5" />
                <span>مُصنّف حسب نوع المتجر</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={catalogViewMode === 'grid'}
                onClick={() => setCatalogViewMode('grid')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  catalogViewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>شبكة موحدة</span>
              </button>
            </div>
          )}

          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>الأسعار محدثة ومطابقة للفواتير الرسمية</span>
          </div>
        </div>
      </div>

      {/* Products Grid (Grouped by Store Type or Flat Grid) or Skeleton Loading */}
      {isViewLoading ? (
        <ProductGridSkeleton count={6} />
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Search className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">لا توجد سلع مطابقة لخيارات البحث</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            جرب تغيير نوع المتجر أو إلغاء الفلاتر لعرض كافة السلع المتاحة.
          </p>
          <button
            type="button"
            onClick={() => {
              setOnlyPromosFilter(false);
              setSelectedCategory('all');
              setSelectedMarket('all');
              setSelectedStoreId('all');
              setProductCategoryFilter('all');
              setQuickFilter('all');
            }}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            إعادة تعيين الفلاتر وعرض الكل
          </button>
        </div>
      ) : (() => {
        const renderProductCard = (
          product: Product,
          keyPrefix: string,
          scopedStoreIds?: Set<string>
        ) => {
          const { minPrice, minStore, promo } = getLowestPrice(product, scopedStoreIds);
          const quantity = cartItemQuantities[product.id] || 0;
          const isAlerted = alertProductIds.includes(product.id);
          const isCompared = compareProductIds.includes(product.id);
          const isWishlisted = wishlistProductIds.includes(product.id);
          const ratingData = getProductRatingData(product);
          const rating = ratingData.rating;
          const demandScore = getProductDemandScore(product);
          const maxSavings = getMaxDiscount(product);
          const marketStats = getMarketPriceStats(product, stores);

          return (
            <div
              key={`${keyPrefix}-${product.id}`}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all p-4 flex flex-col justify-between ${
                isCompared
                  ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-950/20'
                  : 'border-slate-200/90 dark:border-slate-800/90 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 hover:shadow-lg dark:hover:shadow-emerald-950/30'
              }`}
            >
                <div>
                  {/* Top Badge & Alert / Compare buttons */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {promo && (
                        <button
                          onClick={() => handleOpenOfferModal(product, minStore || stores[0])}
                          className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs transition-transform active:scale-95 cursor-pointer"
                          title="اضغط لمعاينة العرض الترويجي والتفاصيل والانتقال للمتجر"
                        >
                          <Tag className="w-3 h-3" />
                          <span>عرض ترويجي</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}

                      {/* Active Sorting Visual Highlight Badges */}
                      {sortBy === 'highest-rated' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 px-2 py-0.5 rounded-md">
                          <Star className="w-3 h-3 fill-current text-amber-500" />
                          <span>{rating}</span>
                        </span>
                      )}

                      {sortBy === 'most-demanded' && demandScore >= 80 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300/60 px-2 py-0.5 rounded-md">
                          <Flame className="w-3 h-3 text-rose-500" />
                          <span>عالي الطلب</span>
                        </span>
                      )}

                      {maxSavings > 0 && sortBy === 'biggest-discount' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300/60 px-2 py-0.5 rounded-md">
                          <Percent className="w-3 h-3 text-purple-600" />
                          <span>وفر {maxSavings.toFixed(1)} ر.س</span>
                        </span>
                      )}

                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                        {product.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onToggleWishlist && (
                        <button
                          type="button"
                          onClick={() => {
                            onToggleWishlist(product);
                            recordRecentlyViewed(product.id);
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isWishlisted
                              ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={isWishlisted ? 'إزالة من قائمة أمنياتي (المفضلة)' : 'إضافة إلى قائمة أمنياتي (المفضلة)'}
                        >
                          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                        </button>
                      )}

                      {onToggleCompare && (
                        <button
                          onClick={() => {
                            onToggleCompare(product);
                            recordRecentlyViewed(product.id);
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                            isCompared
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-600 hover:text-indigo-600 dark:text-slate-300'
                          }`}
                          title={isCompared ? 'إلغاء المقارنة' : 'إضافة إلى جدول المقارنة (حتى 3 سلع)'}
                        >
                          <Scale className="w-3.5 h-3.5" />
                          <span>{isCompared ? 'محدد' : 'قارن'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => onToggleAlert(product)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isAlerted
                            ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                            : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title="تنبيه عند انخفاض السعر"
                      >
                        <Bell className={`w-4 h-4 ${isAlerted ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Product Core Visual & Name */}
                  <div className="flex items-start gap-3 my-2.5">
                    {/* iPhone-Optimized Product Image Box with Floating Best Price Badge */}
                    <div className="relative shrink-0 flex flex-col items-center">
                      <div 
                        onClick={() => handleOpenStoreComparison(product)}
                        className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white dark:bg-slate-850 p-1.5 flex items-center justify-center border border-slate-200/90 dark:border-slate-700/80 overflow-hidden shadow-2xs group/img cursor-pointer active:scale-95 transition-transform"
                        title="اضغط لمعاينة تفاصيل مقارنة الأسعار في كافة المتاجر"
                      >
                        <ProductImage src={product.imageUrl} alt={product.nameAr} size="md" className="w-full h-full object-contain" />
                        
                        {/* iOS Floating Badge ON the Image */}
                        <div className="absolute bottom-1 inset-x-1 py-0.5 px-1 rounded-lg bg-emerald-700/95 dark:bg-emerald-600/95 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-black flex items-center justify-between shadow-xs border border-white/25">
                          <span className="truncate">الأرخص: {minPrice.toFixed(1)}</span>
                          {marketStats.savingsPercentVsAvg > 0 && (
                            <span className="bg-yellow-400 text-slate-950 px-1 rounded text-[7px] font-black shrink-0">
                              -{marketStats.savingsPercentVsAvg}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* iPhone Badge: Best Price vs Market Average */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStoreComparison(product);
                        }}
                        className="mt-1 w-full max-w-[80px] sm:max-w-[88px] py-1 px-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 border border-emerald-300/70 dark:border-emerald-700/70 text-[8.5px] sm:text-[9px] text-emerald-900 dark:text-emerald-300 font-black flex items-center justify-center gap-0.5 shadow-2xs active:scale-95 transition-all cursor-pointer truncate"
                        title={`أفضل سعر حالياً: ${minPrice.toFixed(2)} ر.س مقارنة بمتوسط السوق (${marketStats.avgPrice.toFixed(2)} ر.س). اضغط لرؤية تفاصيل مقارنة الأسعار.`}
                      >
                        <Scale className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="truncate">
                          {marketStats.savingsPercentVsAvg > 0 
                            ? `أقل ${marketStats.savingsPercentVsAvg}%` 
                            : 'أفضل سعر'}
                        </span>
                      </button>
                    </div>

                    <div 
                      onClick={() => handleOpenOfferModal(product, minStore || stores[0])}
                      className="flex-1 min-w-0 cursor-pointer group/item hover:bg-slate-50 dark:hover:bg-slate-800/40 p-1 -m-1 rounded-xl transition-colors"
                      title="اضغط هنا لفتح تفاصيل العرض والتخفيض"
                    >
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover/item:text-emerald-700 dark:group-hover/item:text-emerald-400 transition-colors">
                        {product.nameAr}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                        {product.nameEn}
                      </p>

                      {/* Product Rating & Unit Row - Clickable for Customer Reviews */}
                      <div className="mt-1.5 flex items-center justify-between gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenProductReviews) onOpenProductReviews(product);
                          }}
                          className="hover:opacity-80 transition-opacity cursor-pointer group/rate text-right"
                          title="اضغط لمعاينة جميع تقييمات العملاء وآرائهم أو كتابة تقييمك"
                        >
                          <StarRating rating={ratingData.rating} reviewsCount={ratingData.reviewsCount} size="xs" />
                        </button>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          العبوة: <span className="font-bold text-slate-700 dark:text-slate-300">{product.unit}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Best Price Callout Card */}
                  {minStore && (
                    <div 
                      onClick={() => handleOpenOfferModal(product, minStore as Store)}
                      className="mt-3 p-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between cursor-pointer hover:border-emerald-500 hover:shadow-sm transition-all group"
                      title="اضغط لفتح العرض بالكامل والتخفيض"
                    >
                      <div>
                        <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1">
                          <TrendingDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>الأرخص في: {(minStore as Store).name}</span>
                        </div>
                        <div className="text-lg font-black text-emerald-900 dark:text-emerald-200 mt-0.5">
                          {minPrice.toFixed(2)}{' '}
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">ر.س</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStoreComparison(product);
                          }}
                          className="px-2 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 hover:bg-emerald-200 dark:hover:bg-emerald-800 text-emerald-900 dark:text-emerald-200 text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 cursor-pointer shadow-2xs"
                          title="مقارنة أسعار كافة المتاجر بمتوسط السوق"
                        >
                          <Scale className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                          <span>مقارنة السوق</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenOfferModal(product, minStore as Store);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-black flex items-center gap-1 shadow-xs transition-colors cursor-pointer active:scale-95"
                          title={`فتح تفاصيل عرض ${product.nameAr}`}
                        >
                          <span>فتح العرض</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                        <StoreLogoBadge storeId={(minStore as Store).id} size="md" />
                      </div>
                    </div>
                  )}

                  {/* Mini Store Comparison Table */}
                  <div className="mt-3 space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      <span>مقارنة الأسعار بالمتاجر (اضغط للانتقال للمتجر):</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStoreComparison(product);
                        }}
                        className="text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-black active:scale-95 cursor-pointer"
                        title="فتح مقارنة تفصيلية لأسعار المتاجر بمتوسط السوق"
                      >
                        <Scale className="w-2.5 h-2.5" />
                        <span>فحص متوسط السوق</span>
                      </button>
                    </div>
                    <div className="space-y-1">
                      {stores.map((s) => {
                        const priceInfo = product.prices[s.id];
                        if (!priceInfo || !priceInfo.inStock) return null;
                        const isLowest = priceInfo.priceInclVat === minPrice;

                        return (
                          <div
                            key={s.id}
                            onClick={() => handleOpenOfferModal(product, s, priceInfo)}
                            className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                              isLowest 
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 font-bold text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                            title={`اضغط لمعاينة عرض ${s.name} والانتقال للشراء`}
                          >
                            <div className="flex items-center gap-2">
                              <StoreLogoBadge storeId={s.id} size="xs" />
                              <span className="text-xs">{s.name}</span>
                              {s.id === 'noon' && (
                                <span className="text-[9px] font-black bg-yellow-400 text-slate-950 px-1.5 py-0.2 rounded-md shadow-2xs">
                                  كود HKEEEM2
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {priceInfo.originalPrice && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 line-through">
                                  {priceInfo.originalPrice.toFixed(2)}
                                </span>
                              )}
                              <span className={isLowest ? 'text-emerald-700 dark:text-emerald-400 font-black' : 'font-medium'}>
                                {priceInfo.priceInclVat.toFixed(2)} ر.س
                              </span>
                              <a
                                href={getDirectOfferUrl(s, product, priceInfo)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (s.id === 'noon') {
                                    try {
                                      await navigator.clipboard.writeText('HKEEEM2');
                                      setToastData({
                                        title: 'تم نسخ كود نون HKEEEM2',
                                        message: 'تم نسخ كود الخصم (HKEEEM2) بنجاح! الصقه في نون لتفعيل الخصم واحتساب العمولة.',
                                        type: 'coupon',
                                      });
                                    } catch {}
                                  }
                                  trackEvent('direct_click_store_offer', {
                                    product_id: product.id,
                                    product_name: product.nameAr,
                                    store_id: s.id,
                                    store_name: s.name,
                                    coupon: s.id === 'noon' ? 'HKEEEM2' : undefined,
                                  });
                                }}
                                className={`p-1 rounded transition-colors ${
                                  s.id === 'noon'
                                    ? 'text-amber-800 dark:text-amber-300 hover:bg-yellow-400 hover:text-slate-950'
                                    : 'text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                                }`}
                                title={`فتح صفحة ${product.nameAr} مباشرة في ${s.name}${s.id === 'noon' ? ' وتطبيق كود HKEEEM2' : ''}`}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Noon KSA Official Affiliate Deal & Coupon Banner */}
                  {product.prices['noon']?.inStock && (
                    <div className="mt-2.5 p-2 rounded-xl bg-gradient-to-r from-amber-400/15 via-yellow-400/20 to-amber-500/15 border border-amber-400/50 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StoreLogoBadge storeId="noon" size="xs" />
                        <span className="text-[11px] font-black text-amber-950 dark:text-amber-200">
                          نون السعودية (كاش باك 10% حتى 75 ر.س)
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {NOON_CAMPAIGN_COUPONS.map((nc) => (
                            <button
                              key={nc.code}
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await navigator.clipboard.writeText(nc.code);
                                  setToastData({
                                    title: `تم نسخ كود نون ${nc.code}`,
                                    message: `تم نسخ الكود (${nc.code}) بنجاح! الصقه عند الدفع في نون للحصول على كاش باك 10% حتى 75 ر.س (سارٍ حتى 31 ديسمبر 2026).`,
                                    type: 'coupon',
                                  });
                                } catch {}
                              }}
                              className="text-[9px] bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black px-1.5 py-0.5 rounded shadow-2xs flex items-center gap-0.5 cursor-pointer active:scale-95 transition-transform"
                              title={`نسخ كود خصم نون ${nc.code} (${nc.badgeAr})`}
                            >
                              <span>{nc.code}</span>
                              <Copy className="w-2.5 h-2.5" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <a
                        href={getDirectOfferUrl({ id: 'noon', name: 'نون' } as any, product, product.prices['noon'])}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText('HKEEEM2');
                          } catch {}
                          trackEvent('direct_click_noon_affiliate', {
                            product_id: product.id,
                            product_name: product.nameAr,
                            coupon: 'HKEEEM2',
                            url: getDirectOfferUrl({ id: 'noon', name: 'نون' } as any, product, product.prices['noon']),
                          });
                        }}
                        className="text-[10px] font-black text-amber-900 dark:text-amber-300 hover:underline flex items-center gap-0.5 shrink-0"
                        title="شراء من نون برابط التتبع التسويقي المعتمد"
                      >
                        <span>اشترِ من نون</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}

                  {/* Alhkmy.store Official Direct Deal Badge */}
                  {product.prices['alhkmystore']?.inStock && (
                    <div className="mt-2.5 p-2 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300">
                          متوفر في alhkmy.store
                        </span>
                        <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded shadow-2xs">
                          كود 570C
                        </span>
                      </div>
                      <a
                        href={product.prices['alhkmystore'].offerUrl || `https://alhkmy.store/search?q=${encodeURIComponent(product.nameAr)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          trackEvent('direct_click_alhkmy_store', {
                            product_id: product.id,
                            product_name: product.nameAr,
                          });
                        }}
                        className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                        title="طلب السلعة مباشرة من متجر حكيم"
                      >
                        <span>طلب مباشر</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}

                  {/* Nutrition & Macronutrients Label */}
                  {product.nutrition && (
                    <NutritionLabel
                      nutrition={product.nutrition}
                      productName={product.nameAr}
                    />
                  )}

                  {/* Healthy Alternative Tip */}
                  {product.healthyAlternative && (
                    <div className="mt-3 p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200">
                      <span className="font-bold text-amber-950 dark:text-amber-300">بديل صحي وموفر: </span>
                      <span>{product.healthyAlternative.nameAr} - {product.healthyAlternative.benefitAr}</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action: Add to Cart */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {quantity === 0 ? (
                    <button
                      onClick={() => {
                        onAddToCart(product);
                        recordRecentlyViewed(product.id);
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>أضف إلى السلة المقترحة</span>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl p-1">
                      <button
                        onClick={() => {
                          onAddToCart(product);
                          recordRecentlyViewed(product.id);
                        }}
                        className="w-8 h-8 rounded-lg bg-emerald-700 dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-emerald-800"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                        {quantity} في السلة
                      </span>
                      <button
                        onClick={() => onAddToCart({ ...product, id: product.id })}
                        className="text-xs text-emerald-700 dark:text-emerald-400 px-2 font-bold hover:underline"
                      >
                        مضاف للسلة
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          };

        if (shouldShowGroupedByStoreType) {
          return (
            <div id="products-grid-section" className="space-y-8">
              {groupedProductsByStoreType.map((group) => {
                const isExpanded = Boolean(expandedStoreTypeIds[group.category.id]);
                const displayedProducts = isExpanded
                  ? group.products
                  : group.products.slice(0, 3);
                const hiddenCount = group.products.length - displayedProducts.length;

                return (
                  <section
                    key={`store-type-group-${group.category.id}`}
                    aria-labelledby={`store-type-heading-${group.category.id}`}
                    className="space-y-4 pt-2"
                  >
                    {/* Store-Type Section Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shrink-0">
                          <GlassCategoryIcon categoryId={group.category.id} className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <h3
                              id={`store-type-heading-${group.category.id}`}
                              className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white"
                            >
                              {group.category.labelAr}
                            </h3>
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                              {group.category.labelEn}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                              {group.products.length} سلعة
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {group.stores.length} متاجر
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-xl">
                              {group.stores.map((s) => s.name).join('، ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="hidden sm:flex items-center -space-x-1 space-x-reverse ml-1">
                          {group.stores.slice(0, 4).map((st) => (
                            <StoreLogoBadge
                              key={`${group.category.id}-logo-${st.id}`}
                              storeId={st.id}
                              size="xs"
                            />
                          ))}
                        </div>

                        {group.products.length > 3 && (
                          <button
                            type="button"
                            onClick={() => toggleExpandStoreType(group.category.id)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {isExpanded ? (
                              <>
                                <span>إظهار أقل</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <span>عرض المزيد (+{hiddenCount})</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            handleSelectStoreCategory(group.category.id);
                            document
                              .getElementById('products-grid-section')
                              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          تصفية القسم
                        </button>
                      </div>
                    </div>

                    {/* Section Products Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayedProducts.map((product) =>
                        renderProductCard(product, group.category.id, group.storeIds)
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          );
        }

        const activeStoreTypeIds =
          selectedCategory !== 'all'
            ? new Set(stores.filter((s) => s.category === selectedCategory).map((s) => s.id))
            : undefined;

        return (
          <div id="products-grid-section" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) =>
              renderProductCard(product, 'grid', activeStoreTypeIds)
            )}
          </div>
        );
      })()}

      {/* Recently Viewed Products Section (شوهد مؤخراً) */}
      {(() => {
        const recentlyViewedProducts = recentlyViewedIds
          .map((id) => products.find((p) => p.id === id))
          .filter((p): p is Product => Boolean(p));

        if (recentlyViewedProducts.length === 0) return null;

        return (
          <div className="mt-12 pt-8 border-t-2 border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shadow-xs">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      شوهد مؤخراً (Recently Viewed)
                    </h3>
                    <span className="text-[11px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-300/50">
                      {recentlyViewedProducts.length} سلع
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    السلع التي تفاعلت معها مؤخراً لتسهيل المقارنة السريعة وإتمام الشراء بنقرة واحدة
                  </p>
                </div>
              </div>

              <button
                onClick={clearRecentlyViewed}
                className="text-xs font-bold text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                title="مسح سجل السلع التي شوهدت مؤخراً"
              >
                <X className="w-3.5 h-3.5" />
                <span>مسح السجل</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {recentlyViewedProducts.map((p) => {
                const { minPrice, minStore } = getLowestPrice(p);
                const rData = getProductRatingData(p);

                return (
                  <div
                    key={`recent-${p.id}`}
                    onClick={() => handleOpenOfferModal(p, minStore || stores[0])}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-400/80 dark:hover:border-amber-500/80 p-3 flex flex-col justify-between group transition-all shadow-xs hover:shadow-md cursor-pointer relative"
                  >
                    {/* Remove single item button */}
                    <button
                      type="button"
                      onClick={(e) => removeRecentlyViewedItem(p.id, e)}
                      className="absolute top-2 left-2 w-5 h-5 rounded-full bg-slate-100/90 dark:bg-slate-800/90 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/60 text-slate-400 flex items-center justify-center transition-colors z-10 cursor-pointer shadow-xs"
                      title="إزالة من قائمة شوهد مؤخراً"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    <div>
                      <div className="aspect-square w-full rounded-xl bg-slate-50 dark:bg-slate-850 p-2 flex items-center justify-center mb-2 overflow-hidden group-hover:scale-105 transition-transform duration-200 relative">
                        <ProductImage src={p.imageUrl} alt={p.nameAr} size="sm" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStoreComparison(p);
                          }}
                          className="absolute bottom-1 inset-x-1 py-0.5 px-1 rounded-md bg-emerald-700/95 dark:bg-emerald-600/95 backdrop-blur-xs text-white text-[7.5px] font-black flex items-center justify-center gap-0.5 shadow-2xs active:scale-95 transition-transform cursor-pointer"
                          title="مقارنة أسعار المتاجر بمتوسط السوق"
                        >
                          <Scale className="w-2 h-2 text-amber-300" />
                          <span>أفضل سعر</span>
                        </button>
                      </div>

                      <span className="text-[9px] font-bold text-slate-400 block truncate">
                        {p.category}
                      </span>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {p.nameAr}
                      </h4>

                      {/* Visual Star Rating */}
                      <div className="mt-1">
                        <StarRating rating={rData.rating} reviewsCount={rData.reviewsCount} size="xs" />
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                      <div>
                        <span className="text-[9px] text-slate-400 block truncate">
                          {minStore?.name || 'أقل سعر'}
                        </span>
                        <div className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400">
                          {minPrice.toFixed(2)} <span className="text-[10px]">ر.س</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(p);
                          recordRecentlyViewed(p.id);
                        }}
                        className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                        title={`إضافة ${p.nameAr} إلى السلة`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Toast Notification */}
      <OfferToastNotification toast={toastData} onClose={() => setToastData(null)} />

      {/* Offer Details & Direct Store Redirect Modal */}
      <OfferDetailsModal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        product={modalProduct}
        store={modalStore}
        priceInfo={modalPriceInfo}
        stores={stores}
        onAddToCart={onAddToCart}
      />

      {/* Store Price Comparison vs Market Average Modal (iPhone / iOS Optimized Bottom Sheet) */}
      <StorePriceComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        product={comparisonProduct}
        stores={stores}
        onAddToCart={onAddToCart}
        onOpenStoreOffer={(p, s, pi) => {
          setIsComparisonModalOpen(false);
          handleOpenOfferModal(p, s, pi);
        }}
      />
    </div>
  );
};

