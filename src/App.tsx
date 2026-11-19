import React, { useState, useEffect } from 'react';
import { 
  NavigationTab, 
  Product, 
  Store, 
  CartItem, 
  UserCity, 
  PriceAlert, 
  Coupon 
} from './types';
import { 
  PRODUCTS, 
  STORES, 
  SAUDI_CITIES, 
  INITIAL_PRICE_ALERTS, 
  COUPONS, 
  SAMPLE_PAST_ORDERS 
} from './data/hkeeemData';

import { Navbar } from './components/Navbar';
import { HomeOffersView } from './components/HomeOffersView';
import { QuickListView } from './components/QuickListView';
import { VisionSearchView } from './components/VisionSearchView';
import { StoreMatrixView } from './components/StoreMatrixView';
import { HkeeemBotsView } from './components/HkeeemBotsView';
import { AlertsWatchlistView } from './components/AlertsWatchlistView';
import { ShoppingTimesView } from './components/ShoppingTimesView';
import { CartOptimizerView } from './components/CartOptimizerView';
import { RewardsView } from './components/RewardsView';
import { ShoppingHistoryView } from './components/ShoppingHistoryView';
import { StoreMapView } from './components/StoreMapView';
import { CouponsView } from './components/CouponsView';
import { AlhkmyStoreView } from './components/AlhkmyStoreView';
import { ExclusiveShowcaseView } from './components/ExclusiveShowcaseView';
import { PriceRadarView } from './components/PriceRadarView';
import { LiveVoiceAdvisorModal } from './components/LiveVoiceAdvisorModal';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { OfferToastNotification, ToastData } from './components/OfferToastNotification';
import { LanguageProvider } from './context/LanguageContext';
import AiToolsHub from './components/AiToolsHub';
import { HkeeemChatDrawer } from './components/HkeeemChatDrawer';
import { CheckoutOrderModal } from './components/CheckoutOrderModal';
import { ProductCompareBar } from './components/ProductCompareBar';
import { ProductComparisonModal } from './components/ProductComparisonModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { GoogleAnalyticsModal } from './components/GoogleAnalyticsModal';
import { AppSettingsModal } from './components/AppSettingsModal';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { HkeeemFooter } from './components/HkeeemFooter';
import { initGA, trackPageView, trackEvent } from './utils/analytics';
import { useDataSaver } from './context/DataSaverContext';
import {
  syncCartToSupabase,
  saveOrderToSupabase,
  syncWatchlistAlertsToSupabase,
} from './lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

import { Bot, ShoppingCart, Sparkles, X, Share2, Zap } from 'lucide-react';

