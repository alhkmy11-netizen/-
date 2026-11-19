export type NavigationTab = 
  | 'home'
  | 'compare'
  | 'exclusive-deals'
  | 'price-radar'
  | 'alhkmy-store'
  | 'quicklist'
  | 'image-search'
  | 'cart'
  | 'wishlist'
  | 'reviews'
  | 'matrix'
  | 'bots'
  | 'alerts'
  | 'maps'
  | 'shopping-times'
  | 'coupons'
  | 'chat'
  | 'rewards'
  | 'history'
  | 'ai-tools';

export type StoreMarketType = 'all' | 'saudi' | 'chinese' | 'american';

export type StoreCategoryType =
  | 'all'
  | 'hypermarket'
  | 'local_artisanal'
  | 'organic_shop'
  | 'small_retail'
  | 'pharmacy'
  | 'ecommerce'
  | 'chinese_store'
  | 'american_store';

export interface StoreCategory {
  id: StoreCategoryType;
  labelAr: string;
  labelEn: string;
  icon: string;
  descriptionAr: string;
}

export type StoreCategoryConfig = StoreCategory;

export interface StoreMarketOption {
  id: StoreMarketType;
  labelAr: string;
  labelEn: string;
  flag: string;
  descriptionAr: string;
}

export interface StorePriceInfo {
  priceExclVat?: number;
  priceInclVat: number;
  inStock: boolean;
  isPromo?: boolean;
  originalPrice?: number;
  offerUrl?: string;
  promoTitle?: string;
  validUntil?: string;
}

export interface Store {
  id: string;
  name: string;
  nameEn: string;
  category: StoreCategoryType;
  categoryNameAr: string;
  market?: 'saudi' | 'chinese' | 'american';
  marketLabelAr?: string;
  logo: string;
  brandColor: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  minimumOrder: number;
  deliveryTime: string;
  rating: number;
  deliverySpeedRating?: number;
  availabilityRating?: number;
  averageRating?: number;
  branchesCount: number;
  supportedCities: string[];
  websiteUrl?: string;
}

export interface HealthyAlternative {
  id: string;
  nameAr: string;
  benefitAr: string;
  healthierReason: string;
  priceEstimateSar: number;
}

export interface NutritionInfo {
  servingSize?: string;
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  saturatedFat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  nutriScore?: string;
  healthHighlights?: string[];
}

export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  brand?: string;
  category: string;
  unit: string;
  barcode: string;
  imageUrl: string;
  tags: string[];
  healthyAlternative?: HealthyAlternative;
  nutrition?: NutritionInfo;
  cashbackPercentage?: number;
  rating?: number;
  reviewsCount?: number;
  audioSummary?: string;
  prices: Record<string, StorePriceInfo>;
  priceHistory?: PriceHistoryPoint[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedStoreId?: string;
  productId?: string;
}

export interface Coupon {
  id: string;
  storeId: string;
  storeName?: string;
  storeLogo?: string;
  code: string;
  discount?: string;
  description: string;
  verified: boolean;
  expiry?: string;
  validUntil?: string;
  discountType?: 'PERCENTAGE' | 'FIXED' | string;
  discountValue?: number;
  maxDiscount?: number;
  minSpend?: number;
  category?: string;
  usesCount?: number;
  storeUrl?: string;
}

export interface HkeeemBot {
  id: 'cars' | 'real_estate' | 'offers' | 'coupons';
  name: string;
  title: string;
  description: string;
  scheduleTime: string;
  cronTimeDescription: string;
  avatarIcon: string;
  badgeColor: string;
  status: string;
  lastRunTime: string;
  nextRunTime: string;
  dealsFoundCount: number;
  accentGradient: string;
}

export type BotMetadata = HkeeemBot;

export interface MarketOfferDeal {
  id: string;
  storeId?: string;
  storeName: string;
  storeLogo: string;
  productName?: string;
  category: string;
  originalPriceSar?: number;
  offerPriceSar?: number;
  discountPercentage?: number;
  offerType?: string;
  validUntil: string;
  branches?: string;
  isHot?: boolean;
  title?: string;
  discountBadge?: string;
  originalPrice?: number;
  dealPrice?: number;
  verified?: boolean;
  productImage?: string;
  features?: string[];
  [key: string]: any;
}

export interface VerifiedCouponDeal {
  id: string;
  storeName: string;
  storeCategory?: string;
  couponCode?: string;
  discountSummary?: string;
  minSpendSar?: number;
  maxDiscountSar?: number;
  verifiedAt?: string;
  successRate?: number;
  exclusiveText?: string;
  storeLogo?: string;
  code?: string;
  discount?: string;
  validUntil?: string;
  description?: string;
  verified?: boolean;
  minSpend?: number;
  category?: string;
  [key: string]: any;
}

export interface CarDeal {
  id: string;
  agencyName: string;
  agencyLogo: string;
  carModel: string;
  carYear: number;
  category: string;
  dealType: string;
  cashPriceSar: number;
  discountedPriceSar: number;
  monthlyInstallmentSar: number;
  profitRate: string;
  features: string[];
  badgeText: string;
  validUntil: string;
  linkText: string;
  city: string;
  agencyUrl?: string;
}

