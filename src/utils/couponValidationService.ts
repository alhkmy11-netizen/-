import { Coupon } from '../types';

export interface CouponValidationResult {
  couponId: string;
  code: string;
  isValid: boolean;
  reason?: string;
  status: 'active' | 'expired' | 'unverified' | 'malformed';
  confidenceScore: number; // 0 to 100
}

/**
 * Validates a coupon's expiration and syntax against current time.
 */
export function validateCoupon(coupon: Coupon): CouponValidationResult {
  const code = coupon.code?.trim().toUpperCase();

  // 1. Code syntax check
  if (!code || code.length < 3 || code.length > 25) {
    return {
      couponId: coupon.id,
      code: coupon.code,
      isValid: false,
      reason: 'كود غير صحيح أو قصير جداً',
      status: 'malformed',
      confidenceScore: 0,
    };
  }

  // 2. Expiry date check
  const expiry = coupon.expiry?.trim();
  if (expiry) {
    const isoDateMatch = expiry.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoDateMatch) {
      const expiryDate = new Date(isoDateMatch[0]);
      const now = new Date();
      if (expiryDate < now) {
        return {
          couponId: coupon.id,
          code,
          isValid: false,
          reason: `انتهت صلاحية الكود بتاريخ ${isoDateMatch[0]}`,
          status: 'expired',
          confidenceScore: 10,
        };
      }
    }
  }

  // 3. Active coupon with high confidence
  return {
    couponId: coupon.id,
    code,
    isValid: true,
    status: 'active',
    confidenceScore: coupon.verified ? 98 : 75,
  };
}

/**
 * Filter an array of coupons, returning only active & verified ones,
 * keeping the user experience clean and reliable.
 */
export function filterActiveCoupons(coupons: Coupon[]): Coupon[] {
  return coupons.filter((c) => {
    const result = validateCoupon(c);
    return result.isValid;
  });
}
