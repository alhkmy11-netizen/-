import React, { useState } from 'react';
import { Product, Store } from '../types';
import { StoreLogoBadge, ProductImage } from './SmartIcon';
import { 
  Zap, 
  Check, 
  ShoppingCart, 
  TrendingDown, 
  Sparkles, 
  Plus, 
  Store as StoreIcon 
} from 'lucide-react';

interface QuickListViewProps {
  products: Product[];
  stores: Store[];
  onAddSelectedToCart: (selectedProducts: Product[]) => void;
  onGoToCart: () => void;
}

export const QuickListView: React.FC<QuickListViewProps> = ({
  products,
  stores,
  onAddSelectedToCart,
  onGoToCart,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(['p1', 'p2', 'p3', 'p4', 'p6']);

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    setSelectedIds(products.map((p) => p.id));
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  // Compute store totals for selected items
  const storeTotals = stores.map((store) => {
    let total = 0;
    let missingCount = 0;

    selectedProducts.forEach((p) => {
      const price = p.prices[store.id];
      if (price && price.inStock) {
        total += price.priceInclVat;
      } else {
        missingCount++;
        total += 25; // estimated fallback
      }
    });

    return {
      store,
      total,
      missingCount,
    };
  }).sort((a, b) => a.total - b.total);

  const cheapestStore = storeTotals[0];
  const mostExpensiveStore = storeTotals[storeTotals.length - 1];
  const estimatedSavings = mostExpensiveStore ? Math.max(0, mostExpensiveStore.total - (cheapestStore?.total || 0)) : 0;

  const handleApplyToCart = () => {
    onAddSelectedToCart(selectedProducts);
    onGoToCart();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black">
            <Zap className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold">القائمة السريعة لمقاضي المنزل الأساسية</h1>
        </div>
        <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
          حدد السلع التي تنقص منزلك بنقرة واحدة، وسيقوم «حكيم AI» بحساب أرخص متجر لشراء كامل القائمة فوراً مع توفير رسوم التوصيل.
        </p>

        {/* Real-time Savings Bar */}
        {selectedProducts.length > 0 && cheapestStore && (
          <div className="mt-6 p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-emerald-200">أرخص متجر لشراء سلتك المحددة:</div>
              <div className="text-lg font-black text-amber-300 flex items-center gap-2 mt-1">
                <StoreLogoBadge storeId={cheapestStore.store.id} size="sm" />
                <span>{cheapestStore.store.name}</span>
                <span>• {cheapestStore.total.toFixed(2)} ر.س</span>
              </div>
            </div>

            {estimatedSavings > 0 && (
              <div className="bg-emerald-500/30 border border-emerald-400/40 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>توفر حوالي {estimatedSavings.toFixed(2)} ر.س مقارنة بأعلى متجر!</span>
              </div>
            )}

            <button
              onClick={handleApplyToCart}
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-transform active:scale-95 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>إرسال ({selectedProducts.length}) سلع للسلة الذكية</span>
            </button>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
          تم اختيار <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">{selectedIds.length}</span> من أصل {products.length} سلعة
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
          >
            تحديد الكل
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
          >
            إلغاء التحديد
          </button>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {products.map((product) => {
          const isSelected = selectedIds.includes(product.id);

          // Find lowest price
          let minPrice = Infinity;
          let minStoreName = '';
          Object.entries(product.prices).forEach(([sId, pInfo]) => {
            if (pInfo.inStock && pInfo.priceInclVat < minPrice) {
              minPrice = pInfo.priceInclVat;
              minStoreName = stores.find((s) => s.id === sId)?.name || '';
            }
          });

          return (
            <div
              key={product.id}
              onClick={() => toggleSelect(product.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 shadow-xs ring-1 ring-emerald-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <ProductImage src={product.imageUrl} alt={product.nameAr} size="sm" />

                <div className="min-w-0">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {product.nameAr}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    أرخص سعر:{' '}
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                      {minPrice.toFixed(2)} ر.س
                    </span>{' '}
                    ({minStoreName})
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 shrink-0 font-medium">
                {product.unit}
              </div>
            </div>
          );
        })}
      </div>

      {/* Store Ranking Table for Quick List */}
      {selectedProducts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <StoreIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>ترتيب المتاجر حسب الفاتورة الإجمالية لسلتك:</span>
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {storeTotals.map((item, idx) => (
              <div key={item.store.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 text-center font-bold text-slate-400">#{idx + 1}</span>
                  <StoreLogoBadge storeId={item.store.id} size="sm" />
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white">{item.store.name}</span>
                    <span className="text-[11px] text-slate-400 mr-2">
                      (توصيل: {item.store.deliveryFee} ر.س • مجاني فوق {item.store.freeDeliveryThreshold} ر.س)
                    </span>
                  </div>
                </div>

                <div className="text-left">
                  <span className="font-black text-slate-900 dark:text-white">{item.total.toFixed(2)} ر.س</span>
                  {idx === 0 && (
                    <span className="mr-2 text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                      الأوفر إجمالاً
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