export default function App() {
  const { isDataSaverEnabled, dataSaverLevel } = useDataSaver();
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [selectedCity, setSelectedCity] = useState<UserCity>(SAUDI_CITIES[0]); // الرياض
  const [searchQuery, setSearchQuery] = useState('');
  const [products] = useState<Product[]>(PRODUCTS);
  const [stores] = useState<Store[]>(STORES);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isVoiceAdvisorOpen, setIsVoiceAdvisorOpen] = useState(false);
  const [isDailyChallengeOpen, setIsDailyChallengeOpen] = useState(false);
  const [appliedCartCoupon, setAppliedCartCoupon] = useState<string>('570C');
  const [globalToast, setGlobalToast] = useState<ToastData | null>(null);

  // Cashback loyalty wallet balance
  const [walletBalance, setWalletBalance] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hkeeem_wallet');
      if (saved) return Number(saved);
    } catch (e) {}
    return 150.0; // 150 SAR starting loyalty cashback balance
  });

  // Initialize Google Analytics on mount
  useEffect(() => {
    initGA();
  }, []);

  // Track page views on tab change
  useEffect(() => {
    trackPageView(`/${activeTab}`, `حكيم AI - ${activeTab}`);
  }, [activeTab]);

  // Debounced product search query tracking in Google Analytics 4
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) return;

    const timer = setTimeout(() => {
      const matchCount = products.filter(
        (p) =>
          p.nameAr.toLowerCase().includes(trimmed.toLowerCase()) ||
          p.nameEn.toLowerCase().includes(trimmed.toLowerCase()) ||
          p.category.toLowerCase().includes(trimmed.toLowerCase())
      ).length;

      trackEvent('search', {
        search_term: trimmed,
        results_count: matchCount,
        source: 'navbar_search',
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery, products]);

  // Handle city change with smooth data loading skeleton animation
  const handleCitySelect = (city: UserCity) => {
    if (city.id === selectedCity.id) return;
    trackEvent('select_city', {
      city_id: city.id,
      city_name: city.nameAr,
    });
    setIsDataLoading(true);
    setSelectedCity(city);
    setTimeout(() => {
      setIsDataLoading(false);
    }, 450);
  };

  // Cart State with localStorage persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('hkeeem_cart');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Default starter basket items
    return [
      { product: PRODUCTS[0], quantity: 2 }, // حليب المراعي 2 لتر
      { product: PRODUCTS[1], quantity: 1 }, // أرز الشعلان 5 كجم
      { product: PRODUCTS[3], quantity: 1 }, // بيض الوطنية طبق 30
      { product: PRODUCTS[5], quantity: 2 }, // دجاج التنمية طازج
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('hkeeem_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
    // Sync cart to Supabase asynchronously when configured
    syncCartToSupabase(cart).catch(() => {});
  }, [cart]);

  // Shared Cart Ingestion State from Deep Link
  interface SharedCartNotice {
    itemCount: number;
    items: CartItem[];
    originalCartBackup: CartItem[];
  }
  const [sharedCartNotice, setSharedCartNotice] = useState<SharedCartNotice | null>(null);

  // Check for shared cart in deep link on mount
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sharedParam = urlParams.get('shared_cart') || urlParams.get('sc');
      if (sharedParam) {
        let jsonStr = '';
        try {
          const binaryStr = atob(decodeURIComponent(sharedParam));
          const bytes = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));
          jsonStr = new TextDecoder().decode(bytes);
        } catch {
          try {
            jsonStr = atob(sharedParam);
          } catch {
            // failed
          }
        }

        if (jsonStr) {
          const payload = JSON.parse(jsonStr);
          if (payload && Array.isArray(payload.items) && payload.items.length > 0) {
            const reconstructed: CartItem[] = [];
            payload.items.forEach((entry: { id: string; q: number }) => {
              const matched = PRODUCTS.find((p) => p.id === entry.id);
              if (matched) {
                reconstructed.push({
                  product: matched,
                  quantity: Math.max(1, Math.min(99, Number(entry.q) || 1)),
                });
              }
            });

            if (reconstructed.length > 0) {
              setCart((currentCart) => {
                setSharedCartNotice({
                  itemCount: reconstructed.length,
                  items: reconstructed,
                  originalCartBackup: currentCart,
                });
                return reconstructed;
              });
              setActiveTab('cart');

              // Clean up query param smoothly without reloading
              const cleanUrl = window.location.pathname;
              window.history.replaceState({}, document.title, cleanUrl);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error parsing shared_cart', e);
    }
  }, []);

  // Price Alerts State (Watchlist)
  const [alerts, setAlerts] = useState<PriceAlert[]>(INITIAL_PRICE_ALERTS);

  // Sync watchlist alerts to Supabase asynchronously when configured
  useEffect(() => {
    syncWatchlistAlertsToSupabase(alerts).catch(() => {});
  }, [alerts]);

  // Theme state with localStorage persistence
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem('hkeeem_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('hkeeem_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('hkeeem_theme', 'light');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Google Maps Platform Quota Defense (Demo Key)
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Past Orders State
  const [pastOrders, setPastOrders] = useState(SAMPLE_PAST_ORDERS);

  // Modals & Drawers
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isGaModalOpen, setIsGaModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [checkoutSummary, setCheckoutSummary] = useState<{
    total: number;
    subtotal: number;
    savings: number;
    shipping: number;
    appliedCoupon?: Coupon;
  }>({
    total: 0,
    subtotal: 0,
    savings: 0,
    shipping: 0,
  });

  // Cart Handlers
  const handleAddToCart = (product: Product) => {
    const pricesList = Object.values(product.prices).map((p) => p.priceInclVat);
    const lowestPrice = pricesList.length > 0 ? Math.min(...pricesList) : 0;
    trackEvent('add_to_cart', {
      item_id: product.id,
      item_name: product.nameAr,
      category: product.category,
      price: lowestPrice,
    });
    setCart((prev) => {
      const exists = prev.find((item) => item.product.id === product.id);
      if (exists) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleAddBatchToCart = (newProducts: Product[]) => {
    trackEvent('add_batch_to_cart', {
      items_count: newProducts.length,
    });
    setCart((prev) => {
      const updated = [...prev];
      newProducts.forEach((p) => {
        const idx = updated.findIndex((item) => item.product.id === p.id);
        if (idx >= 0) {
          updated[idx].quantity += 1;
        } else {
          updated.push({ product: p, quantity: 1 });
        }
      });
      return updated;
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    trackEvent('update_cart_quantity', {
      item_id: productId,
      delta,
    });
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    trackEvent('remove_from_cart', {
      item_id: productId,
    });
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    trackEvent('clear_cart');
    setCart([]);
  };

  // Toggle Price Alert for Product
  const handleToggleAlert = (product: Product) => {
    const exists = alerts.find((a) => a.productId === product.id);
    if (exists) {
      setAlerts((prev) => prev.filter((a) => a.productId !== product.id));
    } else {
      let minPrice = Infinity;
      let minStore = 'أسواق العثيم';
      Object.entries(product.prices).forEach(([sId, pInfo]) => {
        if (pInfo.inStock && pInfo.priceInclVat < minPrice) {
          minPrice = pInfo.priceInclVat;
          const s = stores.find((st) => st.id === sId);
          if (s) minStore = s.name;
        }
      });

      const newAlert: PriceAlert = {
        id: `alt_${Date.now()}`,
        productId: product.id,
        productName: product.nameAr,
        productImage: product.imageUrl,
        targetPrice: Math.max(5, minPrice - 3),
        currentLowestPrice: minPrice,
        storeName: minStore,
        createdAt: 'اليوم',
        triggered: false,
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }
  };

  // Checkout Handlers
  const handleProceedToCheckout = (summary: typeof checkoutSummary) => {
    trackEvent('begin_checkout', {
      total: summary.total,
      subtotal: summary.subtotal,
      savings: summary.savings,
    });
    setCheckoutSummary(summary);
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (receipt: any) => {
    trackEvent('purchase', {
      transaction_id: receipt.orderId,
      value: receipt.total,
      savings: receipt.savings,
      currency: 'SAR',
    });

    const orderItems = cart.map((c) => {
      const pricesList = Object.values(c.product.prices)
        .filter((p) => p.inStock)
        .map((p) => p.priceInclVat);
      const unitPrice = pricesList.length > 0 ? Math.min(...pricesList) : 0;
      return {
        id: c.product.id,
        name: c.product.nameAr,
        category: c.product.category,
        price: unitPrice,
        quantity: c.quantity,
        unit: c.product.unit,
        storeName: 'سلة حكيم الذكية الأوفر',
      };
    });

    const catAgg: Record<string, { amount: number; itemCount: number }> = {};
    let itemsSubtotal = 0;
    orderItems.forEach((item) => {
      const lineTotal = item.price * item.quantity;
      itemsSubtotal += lineTotal;
      if (!catAgg[item.category]) {
        catAgg[item.category] = { amount: 0, itemCount: 0 };
      }
      catAgg[item.category].amount += lineTotal;
      catAgg[item.category].itemCount += item.quantity;
    });

    const orderCategories = Object.entries(catAgg).map(([category, info]) => ({
      category,
      amount: Number(info.amount.toFixed(2)),
      percentage: itemsSubtotal > 0 ? Number(((info.amount / itemsSubtotal) * 100).toFixed(1)) : 0,
      itemCount: info.itemCount,
    }));

    const newOrder = {
      id: receipt.orderId,
      date: 'اليوم',
      store: 'سلة حكيم الذكية الأوفر',
      total: receipt.total,
      savings: receipt.savings,
      itemsCount: cart.reduce((a, b) => a + b.quantity, 0),
      status: 'مكتمل ومستلم',
      categories: orderCategories,
      items: orderItems,
    };
    setPastOrders((prev: typeof SAMPLE_PAST_ORDERS) => [newOrder, ...prev]);
    saveOrderToSupabase(newOrder).catch(() => {});
    setCart([]);
  };

  // Compare Products State (up to 3 products)
  const [compareProductIds, setCompareProductIds] = useState<string[]>([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  const handleToggleCompare = (product: Product) => {
    if (compareProductIds.includes(product.id)) {
      setCompareProductIds((prev) => prev.filter((id) => id !== product.id));
      setGlobalToast({
        title: 'تمت إزالة السلعة من المقارنة',
        message: `تم حذف "${product.nameAr}" من جدول المقارنة.`,
      });
    } else {
      if (compareProductIds.length >= 3) {
        setGlobalToast({
          title: 'الحد الأقصى للمقارنة هو 3 سلع',
          message: 'يمكنك مقارنة حتى 3 سلع جنباً إلى جنب. احذف إحدى السلع لإضافة سلعة جديدة.',
        });
        return;
      }
      setCompareProductIds((prev) => [...prev, product.id]);
      setGlobalToast({
        title: 'تمت الإضافة لجدول المقارنة',
        message: `أضيفت "${product.nameAr}" إلى المقارنة (${compareProductIds.length + 1} من 3).`,
        actionLabel: 'فتح جدول المقارنة ↗',
      });
    }
  };

  const handleRemoveCompareProduct = (productId: string) => {
    setCompareProductIds((prev) => prev.filter((id) => id !== productId));
  };

  const handleAddProductToCompare = (product: Product) => {
    if (!compareProductIds.includes(product.id) && compareProductIds.length < 3) {
      setCompareProductIds((prev) => [...prev, product.id]);
    }
  };

  const handleClearAllCompare = () => {
    setCompareProductIds([]);
  };

  const handleAddAllComparedToCart = (productsToCart?: Product[]) => {
    const items = productsToCart || products.filter((p) => compareProductIds.includes(p.id));
    if (items.length === 0) return;
    handleAddBatchToCart(items);
    setGlobalToast({
      title: `تمت إضافة كافة السلع المقارنة (${items.length}) للسلة!`,
      message: 'تم إدراج جميع السلع في قائمة مشترياتك وسلتك الذكية مع تفعيل كود الخصم.',
      actionLabel: 'الانتقال إلى السلة ↗',
    });
  };

  // Mapping quantities for HomeOffersView
  const cartItemQuantities: Record<string, number> = {};
  cart.forEach((c) => {
    cartItemQuantities[c.product.id] = c.quantity;
  });

  const alertProductIds = alerts.map((a) => a.productId);
  const cartTotalItems = cart.reduce((a, b) => a + b.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900 transition-colors duration-200">
      {/* Top Navigation Bar */}
      <Navbar
        currentTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'compare') {
            setIsComparisonModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        compareCount={compareProductIds.length}
        selectedCity={selectedCity}
        onSelectCity={handleCitySelect}
        cities={SAUDI_CITIES}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartCount={cartTotalItems}
        alertsCount={alerts.length}
        onOpenChat={() => {
          trackEvent('chat_bot_open', { source: 'header_button' });
          setIsChatOpen(true);
        }}
        onVoiceSearchClick={() => {
          trackEvent('voice_search_click', { source: 'navbar_mic' });
          setIsChatOpen(true);
        }}
        onOpenVoiceAdvisor={() => {
          trackEvent('open_voice_advisor', { source: 'navbar_btn' });
          setIsVoiceAdvisorOpen(true);
        }}
        onOpenDailyChallenge={() => {
          trackEvent('open_daily_challenge', { source: 'navbar_btn' });
          setIsDailyChallengeOpen(true);
        }}
        onOpenAnalytics={() => setIsGaModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSupabaseSync={() => setIsSupabaseModalOpen(true)}
        walletBalance={walletBalance}
        isDark={isDarkMode}
        onToggleTheme={handleToggleTheme}
      />

      {/* Google Maps Quota Warning Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm" dir="rtl">
          <span>
            تم الوصول إلى الحد المسموح به لخرائط Google Maps Platform.{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              موقع مطوري خرائط Google
            </a>{' '}
            لتحديث الحساب وإعدادات الحصة.
          </span>
        </div>
      )}

      {/* Shared Cart Ingestion Notification Banner */}
      {sharedCartNotice && (
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white px-4 py-3 shadow-md sticky top-0 z-50 animate-fade-in border-b border-emerald-500/30" dir="rtl">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-amber-400 text-slate-950 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <span className="font-black text-amber-300">تم استيراد سلة مقاضي مشتركة بنجاح! 🛒</span>
                <span className="text-emerald-100 mr-1.5 hidden sm:inline">
                  تم تحميل {sharedCartNotice.itemCount} سلع موفرة في سلتك الحالية.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Merge with previous backup
                  setCart((prev) => {
                    const merged = [...prev];
                    sharedCartNotice.originalCartBackup.forEach((backupItem) => {
                      const existing = merged.find((m) => m.product.id === backupItem.product.id);
                      if (existing) {
                        existing.quantity += backupItem.quantity;
                      } else {
                        merged.push(backupItem);
                      }
                    });
                    return merged;
                  });
                  setSharedCartNotice(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                دمج مع سلتي السابقة
              </button>

              <button
                onClick={() => {
                  // Restore original cart
                  setCart(sharedCartNotice.originalCartBackup);
                  setSharedCartNotice(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-black/30 hover:bg-black/40 text-emerald-200 font-bold text-xs transition-colors cursor-pointer"
              >
                تراجع
              </button>

              <button
                onClick={() => setSharedCartNotice(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="إغلاق التنبيه"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area based on Active Tab */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        {activeTab === 'exclusive-deals' && (
          <ExclusiveShowcaseView
            products={products}
            onAddToCart={handleAddToCart}
            onApplyCouponToCart={(code) => {
              setAppliedCartCoupon(code);
              setGlobalToast({
                title: `تم تطبيق الكوبون (${code}) بنجاح!`,
                message: `تم تفعيل كود الخصم في سلتك. ستستمتع بأفضل خصم عند إتمام الطلب من متجر حكيم الذكي alhkmy.store.`,
                actionUrl: 'https://alhkmy.store',
                actionLabel: 'تصفح عروض متجر حكيم الذكي ↗',
              });
            }}
            onOpenVoiceAdvisor={() => setIsVoiceAdvisorOpen(true)}
            walletBalance={walletBalance}
          />
        )}

        {activeTab === 'price-radar' && (
          <PriceRadarView
            products={products}
            stores={stores}
            alerts={alerts}
            onAddToCart={handleAddToCart}
            onToggleAlert={handleToggleAlert}
            onUpdateAlerts={setAlerts}
            alertProductIds={alertProductIds}
            onOpenSupabaseSync={() => setIsSupabaseModalOpen(true)}
          />
        )}

        {activeTab === 'home' && (
          <HomeOffersView
            products={products}
            stores={stores}
            searchQuery={searchQuery}
            onAddToCart={handleAddToCart}
            cartItemQuantities={cartItemQuantities}
            onToggleAlert={handleToggleAlert}
            alertProductIds={alertProductIds}
            onOpenQuickList={() => setActiveTab('quicklist')}
            onOpenImageSearch={() => setActiveTab('image-search')}
            isLoading={isDataLoading}
            compareProductIds={compareProductIds}
            onToggleCompare={handleToggleCompare}
            onOpenAlhkmyStore={() => setActiveTab('alhkmy-store')}
            pastOrders={pastOrders}
            cart={cart}
            onOpenHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'alhkmy-store' && (
          <AlhkmyStoreView
            products={products}
            store={stores.find((s) => s.id === 'alhkmystore') || stores[0]}
            onAddToCart={handleAddToCart}
            onOpenOfferModal={(product, store, priceInfo) => {
              // Can navigate to home or view offer modal
              setActiveTab('home');
            }}
          />
        )}

        {activeTab === 'quicklist' && (
          <QuickListView
            products={products}
            stores={stores}
            onAddSelectedToCart={handleAddBatchToCart}
            onGoToCart={() => setActiveTab('cart')}
          />
        )}

        {activeTab === 'image-search' && (
          <VisionSearchView
            products={products}
            onAddToCart={handleAddToCart}
            onGoToCart={() => setActiveTab('cart')}
          />
        )}

        {activeTab === 'matrix' && (
          <StoreMatrixView
            products={products}
            stores={stores}
            onAddToCart={handleAddToCart}
            isLoading={isDataLoading}
          />
        )}

        {activeTab === 'bots' && (
          <HkeeemBotsView
            products={products}
            stores={stores}
            onOpenCouponsTab={() => setActiveTab('coupons')}
            onOpenOffersTab={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsWatchlistView
            alerts={alerts}
            stores={stores}
            products={products}
            onRemoveAlert={(id) => setAlerts((prev) => prev.filter((a) => a.id !== id))}
            onAddToCart={handleAddToCart}
            onUpdateAlerts={setAlerts}
          />
        )}

        {activeTab === 'shopping-times' && <ShoppingTimesView />}

        {activeTab === 'cart' && (
          <CartOptimizerView
            cart={cart}
            stores={stores}
            coupons={COUPONS}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onProceedToCheckout={handleProceedToCheckout}
            onContinueShopping={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'rewards' && (
          <RewardsView
            currentSpend={320}
            targetSpendForElite={500}
            onExploreOffers={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'history' && (
          <ShoppingHistoryView
            pastOrders={pastOrders}
            onOpenStoreOffers={() => setActiveTab('home')}
            products={products}
            stores={stores}
            cart={cart}
            onAddToCart={handleAddToCart}
          />
        )}

        {activeTab === 'maps' && (
          <StoreMapView
            stores={stores}
            selectedCity={selectedCity}
            onSelectCity={setSelectedCity}
            cities={SAUDI_CITIES}
          />
        )}

        {activeTab === 'coupons' && <CouponsView coupons={COUPONS} />}

        {activeTab === 'ai-tools' && <AiToolsHub />}
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 md:bottom-5 left-4 sm:left-5 z-40 flex items-center gap-2.5 sm:gap-3">
        <AnimatePresence>
          {activeTab !== 'cart' && cartTotalItems > 0 && (
            <motion.button
              key="floating-cart-btn"
              initial={{ opacity: 0, scale: 0.8, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 16 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 360, damping: 24 }}
              onClick={() => setActiveTab('cart')}
              className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full bg-slate-900 text-white font-black text-xs sm:text-sm flex items-center gap-2 sm:gap-2.5 shadow-xl hover:bg-slate-800 cursor-pointer border border-slate-700"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <motion.span
                  key={cartTotalItems}
                  initial={{ scale: 1.45 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                  className="absolute -top-2 -right-2 bg-emerald-500 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center"
                >
                  {cartTotalItems}
                </motion.span>
              </div>
              <span className="hidden sm:inline">سلة التوفير الذكية</span>
              <span className="sm:hidden">السلة</span>
            </motion.button>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsChatOpen(true)}
          className="px-4 py-3 rounded-full bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-xl transition-all transform active:scale-95 cursor-pointer ring-2 ring-emerald-500/30"
          title="مساعد حكيم AI الذكي"
        >
          <div className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span>اسأل حكيم AI</span>
        </button>
      </div>

      {/* AI Assistant Chat Drawer */}
      <HkeeemChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        userCity={selectedCity}
        cart={cart}
      />

      {/* Checkout Modal */}
      <CheckoutOrderModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        summary={checkoutSummary}
        onOrderSuccess={handleOrderSuccess}
        userCity={selectedCity.nameAr}
      />

      {/* Live Voice Advisor Modal */}
      <LiveVoiceAdvisorModal
        isOpen={isVoiceAdvisorOpen}
        onClose={() => setIsVoiceAdvisorOpen(false)}
      />

      {/* Daily Challenge Quiz Modal */}
      <DailyChallengeModal
        isOpen={isDailyChallengeOpen}
        onClose={() => setIsDailyChallengeOpen(false)}
        onApplyVipCode={(code) => {
          setAppliedCartCoupon(code);
          setGlobalToast({
            title: `🎉 مبروك! فزت بكود الخصم الذهبي (${code})`,
            message: `تم تطبيق كود الخصم VIP بنسبة 20% على سلتك في متجر حكيم الذكي alhkmy.store!`,
            actionUrl: 'https://alhkmy.store',
            actionLabel: 'الانتقال إلى متجر حكيم وتطبيق الكود ↗',
          });
        }}
      />

      {/* Floating Compare Bar */}
      <ProductCompareBar
        selectedProducts={products.filter((p) => compareProductIds.includes(p.id))}
        stores={stores}
        onRemoveProduct={handleRemoveCompareProduct}
        onClearAll={handleClearAllCompare}
        onOpenComparison={() => setIsComparisonModalOpen(true)}
      />

      {/* Side-by-Side Product Comparison Modal */}
      <ProductComparisonModal
        isOpen={isComparisonModalOpen || activeTab === 'compare'}
        onClose={() => {
          setIsComparisonModalOpen(false);
          if (activeTab === 'compare') {
            setActiveTab('home');
          }
        }}
        comparedProducts={products.filter((p) => compareProductIds.includes(p.id))}
        allProducts={products}
        stores={stores}
        onAddToCart={handleAddToCart}
        onAddAllToCart={handleAddAllComparedToCart}
        onRemoveProduct={handleRemoveCompareProduct}
        onAddProductToCompare={handleAddProductToCompare}
        onClearAll={handleClearAllCompare}
      />

      {/* Global Toast Notification */}
      <OfferToastNotification
        toast={globalToast}
        onClose={() => setGlobalToast(null)}
      />

      {/* Mobile Bottom Navigation Bar (md:hidden) */}
      <MobileBottomNav
        currentTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'compare') {
            setIsComparisonModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        cartCount={cartTotalItems}
        compareCount={compareProductIds.length}
        onOpenChat={() => setIsChatOpen(true)}
        selectedCity={selectedCity.nameAr}
        themeMode={isDarkMode ? 'dark' : 'light'}
        isDark={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onOpenAnalytics={() => setIsGaModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Google Analytics 4 Management & Diagnostics Modal */}
      <GoogleAnalyticsModal
        isOpen={isGaModalOpen}
        onClose={() => setIsGaModalOpen(false)}
      />

      {/* App Settings & Data Saver Modal */}
      <AppSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Supabase Cloud Sync Modal */}
      <SupabaseSyncModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        cart={cart}
        wishlistProductIds={[]}
      />

      {/* Floating Data Saver Indicator & Quick Switcher (Desktop) */}
      {isDataSaverEnabled && (
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="hidden md:flex fixed bottom-6 left-6 z-40 bg-slate-900/90 hover:bg-slate-900 text-white backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-emerald-500/50 cursor-pointer items-center gap-2 transition-all active:scale-95 text-xs font-black animate-in fade-in slide-in-from-bottom-2 duration-300"
          title="الوضع الاقتصادي مفعل - اضغط لتعديل الإعدادات"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
          <span>الوضع الاقتصادي مفعل ({dataSaverLevel === 'ultra' ? 'أقصى - 95%' : '80% توفير'})</span>
        </button>
      )}

      {/* Saudi E-commerce Footer */}
      <HkeeemFooter onSelectTab={setActiveTab} />
    </div>
  );
}
