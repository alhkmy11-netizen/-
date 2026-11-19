import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { Product } from '../types';

export interface ProductRatingData {
  rating: number;
  reviewsCount: number;
  starsCount: number;
}

/**
 * Returns consistent, realistic product ratings and review counts based on product data or deterministic mock
 */
export const getProductRatingData = (product: Product): ProductRatingData => {
  if (product.rating && product.reviewsCount) {
    return {
      rating: product.rating,
      reviewsCount: product.reviewsCount,
      starsCount: Math.round(product.rating),
    };
  }

  // Deterministic seed based on product ID and name to keep values consistent across renders
  let hash = 0;
  const str = product.id + product.nameAr;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  // Ratings between 4.4 and 5.0
  const ratingSteps = [4.5, 4.6, 4.7, 4.7, 4.8, 4.8, 4.9, 4.9, 5.0];
  const rating = product.rating || ratingSteps[absHash % ratingSteps.length];

  // Review counts between 48 and 420 reviews
  const reviewsCount = product.reviewsCount || (48 + (absHash % 372));

  return {
    rating: Number(rating.toFixed(1)),
    reviewsCount,
    starsCount: Math.round(rating),
  };
};

interface StarRatingProps {
  rating: number;
  reviewsCount?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showCount?: boolean;
  showNumeric?: boolean;
  countLabel?: string;
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  reviewsCount,
  size = 'sm',
  showCount = true,
  showNumeric = true,
  countLabel,
  className = '',
}) => {
  const normalizedRating = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(normalizedRating);
  const remainder = normalizedRating - fullStars;
  const hasHalfStar = remainder >= 0.25 && remainder < 0.75;
  const effectiveFull = remainder >= 0.75 ? fullStars + 1 : fullStars;
  const emptyStars = Math.max(0, 5 - effectiveFull - (hasHalfStar ? 1 : 0));

  const sizeClasses = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const starSize = sizeClasses[size];

  return (
    <div 
      className={`inline-flex items-center gap-1.5 ${className}`} 
      title={`متوسط التقييم: ${normalizedRating.toFixed(1)} من 5${reviewsCount !== undefined ? ` (${reviewsCount} تقييم)` : ''}`}
    >
      {/* 5-Star Visual Row */}
      <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
        {[...Array(effectiveFull)].map((_, i) => (
          <Star key={`full-${i}`} className={`${starSize} fill-amber-400 text-amber-400`} />
        ))}
        {hasHalfStar && (
          <StarHalf className={`${starSize} fill-amber-400 text-amber-400`} />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className={`${starSize} text-slate-300 dark:text-slate-600`} />
        ))}
      </div>

      {/* Numeric Rating */}
      {showNumeric && (
        <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400">
          {normalizedRating.toFixed(1)}
        </span>
      )}

      {/* Reviews Count */}
      {showCount && reviewsCount !== undefined && (
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          {countLabel ? `(${reviewsCount} ${countLabel})` : `(${reviewsCount})`}
        </span>
      )}
    </div>
  );
};
