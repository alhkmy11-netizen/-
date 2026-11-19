import React, { useState, useMemo } from 'react';
import { Product, Store, StoreMarketType, StorePriceInfo } from '../types';
import { STORE_MARKET_OPTIONS } from '../data/hkeeemData';
import { Table2, Plus, Check, RefreshCw, Sparkles, ExternalLink, Globe, Store as StoreIcon } from 'lucide-react';
import { MatrixTableSkeleton } from './Skeletons';
import { StoreLogoBadge, ProductImage } from './SmartIcon';
import { OfferDetailsModal } from './OfferDetailsModal';
import { OfferToastNotification, ToastData } from './OfferToastNotification';
import { getDirectOfferUrl } from '../utils/storeLinks';

interface StoreMatrixViewProps {
  products: Product[];
  stores: Store[];
  onAddToCart: (product: Product) => void;
  isLoading?: boolean;
}

export const StoreMatrixView: React.FC<StoreMatrixViewProps> = ({
  products,
  stores,
  onAddToCart,
  isLoading = false,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedMarket, setSelectedMarket] = useState<StoreMarketType>('all');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [isFilterTransition, setIsFilterTransition] = useState(false);

  // Offer Modal State
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [modalStore, setModalStore] = useState<Store | null>(null);
  const [modalPriceInfo, setModalPriceInfo] = useState<StorePriceInfo | null>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [toastData, setToastData] = useState<ToastData | null>(null);

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const handleSelectCategory = (cat: string) => {
    if (cat === filterCategory) return;
    setIsFilterTransition(true);
    setFilterCategory(cat);
    setTimeout(() => setIsFilterTransition(false), 250);
  };

  const handleSelectMarket = (market: StoreMarketType) => {
    if (market === selectedMarket) return;
    setIsFilterTransition(true);
    setSelectedMarket(market);
    setTimeout(() => setIsFilterTransition(false), 220);
  };

  const isViewLoading = isLoading || isFilterTransition;

  // Filter stores by Saudi / Chinese / American market
  const displayedStores = useMemo(() => {
    if (selectedMarket === 'all') return stores;
    return stores.filter((s) => (s.market || 'saudi') === selectedMarket);
  }, [stores, selectedMarket]);

  // Count per market
  const marketCounts = useMemo(() => {
    return {
      all: stores.length,
      saudi: stores.filter((s) => (s.market || 'saudi') === 'saudi').length,
      chinese: stores.filter((s) => s.market === 'chinese').length,
      american: stores.filter((s) => s.market === 'american').length,
    };
  }, [stores]);

  const filteredProducts = useMemo(() => {
    const byCategory =
      filterCategory === 'all'
        ? products
        : products.filter((p) => p.category === filterCategory);

    if (selectedMarket === 'all') return byCategory;

    // Show products that are available in at least one store of the selected market first
    const matching = byCategory.filter((p) =>
      displayedStores.some((s) => p.prices[s.id]?.inStock)
    );
    return matching.length > 0 ? matching : byCategory;
  }, [products, filterCategory, selectedMarket, displayedStores]);

  const getMarketBadge = (store: Store) => {
    const m = store.market || 'saudi';
    if (m === 'chinese') {
      return {
        label: '🇨🇳 متجر صيني',
        classes: 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/60',
      };
    }
    if (m === 'american') {
      return {
        label: '🇺🇸 متجر أمريكي',
        classes: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
      };
    }
    return {
      label: '🇸🇦 متجر سعودي',
      classes: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    };
  };

  const handleAdd = (product: Product) => {
    onAddToCart(product);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1500);
  };

  const handleOpenOffer = (product: Product, store: Store, priceInfo?: StorePriceInfo) => {
    setModalProduct(product);
    setModalStore(store);
    setModalPriceInfo(priceInfo || product.prices[store.id] || null);
    setIsOfferModalOpen(true);

    // Welcoming Toast Notification
    setToastData({
      title: 'مرحباً بك! تم توجيهك إلى تفاصيل العرض',
      message: `تم فتح تفاصيل العرض لـ "${product.nameAr}" في ${store.name}. تسوقاً موفراً وممتعاً!`,
      storeName: store.name,
      storeId: store.id,
      productName: product.nameAr,
    });
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-emerald-500 text-white font-black">
                <Table2 className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold">
                مقارن الأسعار الشامل (السعودية • الصين • أمريكا)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              جدول مقارنة شفاف يعرض أسعار السلع جنباً إلى جنب بين المتاجر السعودية، والمتاجر الصينية، والمتاجر الأمريكية. اللون الأخضر يوضح السعر الأقل لكل سلعة.
            </p>
          </div>

          {isViewLoading && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 text-xs font-bold text-emerald-200 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-300" />
              <span>جاري مزامنة أسعار المتاجر...</span>
            </div>
          )}
        </div>
      </div>

      {/* Store Origin / Market Selector Panel (Saudi / Chinese / American) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                قائمة المتاجر حسب السوق (سعودي • متجر صيني • متجر أمريكي)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                اختر سوق المتاجر للمقارنة الفورية بين المتاجر المحلية والعالمية
              </p>
            </div>
          </div>

          {/* Dropdown Menu Selector */}
          <div className="flex items-center gap-2">
            <label htmlFor="store-market-select" className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
              قائمة المتاجر:
            </label>
            <select
              id="store-market-select"
              value={selectedMarket}
              onChange={(e) => handleSelectMarket(e.target.value as StoreMarketType)}
              className="px-3 py-2 rounded-xl text-xs font-black bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
            >
              {STORE_MARKET_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.flag} {opt.labelAr} ({marketCounts[opt.id]})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Interactive Market Filter Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STORE_MARKET_OPTIONS.map((opt) => {
            const isActive = selectedMarket === opt.id;
            const count = marketCounts[opt.id];
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelectMarket(opt.id)}
                className={`p-2.5 sm:p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isActive
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/25'
                    : 'bg-slate-50/80 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50/60 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg shrink-0">{opt.flag}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-black truncate">{opt.labelAr}</div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-400'}`}>
                      {opt.labelEn}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Stores Strip in Selected Market */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 ml-1">
            <StoreIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>المتاجر المعروضة ({displayedStores.length}):</span>
          </span>
          {displayedStores.map((st) => {
            const badge = getMarketBadge(st);
            return (
              <span
                key={st.id}
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${badge.classes}`}
              >
                <span>{st.name}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Product Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleSelectCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              filterCategory === cat
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {cat === 'all' ? 'جميع التصنيفات' : cat}
          </button>
        ))}
      </div>

      {/* Comparison Matrix Table or Skeleton */}
      {isViewLoading ? (
        <MatrixTableSkeleton storeCount={displayedStores.length} rowCount={8} />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold">
              <tr>
                <th className="p-3.5 sticky right-0 bg-slate-50 dark:bg-slate-850 z-10 min-w-[190px] sm:min-w-[210px]">
                  السلعة
                </th>
                <th className="p-3.5 min-w-[95px]">العبوة</th>
                {displayedStores.map((s) => {
                  const badge = getMarketBadge(s);
                  return (
                    <th key={s.id} className="p-3.5 text-center min-w-[125px]">
                      <div className="flex justify-center mb-1">
                        <StoreLogoBadge storeId={s.id} size="sm" />
                      </div>
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white mt-0.5">
                        {s.name}
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border mt-1 inline-block ${badge.classes}`}
                      >
                        {badge.label}
                      </span>
                      {s.id === 'noon' && (
                        <span className="text-[9px] bg-yellow-400 text-slate-950 font-black px-1.5 py-0.2 rounded mt-1 block w-fit mx-auto shadow-2xs">
                          كود HKEEEM2
                        </span>
                      )}
                    </th>
                  );
                })}
                <th className="p-3.5 text-center min-w-[85px]">إجراء</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((p) => {
                // Calculate lowest price across currently displayed stores
                let minPrice = Infinity;
                displayedStores.forEach((ds) => {
                  const pInfo = p.prices[ds.id];
                  if (pInfo && pInfo.inStock && pInfo.priceInclVat < minPrice) {
                    minPrice = pInfo.priceInclVat;
                  }
                });

                return (
                  <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/60 transition-colors">
                    {/* Product Info */}
                    <td className="p-3.5 sticky right-0 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-850/60 z-10">
                      <div className="flex items-center gap-2.5">
                        <ProductImage src={p.imageUrl} alt={p.nameAr} size="sm" />
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm line-clamp-2">
                            {p.nameAr}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[160px] sm:max-w-[180px]">
                            {p.nameEn}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Unit */}
                    <td className="p-3.5 text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap">
                      {p.unit}
                    </td>

                    {/* Store Price Columns */}
                    {displayedStores.map((store) => {
                      const priceInfo = p.prices[store.id];
                      if (!priceInfo || !priceInfo.inStock) {
                        return (
                          <td key={store.id} className="p-3.5 text-center text-slate-300 dark:text-slate-600">
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-400">
                              غير متوفر
                            </span>
                          </td>
                        );
                      }

                      const isLowest = priceInfo.priceInclVat === minPrice;

                      return (
                        <td
                          key={store.id}
                          onClick={() => handleOpenOffer(p, store, priceInfo)}
                          className={`p-3.5 text-center cursor-pointer transition-colors group ${
                            isLowest
                              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 font-black hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={`اضغط لمعاينة عرض ${p.nameAr} في ${store.name} والانتقال للمتجر`}
                        >
                          <div className="flex flex-col items-center">
                            <span
                              className={`text-xs flex items-center gap-1 ${
                                isLowest
                                  ? 'text-emerald-800 dark:text-emerald-300 font-black'
                                  : 'text-slate-800 dark:text-slate-200 font-medium'
                              }`}
                            >
                              <span>{priceInfo.priceInclVat.toFixed(2)} ر.س</span>
                              <a
                                href={getDirectOfferUrl(store, p, priceInfo)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="opacity-0 group-hover:opacity-100 hover:text-emerald-600 transition-opacity text-slate-400 p-0.5"
                                title={`فتح صفحة ${p.nameAr} في ${store.name}`}
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </span>
                            {isLowest && (
                              <span className="inline-flex items-center gap-1 text-[9px] text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded-full mt-0.5 font-bold">
                                <Sparkles className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                <span>الأرخص</span>
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Add to Cart Action */}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleAdd(p)}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${
                          justAddedId === p.id
                            ? 'bg-emerald-600 text-white scale-105'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-emerald-700 hover:text-white text-slate-700 dark:text-slate-300'
                        }`}
                        title="أضف إلى السلة المقترحة"
                      >
                        {justAddedId === p.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

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
    </div>
  );
};
