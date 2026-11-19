import React, { useState } from 'react';
import { Product, Store, StorePriceInfo } from '../types';
import { ProductImage, StoreLogoBadge } from './SmartIcon';
import { X, ExternalLink, ShoppingCart, Tag, Check, Clock, TrendingDown, Copy, Sparkles, ShieldCheck } from 'lucide-react';
import { 
  getDirectOfferUrl, 
  NOON_AFFILIATE_CONFIG, 
  NOON_CAMPAIGN_COUPONS, 
  isNoonCampaignCoupon 
} from '../utils/storeLinks';
import { trackEvent } from '../utils/analytics';

interface OfferDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  store: Store | null;
  priceInfo?: StorePriceInfo | null;
  stores?: Store[];
  onAddToCart?: (product: Product) => void;
}

export const OfferDetailsModal: React.FC<OfferDetailsModalProps> = ({
  isOpen,
  onClose,
  product,
  store,
  priceInfo,
  stores = [],
  onAddToCart,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedNoonCode, setSelectedNoonCode] = useState<string>('HKEEEM2');

  if (!isOpen || !product || !store) return null;

  const currentPrice = priceInfo || product.prices[store.id];
  const url = getDirectOfferUrl(store, product, currentPrice);
  const isNoon = store.id === 'noon' || store.id.toLowerCase().includes('noon');
  const activeCoupon = isNoon ? selectedNoonCode : '570C';

  const handleCopyCoupon = async (codeToCopy: string = activeCoupon) => {
    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopiedCode(codeToCopy);
      if (isNoon) {
        setSelectedNoonCode(codeToCopy);
      }
      trackEvent('copy_offer_modal_coupon', {
        store_id: store.id,
        coupon_code: codeToCopy,
        product_id: product.id,
      });
      setTimeout(() => setCopiedCode(null), 2200);
    } catch {
      // ignore
    }
  };

  const handleGoToStore = async () => {
    try {
      await navigator.clipboard.writeText(activeCoupon);
    } catch {}
    trackEvent('click_offer_modal_store_url', {
      store_id: store.id,
      store_name: store.name,
      product_id: product.id,
      coupon_code: activeCoupon,
      is_affiliate: isNoon,
      url,
    });
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isNoon 
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60' 
            : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-750'
        }`}>
          <div className="flex items-center gap-2.5">
            <StoreLogoBadge storeId={store.id} size="sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">تفاصيل العرض في {store.name}</h3>
                {isNoon && (
                  <span className="text-[10px] font-black bg-yellow-400 text-slate-950 px-2 py-0.2 rounded-md shadow-2xs">
                    رابط تسويقي معتمد
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">سعر معتمد ومحدث من الفواتير والكتالوج</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 dark:bg-slate-800 p-2 border border-slate-100 dark:border-slate-700 shrink-0 flex items-center justify-center">
              <ProductImage src={product.imageUrl} alt={product.nameAr} size="md" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">{product.category}</span>
              <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug">{product.nameAr}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{product.nameEn}</p>
              <span className="text-xs text-slate-500 font-bold block mt-1">العبوة: {product.unit}</span>
            </div>
          </div>

          {/* Pricing Highlight */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold block">السعر الحالي شامل الضريبة:</span>
              <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono mt-0.5">
                {currentPrice?.priceInclVat?.toFixed(2) || '0.00'}{' '}
                <span className="text-xs font-bold">ر.س</span>
              </div>
            </div>
            {currentPrice?.isPromo && (
              <div className="px-3 py-1 bg-amber-500 text-slate-950 text-xs font-black rounded-lg flex items-center gap-1 shadow-2xs">
                <Tag className="w-3.5 h-3.5" />
                <span>عرض ترويجي نشط</span>
              </div>
            )}
          </div>

          {/* Noon Affiliate Dedicated Coupon Box (All 5 Active Campaign Coupons) */}
          {isNoon ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-yellow-400/15 to-orange-500/10 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-slate-900 border-2 border-amber-400 dark:border-amber-600/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                    أكواد حملة نون المعتمدة 2026 (5 أكواد نشطة):
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">
                  كاش باك 10% حتى 75 ر.س
                </span>
              </div>

              {/* 5 Campaign Coupons List with Quick Copy */}
              <div className="space-y-1.5">
                {NOON_CAMPAIGN_COUPONS.map((nc) => {
                  const isSelected = selectedNoonCode === nc.code;
                  const isThisCopied = copiedCode === nc.code;

                  return (
                    <div
                      key={nc.code}
                      onClick={() => handleCopyCoupon(nc.code)}
                      className={`p-2 rounded-xl transition-all flex items-center justify-between cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-100/90 dark:bg-amber-950/60 border-amber-400 dark:border-amber-500 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white px-1 tracking-wider">
                          {nc.code}
                        </span>
                        <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold">
                          {nc.badgeAr}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline">
                          سارٍ حتى 31 ديسمبر 2026
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCoupon(nc.code);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                            isThisCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 shadow-2xs'
                          }`}
                        >
                          {isThisCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{isThisCopied ? 'تم النسخ!' : 'نسخ'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[10px] text-amber-900 dark:text-amber-300 text-center font-bold pt-1">
                الصق أي كود من الأكواد الخمسة أعلاه عند الدفع في نون للحصول على كاش باك 10% حتى 75 ر.س
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                <span className="font-bold text-slate-700 dark:text-slate-300">كود الخصم المقترح:</span>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                  570C
                </span>
              </div>
              <button
                onClick={() => handleCopyCoupon('570C')}
                className="text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
              >
                {copiedCode === '570C' ? 'تم النسخ!' : 'نسخ'}
              </button>
            </div>
          )}

          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span>حالة التوفر:</span>
              <span className="font-bold text-emerald-600">متوفر وجاهز للطلب المباشر</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span>مدة التوصيل التقديرية:</span>
              <span>{store.deliveryTime}</span>
            </div>
            {isNoon && (
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>مسار الرابط التسويقي:</span>
                <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold truncate max-w-[200px]" dir="ltr">
                  {url}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-750 flex items-center gap-2">
          {onAddToCart && (
            <button
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>أضف للسلة</span>
            </button>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleGoToStore}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer ${
              isNoon
                ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black ring-2 ring-amber-400/40'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <span>{isNoon ? `اشترِ الآن من نون (كود ${selectedNoonCode})` : 'انتقل للمتجر'}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