export interface RealEstateDeal {
  id: string;
  title: string;
  dealType?: 'rent' | 'sale';
  propertyType: string;
  city: string;
  district: string;
  priceSar: number;
  pricePeriod?: string;
  areaM2?: number;
  areaSqm?: number;
  bedrooms?: number;
  roomsCount?: string | number;
  features?: string[];
  verified?: boolean;
  licenseNumber?: string;
  falLicenseNumber?: string;
  advertiser?: string;
  badgeText?: string;
  validUntil?: string;
  propertyUrl?: string;
  [key: string]: any;
}

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  targetPrice: number;
  currentLowestPrice: number;
  storeName: string;
  createdAt: string;
  triggered: boolean;
  previousPrice?: number;
  lastNotifiedAt?: string;
  discountPercent?: number;
  emailNotificationEnabled?: boolean;
  userEmail?: string;
}

export interface UserCity {
  id: string;
  nameAr: string;
  nameEn: string;
  region: string;
  lat?: number;
  lng?: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  userName: string;
  userEmail?: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  createdAt: string;
  verifiedPurchase: boolean;
  storePurchasedFrom?: string;
  helpfulCount: number;
}

export interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  city: string;
  isLoggedIn: boolean;
  wishlistIds: string[];
}

export interface PastOrderItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  unit?: string;
  storeName?: string;
}

export interface PastOrderCategory {
  category: string;
  amount: number;
  percentage: number;
  itemCount: number;
}

export interface PastOrder {
  id: string;
  date: string;
  store: string;
  total: number;
  savings: number;
  itemsCount: number;
  status?: string;
  paymentMethod?: string;
  categories?: PastOrderCategory[];
  items?: PastOrderItem[];
}

export interface PriceHistoryPoint {
  date: string;
  day: string;
  avgPrice: number;
  lowestPrice: number;
  highestPrice: number;
  panda?: number;
  othaim?: number;
  danube?: number;
  carrefour?: number;
  amazon?: number;
  lulu?: number;
  event?: string;
}

export interface CartHistoricalWeekPoint {
  weekKey: 'w3_ago' | 'w2_ago' | 'w1_ago' | 'current';
  label: string;
  shortLabel: string;
  date: string;
  smartSplitTotal: number;
  cheapestStoreTotal: number;
  marketAvgTotal: number;
  highestStoreTotal: number;
  pandaTotal: number;
  othaimTotal: number;
  danubeTotal: number;
  carrefourTotal: number;
  amazonTotal: number;
  luluTotal: number;
  eventNote?: string;
}

export interface CartInflationItemChange {
  productId: string;
  productName: string;
  unit: string;
  imageUrl: string;
  quantity: number;
  currentUnitPrice: number;
  pastUnitPrice: number;
  currentTotalPrice: number;
  pastTotalPrice: number;
  deltaSar: number;
  deltaPercent: number;
  trend: 'down' | 'up' | 'stable';
  note: string;
}

export interface CartInflationAnalysis {
  historicalPoints: CartHistoricalWeekPoint[];
  currentTotal: number;
  threeWeeksAgoTotal: number;
  netChangeSar: number;
  netChangePercent: number;
  trend: 'saving' | 'inflation' | 'stable';
  headline: string;
  explanation: string;
  totalSavedVsMarket: number;
  basketCpiScore: number;
  itemChanges: CartInflationItemChange[];
}

export interface SavedCartItemRecord {
  productId: string;
  quantity: number;
  savedUnitPriceSar: number;
  savedTotalPriceSar: number;
  savedStoreId?: string;
  savedStoreName?: string;
}

export interface SavedCartSnapshot {
  id: string;
  title: string;
  savedAt: string;
  dateLabel: string;
  note?: string;
  items: SavedCartItemRecord[];
  totalCostSar: number;
  itemCount: number;
  bestStoreName?: string;
}

export interface CartItemComparison {
  productId: string;
  productName: string;
  unit: string;
  imageUrl: string;
  quantity: number;
  currentUnitPriceSar: number;
  savedUnitPriceSar: number;
  currentTotalPriceSar: number;
  savedTotalPriceSar: number;
  unitPriceDeltaSar: number;
  unitPriceDeltaPercent: number;
  totalPriceDeltaSar: number;
  trend: 'down' | 'up' | 'stable' | 'new' | 'removed';
  bestCurrentStoreName: string;
  savedStoreName?: string;
  changeNote: string;
  category?: string;
  savedQuantity: number;
  currentQuantity: number;
  savedUnitPrice: number;
  currentUnitPrice: number;
  savedTotalPrice: number;
  currentTotalPrice: number;
}

export interface CartComparisonResult {
  savedCart: SavedCartSnapshot;
  currentTotalCost: number;
  savedTotalCost: number;
  costDeltaSar: number;
  costDeltaPercent: number;
  overallTrend: 'cheaper' | 'more_expensive' | 'identical';
  itemsCount: {
    total: number;
    cheaper: number;
    moreExpensive: number;
    stable: number;
    newInCart?: number;
    missingInCart?: number;
    newItems: number;
    removedItems: number;
  };
  itemComparisons: CartItemComparison[];
  topSavingsItem?: CartItemComparison;
  topPriceIncreaseItem?: CartItemComparison;
}


