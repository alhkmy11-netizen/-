import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  Radar,
  TrendingDown,
  TrendingUp,
  Minus,
  Search,
  Bell,
  BellRing,
  ShoppingCart,
  Check,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Calendar,
  SlidersHorizontal,
  X,
  Radio,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  RefreshCw,
  Send,
  Database,
  Trash2,
} from 'lucide-react';
import { PriceAlert, Product, Store } from '../types';
import { PRODUCTS, STORES } from '../data/hkeeemData';
import { analyze30DayTrend, PriceRadarAnalysis, PriceRadarDayPoint } from '../data/priceHistoryHelper';
import { getMarketPriceStats } from '../utils/marketPrice';
import { getDirectOfferUrl } from '../utils/storeLinks';
import { ProductImage, StoreLogoBadge } from './SmartIcon';
import {
  subscribeToWatchlistPriceDrops,
  publishRealtimePriceDrop,
  RealtimeConnectionState,
  RealtimePriceDropEvent,
  SUPABASE_PROJECT_ID,
} from '../lib/supabase';
import {
  isPushSupported,
  getPushPermissionState,
  requestPushPermission,
  sendNativePushNotification,
  playNotificationChime,
} from '../utils/notificationService';

interface PriceRadarViewProps {
  products?: Product[];
  stores?: Store[];
  alerts?: PriceAlert[];
  onAddToCart?: (product: Product) => void;
  onToggleAlert?: (product: Product) => void;
  onUpdateAlerts?: React.Dispatch<React.SetStateAction<PriceAlert[]>>;
  alertProductIds?: string[];
  onOpenSupabaseSync?: () => void;
}

type TimeRangeOption = 30 | 14 | 7;
type ChartModeOption = 'trend' | 'market-band';
type DecisionFilterOption = 'all' | 'watchlist' | 'buy-now' | 'fair' | 'wait';

