import { CartItem, PastOrder, Product, Store } from '../types';
import { getMarketPriceStats } from './marketPrice';

export type RecommendationMode = 'all' | 'history' | 'views' | 'deals';

export type RecommendationReasonType =
  | 'history'
  | 'views'
  | 'restock'
  | 'preferred-store'
  | 'savings';

export interface RecommendedProduct {
  product: Product;
  score: number;
  historyScore: number;
  viewsScore: number;
  valueScore: number;
  reasonType: RecommendationReasonType;
  reasonTextAr: string;
  secondaryContextAr?: string;
  minPrice: number;
  avgPrice: number;
  minStore: Store | null;
  savingsPercentVsAvg: number;
  hasPromo: boolean;
  isPreviouslyBought: boolean;
  inCartQuantity: number;
}

export interface RecommendationProfileSummary {
  ordersAnalyzed: number;
  viewsAnalyzed: number;
  topCategories: string[];
  preferredStores: string[];
  totalHistoryItemsAnalyzed: number;
}

export interface PersonalizedRecommendationsResult {
  recommendations: RecommendedProduct[];
  profile: RecommendationProfileSummary;
}

/**
 * Normalizes related Arabic category names across past orders and the live product catalog
 * so shopping history categories cleanly match catalog categories.
 */
const CATEGORY_GROUPS: Record<string, string[]> = {
  'ألبان وأجبان': ['ألبان وأجبان', 'ألبان'],
  'مؤن وحبوب': ['مؤن وحبوب', 'معلبات ومؤن'],
  'لحوم ودواجن': ['لحوم ودواجن'],
  'زيوت ودهون': ['زيوت ودهون'],
  'عناية ومنظفات': ['عناية ومنظفات', 'عناية وصحة', 'عناية وأطفال'],
  'مشروبات وقهوة': ['مشروبات وقهوة', 'مشروبات ومؤن', 'أجهزة منزلية وقهوة'],
  'إلكترونيات وتكنولوجيا': ['إلكترونيات وتكنولوجيا', 'أجهزة ذكية ومنزلية'],
  'عود وعطور فاخرة': ['عود وعطور فاخرة'],
};

const getRelatedCategoryKey = (category: string): string => {
  const normalized = category.trim();
  for (const [canonical, members] of Object.entries(CATEGORY_GROUPS)) {
    if (members.some((m) => m === normalized || normalized.includes(m) || m.includes(normalized))) {
      return canonical;
    }
  }
  return normalized;
};

const tokenizeArabicAndEnglish = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[()\[\].,،\-_/]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3);
};

const STORE_NAME_SYNONYMS: Record<string, string[]> = {
  alhkmystore: ['متجر حكيم', 'alhkmy'],
  othaim: ['العثيم', 'othaim'],
  panda: ['بنده', 'هايبر بنده', 'panda'],
  carrefour: ['كارفور', 'carrefour'],
  danube: ['الدانوب', 'danube'],
  lulu: ['لولو', 'lulu'],
  amazon: ['أمازون', 'amazon'],
  noon: ['نون', 'noon'],
  tamimi: ['التميمي', 'tamimi'],
  nahdi: ['النهدي', 'nahdi'],
};

const resolveStoreIdsFromLabel = (label: string): string[] => {
  const lower = label.toLowerCase();
  const matched: string[] = [];
  Object.entries(STORE_NAME_SYNONYMS).forEach(([storeId, keywords]) => {
    if (keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      matched.push(storeId);
    }
  });
  return matched;
};

/**
 * Simple, transparent client-side Personalized Recommendations engine.
 * Combines:
 *  1. Shopping History Affinity (category spend, purchase frequency, recency, restock overlap)
 *  2. Previous Views Similarity (recency-weighted viewed categories, tags, and price bracket)
 *  3. Preferred Store & Market Value (savings vs market average, active promotions, cashback)
 */
