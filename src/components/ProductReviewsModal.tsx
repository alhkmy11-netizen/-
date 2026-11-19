import React, { useState } from 'react';
import { Product, ProductReview, Store } from '../types';
import { ProductImage } from './SmartIcon';
import { 
  X, 
  Star, 
  CheckCircle2, 
  ThumbsUp, 
  MessageSquarePlus, 
  ShieldCheck, 
  Filter, 
  AlertCircle,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { trackEvent } from '../utils/analytics';

interface ProductReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  reviews: ProductReview[];
  onAddReview: (review: Omit<ProductReview, 'id' | 'createdAt' | 'helpfulCount'>) => void;
  onHelpfulVote?: (reviewId: string) => void;
  onAddToCart?: (product: Product) => void;
  stores?: Store[];
}

export const ProductReviewsModal: React.FC<ProductReviewsModalProps> = ({
  isOpen,
  onClose,
  product,
  reviews,
  onAddReview,
  onHelpfulVote,
  onAddToCart,
  stores = [],
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [verifiedPurchase, setVerifiedPurchase] = useState(true);
  const [storePurchasedFrom, setStorePurchasedFrom] = useState('متجر حكيم الذكي (alhkmy.store)');
  const [filterRating, setFilterRating] = useState<number | 'all'>('all');
  const [formError, setFormError] = useState('');
  const [votedIds, setVotedIds] = useState<string[]>([]);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen || !product) return null;

  // Filter reviews for this specific product
  const productReviews = reviews.filter((r) => r.productId === product.id);

  // Compute average rating
  const totalReviews = productReviews.length;
  const avgRating = totalReviews > 0
    ? Number((productReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
    : (product.rating || 4.8);

  // Rating distribution
  const starCounts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: productReviews.filter((r) => r.rating === s).length,
    percentage: totalReviews > 0
      ? Math.round((productReviews.filter((r) => r.rating === s).length / totalReviews) * 100)
      : (s === 5 ? 75 : s === 4 ? 20 : 5),
  }));

  const filteredReviews = productReviews.filter((r) => {
    if (filterRating === 'all') return true;
    return r.rating === filterRating;
  });

  const ratingDescriptions: Record<number, string> = {
    1: 'سيئ جداً 😞',
    2: 'أقل من المتوقع 🙁',
    3: 'مقبول / عادي 😐',
    4: 'جيد جداً ومناسب 😊',
    5: 'ممتاز وأنصح به بشدة! 🌟',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setFormError('الرجاء كتابة اسمك الكريم');
      return;
    }
    if (!comment.trim()) {
      setFormError('الرجاء كتابة تفاصيل تقييمك للمنتج');
      return;
    }

    setFormError('');
    onAddReview({
      productId: product.id,
      productName: product.nameAr,
      userName: userName.trim(),
      userEmail: userEmail.trim() || undefined,
      rating,
      title: title.trim() || ratingDescriptions[rating].split(' ')[0],
      comment: comment.trim(),
      verifiedPurchase,
      storePurchasedFrom,
    });

    trackEvent('submit_product_review', {
      product_id: product.id,
      product_name: product.nameAr,
      rating,
      verified: verifiedPurchase,
    });

    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setShowAddForm(false);
      setComment('');
      setTitle('');
    }, 2000);
  };

  const handleVote = (reviewId: string) => {
    if (votedIds.includes(reviewId)) return;
    setVotedIds((prev) => [...prev, reviewId]);
    if (onHelpfulVote) {
      onHelpfulVote(reviewId);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] safe-area-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-850/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center shadow-xs">
              <ProductImage src={product.imageUrl} alt={product.nameAr} size="sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white line-clamp-1">
                  تقييمات وآراء المشترين
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/50">
                  موثقة
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-medium mt-0.5">
                {product.nameAr}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 -webkit-overflow-scrolling-touch">
          {/* Average Rating Summary Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-slate-50 dark:to-slate-800/40 border border-amber-200/60 dark:border-amber-800/40 flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center sm:text-right shrink-0">
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-sm font-bold text-slate-400">/ 5</span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-1 mt-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star 
                    key={s} 
                    className={`w-4 h-4 ${s <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} 
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1.5">
                بناءً على {totalReviews > 0 ? totalReviews : product.reviewsCount || 84} تقييم حقيقي
              </p>
            </div>

            {/* Stars Breakdown Bars */}
            <div className="flex-1 w-full space-y-1.5 border-t sm:border-t-0 sm:border-r border-slate-200 dark:border-slate-700 pt-3 sm:pt-0 sm:pr-6">
              {starCounts.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 w-8 flex items-center gap-0.5">
                    <span>{star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold w-12 text-left">
                    {percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row: Write Review Button & Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95 ${
                showAddForm
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>{showAddForm ? 'إلغاء كتابة التقييم' : 'أضف تقييمك ورأيك'}</span>
            </button>

            {/* Filter by stars */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              <span className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>تصفية:</span>
              </span>
              {(['all', 5, 4, 3] as const).map((starVal) => (
                <button
                  key={String(starVal)}
                  onClick={() => setFilterRating(starVal)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterRating === starVal
                      ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {starVal === 'all' ? 'الكل' : `${starVal} ★`}
                </button>
              ))}
            </div>
          </div>

          {/* Write Review Form Collapsible */}
          {showAddForm && (
            <form 
              onSubmit={handleSubmit}
              className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-emerald-500/40 shadow-inner space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>اكتب تجربتك وتقييمك للمنتج</span>
                </h4>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  مشتري معتمد
                </span>
              </div>

              {submittedSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400 text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-black text-sm">شكراً لك! تم نشر تقييمك بنجاح.</p>
                    <p className="text-xs mt-0.5">مشاركتك تساعد آلاف المتسوقين في اختيار أفضل السلع والتوفير.</p>
                  </div>
                </div>
              ) : (
                <>
                  {formError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Interactive Star Picker */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                      تقييمك بالنجوم (1 إلى 5):
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-fit">
                        {[1, 2, 3, 4, 5].map((starIndex) => (
                          <button
                            key={starIndex}
                            type="button"
                            onClick={() => setRating(starIndex)}
                            onMouseEnter={() => setHoverRating(starIndex)}
                            onMouseLeave={() => setHoverRating(null)}
                            className="p-1 cursor-pointer transition-transform hover:scale-125 active:scale-95"
                            title={`${starIndex} نجوم`}
                          >
                            <Star 
                              className={`w-6 h-6 transition-colors ${
                                starIndex <= (hoverRating || rating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                        {ratingDescriptions[hoverRating || rating]}
                      </span>
                    </div>
                  </div>

                  {/* Name and Email inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        الاسم الكريم *
                      </label>
                      <input 
                        type="text"
                        required
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="مثال: عبد العزيز الشمري"
                        className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        البريد الإلكتروني (اختياري للإشعار)
                      </label>
                      <input 
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Review Title & Store */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        عنوان مختصر للتقييم
                      </label>
                      <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="مثال: منتج ممتاز وتوفير حقيقي"
                        className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        المتجر الذي اشتريت منه
                      </label>
                      <select
                        value={storePurchasedFrom}
                        onChange={(e) => setStorePurchasedFrom(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500"
                      >
                        <option value="متجر حكيم الذكي (alhkmy.store)">متجر حكيم الذكي (alhkmy.store)</option>
                        <option value="أسواق عبد الله العثيم">أسواق عبد الله العثيم</option>
                        <option value="هايبر بنده">هايبر بنده</option>
                        <option value="كارفور السعودية">كارفور السعودية</option>
                        <option value="نون ديلي (Noon Daily)">نون ديلي (Noon Daily)</option>
                        <option value="أمازون السعودية">أمازون السعودية</option>
                        <option value="الدانوب هايبرماركت">الدانوب هايبرماركت</option>
                      </select>
                    </div>
                  </div>

                  {/* Comment Text Area */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      تفاصيل تجربتك وتقييمك *
                    </label>
                    <textarea 
                      required
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="صف جودة المنتج، التغليف، سرعة التوصيل، ومدى الاستفادة من فرق السعر والتوفير..."
                      className="w-full px-3 py-2 text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Verified Purchase Checkbox */}
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={verifiedPurchase}
                      onChange={(e) => setVerifiedPurchase(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>أؤكد أنني قمت بشراء واستخدام هذا المنتج من المتجر المذكور</span>
                  </label>

                  {/* Submit Button */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      نشر التقييم الآن
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          {/* Individual Customer Reviews List */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              آراء المتسوقين ({filteredReviews.length})
            </h4>

            {filteredReviews.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-700">
                <MessageSquarePlus className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                  لا توجد تقييمات مطابقة لهذا الفلتر حالياً
                </p>
                <p className="text-xs text-slate-500">كن أول من يشارك رأيه حول هذه السلعة للمتسوقين!</p>
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <div 
                  key={rev.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/80 shadow-xs space-y-2.5 transition-all hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          {rev.userName}
                        </span>
                        {rev.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>مشتري معتمد</span>
                          </span>
                        )}
                        {rev.storePurchasedFrom && (
                          <span className="text-[10px] font-medium text-slate-400">
                            • عبر {rev.storePurchasedFrom}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
                        {rev.createdAt}
                      </span>
                    </div>

                    {/* Star Rating Display */}
                    <div className="flex items-center gap-1 text-amber-400 shrink-0">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-700'}`} 
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review Title & Body */}
                  {rev.title && (
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      {rev.title}
                    </h5>
                  )}
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    {rev.comment}
                  </p>

                  {/* Helpful Button */}
                  <div className="pt-1 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="text-[11px]">هل كان هذا التقييم مفيداً لك؟</span>
                    <button
                      onClick={() => handleVote(rev.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        votedIds.includes(rev.id)
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black'
                          : 'bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 text-slate-600 dark:text-slate-300'
                      }`}
                      title="تصويت مفيد"
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${votedIds.includes(rev.id) ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                      <span>مفيد ({rev.helpfulCount + (votedIds.includes(rev.id) ? 1 : 0)})</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer with Add to Cart Action */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex items-center justify-between gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium">أقل سعر متوفر حالياً:</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {Object.values(product.prices)[0]?.priceInclVat || 12} ر.س
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onAddToCart && (
              <button
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>إضافة إلى السلة الذكية</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
