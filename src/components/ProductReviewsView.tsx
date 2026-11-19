import React, { useState } from 'react';
import { Product, ProductReview, Store } from '../types';
import { ProductImage } from './SmartIcon';
import { 
  Star, 
  MessageSquare, 
  ShieldCheck, 
  ThumbsUp, 
  Filter, 
  Search, 
  Sparkles, 
  MessageSquarePlus,
  ArrowRight,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { trackEvent } from '../utils/analytics';

interface ProductReviewsViewProps {
  reviews: ProductReview[];
  products: Product[];
  stores: Store[];
  onOpenReviewModal: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onHelpfulVote?: (reviewId: string) => void;
}

export const ProductReviewsView: React.FC<ProductReviewsViewProps> = ({
  reviews,
  products,
  stores,
  onOpenReviewModal,
  onAddToCart,
  onHelpfulVote,
}) => {
  const [selectedRating, setSelectedRating] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [votedIds, setVotedIds] = useState<string[]>([]);

  const filteredReviews = reviews.filter((r) => {
    const matchesRating = selectedRating === 'all' || r.rating === selectedRating;
    const matchesQuery = 
      !searchQuery.trim() ||
      r.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.userName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRating && matchesQuery;
  });

  const avgScore = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '4.9';

  const handleVote = (reviewId: string) => {
    if (votedIds.includes(reviewId)) return;
    setVotedIds((prev) => [...prev, reviewId]);
    if (onHelpfulVote) {
      onHelpfulVote(reviewId);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-12" dir="rtl">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 text-white p-5 sm:p-8 relative overflow-hidden border border-amber-500/30 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 inline-flex items-center justify-center">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                تقييمات المتسوقين الموثقة • Customer Reviews
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white">
              آراء وتقييمات عملاء متجر حكيم (alhkmy.store)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              تقييمات حقيقية من متسوقين قاموا بشراء السلع وتجربة التوفير الفعلي في مختلف المتاجر والهايبرماركت.
            </p>
          </div>

          {/* Overall Stats Card */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-black text-amber-300">{avgScore}</div>
              <div className="flex items-center justify-center gap-0.5 mt-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-[10px] text-slate-300 font-bold block mt-1">
                {reviews.length} مراجعة موثقة
              </span>
            </div>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="ابحث في آراء المشترين أو اسم السلعة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
        </div>

        {/* Rating Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {(['all', 5, 4, 3] as const).map((starVal) => (
            <button
              key={String(starVal)}
              onClick={() => setSelectedRating(starVal)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedRating === starVal
                  ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {starVal === 'all' ? 'جميع التقييمات' : `${starVal} نجوم ★`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReviews.map((rev) => {
          const product = products.find((p) => p.id === rev.productId);

          return (
            <div
              key={rev.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/80 shadow-xs space-y-3.5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Product Reference Header */}
                {product && (
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-700/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-750 p-1 border border-slate-100 dark:border-slate-700 shrink-0 flex items-center justify-center">
                        <ProductImage src={product.imageUrl} alt={product.nameAr} size="xs" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                          {product.nameAr}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {product.category}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenReviewModal(product)}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      تقييم هذه السلعة
                    </button>
                  </div>
                )}

                {/* Reviewer Details & Stars */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {rev.userName}
                      </span>
                      {rev.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>شراء معتمد</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {rev.createdAt} {rev.storePurchasedFrom ? `• ${rev.storePurchasedFrom}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star 
                        key={s} 
                        className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} 
                      />
                    ))}
                  </div>
                </div>

                {/* Review Body */}
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    {rev.title}
                  </h5>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal mt-1">
                    {rev.comment}
                  </p>
                </div>
              </div>

              {/* Footer Row: Helpful Vote & Quick Add to Cart */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <button
                  onClick={() => handleVote(rev.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    votedIds.includes(rev.id)
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black'
                      : 'bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${votedIds.includes(rev.id) ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                  <span>مفيد ({rev.helpfulCount + (votedIds.includes(rev.id) ? 1 : 0)})</span>
                </button>

                {product && (
                  <button
                    onClick={() => {
                      onAddToCart(product);
                      trackEvent('add_from_reviews_view', { product_id: product.id });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>إضافة للسلة</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
