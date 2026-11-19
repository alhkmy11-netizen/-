import React from 'react';
import { Product, Store } from '../types';
import { ProductImage } from './SmartIcon';
import { Scale, X, Sparkles, Plus, Trash2, ExternalLink, ArrowRight } from 'lucide-react';

interface ProductCompareBarProps {
  selectedProducts: Product[];
  stores: Store[];
  onRemoveProduct: (productId: string) => void;
  onClearAll: () => void;
  onOpenComparison: () => void;
}

export const ProductCompareBar: React.FC<ProductCompareBarProps> = ({
  selectedProducts,
  stores,
  onRemoveProduct,
  onClearAll,
  onOpenComparison,
}) => {
  if (selectedProducts.length === 0) return null;

  const getLowestPrice = (product: Product) => {
    let minPrice = Infinity;
    Object.values(product.prices).forEach((info) => {
      if (info.inStock && info.priceInclVat < minPrice) {
        minPrice = info.priceInclVat;
      }
    });
    return minPrice === Infinity ? null : minPrice;
  };

  const handleOpen = () => {
    onOpenComparison();
  };

  return (
    <div 
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-45 w-[95%] max-w-3xl animate-in slide-in-from-bottom-5 duration-300"
      dir="rtl"
    >
      <div className="bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white border-2 border-indigo-500/60 rounded-3xl p-3 sm:p-4 shadow-2xl shadow-indigo-950/50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Header & Status */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black text-white">مقارنة السلع</span>
                  <span className="text-[10px] font-black bg-indigo-500 text-white px-1.5 py-0.2 rounded-full">
                    {selectedProducts.length} من 3
                  </span>
                </div>
                <p className="text-[10px] text-slate-300">
                  {selectedProducts.length === 1 
                    ? 'اختر سلعة ثانية لمقارنة الأسعار والمواصفات'
                    : 'جدول مقارنة الأسعار والمتاجر جاهز'}
                </p>
              </div>
            </div>

            <button
              onClick={onClearAll}
              className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors sm:hidden flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح</span>
            </button>
          </div>

          {/* Product Slots (Up to 3) */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
            {[0, 1, 2].map((slotIndex) => {
              const product = selectedProducts[slotIndex];

              if (product) {
                const lowestPrice = getLowestPrice(product);
                return (
                  <div
                    key={product.id}
                    className="relative group bg-slate-800/90 border border-slate-700 hover:border-indigo-400 rounded-2xl p-2 flex items-center gap-2 min-w-[130px] sm:min-w-[150px] transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 shrink-0 p-1 flex items-center justify-center">
                      <ProductImage src={product.imageUrl} alt={product.nameAr} size="xs" />
                    </div>

                    <div className="flex-1 min-w-0 pr-1">
                      <span className="text-[11px] font-bold text-slate-100 block truncate" title={product.nameAr}>
                        {product.nameAr}
                      </span>
                      {lowestPrice !== null && (
                        <span className="text-[10px] font-black text-emerald-400">
                          {lowestPrice.toFixed(2)} ر.س
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onRemoveProduct(product.id)}
                      className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                      title="إزالة من المقارنة"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={`empty-${slotIndex}`}
                  className="border-2 border-dashed border-slate-700/80 rounded-2xl p-2 flex items-center justify-center gap-1.5 min-w-[110px] sm:min-w-[130px] h-[52px] text-slate-400 text-[10px] font-bold"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                  <span>سلعة {slotIndex + 1}</span>
                </div>
              );
            })}
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClearAll}
              className="hidden sm:flex px-2.5 py-2 text-[11px] text-slate-400 hover:text-rose-400 transition-colors items-center gap-1 cursor-pointer font-bold"
              title="مسح قائمة المقارنة"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>إلغاء</span>
            </button>

            <button
              onClick={handleOpen}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Scale className="w-4 h-4" />
              <span>عرض المقارنة الشاملة ({selectedProducts.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
