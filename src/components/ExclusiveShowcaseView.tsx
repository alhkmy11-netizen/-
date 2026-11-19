import React from 'react';
import { Product } from '../types';
import { ProductImage } from './SmartIcon';
import { Sparkles, ShoppingCart, Tag, Mic, Gift, ExternalLink, Zap } from 'lucide-react';

interface ExclusiveShowcaseViewProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onApplyCouponToCart: (code: string) => void;
  onOpenVoiceAdvisor?: () => void;
  walletBalance?: number;
}

export const ExclusiveShowcaseView: React.FC<ExclusiveShowcaseViewProps> = ({
  products,
  onAddToCart,
  onApplyCouponToCart,
  onOpenVoiceAdvisor,
  walletBalance = 0,
}) => {
  return (
    <div className="space-y-6" dir="rtl">
      {/* Hero Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/20 text-slate-950 text-xs font-black">
            <Zap className="w-3.5 h-3.5" />
            <span>عروض التوفير الحصرية والذهبية</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight">
            خصومات حصرية وكوبونات VIP مباشرة
          </h1>
          <p className="text-xs sm:text-sm font-semibold opacity-90">
            احصل على أفضل الأسعار مع كود الخصم المعتمد (570C) وكاش باك فوري يضاف مباشرة إلى محفظتك.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => onApplyCouponToCart('570C')}
            className="px-5 py-3 rounded-2xl bg-slate-950 text-white font-black text-xs inline-flex items-center gap-2 shadow-lg hover:bg-slate-900 transition-all cursor-pointer"
          >
            <Tag className="w-4 h-4 text-amber-400" />
            <span>تطبيق كود 570C في السلة</span>
          </button>

          {onOpenVoiceAdvisor && (
            <button
              onClick={onOpenVoiceAdvisor}
              className="px-4 py-3 rounded-2xl bg-white/20 backdrop-blur-xs text-slate-950 font-black text-xs inline-flex items-center gap-2 hover:bg-white/30 transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>المستشار الصوتي AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.slice(0, 9).map((product) => (
          <div
            key={product.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between hover:border-amber-400 transition-all shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                  عرض حصري
                </span>
                <span className="text-[10px] text-slate-400">{product.category}</span>
              </div>

              <div className="flex items-center gap-3 my-2">
                <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 p-1 flex items-center justify-center shrink-0">
                  <ProductImage src={product.imageUrl} alt={product.nameAr} size="sm" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">{product.nameAr}</h3>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{product.nameEn}</p>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{product.unit}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => onAddToCart(product)}
                className="w-full py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>أضف للسلة مع التخفيض</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
