import React, { useState } from 'react';
import { Product, Store } from '../types';
import { ProductImage, StoreLogoBadge } from './SmartIcon';
import { 
  Heart, 
  Trash2, 
  ShoppingCart, 
  Share2, 
  ArrowRight, 
  Sparkles, 
  TrendingDown, 
  Check, 
  ExternalLink,
  Tag,
  Star,
  Store as StoreIcon
} from 'lucide-react';
import { trackEvent } from '../utils/analytics';

interface WishlistViewProps {
  wishlistProductIds: string[];
  products: Product[];
  stores: Store[];
  onRemoveFromWishlist: (productId: string) => void;
  onClearWishlist: () => void;
  onAddToCart: (product: Product) => void;
  onAddAllToCart: (products: Product[]) => void;
  onContinueShopping: () => void;
  onOpenProductReviews?: (product: Product) => void;
}

export const WishlistView: React.FC<WishlistViewProps> = ({
  wishlistProductIds,
  products,
  stores,
  onRemoveFromWishlist,
  onClearWishlist,
  onAddToCart,
  onAddAllToCart,
  onContinueShopping,
  onOpenProductReviews,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [addedItemIds, setAddedItemIds] = useState<string[]>([]);

  // Get full product objects in wishlist
  const wishlistedProducts = products.filter((p) => wishlistProductIds.includes(p.id));

  // Compute lowest price and store for a product
  const getLowestStorePrice = (product: Product): {
    price: number;
    store: Store | null;
    originalPrice: number;
    savings: number;
  } => {
    let minPrice = Infinity;
    let minStore: Store | null = null;
    let originalPrice = 0;

    Object.entries(product.prices).forEach(([storeId, priceInfo]) => {
      if (priceInfo.inStock && priceInfo.priceInclVat < minPrice) {
        minPrice = priceInfo.priceInclVat;
        minStore = stores.find((s) => s.id === storeId) || null;
        if (priceInfo.originalPrice && priceInfo.originalPrice > minPrice) {
          originalPrice = priceInfo.originalPrice;
        }
      }
    });

    return {
      price: minPrice === Infinity ? 0 : minPrice,
      store: minStore,
      originalPrice,
      savings: originalPrice > minPrice ? originalPrice - minPrice : 0,
    };
  };

  const totalWishlistValue = wishlistedProducts.reduce((sum, p) => {
    const { price } = getLowestStorePrice(p);
    return sum + price;
  }, 0);

  const totalPotentialSavings = wishlistedProducts.reduce((sum, p) => {
    const { savings } = getLowestStorePrice(p);
    return sum + savings;
  }, 0);

  const handleShareWishlist = async () => {
    const shareText = `قائمتي المفضلة في متجر حكيم الذكي alhkmy.store تضم ${wishlistedProducts.length} سلع موفرة بقيمة ${totalWishlistValue.toFixed(1)} ر.س!`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'قائمة أمنياتي في متجر حكيم',
          text: shareText,
          url: shareUrl,
        });
        trackEvent('share_wishlist', { count: wishlistedProducts.length });
        return;
      } catch (e) {
        // user cancelled or share failed, fallback to copy
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
        trackEvent('copy_wishlist_link', { count: wishlistedProducts.length });
      } catch {}
    }
  };

  const handleItemAdd = (product: Product) => {
    onAddToCart(product);
    setAddedItemIds((prev) => [...prev, product.id]);
    setTimeout(() => {
      setAddedItemIds((prev) => prev.filter((id) => id !== product.id));
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12" dir="rtl">
      {/* Page Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 text-white p-5 sm:p-8 relative overflow-hidden border border-rose-500/30 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-400/30 inline-flex items-center justify-center">
                <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30">
                قائمة الرغبات الشخصية • Wishlist
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              قائمة أمنياتي ومفضلاتي في متجر حكيم
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl leading-relaxed">
              احفظ سلعك ومشترياتك المفضلة لمتابعة عروضها، وتنبيهات الخصومات، وإضافتها بنقرة واحدة إلى سلة الشراء.
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          {wishlistedProducts.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
              <div>
                <span className="text-[11px] text-slate-300 block font-bold">إجمالي قيمة السلع الموفرة:</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-300">
                    {totalWishlistValue.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-300 font-bold">ر.س</span>
                </div>
                {totalPotentialSavings > 0 && (
                  <span className="text-[10px] text-emerald-400 font-bold block mt-0.5">
                    توفير محتمل: {totalPotentialSavings.toFixed(1)} ر.س
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mr-2">
                <button
                  onClick={handleShareWishlist}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="مشاركة المفضلة"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => onAddAllToCart(wishlistedProducts)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>نقل الكل للسلة ({wishlistedProducts.length})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Ambient glow */}
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Main Wishlist Grid */}
      {wishlistedProducts.length === 0 ? (
        <div className="p-8 sm:p-14 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center">
            <Heart className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              قائمة أمنياتك فارغة حالياً
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              اضغط على أيقونة القلب ❤️ بجانب أي منتج في متجر حكيم أو عروض الهايبرماركت لإضافته هنا ومتابعة سعره.
            </p>
          </div>

          <button
            onClick={onContinueShopping}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span>استكشاف عروض المتاجر الآن</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                العناصر المحفوظة ({wishlistedProducts.length})
              </span>
              <span className="text-xs text-slate-400">
                محدثة بأحدث الأسعار الفورية
              </span>
            </div>

            <button
              onClick={onClearWishlist}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>تفريغ القائمة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlistedProducts.map((product) => {
              const { price, store, originalPrice, savings } = getLowestStorePrice(product);
              const isAdded = addedItemIds.includes(product.id);

              return (
                <div
                  key={product.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-3">
                    {/* Top Row: Store Badge & Remove Heart */}
                    <div className="flex items-center justify-between">
                      {store ? (
                        <div className="flex items-center gap-1.5">
                          <StoreLogoBadge storeId={store.id} size="xs" />
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {store.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">جميع المتاجر</span>
                      )}

                      <button
                        onClick={() => {
                          onRemoveFromWishlist(product.id);
                          trackEvent('remove_from_wishlist', { product_id: product.id });
                        }}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="إزالة من المفضلة"
                      >
                        <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                      </button>
                    </div>

                    {/* Product Image & Title */}
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-750 p-1.5 border border-slate-100 dark:border-slate-700 shrink-0 flex items-center justify-center">
                        <ProductImage src={product.imageUrl} alt={product.nameAr} size="sm" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-slate-400 font-bold block">{product.category}</span>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-2 leading-snug">
                          {product.nameAr}
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                          العبوة: {product.unit}
                        </span>
                      </div>
                    </div>

                    {/* Reviews Clickable Trigger */}
                    {onOpenProductReviews && (
                      <button
                        onClick={() => onOpenProductReviews(product)}
                        className="flex items-center gap-1 text-[11px] font-bold text-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{product.rating || 4.8} / 5</span>
                        <span className="text-slate-400 font-normal">
                          ({product.reviewsCount || 85} تقييم) • مشاهدة الآراء
                        </span>
                      </button>
                    )}

                    {/* Pricing Row */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-750/70 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">أقل سعر وجده حكيم:</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            {price} ر.س
                          </span>
                          {originalPrice > price && (
                            <span className="text-[11px] text-slate-400 line-through">
                              {originalPrice} ر.س
                            </span>
                          )}
                        </div>
                      </div>

                      {savings > 0 && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                          وفر {savings.toFixed(1)} ر.س
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleItemAdd(product)}
                    className={`w-full py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs ${
                      isAdded
                        ? 'bg-emerald-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>تمت الإضافة للسلة!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>إضافة إلى السلة الذكية</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
