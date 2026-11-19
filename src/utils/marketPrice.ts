import { Product, Store, StorePriceInfo } from '../types';

export interface StorePriceComparisonItem {
  store: Store;
  priceInfo: StorePriceInfo;
  price: number;
  diffFromAvg: number;
  diffPercent: number;
  isLowest: boolean;
  savingsVsStore: number;
}

export interface MarketPriceStats {
  minPrice: number;
  minStore: Store | null;
  avgPrice: number;
  maxPrice: number;
  savingsVsAvg: number;
  savingsPercentVsAvg: number;
  availableStoresCount: number;
  storePrices: StorePriceComparisonItem[];
}

/**
 * Calculates market price statistics for a given product across all available stores.
 * Computes the lowest price, market average price, maximum price, and individual store variances.
 */
export const getMarketPriceStats = (product: Product, stores: Store[]): MarketPriceStats => {
  const storePrices: StorePriceComparisonItem[] = [];
  let minPrice = Infinity;
  let minStore: Store | null = null;
  let maxPrice = 0;
  let sumPrice = 0;
  let count = 0;

  stores.forEach((store) => {
    const priceInfo = product.prices[store.id];
    if (priceInfo && priceInfo.inStock && priceInfo.priceInclVat > 0) {
      const price = priceInfo.priceInclVat;
      sumPrice += price;
      count++;
      if (price < minPrice) {
        minPrice = price;
        minStore = store;
      }
      if (price > maxPrice) {
        maxPrice = price;
      }
    }
  });

  if (count === 0 || minPrice === Infinity) {
    const fallback = Object.values(product.prices)[0]?.priceInclVat || 10;
    return {
      minPrice: fallback,
      minStore: stores[0] || null,
      avgPrice: fallback,
      maxPrice: fallback,
      savingsVsAvg: 0,
      savingsPercentVsAvg: 0,
      availableStoresCount: 0,
      storePrices: [],
    };
  }

  const avgPrice = Number((sumPrice / count).toFixed(2));
  const savingsVsAvg = Math.max(0, Number((avgPrice - minPrice).toFixed(2)));
  const savingsPercentVsAvg = avgPrice > 0 ? Math.round((savingsVsAvg / avgPrice) * 100) : 0;

  stores.forEach((store) => {
    const priceInfo = product.prices[store.id];
    if (priceInfo && priceInfo.inStock && priceInfo.priceInclVat > 0) {
      const price = priceInfo.priceInclVat;
      const diffFromAvg = Number((price - avgPrice).toFixed(2));
      const diffPercent = avgPrice > 0 ? Math.round(((price - avgPrice) / avgPrice) * 100) : 0;
      const savingsVsStore = Math.max(0, Number((price - minPrice).toFixed(2)));

      storePrices.push({
        store,
        priceInfo,
        price,
        diffFromAvg,
        diffPercent,
        isLowest: price === minPrice,
        savingsVsStore,
      });
    }
  });

  // Sort lowest price first
  storePrices.sort((a, b) => a.price - b.price);

  return {
    minPrice,
    minStore,
    avgPrice,
    maxPrice,
    savingsVsAvg,
    savingsPercentVsAvg,
    availableStoresCount: count,
    storePrices,
  };
};
