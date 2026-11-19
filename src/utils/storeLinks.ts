import { Store, Product, StorePriceInfo } from '../types';

/**
 * Information structure for official Noon campaign coupons
 * Campaign details: Valid until 31 December 2026, 10% Cashback up to 75 SAR
 */
export interface NoonCouponConfig {
  code: string;
  nameAr: string;
  badgeAr: string;
  discountText: string;
  cashbackText: string;
  cashbackPercent: number; // 10%
  maxCashback: number; // 75 SAR
  expiry: string; // '31 ديسمبر 2026'
  description: string;
  storeUrl: string;
  isPrimary?: boolean;
}

/**
 * 5 Active Noon Campaign Coupons (سارية حتى 31 ديسمبر 2026 بكاش باك 10% حتى 75)
 * 1. HKEEEM2 (Primary / Default)
 * 2. JQUDQ
 * 3. XTMSM
 * 4. IVQVQ
 * 5. ACOCS
 */
export const NOON_CAMPAIGN_COUPONS: NoonCouponConfig[] = [
  {
    code: 'HKEEEM2',
    nameAr: 'كوبون نون الأساسي المعتمد',
    badgeAr: 'الكوبون الأول • رسمي',
    discountText: 'كاش باك 10% حتى 75 ر.س',
    cashbackText: '10% كاش باك (حد أقصى 75 ر.س)',
    cashbackPercent: 10,
    maxCashback: 75,
    expiry: 'سارٍ حتى 31 ديسمبر 2026',
    description: 'كوبون نون الرئيسي المعتمد لحملة حكيم AI: استرداد كاش باك 10% بحد أقصى 75 ر.س على مقاضي السوبرماركت والأقسام المشمولة.',
    storeUrl: 'https://s.noon.com/RZu4tvxjJ8Q',
    isPrimary: true,
  },
  {
    code: 'JQUDQ',
    nameAr: 'كوبون نون المباشر (حملة التوفير)',
    badgeAr: 'الكوبون الثاني • فعال',
    discountText: 'كاش باك 10% حتى 75 ر.س',
    cashbackText: '10% كاش باك (حد أقصى 75 ر.س)',
    cashbackPercent: 10,
    maxCashback: 75,
    expiry: 'سارٍ حتى 31 ديسمبر 2026',
    description: 'كود خصم وكاش باك 10% حتى 75 ر.س معتمد ومفحوص لكافة مقاضي ومنتجات نون السعودية.',
    storeUrl: 'https://s.noon.com/RZu4tvxjJ8Q',
  },
  {
    code: 'XTMSM',
    nameAr: 'كوبون نون التوفيري الحصري',
    badgeAr: 'الكوبون الثالث • معتمد',
    discountText: 'كاش باك 10% حتى 75 ر.س',
    cashbackText: '10% كاش باك (حد أقصى 75 ر.س)',
    cashbackPercent: 10,
    maxCashback: 75,
    expiry: 'سارٍ حتى 31 ديسمبر 2026',
    description: 'كوبون حملة نون المعتمد يمنحك 10% كاش باك فوري حتى 75 ر.س لسلات المقاضي والمستلزمات اليومية.',
    storeUrl: 'https://s.noon.com/RZu4tvxjJ8Q',
  },
  {
    code: 'IVQVQ',
    nameAr: 'كوبون نون الذكي السريع',
    badgeAr: 'الكوبون الرابع • مجرب',
    discountText: 'كاش باك 10% حتى 75 ر.س',
    cashbackText: '10% كاش باك (حد أقصى 75 ر.س)',
    cashbackPercent: 10,
    maxCashback: 75,
    expiry: 'سارٍ حتى 31 ديسمبر 2026',
    description: 'كود نشط ومعتمد يوفر كاش باك 10% حتى 75 ر.س عند إتمام سلة التسوق في منصة نون السعودية.',
    storeUrl: 'https://s.noon.com/RZu4tvxjJ8Q',
  },
  {
    code: 'ACOCS',
    nameAr: 'كوبون نون للمقاضي والمؤن',
    badgeAr: 'الكوبون الخامس • حصري',
    discountText: 'كاش باك 10% حتى 75 ر.س',
    cashbackText: '10% كاش باك (حد أقصى 75 ر.س)',
    cashbackPercent: 10,
    maxCashback: 75,
    expiry: 'سارٍ حتى 31 ديسمبر 2026',
    description: 'كود خصم معتمد لحملة نون 2026 يقدم كاش باك 10% بقيمة تصل إلى 75 ريال لجميع العملاء.',
    storeUrl: 'https://s.noon.com/RZu4tvxjJ8Q',
  },
];

/**
 * Official Affiliate Tracking Links for Noon KSA
 * Used to ensure commission attribution on Buy Now and Add to Cart actions
 */
export const NOON_AFFILIATE_CONFIG = {
  couponCode: 'HKEEEM2',
  couponCodes: NOON_CAMPAIGN_COUPONS.map(c => c.code),
  coupons: NOON_CAMPAIGN_COUPONS,
  links: {
    // Primary link for Groceries, Daily, Pantry, Health, Household
    grocery: 'https://s.noon.com/RZu4tvxjJ8Q',
    // Secondary link for Electronics, Home Appliances, Tech, General
    electronics: 'https://s.noon.com/GNyYYcGJwGY',
    // Fallback default affiliate shortlink
    default: 'https://s.noon.com/RZu4tvxjJ8Q',
  },
  discountText: 'كاش باك 10% حتى 75 ر.س (سارٍ حتى 31 ديسمبر 2026)',
  expiryText: 'سارٍ حتى 31 ديسمبر 2026',
};