export function computePersonalizedRecommendations(params: {
  products: Product[];
  stores: Store[];
  pastOrders: PastOrder[];
  recentlyViewedIds: string[];
  cart?: CartItem[];
  dismissedIds?: string[];
  mode?: RecommendationMode;
  limit?: number;
}): PersonalizedRecommendationsResult {
  const {
    products,
    stores,
    pastOrders,
    recentlyViewedIds,
    cart = [],
    dismissedIds = [],
    mode = 'all',
    limit = 4,
  } = params;

  const dismissedSet = new Set(dismissedIds);
  const cartQtyMap = new Map<string, number>();
  cart.forEach((item) => {
    cartQtyMap.set(item.product.id, (cartQtyMap.get(item.product.id) || 0) + item.quantity);
  });

  // 1. Analyze Shopping History (pastOrders)
  const historyCategoryWeights = new Map<string, number>();
  const historyCategoryRawLabels = new Map<string, string>();
  const historyKeywordWeights = new Map<string, number>();
  const preferredStoreWeights = new Map<string, number>();
  let totalHistoryItemsAnalyzed = 0;

  pastOrders.forEach((order, orderIndex) => {
    // Recency decay: newest orders carry higher weight
    const recencyWeight = 1 / (1 + orderIndex * 0.25);

    // Preferred stores from order header
    resolveStoreIdsFromLabel(order.store).forEach((storeId) => {
      preferredStoreWeights.set(storeId, (preferredStoreWeights.get(storeId) || 0) + 2.5 * recencyWeight);
    });

    // Category spend share & frequency
    if (order.categories && order.categories.length > 0) {
      order.categories.forEach((catEntry) => {
        const key = getRelatedCategoryKey(catEntry.category);
        const weight = ((catEntry.percentage || 15) / 20 + (catEntry.itemCount || 1) * 0.6) * recencyWeight;
        historyCategoryWeights.set(key, (historyCategoryWeights.get(key) || 0) + weight);
        if (!historyCategoryRawLabels.has(key)) {
          historyCategoryRawLabels.set(key, catEntry.category);
        }
      });
    }

    // Purchased line items
    if (order.items && order.items.length > 0) {
      order.items.forEach((item) => {
        totalHistoryItemsAnalyzed += item.quantity || 1;
        const key = getRelatedCategoryKey(item.category);
        historyCategoryWeights.set(key, (historyCategoryWeights.get(key) || 0) + 1.4 * recencyWeight);
        if (!historyCategoryRawLabels.has(key)) {
          historyCategoryRawLabels.set(key, item.category);
        }

        if (item.storeName) {
          resolveStoreIdsFromLabel(item.storeName).forEach((storeId) => {
            preferredStoreWeights.set(storeId, (preferredStoreWeights.get(storeId) || 0) + 1.2 * recencyWeight);
          });
        }

        tokenizeArabicAndEnglish(item.name).forEach((token) => {
          historyKeywordWeights.set(token, (historyKeywordWeights.get(token) || 0) + 1.5 * recencyWeight);
        });
      });
    } else {
      totalHistoryItemsAnalyzed += order.itemsCount || 0;
    }
  });

  // Normalize max history category weight
  const maxHistoryCatWeight = Math.max(1, ...Array.from(historyCategoryWeights.values()));

  // 2. Analyze Previous Views (recentlyViewedIds)
  const viewedProducts = recentlyViewedIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const viewedCategoryWeights = new Map<string, number>();
  const viewedTagWeights = new Map<string, number>();
  const viewedByCategorySource = new Map<string, Product>();
  const viewedByTagSource = new Map<string, Product>();
  const viewedPriceLogs: number[] = [];

  viewedProducts.forEach((vp, index) => {
    const recencyWeight = 1 / (1 + index * 0.35);
    const catKey = getRelatedCategoryKey(vp.category);
    viewedCategoryWeights.set(catKey, (viewedCategoryWeights.get(catKey) || 0) + 2.5 * recencyWeight);
    if (!viewedByCategorySource.has(catKey)) {
      viewedByCategorySource.set(catKey, vp);
    }

    vp.tags.forEach((tag) => {
      const normalizedTag = tag.trim().toLowerCase();
      viewedTagWeights.set(normalizedTag, (viewedTagWeights.get(normalizedTag) || 0) + 2.0 * recencyWeight);
      if (!viewedByTagSource.has(normalizedTag)) {
        viewedByTagSource.set(normalizedTag, vp);
      }
    });

    const stats = getMarketPriceStats(vp, stores);
    if (stats.minPrice > 0) {
      viewedPriceLogs.push(Math.log10(stats.minPrice + 1));
    }
  });

  const maxViewedCatWeight = Math.max(1, ...Array.from(viewedCategoryWeights.values()));
  const avgViewedPriceLog =
    viewedPriceLogs.length > 0
      ? viewedPriceLogs.reduce((acc, v) => acc + v, 0) / viewedPriceLogs.length
      : null;

  // Cart complementary category boost (lightweight signal)
  const cartCategoryKeys = new Set(cart.map((c) => getRelatedCategoryKey(c.product.category)));

  // Top categories & preferred stores for profile summary
  const topCategories = Array.from(historyCategoryWeights.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => historyCategoryRawLabels.get(key) || key);

  const preferredStores = Array.from(preferredStoreWeights.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([storeId]) => stores.find((s) => s.id === storeId)?.name)
    .filter((name): name is string => Boolean(name));

  // 3. Score Every Candidate Product
  const viewedIdSet = new Set(recentlyViewedIds);
  const scored: RecommendedProduct[] = [];

  products.forEach((product) => {
    if (dismissedSet.has(product.id)) return;

    const marketStats = getMarketPriceStats(product, stores);
    const catKey = getRelatedCategoryKey(product.category);
    const inCartQty = cartQtyMap.get(product.id) || 0;
    const isMostRecentlyViewed = recentlyViewedIds[0] === product.id;

    // --- A. History Score (0 to 42) ---
    const rawHistCat = historyCategoryWeights.get(catKey) || 0;
    let historyScore = (rawHistCat / maxHistoryCatWeight) * 26;

    const productTokens = new Set([
      ...tokenizeArabicAndEnglish(product.nameAr),
      ...product.tags.map((t) => t.toLowerCase()),
    ]);

    let tokenOverlapWeight = 0;
    productTokens.forEach((tok) => {
      if (historyKeywordWeights.has(tok)) {
        tokenOverlapWeight += historyKeywordWeights.get(tok) || 0;
      }
    });

    const isPreviouslyBought = tokenOverlapWeight >= 2.2;
    historyScore += Math.min(16, tokenOverlapWeight * 3.2);

    // --- B. Views Score (0 to 36) ---
    const rawViewCat = viewedCategoryWeights.get(catKey) || 0;
    let viewsScore = (rawViewCat / maxViewedCatWeight) * 18;

    let matchedTagWeight = 0;
    let matchedViewSource: Product | null = viewedByCategorySource.get(catKey) || null;
    product.tags.forEach((tag) => {
      const nt = tag.trim().toLowerCase();
      const w = viewedTagWeights.get(nt) || 0;
      if (w > 0) {
        matchedTagWeight += w;
        const src = viewedByTagSource.get(nt);
        if (src && src.id !== product.id) {
          matchedViewSource = src;
        }
      }
    });

    // If matched source is the same product, look for another viewed product in same category
    if (matchedViewSource && matchedViewSource.id === product.id) {
      matchedViewSource =
        viewedProducts.find(
          (vp) => vp.id !== product.id && getRelatedCategoryKey(vp.category) === catKey
        ) || null;
    }

    viewsScore += Math.min(12, matchedTagWeight * 3.5);

    // Price tier similarity with recently viewed items
    if (avgViewedPriceLog !== null && marketStats.minPrice > 0) {
      const prodLog = Math.log10(marketStats.minPrice + 1);
      const dist = Math.abs(prodLog - avgViewedPriceLog);
      viewsScore += Math.max(0, 6 - dist * 5);
    }

    // Slight novelty boost for unseen similar items over exact already-viewed items
    if (viewedIdSet.has(product.id)) {
      viewsScore = isMostRecentlyViewed ? viewsScore * 0.45 : viewsScore * 0.72;
    }

    // --- C. Value & Store Affinity Score (0 to 25) ---
    let valueScore = 0;
    const hasPromo = Object.values(product.prices).some(
      (pi) => pi.inStock && (pi.isPromo || (pi.originalPrice && pi.originalPrice > pi.priceInclVat))
    );

    if (marketStats.savingsPercentVsAvg > 0) {
      valueScore += Math.min(12, marketStats.savingsPercentVsAvg * 0.65);
    }
    if (hasPromo) valueScore += 5;
    if (product.cashbackPercentage) valueScore += Math.min(4, product.cashbackPercentage * 0.35);

    const bestStorePrefWeight = marketStats.minStore
      ? preferredStoreWeights.get(marketStats.minStore.id) || 0
      : 0;
    if (bestStorePrefWeight > 0) {
      valueScore += Math.min(6, bestStorePrefWeight * 1.1);
    }

    // Light complementary boost if category is in current cart, but reduce exact duplicate already in cart
    if (inCartQty > 0) {
      historyScore *= 0.68;
      viewsScore *= 0.68;
    } else if (cartCategoryKeys.has(catKey)) {
      valueScore += 3;
    }

    // --- Mode-Weighted Total Score ---
    let totalScore = 0;
    if (mode === 'history') {
      totalScore = historyScore * 1.45 + valueScore * 0.55 + viewsScore * 0.25;
    } else if (mode === 'views') {
      totalScore = viewsScore * 1.5 + valueScore * 0.5 + historyScore * 0.25;
    } else if (mode === 'deals') {
      totalScore = valueScore * 1.8 + historyScore * 0.45 + viewsScore * 0.35;
    } else {
      totalScore = historyScore + viewsScore + valueScore;
    }

    // --- Determine Human-Readable Arabic Reason ---
    let reasonType: RecommendationReasonType = 'savings';
    let reasonTextAr = `أقل بـ ${marketStats.savingsPercentVsAvg}% عن متوسط السوق`;
    let secondaryContextAr: string | undefined;

    if (mode === 'deals' && marketStats.savingsPercentVsAvg >= 8) {
      reasonType = 'savings';
      reasonTextAr = `توفير ${marketStats.savingsPercentVsAvg}% عن متوسط السوق في ${marketStats.minStore?.name || 'أرخص متجر'}`;
    } else if (isPreviouslyBought && inCartQty === 0 && (mode === 'all' || mode === 'history')) {
      reasonType = 'restock';
      reasonTextAr = 'مقترح لإعادة التعبئة بناءً على طلباتك السابقة';
      if (marketStats.minStore) {
        secondaryContextAr = `أفضل سعر اليوم في ${marketStats.minStore.name}`;
      }
    } else if (
      (mode === 'views' || viewsScore >= historyScore) &&
      matchedViewSource &&
      viewsScore >= 12
    ) {
      reasonType = 'views';
      const shortName =
        matchedViewSource.nameAr.length > 26
          ? `${matchedViewSource.nameAr.slice(0, 26)}…`
          : matchedViewSource.nameAr;
      reasonTextAr = `مشابه لـ «${shortName}» الذي شاهدته مؤخراً`;
    } else if (rawHistCat > 0 && (mode === 'history' || historyScore >= 14)) {
      reasonType = 'history';
      const label = historyCategoryRawLabels.get(catKey) || product.category;
      reasonTextAr = `لأنك تتسوق بانتظام من فئة «${label}»`;
    } else if (bestStorePrefWeight > 0 && marketStats.minStore) {
      reasonType = 'preferred-store';
      reasonTextAr = `متوفر بأقل سعر في متجرك المفضل (${marketStats.minStore.name})`;
    } else if (marketStats.savingsPercentVsAvg > 0) {
      reasonType = 'savings';
      reasonTextAr = `وفر ${marketStats.savingsPercentVsAvg}% مقارنة بمتوسط أسعار السوق`;
    } else {
      reasonType = 'savings';
      reasonTextAr = `اختيار مناسب ضمن فئة ${product.category}`;
    }

    scored.push({
      product,
      score: Math.round(totalScore),
      historyScore: Math.round(historyScore),
      viewsScore: Math.round(viewsScore),
      valueScore: Math.round(valueScore),
      reasonType,
      reasonTextAr,
      secondaryContextAr,
      minPrice: marketStats.minPrice,
      avgPrice: marketStats.avgPrice,
      minStore: marketStats.minStore,
      savingsPercentVsAvg: marketStats.savingsPercentVsAvg,
      hasPromo,
      isPreviouslyBought,
      inCartQuantity: inCartQty,
    });
  });

  // Sort by score descending, with savings percent as tie-breaker
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.savingsPercentVsAvg - a.savingsPercentVsAvg;
  });

  // Light category diversity: avoid returning 4 identical-category products in 'all' mode when others are strong
  const selected: RecommendedProduct[] = [];
  if (mode === 'all' && scored.length > limit) {
    const categoryCounts = new Map<string, number>();
    const overflow: RecommendedProduct[] = [];

    for (const item of scored) {
      const cKey = getRelatedCategoryKey(item.product.category);
      const count = categoryCounts.get(cKey) || 0;
      if (count < 2) {
        selected.push(item);
        categoryCounts.set(cKey, count + 1);
      } else {
        overflow.push(item);
      }
      if (selected.length === limit) break;
    }

    while (selected.length < limit && overflow.length > 0) {
      const next = overflow.shift();
      if (next) selected.push(next);
    }
  } else {
    selected.push(...scored.slice(0, limit));
  }

  return {
    recommendations: selected,
    profile: {
      ordersAnalyzed: pastOrders.length,
      viewsAnalyzed: viewedProducts.length,
      topCategories,
      preferredStores,
      totalHistoryItemsAnalyzed,
    },
  };
}