// Mini inline sparkline for product selector cards
const MiniSparkline: React.FC<{
  points: PriceRadarDayPoint[];
  decision: PriceRadarAnalysis['decision'];
}> = ({ points, decision }) => {
  if (points.length < 2) return null;
  const values = points.map((p) => p.lowestPrice);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 92;
  const height = 28;
  const pad = 2;

  const pathD = values
    .map((val, idx) => {
      const x = pad + (idx / (values.length - 1)) * (width - pad * 2);
      const y = height - pad - ((val - min) / range) * (height - pad * 2);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor =
    decision === 'buy-now'
      ? '#16a34a'
      : decision === 'wait'
      ? '#d97706'
      : '#2563eb';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 overflow-visible"
      aria-hidden="true"
    >
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const PriceRadarView: React.FC<PriceRadarViewProps> = ({
  products = PRODUCTS,
  stores = STORES,
  alerts = [],
  onAddToCart,
  onToggleAlert,
  onUpdateAlerts,
  alertProductIds = [],
  onOpenSupabaseSync,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilterOption>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [timeRange, setTimeRange] = useState<TimeRangeOption>(30);
  const [chartMode, setChartMode] = useState<ChartModeOption>('trend');
  const [showAvgLine, setShowAvgLine] = useState<boolean>(true);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Supabase Realtime Watchlist Price-Drop State
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeConnectionState>('unconfigured');
  const [reconnectTick, setReconnectTick] = useState(0);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimePriceDropEvent[]>([]);
  const [activeDropBanner, setActiveDropBanner] = useState<RealtimePriceDropEvent | null>(null);
  const [livePriceOverrides, setLivePriceOverrides] = useState<Record<string, number>>({});
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() =>
    isPushSupported() ? getPushPermissionState() : 'denied'
  );
  const [isPublishingDrop, setIsPublishingDrop] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const chartPanelRef = useRef<HTMLDivElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const seenEventKeysRef = useRef<Set<string>>(new Set());
  const soundEnabledRef = useRef<boolean>(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Resolve full watchlist alerts (fallback to alertProductIds if alerts array omitted)
  const effectiveWatchlistAlerts = useMemo<PriceAlert[]>(() => {
    if (alerts.length > 0) return alerts;
    return alertProductIds
      .map((pid) => {
        const prod = products.find((p) => p.id === pid);
        if (!prod) return null;
        const stats = getMarketPriceStats(prod, stores);
        return {
          id: `alt_${pid}`,
          productId: pid,
          productName: prod.nameAr,
          productImage: prod.imageUrl,
          targetPrice: Math.max(1, Number((stats.minPrice * 0.92).toFixed(2))),
          currentLowestPrice: stats.minPrice,
          storeName: stats.minStore?.name || 'أرخص متجر',
          createdAt: 'اليوم',
          triggered: false,
        } as PriceAlert;
      })
      .filter((item): item is PriceAlert => Boolean(item));
  }, [alerts, alertProductIds, products, stores]);

  const watchlistIdsSet = useMemo(
    () => new Set(effectiveWatchlistAlerts.map((a) => a.productId)),
    [effectiveWatchlistAlerts]
  );

  const watchlistRef = useRef<PriceAlert[]>(effectiveWatchlistAlerts);
  useEffect(() => {
    watchlistRef.current = effectiveWatchlistAlerts;
  }, [effectiveWatchlistAlerts]);

  // Handle verified incoming Supabase Realtime price-drop event (idempotent)
  const handleIncomingPriceDrop = useCallback(
    (event: RealtimePriceDropEvent) => {
      const dedupeKey = `${event.productId}:${event.newPrice.toFixed(2)}`;
      if (seenEventKeysRef.current.has(event.id) || seenEventKeysRef.current.has(dedupeKey)) {
        return;
      }
      seenEventKeysRef.current.add(event.id);
      seenEventKeysRef.current.add(dedupeKey);

      // Update live price override so chart & KPIs reflect the drop immediately
      setLivePriceOverrides((prev) => ({
        ...prev,
        [event.productId]: event.newPrice,
      }));

      // Append to live Realtime events feed
      setRealtimeEvents((prev) => [event, ...prev].slice(0, 12));
      setActiveDropBanner(event);

      // Sync updated price & triggered state back into user's Watchlist alerts
      if (onUpdateAlerts) {
        onUpdateAlerts((prev) =>
          prev.map((a) =>
            a.productId === event.productId
              ? {
                  ...a,
                  previousPrice: event.oldPrice,
                  currentLowestPrice: event.newPrice,
                  storeName: event.storeName || a.storeName,
                  triggered: true,
                  discountPercent: event.dropPercent,
                  lastNotifiedAt: event.receivedAt,
                }
              : a
          )
        );
      }

      // Play audio chime if enabled
      if (soundEnabledRef.current) {
        playNotificationChime();
      }

      // Dispatch native browser push notification if permitted
      const matchedProduct = products.find((p) => p.id === event.productId);
      sendNativePushNotification(`انخفاض فوري في السعر: ${event.productName}`, {
        body: `هبط السعر من ${event.oldPrice.toFixed(2)} إلى ${event.newPrice.toFixed(2)} ر.س (-${event.dropPercent}%) في ${event.storeName}`,
        icon: matchedProduct?.imageUrl,
        tag: event.id,
        onClick: () => {
          setSelectedProductId(event.productId);
        },
      });
    },
    [onUpdateAlerts, products]
  );

  // Subscribe to Supabase Realtime channel for Watchlist price drops
  useEffect(() => {
    const { channel, unsubscribe } = subscribeToWatchlistPriceDrops({
      getWatchlistAlerts: () => watchlistRef.current,
      onPriceDrop: handleIncomingPriceDrop,
      onStatusChange: setRealtimeStatus,
    });

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      unsubscribe();
    };
  }, [handleIncomingPriceDrop, reconnectTick]);

  // Re-check Supabase connection if user configures the Anon Key in another modal/tab
  useEffect(() => {
    const handleFocusOrStorage = () => {
      const hasKey = Boolean(
        localStorage.getItem('hkeeem_supabase_anon_key')?.trim() ||
          (import.meta.env.VITE_SUPABASE_ANON_KEY as string)
      );
      if (hasKey && realtimeStatus === 'unconfigured') {
        setReconnectTick((t) => t + 1);
      }
    };

    window.addEventListener('storage', handleFocusOrStorage);
    window.addEventListener('focus', handleFocusOrStorage);
    return () => {
      window.removeEventListener('storage', handleFocusOrStorage);
      window.removeEventListener('focus', handleFocusOrStorage);
    };
  }, [realtimeStatus]);

  const handleRequestPushPermission = async () => {
    const result = await requestPushPermission();
    setPushPermission(result);
    if (result === 'granted') {
      if (soundEnabled) playNotificationChime();
      sendNativePushNotification('تم تفعيل تنبيهات رادار الأسعار الفورية', {
        body: 'ستصلك إشعارات فورية عبر Supabase Realtime عند انخفاض سعر أي منتج في قائمة المراقبة.',
      });
    }
  };

  // Publish a genuine Supabase Realtime price-drop broadcast/insert for a watchlisted item
  const handlePublishWatchlistPriceDrop = async (targetAlert?: PriceAlert) => {
    setPublishFeedback(null);
    const chosenAlert =
      targetAlert ||
      effectiveWatchlistAlerts.find((a) => a.productId === activeProduct?.id) ||
      effectiveWatchlistAlerts[0];

    if (!chosenAlert) {
      setPublishFeedback({
        type: 'error',
        message: 'أضف منتجاً واحداً على الأقل إلى قائمة المراقبة أولاً.',
      });
      return;
    }

    const prod = products.find((p) => p.id === chosenAlert.productId);
    const currentPrice =
      livePriceOverrides[chosenAlert.productId] ?? chosenAlert.currentLowestPrice;
    const dropStep = Math.max(1, Number((currentPrice * 0.08).toFixed(2)));
    const nextPrice = Math.max(1, Number((currentPrice - dropStep).toFixed(2)));
    const stats = prod ? getMarketPriceStats(prod, stores) : null;

    setIsPublishingDrop(true);
    const res = await publishRealtimePriceDrop(channelRef.current, {
      productId: chosenAlert.productId,
      productName: chosenAlert.productName,
      storeId: stats?.minStore?.id,
      storeName: chosenAlert.storeName || stats?.minStore?.name || 'أسواق العثيم',
      oldPrice: currentPrice,
      newPrice: nextPrice,
      targetPrice: chosenAlert.targetPrice,
    });
    setIsPublishingDrop(false);

    if (!res.success) {
      setPublishFeedback({
        type: 'error',
        message: res.error || 'تعذر إرسال التحديث عبر Supabase Realtime.',
      });
    } else {
      setPublishFeedback({
        type: 'success',
        message: `تم بث تحديث انخفاض السعر لـ «${chosenAlert.productName}» عبر Supabase Realtime.`,
      });
    }
  };

  // Precompute 30-day analysis for all products (applying any live Realtime price drops)
  const analysisMap = useMemo(() => {
    const map = new Map<string, PriceRadarAnalysis>();
    products.forEach((p) => {
      const base = analyze30DayTrend(p);
      const liveOverride = livePriceOverrides[p.id];
      if (liveOverride && liveOverride < base.currentLowest && base.points.length > 0) {
        const updatedPoints = base.points.map((pt, idx) =>
          idx === base.points.length - 1
            ? {
                ...pt,
                lowestPrice: liveOverride,
                event: `انخفاض فوري عبر Supabase Realtime (${liveOverride.toFixed(2)} ر.س)`,
              }
            : pt
        );
        const min30Day = Math.min(base.min30Day, liveOverride);
        const diffFromAvgPercent =
          base.avg30Day > 0
            ? Number((((liveOverride - base.avg30Day) / base.avg30Day) * 100).toFixed(1))
            : base.diffFromAvgPercent;
        const firstPrice = updatedPoints[0].lowestPrice;
        const change30DaySar = Number((liveOverride - firstPrice).toFixed(2));
        const change30DayPercent =
          firstPrice > 0 ? Number((((liveOverride - firstPrice) / firstPrice) * 100).toFixed(1)) : 0;
        const savingsVsPeak30Day = Number(Math.max(0, base.max30Day - liveOverride).toFixed(2));
        const savingsPercentVsPeak =
          base.max30Day > 0 ? Math.round((savingsVsPeak30Day / base.max30Day) * 100) : 0;

        map.set(p.id, {
          ...base,
          points: updatedPoints,
          currentLowest: liveOverride,
          min30Day,
          diffFromAvgPercent,
          change30DaySar,
          change30DayPercent,
          savingsVsPeak30Day,
          savingsPercentVsPeak,
          decision: 'buy-now',
          decisionLabel: 'اشترِ الآن',
          decisionHeadline: 'هبوط فوري مرصود عبر Supabase Realtime — فرصة شراء ممتازة',
          decisionSummary: `هبط السعر لحظياً إلى ${liveOverride.toFixed(2)} ر.س ليصبح أقل بـ ${Math.abs(diffFromAvgPercent)}% من متوسط آخر 30 يوماً.`,
        });
      } else {
        map.set(p.id, base);
      }
    });
    return map;
  }, [products, livePriceOverrides]);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  // Filtered products list
  const radarItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.nameAr.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

      const analysis = analysisMap.get(p.id);
      const matchesDecision =
        decisionFilter === 'all' ||
        (decisionFilter === 'watchlist' && watchlistIdsSet.has(p.id)) ||
        (analysis && analysis.decision === decisionFilter);

      return matchesSearch && matchesCategory && matchesDecision;
    });
  }, [products, search, selectedCategory, decisionFilter, analysisMap, watchlistIdsSet]);

  // Resolve currently active product for the interactive chart
  const activeProduct = useMemo(() => {
    return (
      products.find((p) => p.id === selectedProductId) ||
      radarItems[0] ||
      products[0] ||
      null
    );
  }, [products, radarItems, selectedProductId]);

  const activeAnalysis = useMemo(() => {
    if (!activeProduct) return null;
    return analysisMap.get(activeProduct.id) || analyze30DayTrend(activeProduct);
  }, [activeProduct, analysisMap]);

  const activeMarketStats = useMemo(() => {
    if (!activeProduct) return null;
    return getMarketPriceStats(activeProduct, stores);
  }, [activeProduct, stores]);

  const visibleChartData = useMemo(() => {
    if (!activeAnalysis) return [];
    return activeAnalysis.points.slice(-timeRange);
  }, [activeAnalysis, timeRange]);

  const handleSelectProduct = (product: Product) => {
    setSelectedProductId(product.id);
    if (chartPanelRef.current) {
      chartPanelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleAddToCart = (product: Product) => {
    if (!onAddToCart) return;
    onAddToCart(product);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1500);
  };

  // Summary counts for decision filter buttons
  const decisionCounts = useMemo(() => {
    let buyNow = 0;
    let fair = 0;
    let wait = 0;
    products.forEach((p) => {
      const d = analysisMap.get(p.id)?.decision;
      if (d === 'buy-now') buyNow++;
      else if (d === 'fair') fair++;
      else if (d === 'wait') wait++;
    });
    return {
      all: products.length,
      watchlist: effectiveWatchlistAlerts.length,
      buyNow,
      fair,
      wait,
    };
  }, [products, analysisMap, effectiveWatchlistAlerts.length]);

  const isActiveAlerted = activeProduct ? watchlistIdsSet.has(activeProduct.id) : false;

  const realtimeStatusDisplay = useMemo(() => {
    switch (realtimeStatus) {
      case 'subscribed':
        return {
          label: 'متصل لحظياً عبر Supabase Realtime',
          dotClass: 'bg-emerald-500 animate-pulse',
          textClass: 'text-emerald-700 dark:text-emerald-400',
          icon: <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
        };
      case 'connecting':
        return {
          label: 'جاري تأسيس اتصال Supabase Realtime...',
          dotClass: 'bg-amber-500 animate-pulse',
          textClass: 'text-amber-700 dark:text-amber-400',
          icon: <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin shrink-0" />,
        };
      case 'channel_error':
      case 'closed':
        return {
          label: 'تعذر الاتصال بقناة Supabase Realtime',
          dotClass: 'bg-rose-500',
          textClass: 'text-rose-700 dark:text-rose-400',
          icon: <WifiOff className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />,
        };
      default:
        return {
          label: 'بانتظار ربط مفتاح Supabase Realtime',
          dotClass: 'bg-slate-400',
          textClass: 'text-slate-600 dark:text-slate-400',
          icon: <Database className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />,
        };
    }
  }, [realtimeStatus]);

  // Custom Recharts tooltip with full Light/Dark contrast
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const point: PriceRadarDayPoint = payload[0].payload;
    const gap = Math.max(0, point.highestPrice - point.lowestPrice);

    return (
      <div
        className="bg-slate-950/95 text-slate-100 p-3.5 rounded-xl shadow-xl border border-slate-700/90 text-right min-w-[210px]"
        dir="rtl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2 mb-2">
          <span className="text-xs font-bold text-white">{point.label}</span>
          <span className="text-[11px] text-slate-400">شامل الضريبة</span>
        </div>

        {point.event && (
          <div className="mb-2.5 text-[11px] text-amber-300 font-medium bg-amber-500/10 border border-amber-500/25 rounded-lg px-2 py-1">
            {point.event}
          </div>
        )}

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-emerald-400 font-medium">أدنى سعر بالسوق</span>
            <span className="font-mono tabular-nums font-bold text-emerald-300">
              {point.lowestPrice.toFixed(2)} ر.س
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">متوسط المتاجر</span>
            <span className="font-mono tabular-nums font-semibold text-white">
              {point.avgPrice.toFixed(2)} ر.س
            </span>
          </div>
          {chartMode === 'market-band' && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-rose-400">أعلى سعر بالسوق</span>
              <span className="font-mono tabular-nums font-semibold text-rose-300">
                {point.highestPrice.toFixed(2)} ر.س
              </span>
            </div>
          )}
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>فارق التوفير المتاح</span>
          <span className="font-mono tabular-nums font-bold text-slate-200">
            {gap.toFixed(2)} ر.س
          </span>
        </div>
      </div>
    );
  };

  const getDecisionTheme = (decision: PriceRadarAnalysis['decision']) => {
    if (decision === 'buy-now') {
      return {
        surface: 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-800/70',
        text: 'text-emerald-800 dark:text-emerald-300',
        accent: 'text-emerald-700 dark:text-emerald-400',
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
      };
    }
    if (decision === 'wait') {
      return {
        surface: 'bg-amber-50 dark:bg-amber-950/35 border-amber-200 dark:border-amber-800/70',
        text: 'text-amber-900 dark:text-amber-300',
        accent: 'text-amber-700 dark:text-amber-400',
        icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
      };
    }
    return {
      surface: 'bg-sky-50 dark:bg-sky-950/35 border-sky-200 dark:border-sky-800/70',
      text: 'text-sky-900 dark:text-sky-300',
      accent: 'text-sky-700 dark:text-sky-400',
      icon: <Clock className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />,
    };
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setDecisionFilter('all');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" dir="rtl">
      {/* Top Header & Search */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Radar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">
              رادار الأسعار الذكي — تحليل اتجاه 30 يوماً
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5 max-w-2xl">
              تابع حركة أسعار المنتجات يومياً خلال آخر 30 يوماً مع توصية واضحة تساعدك على اتخاذ قرار الشراء أو الانتظار.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-80 relative shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="ابحث عن منتج لمراقبة سعره..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl bg-slate-800 text-white placeholder:text-slate-400 border border-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="مسح البحث"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Instant Supabase Realtime Price-Drop Alert Banner */}
      <AnimatePresence>
        {activeDropBanner && (
          <motion.div
            key={activeDropBanner.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            role="alert"
            aria-live="assertive"
            className="p-4 sm:p-5 rounded-2xl bg-emerald-950 text-white border border-emerald-500/50 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-emerald-300 font-semibold">
                  <span>تنبيه فوري من قائمة المراقبة</span>
                  <span aria-hidden="true">·</span>
                  <span>Supabase Realtime</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{activeDropBanner.receivedAt}</span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white mt-0.5 truncate">
                  انخفض سعر «{activeDropBanner.productName}» بنسبة {activeDropBanner.dropPercent}%
                </h2>
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-emerald-100/90 mt-1 font-mono tabular-nums">
                  <span>
                    من <span className="line-through text-emerald-300/70">{activeDropBanner.oldPrice.toFixed(2)}</span> إلى{' '}
                    <strong className="text-white text-sm">{activeDropBanner.newPrice.toFixed(2)} ر.س</strong>
                  </span>
                  <span aria-hidden="true" className="font-sans">·</span>
                  <span className="font-sans">وفر {activeDropBanner.dropAmount.toFixed(2)} ر.س في {activeDropBanner.storeName}</span>
                  {activeDropBanner.reachedTarget && (
                    <>
                      <span aria-hidden="true" className="font-sans">·</span>
                      <span className="font-sans text-amber-300 font-semibold">وصل إلى السعر المستهدف</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const prod = products.find((p) => p.id === activeDropBanner.productId);
                  if (prod) handleSelectProduct(prod);
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                عرض في المخطط
              </button>
              {onAddToCart && (
                <button
                  type="button"
                  onClick={() => {
                    const prod = products.find((p) => p.id === activeDropBanner.productId);
                    if (prod) handleAddToCart(prod);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>أضف للسلة الآن</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveDropBanner(null)}
                aria-label="إغلاق التنبيه الفوري"
                className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supabase Realtime Watchlist Monitoring Panel */}
      <section
        aria-label="تنبيهات انخفاض الأسعار الفورية عبر Supabase Realtime"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                تنبيهات قائمة المراقبة الفورية (Supabase Realtime)
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
              <span className={`inline-flex items-center gap-1.5 font-semibold ${realtimeStatusDisplay.textClass}`}>
                <span className={`w-2 h-2 rounded-full ${realtimeStatusDisplay.dotClass}`} />
                {realtimeStatusDisplay.icon}
                <span>{realtimeStatusDisplay.label}</span>
              </span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                {effectiveWatchlistAlerts.length} سلع قيد المراقبة
              </span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span className="text-slate-500 dark:text-slate-400 font-mono">
                {SUPABASE_PROJECT_ID}
              </span>
            </div>
          </div>

          {/* Realtime Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Sound Chime Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              title={soundEnabled ? 'كتم صوت التنبيه' : 'تفعيل صوت التنبيه'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              <span>{soundEnabled ? 'الصوت مفعّل' : 'صامت'}</span>
            </button>

            {/* Browser Push Notification Toggle */}
            {isPushSupported() && (
              <button
                type="button"
                onClick={handleRequestPushPermission}
                disabled={pushPermission === 'granted'}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  pushPermission === 'granted'
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 cursor-default'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>
                  {pushPermission === 'granted' ? 'إشعارات المتصفح مفعّلة' : 'تفعيل إشعارات المتصفح'}
                </span>
              </button>
            )}

            {/* Connect / Reconnect / Broadcast Test Drop */}
            {realtimeStatus === 'unconfigured' ? (
              <div className="flex items-center gap-1.5">
                {onOpenSupabaseSync && (
                  <button
                    type="button"
                    onClick={onOpenSupabaseSync}
                    className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>ربط Supabase Realtime</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setReconnectTick((t) => t + 1)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="إعادة فحص اتصال Supabase"
                  aria-label="إعادة فحص اتصال Supabase"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : realtimeStatus === 'subscribed' ? (
              <button
                type="button"
                onClick={() => handlePublishWatchlistPriceDrop()}
                disabled={isPublishingDrop || effectiveWatchlistAlerts.length === 0}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                title="إرسال تحديث انخفاض سعر فعلي عبر قناة Supabase Realtime لاختبار التنبيه الفوري"
              >
                {isPublishingDrop ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>بث انخفاض سعر عبر Realtime</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setReconnectTick((t) => t + 1)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة الاتصال</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Line for Publish Action */}
        {publishFeedback && (
          <div
            className={`px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border ${
              publishFeedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/35 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            <span>{publishFeedback.message}</span>
            <button
              type="button"
              onClick={() => setPublishFeedback(null)}
              aria-label="إغلاق الرسالة"
              className="p-0.5 hover:opacity-75 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Active Watchlist Items Strip */}
        {effectiveWatchlistAlerts.length === 0 ? (
          <div className="py-3 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
            <span>
              قائمة المراقبة فارغة حالياً. اضغط على «تنبيه عند انخفاض السعر» لأي منتج لتفعيل الرصد اللحظي عبر Supabase Realtime.
            </span>
            {activeProduct && onToggleAlert && (
              <button
                type="button"
                onClick={() => onToggleAlert(activeProduct)}
                className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer whitespace-nowrap"
              >
                + إضافة «{activeProduct.nameAr}» للمراقبة
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                المنتجات في قائمة المراقبة (تُرسل تنبيهاً فورياً عند أي هبوط في السعر)
              </span>
              <span className="hidden sm:inline">
                اضغط على أي منتج لمعاينة مخطط آخر 30 يوماً
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {effectiveWatchlistAlerts.map((alert) => {
                const prod = products.find((p) => p.id === alert.productId);
                const livePrice = livePriceOverrides[alert.productId] ?? alert.currentLowestPrice;
                const isSelected = activeProduct?.id === alert.productId;
                const reachedTarget = livePrice <= alert.targetPrice;

                return (
                  <div
                    key={alert.id}
                    onClick={() => {
                      if (prod) handleSelectProduct(prod);
                    }}
                    className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-500/70'
                        : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <ProductImage src={alert.productImage} alt={alert.productName} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {alert.productName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            {livePrice.toFixed(2)} ر.س
                          </span>
                          <span aria-hidden="true" className="font-sans">·</span>
                          <span className="font-sans">
                            الهدف: {alert.targetPrice.toFixed(2)}
                          </span>
                        </div>
                        {reachedTarget && (
                          <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                            تم الوصول للسعر المستهدف
                          </div>
                        )}
                      </div>
                    </div>

                    {prod && onToggleAlert && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleAlert(prod);
                        }}
                        aria-label={`إزالة ${alert.productName} من قائمة المراقبة`}
                        title="إزالة من قائمة المراقبة"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Live Received Realtime Alerts Feed */}
        {realtimeEvents.length > 0 && (
          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>سجل التنبيهات الفورية الواردة ({realtimeEvents.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setRealtimeEvents([])}
                className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
              >
                مسح السجل
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              {realtimeEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {ev.productName}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{ev.storeName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                        {ev.oldPrice.toFixed(2)} ← {ev.newPrice.toFixed(2)} ر.س (-{ev.dropPercent}%)
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{ev.receivedAt}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {ev.source === 'postgres_changes' ? 'تحديث قاعدة البيانات' : 'بث Realtime'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const prod = products.find((p) => p.id === ev.productId);
                        if (prod) handleSelectProduct(prod);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      عرض المخطط
                    </button>
                    {onAddToCart && (
                      <button
                        type="button"
                        onClick={() => {
                          const prod = products.find((p) => p.id === ev.productId);
                          if (prod) handleAddToCart(prod);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        أضف للسلة
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Primary Focal Anchor: Interactive 30-Day Price Trend & Buy Decision Workspace */}
      {activeProduct && activeAnalysis && activeMarketStats && (
        <section
          ref={chartPanelRef}
          aria-label="مخطط تغير سعر المنتج خلال 30 يوماً"
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          {/* Selected Product Bar */}
          <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <ProductImage src={activeProduct.imageUrl} alt={activeProduct.nameAr} size="md" />
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  {activeProduct.nameAr}
                </h2>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>{activeProduct.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeProduct.unit}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    متوفر في {activeMarketStats.availableStoresCount} متاجر
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Purchase & Alert Actions */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {onToggleAlert && (
                <button
                  type="button"
                  onClick={() => onToggleAlert(activeProduct)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isActiveAlerted
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Bell className={`w-4 h-4 ${isActiveAlerted ? 'fill-amber-500 text-amber-500' : ''}`} />
                  <span>{isActiveAlerted ? 'تنبيه الهبوط مفعّل' : 'تنبيه عند انخفاض السعر'}</span>
                </button>
              )}

              {onAddToCart && (
                <button
                  type="button"
                  onClick={() => handleAddToCart(activeProduct)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    justAddedId === activeProduct.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {justAddedId === activeProduct.id ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>تمت الإضافة للسلة</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      <span>أضف للسلة الذكية</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Purchase Decision Strip */}
          {(() => {
            const theme = getDecisionTheme(activeAnalysis.decision);
            return (
              <div className={`px-5 sm:px-6 py-4 border-b ${theme.surface}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{theme.icon}</div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        <span className={theme.accent}>{activeAnalysis.decisionLabel}</span>
                        <span aria-hidden="true" className="text-slate-400">·</span>
                        <h3 className={`text-sm font-bold ${theme.text}`}>
                          {activeAnalysis.decisionHeadline}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-relaxed max-w-3xl">
                        {activeAnalysis.decisionSummary}
                      </p>
                    </div>
                  </div>

                  {activeMarketStats.minStore && (
                    <a
                      href={getDirectOfferUrl(
                        activeMarketStats.minStore,
                        activeProduct,
                        activeProduct.prices[activeMarketStats.minStore.id]
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-emerald-500 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start md:self-center"
                    >
                      <span>أفضل عرض في {activeMarketStats.minStore.name}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </a>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 4-Column Tabular KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-200/80 dark:divide-slate-800 border-b border-slate-200/80 dark:border-slate-800">
            <div className="p-4 sm:p-5">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                أقل سعر اليوم
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-1">
                {activeAnalysis.currentLowest.toFixed(2)}{' '}
                <span className="text-xs font-sans font-semibold text-slate-500">ر.س</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                {activeMarketStats.minStore ? `لدى ${activeMarketStats.minStore.name}` : 'السعر الحالي'}
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                أدنى سعر في 30 يوماً
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {activeAnalysis.min30Day.toFixed(2)}{' '}
                <span className="text-xs font-sans font-semibold text-slate-500">ر.س</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                الفارق الحالي:{' '}
                {Math.max(0, activeAnalysis.currentLowest - activeAnalysis.min30Day).toFixed(2)} ر.س
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                متوسط آخر 30 يوماً
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {activeAnalysis.avg30Day.toFixed(2)}{' '}
                <span className="text-xs font-sans font-semibold text-slate-500">ر.س</span>
              </div>
              <div
                className={`text-[11px] mt-1 font-mono tabular-nums font-semibold ${
                  activeAnalysis.diffFromAvgPercent <= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {activeAnalysis.diffFromAvgPercent <= 0 ? 'أقل من المتوسط بـ' : 'أعلى من المتوسط بـ'}{' '}
                {Math.abs(activeAnalysis.diffFromAvgPercent)}%
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                أعلى سعر · تغير 30 يوماً
              </div>
              <div className="flex items-baseline gap-2.5 mt-1">
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {activeAnalysis.max30Day.toFixed(2)}{' '}
                  <span className="text-xs font-sans font-semibold text-slate-500">ر.س</span>
                </span>
                <span
                  className={`inline-flex items-center gap-0.5 text-xs font-mono tabular-nums font-bold ${
                    activeAnalysis.change30DayPercent <= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {activeAnalysis.change30DayPercent < 0 ? (
                    <TrendingDown className="w-3.5 h-3.5" />
                  ) : activeAnalysis.change30DayPercent > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <Minus className="w-3.5 h-3.5" />
                  )}
                  {Math.abs(activeAnalysis.change30DayPercent)}%
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                توفير عن القمة: {activeAnalysis.savingsVsPeak30Day.toFixed(2)} ر.س
              </div>
            </div>
          </div>

          {/* Chart Toolbar */}
          <div className="px-5 sm:px-6 pt-5 pb-2 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Segmented Range Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                {([30, 14, 7] as TimeRangeOption[]).map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setTimeRange(days)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      timeRange === days
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    آخر {days} يوماً
                  </button>
                ))}
              </div>

              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setChartMode('trend')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    chartMode === 'trend'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  الأدنى والمتوسط
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('market-band')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    chartMode === 'market-band'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  نطاق السوق الكامل
                </button>
              </div>
            </div>

            {/* Legend & Average Reference Line Toggle */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-600 rounded-full inline-block" />
                <span>أدنى سعر</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-slate-400 border-t border-dashed border-slate-500 inline-block" />
                <span>متوسط السوق</span>
              </div>
              {chartMode === 'market-band' && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-500 rounded-full inline-block" />
                  <span>أعلى سعر</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowAvgLine((prev) => !prev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  showAvgLine
                    ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {showAvgLine ? 'إخفاء خط المتوسط' : 'إظهار خط المتوسط'}
              </button>
            </div>
          </div>

          {/* Interactive 30-Day Recharts Visualization */}
          <div className="px-3 sm:px-6 pb-5 pt-2">
            <div className="h-[310px] sm:h-[340px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={visibleChartData}
                  margin={{ top: 14, right: 16, left: 4, bottom: 6 }}
                >
                  <defs>
                    <linearGradient id="radarLowestGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="radarHighestGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    interval={timeRange === 30 ? 4 : timeRange === 14 ? 2 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                    tickLine={false}
                    axisLine={false}
                    width={62}
                    tickFormatter={(v) => `${v}`}
                    domain={['dataMin - 1', 'dataMax + 1']}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {showAvgLine && (
                    <ReferenceLine
                      y={activeAnalysis.avg30Day}
                      stroke="#0284c7"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `متوسط 30 يوم: ${activeAnalysis.avg30Day.toFixed(2)}`,
                        position: 'insideTopRight',
                        fill: '#0284c7',
                        fontSize: 11,
                      }}
                    />
                  )}

                  {chartMode === 'market-band' && (
                    <Area
                      type="monotone"
                      dataKey="highestPrice"
                      name="أعلى سعر"
                      stroke="#e11d48"
                      strokeWidth={1.75}
                      fill="url(#radarHighestGradient)"
                      dot={false}
                      activeDot={{ r: 4, fill: '#e11d48', stroke: '#fff', strokeWidth: 2 }}
                    />
                  )}

                  <Area
                    type="monotone"
                    dataKey="avgPrice"
                    name="متوسط السوق"
                    stroke="#64748b"
                    strokeWidth={1.75}
                    strokeDasharray="4 4"
                    fillOpacity={0}
                    dot={false}
                    activeDot={{ r: 4, fill: '#64748b', stroke: '#fff', strokeWidth: 2 }}
                  />

                  <Area
                    type="monotone"
                    dataKey="lowestPrice"
                    name="أدنى سعر"
                    stroke="#16a34a"
                    strokeWidth={2.75}
                    fill="url(#radarLowestGradient)"
                    dot={timeRange <= 14 ? { r: 3, fill: '#16a34a', strokeWidth: 1.5, stroke: '#fff' } : false}
                    activeDot={{ r: 6, fill: '#16a34a', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Current Store Prices Row for Selected Product */}
          {activeMarketStats.storePrices.length > 0 && (
            <div className="px-5 sm:px-6 py-4 bg-slate-50/70 dark:bg-slate-950/40 border-t border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  أرخص المتاجر المتوفرة الآن لهذا المنتج
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>محدّث لآخر 30 يوماً · شامل ضريبة 15%</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {activeMarketStats.storePrices.slice(0, 4).map((item) => (
                  <a
                    key={item.store.id}
                    href={getDirectOfferUrl(item.store, activeProduct, item.priceInfo)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-2.5 ${
                      item.isLowest
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <StoreLogoBadge storeId={item.store.id} size="sm" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {item.store.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {item.isLowest ? 'الأقل سعراً اليوم' : item.store.marketLabelAr || 'متجر سعودي'}
                        </div>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <div
                        className={`text-sm font-bold font-mono tabular-nums ${
                          item.isLowest
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {item.price.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">ر.س</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Filter Bar for Product Selector Grid */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              اختر منتجاً لعرض مسار سعره خلال 30 يوماً
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              ({radarItems.length})
            </span>
          </div>

          {/* Decision Filter Segmented Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setDecisionFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                decisionFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              الكل ({decisionCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setDecisionFilter('watchlist')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                decisionFilter === 'watchlist'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400'
              }`}
            >
              قائمة المراقبة ({decisionCounts.watchlist})
            </button>
            <button
              type="button"
              onClick={() => setDecisionFilter('buy-now')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                decisionFilter === 'buy-now'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400'
              }`}
            >
              اشترِ الآن ({decisionCounts.buyNow})
            </button>
            <button
              type="button"
              onClick={() => setDecisionFilter('fair')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                decisionFilter === 'fair'
                  ? 'bg-sky-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-sky-700 dark:hover:text-sky-400'
              }`}
            >
              سعر عادل ({decisionCounts.fair})
            </button>
            <button
              type="button"
              onClick={() => setDecisionFilter('wait')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                decisionFilter === 'wait'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400'
              }`}
            >
              انتظر العرض ({decisionCounts.wait})
            </button>
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-emerald-700 text-white border-slate-900 dark:border-emerald-700'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {cat === 'all' ? 'جميع التصنيفات' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Radar Cards Grid or Empty State */}
      {radarItems.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Search className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            لم يتم العثور على منتجات مطابقة للبحث
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            جرّب تغيير كلمات البحث أو إعادة تعيين فلاتر التوصية والتصنيف لاستعراض جميع المنتجات المرصودة.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            إعادة تعيين الفلاتر
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {radarItems.map((p) => {
            const analysis = analysisMap.get(p.id) || analyze30DayTrend(p);
            const isSelected = activeProduct?.id === p.id;
            const decisionTextColor =
              analysis.decision === 'buy-now'
                ? 'text-emerald-700 dark:text-emerald-400'
                : analysis.decision === 'wait'
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-sky-700 dark:text-sky-400';

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectProduct(p)}
                className={`text-right p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-600 dark:border-emerald-500 ring-1 ring-emerald-600/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3 w-full">
                  <ProductImage src={p.imageUrl} alt={p.nameAr} size="sm" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {p.nameAr}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      <span>{p.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-semibold ${decisionTextColor}`}>
                        {analysis.decisionLabel}
                      </span>
                      {watchlistIdsSet.has(p.id) && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            قيد المراقبة
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 w-full">
                  <div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      أقل سعر حالياً
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                        {analysis.currentLowest.toFixed(2)}{' '}
                        <span className="text-[10px] font-sans text-slate-500">ر.س</span>
                      </span>
                      <span
                        className={`text-[11px] font-mono tabular-nums font-semibold inline-flex items-center gap-0.5 ${
                          analysis.change30DayPercent <= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {analysis.change30DayPercent <= 0 ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <TrendingUp className="w-3 h-3" />
                        )}
                        {Math.abs(analysis.change30DayPercent)}%
                      </span>
                    </div>
                  </div>

                  <MiniSparkline points={analysis.points} decision={analysis.decision} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