/**
 * Check if a coupon code belongs to the official Noon campaign
 */
export const isNoonCampaignCoupon = (code: string): boolean => {
  if (!code) return false;
  const normalized = code.trim().toUpperCase();
  return NOON_CAMPAIGN_COUPONS.some(c => c.code.toUpperCase() === normalized);
};

/**
 * Get the coupon configuration for a given Noon code
 */
export const getNoonCouponConfig = (code: string): NoonCouponConfig | undefined => {
  if (!code) return undefined;
  const normalized = code.trim().toUpperCase();
  return NOON_CAMPAIGN_COUPONS.find(c => c.code.toUpperCase() === normalized);
};

/**
 * Distribute or recommend a Noon coupon from the 5 active codes.
 * Rotates or chooses based on user index / cart seed to ensure fair distribution and maximum benefit.
 */
export const distributeOptimalNoonCoupon = (seed?: number | string): NoonCouponConfig => {
  if (seed === undefined) {
    return NOON_CAMPAIGN_COUPONS[0]; // HKEEEM2 by default
  }
  let index = 0;
  if (typeof seed === 'number') {
    index = Math.abs(Math.floor(seed)) % NOON_CAMPAIGN_COUPONS.length;
  } else {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    index = Math.abs(hash) % NOON_CAMPAIGN_COUPONS.length;
  }
  return NOON_CAMPAIGN_COUPONS[index];
};

/**
 * Returns the appropriate Noon affiliate tracking link based on product category
 */
export const getNoonAffiliateLink = (
  product?: Product,
  priceInfo?: StorePriceInfo
): string => {
  // If an explicit affiliate URL was pre-configured on the price object, honor it
  if (priceInfo?.offerUrl && priceInfo.offerUrl.includes('s.noon.com')) {
    return priceInfo.offerUrl;
  }

  if (!product) {
    return NOON_AFFILIATE_CONFIG.links.default;
  }

  const category = (product.category || '').toLowerCase();
  const tags = (product.tags || []).join(' ').toLowerCase();
  const name = (product.nameAr + ' ' + (product.nameEn || '')).toLowerCase();

  // If electronics, gadgets, appliances, or tech:
  if (
    category.includes('إلكترونيات') ||
    category.includes('أجهزة') ||
    category.includes('electronics') ||
    tags.includes('إلكترونيات') ||
    name.includes('شاحن') ||
    name.includes('سماعة') ||
    name.includes('جوال')
  ) {
    return NOON_AFFILIATE_CONFIG.links.electronics;
  }

  // Default for groceries, pantry, dairy, personal care, baby products, etc.
  return NOON_AFFILIATE_CONFIG.links.grocery;
};

/**
 * Returns the direct purchase / offer URL for any given store.
 * For Noon, it automatically resolves to the affiliate tracking link.
 */
export const getDirectOfferUrl = (
  store: Store,
  product?: Product,
  priceInfo?: StorePriceInfo
): string => {
  // 1. Noon KSA: Always route through affiliate tracking shortlinks
  if (store.id === 'noon' || store.id.toLowerCase().includes('noon')) {
    return getNoonAffiliateLink(product, priceInfo);
  }

  // 2. If explicit offerUrl was provided
  if (priceInfo?.offerUrl) {
    return priceInfo.offerUrl;
  }

  const query = product ? encodeURIComponent(`${product.nameAr} ${product.unit || ''}`) : '';

  switch (store.id) {
    case 'alhkmy_store':
    case 'alhkmystore':
    case 'alhkmy':
      return `https://alhkmy.store/search?q=${query}`;
    case 'panda':
      return `https://panda.com.sa/ar/catalogsearch/result/?q=${query}`;
    case 'othaim':
      return `https://othaimmarkets.com/catalogsearch/result/?q=${query}`;
    case 'carrefour':
      return `https://www.carrefourksa.com/mafsau/ar/search?keyword=${query}`;
    case 'danube':
      return `https://danube.sa/ar/search?q=${query}`;
    case 'amazon':
      return `https://www.amazon.sa/s?k=${query}`;
    case 'lulu':
      return `https://www.luluhypermarket.com/ar-sa/search/?text=${query}`;
    case 'nahdi':
      return `https://www.nahdionline.com/ar/search?q=${query}`;
    case 'tamimi':
      return `https://shop.tamimimarkets.com/ar/search?q=${query}`;
    case 'aliexpress':
      return `https://ar.aliexpress.com/wholesale?SearchText=${query}`;
    case 'temu':
      return `https://www.temu.com/sa/search_result.html?search_key=${query}`;
    case 'shein':
      return `https://ar.shein.com/pdsearch/${query}/`;
    case 'amazon_us':
      return `https://www.amazon.com/s?k=${query}`;
    case 'walmart':
      return `https://www.walmart.com/search?q=${query}`;
    case 'iherb':
      return `https://sa.iherb.com/search?kw=${query}`;
    case 'aljouf_artisanal':
      return `https://aljouf.com.sa/search?q=${query}`;
    case 'najd_craft':
      return `https://alhkmy.store/search?q=${query}`;
    case 'abazeer_organic':
      return `https://abazeer.com/search?q=${query}`;
    case 'watania_organic':
      return `https://watania-agri.com/search?q=${query}`;
    default:
      return `https://www.google.com/search?q=${query}+${encodeURIComponent(store.name)}`;
  }
};
