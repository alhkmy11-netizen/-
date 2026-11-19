import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  History,
  Receipt,
  TrendingDown,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
  Wallet,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Filter,
  DollarSign,
  Layers,
  Store as StoreIcon,
  Plus,
  RefreshCw,
  Search,
  Tag,
  ChevronDown,
  ChevronUp,
  X,
  CreditCard,
  Percent,
  Activity,
  Award
} from 'lucide-react';
import { PastOrder, PastOrderItem, Product, Store, CartItem } from '../types';
import { CartInflationTrendChart } from './CartInflationTrendChart';
import { ProjectedMonthEndSavingsCard } from './ProjectedMonthEndSavingsCard';
import { calculateCartHistoricalAnalysis } from '../lib/cartHistoricalAnalysis';

interface ShoppingHistoryViewProps {
  pastOrders: PastOrder[];
  onOpenStoreOffers: () => void;
  products?: Product[];
  stores?: Store[];
  cart?: CartItem[];
  onAddToCart?: (product: Product, storeId?: string) => void;
}

// ألوان متناسقة ومريحة للعين لفئات المشتريات
const CATEGORY_COLORS: Record<string, string> = {
  'ألبان وأجبان': '#10b981', // Emerald
  'مؤن وحبوب': '#f59e0b', // Amber
  'لحوم ودواجن': '#ef4444', // Red
  'خضار وفواكه': '#84cc16', // Lime
  'زيوت ودهون': '#eab308', // Yellow
  'مشروبات وقهوة': '#6366f1', // Indigo
  'عناية ومنظفات': '#06b6d4', // Cyan
  'حلويات ومخبوزات': '#ec4899', // Pink
  'أخرى': '#8b5cf6', // Violet
};

const DEFAULT_CATEGORY_COLOR = '#64748b';

export const ShoppingHistoryView: React.FC<ShoppingHistoryViewProps> = ({
  pastOrders,
  onOpenStoreOffers,
  products = [],
  stores = [],
  cart = [],
  onAddToCart,
}) => {
  // التبويب النشط داخل قسم التاريخ: لوحة المؤشرات | سجل الفواتير | تحليل التضخم
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'inflation'>('dashboard');

  // فترة التحليل الزمني
  const [timeRange, setTimeRange] = useState<'all' | '90days' | '30days'>('all');

  // نمط الرسم البياني للإنفاق: مساحي انسيابي أو أعمدة شهرية
  const [spendChartType, setSpendChartType] = useState<'area' | 'bar'>('area');

  // تصفية الفئة المحددة في رسم التوزيع الدائري
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // الفاتورة المحددة لعرض تفاصيلها في النافذة المنبثقة
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<PastOrder | null>(null);

  // كلمة البحث في الفواتير
  const [searchOrderQuery, setSearchOrderQuery] = useState('');

  // حساب التضخم والتحليل للسلة إذا توفرت
  const inflationAnalysis = useMemo(() => {
    if (cart.length > 0 && products.length > 0 && stores.length > 0) {
      return calculateCartHistoricalAnalysis(cart, products, stores);
    }
    return null;
  }, [cart, products, stores]);

  // إحصائيات عامة
  const totalSpend = useMemo(() => {
    return pastOrders.reduce((acc, curr) => acc + curr.total, 0);
  }, [pastOrders]);

  const totalSaved = useMemo(() => {
    return pastOrders.reduce((acc, curr) => acc + curr.savings, 0);
  }, [pastOrders]);

  const totalItemsCount = useMemo(() => {
    return pastOrders.reduce((acc, curr) => acc + curr.itemsCount, 0);
  }, [pastOrders]);

  const averageOrderValue = useMemo(() => {
    return pastOrders.length > 0 ? totalSpend / pastOrders.length : 0;
  }, [pastOrders, totalSpend]);

  const overallSavingsRate = useMemo(() => {
    const marketTotal = totalSpend + totalSaved;
    return marketTotal > 0 ? (totalSaved / marketTotal) * 100 : 0;
  }, [totalSpend, totalSaved]);

  // تجهيز بيانات الرسوم البيانية لأنماط الإنفاق عبر الأشهر والطلبات
  const spendingTrendData = useMemo(() => {
    // بناء مصفوفة زمنية مرتبة حسب التاريخ
    const chronologicalOrders = [...pastOrders].reverse();

    return chronologicalOrders.map((order, idx) => {
      // استخراج الشهر أو التاريخ القصير
      const label = order.date.replace(' 2026', '');
      const marketPrice = order.total + order.savings;
      return {
        id: order.id,
        name: label,
        fullName: order.date,
        spend: Number(order.total.toFixed(1)),
        savings: Number(order.savings.toFixed(1)),
        marketBenchmark: Number(marketPrice.toFixed(1)),
        store: order.store,
        itemsCount: order.itemsCount,
        savingsPercent: Number(((order.savings / marketPrice) * 100).toFixed(1)),
      };
    });
  }, [pastOrders]);

  // تجهيز بيانات توزيع المشتريات على فئات المنتجات (Donut Chart)
  const categoryDistributionData = useMemo(() => {
    const categoryTotals: Record<string, { amount: number; count: number }> = {};

    pastOrders.forEach((order) => {
      if (order.categories && order.categories.length > 0) {
        order.categories.forEach((cat) => {
          if (!categoryTotals[cat.category]) {
            categoryTotals[cat.category] = { amount: 0, count: 0 };
          }
          categoryTotals[cat.category].amount += cat.amount;
          categoryTotals[cat.category].count += cat.itemCount;
        });
      } else {
        // توزيع تقديري في حال عدم وجود تفصيل دقيق للفئات في طلبات سابقة قديمة
        const defaultCat = 'مؤن وحبوب';
        if (!categoryTotals[defaultCat]) {
          categoryTotals[defaultCat] = { amount: 0, count: 0 };
        }
        categoryTotals[defaultCat].amount += order.total;
        categoryTotals[defaultCat].count += order.itemsCount;
      }
    });

    const sumAmounts = Object.values(categoryTotals).reduce((a, b) => a + b.amount, 0);

    return Object.entries(categoryTotals)
      .map(([name, val]) => {
        const percentage = sumAmounts > 0 ? Number(((val.amount / sumAmounts) * 100).toFixed(1)) : 0;
        return {
          name,
          value: Number(val.amount.toFixed(1)),
          count: val.count,
          percentage,
          color: CATEGORY_COLORS[name] || DEFAULT_CATEGORY_COLOR,
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [pastOrders]);

  // تجهيز بيانات توزيع الإنفاق والتوفير حسب المتاجر
  const storeDistributionData = useMemo(() => {
    const storeMap: Record<string, { totalSpend: number; totalSavings: number; count: number }> = {};

    pastOrders.forEach((order) => {
      // تبسيط اسم المتجر
      let storeKey = order.store;
      if (storeKey.includes('هجينة')) storeKey = 'سلة هجينة ذكية';
      else if (storeKey.includes('حكيم')) storeKey = 'متجر حكيم الذكي';
      else if (storeKey.includes('العثيم')) storeKey = 'أسواق العثيم';
      else if (storeKey.includes('بنده')) storeKey = 'هايبر بنده';
      else if (storeKey.includes('كارفور')) storeKey = 'كارفور';
      else if (storeKey.includes('الدانوب')) storeKey = 'الدانوب';
      else if (storeKey.includes('لولو')) storeKey = 'لولو هايبر';

      if (!storeMap[storeKey]) {
        storeMap[storeKey] = { totalSpend: 0, totalSavings: 0, count: 0 };
      }
      storeMap[storeKey].totalSpend += order.total;
      storeMap[storeKey].totalSavings += order.savings;
      storeMap[storeKey].count += 1;
    });

    return Object.entries(storeMap)
      .map(([storeName, data]) => ({
        storeName,
        spend: Number(data.totalSpend.toFixed(1)),
        savings: Number(data.totalSavings.toFixed(1)),
        count: data.count,
      }))
      .sort((a, b) => b.spend - a.spend);
  }, [pastOrders]);

  // تحديد الفئة الأكثر إنفاقاً
  const topCategory = categoryDistributionData[0] || null;

  // تحديد المتجر الأكثر توفيراً
  const bestSavingStore = useMemo(() => {
    if (storeDistributionData.length === 0) return null;
    return [...storeDistributionData].sort((a, b) => b.savings - a.savings)[0];
  }, [storeDistributionData]);

  // تصفية الفواتير بحسب البحث
  const filteredOrders = useMemo(() => {
    if (!searchOrderQuery.trim()) return pastOrders;
    const q = searchOrderQuery.toLowerCase();
    return pastOrders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.store.toLowerCase().includes(q) ||
        o.date.toLowerCase().includes(q)
    );
  }, [pastOrders, searchOrderQuery]);

  // مخصص التلميح المالي لمخطط الإنفاق
  const CustomSpendingTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl border border-slate-700 shadow-xl text-right text-xs space-y-1.5 min-w-[200px]">
          <div className="font-bold text-slate-200 border-b border-slate-700/60 pb-1 flex items-center justify-between">
            <span className="text-emerald-400 font-mono">{data.id}</span>
            <span>{data.fullName}</span>
          </div>
          <div className="text-slate-300 font-medium">{data.store}</div>
          <div className="flex justify-between items-center text-slate-200 pt-1">
            <span className="font-bold text-white">{data.spend} ر.س</span>
            <span className="text-slate-400">الإنفاق الفعلي:</span>
          </div>
          <div className="flex justify-between items-center text-emerald-400">
            <span className="font-bold">+{data.savings} ر.س ({data.savingsPercent}%)</span>
            <span className="text-slate-400">التوفير المحقق:</span>
          </div>
          <div className="flex justify-between items-center text-amber-300 border-t border-slate-800 pt-1">
            <span className="font-bold">{data.marketBenchmark} ر.س</span>
            <span className="text-slate-400">متوسط السوق:</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // مخصص التلميح لمخطط توزيع الفئات
  const CustomCategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl border border-slate-700 shadow-xl text-right text-xs space-y-1 min-w-[170px]">
          <div className="font-bold text-slate-200 flex items-center gap-1.5 justify-end">
            <span>{data.name}</span>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          </div>
          <div className="flex justify-between items-center text-slate-300 pt-1">
            <span className="font-bold text-emerald-400">{data.value} ر.س</span>
            <span className="text-slate-400">إجمالي المشتريات:</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-bold text-amber-300">{data.percentage}%</span>
            <span className="text-slate-400">النسبة من السلة:</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-medium text-slate-200">{data.count} سلع</span>
            <span className="text-slate-400">عدد المنتجات:</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 px-3 sm:px-4">
      {/* رأس الصفحة الرئيسي - ترحيب ومؤشرات رئيسية */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-900/30 relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-3">
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>لوحة تحكم الإنفاق والتوفير الذكي</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              سجل المشتريات وتحليلات الإنفاق
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-2 leading-relaxed">
              راقب أنماط مصروفاتك الاستهلاكية، وتوزيع السلة على الفئات المختلفة عبر رسوم بيانية تفاعلية تدعمك في التوفير المستمر مع حكيم.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center min-w-[140px]">
              <div className="text-[11px] text-emerald-300 font-medium">إجمالي التوفير المحقق</div>
              <div className="text-2xl font-black text-amber-300 mt-0.5">{totalSaved.toFixed(1)} ر.س</div>
              <div className="text-[10px] text-emerald-200 mt-1 flex items-center justify-center gap-1">
                <TrendingDown className="w-3 h-3 text-emerald-400" />
                <span>وفرت {overallSavingsRate.toFixed(1)}% من الفواتير</span>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 text-center min-w-[140px]">
              <div className="text-[11px] text-slate-300 font-medium">إجمالي المصروفات</div>
              <div className="text-2xl font-black text-white mt-0.5">{totalSpend.toFixed(1)} ر.س</div>
              <div className="text-[10px] text-slate-300 mt-1">
                عبر {pastOrders.length} سلال شرائية
              </div>
            </div>
          </div>
        </div>

        {/* أشرطة التنقل الداخلية (Dashboard / Orders / Inflation) */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 backdrop-blur-md rounded-2xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>لوحة المؤشرات والرسوم</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>سجل الفواتير ({pastOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('inflation')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'inflation'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>تحليل التضخم والتوقعات</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenStoreOffers}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>تسوق العروض الجديدة</span>
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* المحتوى بحسب التبويب النشط */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* بطاقات المؤشرات الأربعة الرئيسية (KPI Summary Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* بطاقة متوسط الفاتورة */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold">متوسط الفاتورة</span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {averageOrderValue.toFixed(1)} <span className="text-xs font-normal text-slate-500">ر.س</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  معدل {Math.round(totalItemsCount / Math.max(1, pastOrders.length))} سلع لكل سلة
                </div>
              </div>
            </div>

            {/* بطاقة نسبة التوفير */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold">معدل التوفير الفعلي</span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                  {overallSavingsRate.toFixed(1)}%
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-bold">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>توفير أعلى من متوسط السوق</span>
                </div>
              </div>
            </div>

            {/* بطاقة الفئة الأكثر طلباً */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold">الفئة الأكثر استهلاكاً</span>
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <PieIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                  {topCategory ? topCategory.name : 'لا توجد بيانات'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  تشكل {topCategory?.percentage || 0}% من إجمالي الميزانية
                </div>
              </div>
            </div>

            {/* بطاقة المتجر الأفضل */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold">المتجر الأكثر توفيراً</span>
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                  {bestSavingStore ? bestSavingStore.storeName : 'متجر حكيم'}
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                  وفّر لك {bestSavingStore?.savings.toFixed(1) || 0} ر.س
                </div>
              </div>
            </div>
          </div>

          {/* الرسوم البيانية الرئيسية المزدوجة باستخدام recharts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* المخطط 1: أنماط الإنفاق والتوفير عبر الزمن (2/3 العرض على الشاشات الكبيرة) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      أنماط الإنفاق والتوفير عبر الفترات
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    مقارنة الإنفاق الفعلي بالسعر المرجعي لمتوسط السوق مع قياس وفر كل سلة
                  </p>
                </div>

                {/* خيارات نوع المخطط */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                  <button
                    onClick={() => setSpendChartType('area')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      spendChartType === 'area'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    انسيابي (Area)
                  </button>
                  <button
                    onClick={() => setSpendChartType('bar')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      spendChartType === 'bar'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    أعمدة (Bar)
                  </button>
                </div>
              </div>

              {/* حاوية الرسم البياني Recharts */}
              <div className="h-[280px] sm:h-[320px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                  {spendChartType === 'area' ? (
                    <AreaChart
                      data={spendingTrendData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        unit=" ر.س"
                      />
                      <Tooltip content={<CustomSpendingTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        formatter={(value) => {
                          if (value === 'spend') return 'الإنفاق الفعلي (مع حكيم)';
                          if (value === 'marketBenchmark') return 'متوسط سعر السوق';
                          if (value === 'savings') return 'المبلغ الموفر';
                          return value;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="marketBenchmark"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fill="url(#marketGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="spend"
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="url(#spendGradient)"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart
                      data={spendingTrendData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        unit=" ر.س"
                      />
                      <Tooltip content={<CustomSpendingTooltip />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        formatter={(value) => {
                          if (value === 'spend') return 'الإنفاق الفعلي';
                          if (value === 'savings') return 'المبلغ الموفر';
                          return value;
                        }}
                      />
                      <Bar dataKey="spend" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={38} />
                      <Bar dataKey="savings" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={38} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>

              {/* ملحوظة ذكية أسفل الرسم */}
              <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>
                    الخط المنقط يمثل تكلفة المشتريات لو تمت بدون مقارنة حكيم للأسعار
                  </span>
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-black">
                  فرق السعر لمصلحتك
                </span>
              </div>
            </div>

            {/* المخطط 2: توزيع المشتريات على فئات المنتجات المختلفة (Pie / Donut) */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      توزيع الفئات
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {categoryDistributionData.length} فئات
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  نسبة وتكلفة السلع حسب تصنيفها الغذائي والاستهلاكي
                </p>

                {/* رسم الدونات Recharts */}
                <div className="h-[200px] w-full relative flex items-center justify-center" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomCategoryTooltip />} />
                      <Pie
                        data={categoryDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        onClick={(entry: any) => {
                          const catName = entry?.name || null;
                          setSelectedCategory(selectedCategory === catName ? null : catName);
                        }}
                      >
                        {categoryDistributionData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            stroke={selectedCategory === entry.name ? '#000' : 'transparent'}
                            strokeWidth={2}
                            className="cursor-pointer transition-transform hover:scale-105"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* نص في منتصف الدونات */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-slate-400 font-bold">إجمالي الفئات</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {totalSpend.toFixed(0)} ر.س
                    </span>
                  </div>
                </div>
              </div>

              {/* قائمة الفئات مع النسب */}
              <div className="mt-3 space-y-1.5 max-h-[160px] overflow-y-auto pr-1 no-scrollbar text-xs">
                {categoryDistributionData.map((cat) => (
                  <div
                    key={cat.name}
                    onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                    className={`flex items-center justify-between p-1.5 rounded-xl cursor-pointer transition-colors ${
                      selectedCategory === cat.name
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                        {cat.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        {cat.value} ر.س
                      </span>
                      <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md min-w-[36px] text-center">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* المخطط 3: توزيع الإنفاق والتوفير بحسب المتاجر السعودية */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <StoreIcon className="w-4 h-4 text-emerald-600" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    توزيع المشتريات والتوفير حسب المتاجر
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  يوضح حجم مصروفاتك في كل سوبرماركت ومتجر والمبالغ التي وفرتها المقارنة الذكية
                </p>
              </div>

              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {storeDistributionData.length} شركاء ومتاجر
              </div>
            </div>

            <div className="h-[240px] sm:h-[270px] w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={storeDistributionData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis
                    dataKey="storeName"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    unit=" ر.س"
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => {
                      if (name === 'spend') return [`${value} ر.س`, 'المصروف'];
                      if (name === 'savings') return [`${value} ر.س`, 'التوفير'];
                      return [value, name];
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => {
                      if (value === 'spend') return 'إجمالي الإنفاق';
                      if (value === 'savings') return 'التوفير المحقق';
                      return value;
                    }}
                  />
                  <Bar dataKey="spend" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={42} />
                  <Bar dataKey="savings" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* تبويب سجل الفواتير */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* شريط البحث في الفواتير */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث برقم الفاتورة، اسم المتجر، أو التاريخ..."
                value={searchOrderQuery}
                onChange={(e) => setSearchOrderQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {searchOrderQuery && (
                <button
                  onClick={() => setSearchOrderQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              عرض {filteredOrders.length} من أصل {pastOrders.length} طلبات
            </div>
          </div>

          {/* قائمة الفواتير */}
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrderForModal(order)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-wrap items-center justify-between gap-4 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all shadow-xs cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shadow-inner group-hover:scale-105 transition-transform">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-700 dark:text-slate-300">
                        {order.id}
                      </span>
                      <span className="text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{order.status || 'مكتمل ومستلم'}</span>
                      </span>
                      {order.paymentMethod && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {order.paymentMethod}
                        </span>
                      )}
                    </div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                      {order.store}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {order.date} • {order.itemsCount} سلع
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-left">
                  <div>
                    <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                      {order.total.toFixed(2)} ر.س
                    </div>
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 justify-end mt-0.5">
                      <TrendingDown className="w-3.5 h-3.5" />
                      <span>وفرت {order.savings.toFixed(2)} ر.س</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </div>
                </div>
              </div>
            ))}

            {filteredOrders.length === 0 && (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-white">لم يتم العثور على فواتير تطابق بحثك</h3>
                <p className="text-xs text-slate-400 mt-1">جرب البحث بكلمات أخرى أو مسح حقل البحث.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* تبويب تحليل التضخم ومقارنة السلال المحفوظة */}
      {activeTab === 'inflation' && (
        <div className="space-y-6">
          {inflationAnalysis ? (
            <div className="space-y-6">
              <CartInflationTrendChart analysis={inflationAnalysis} stores={stores} />
              <ProjectedMonthEndSavingsCard
                analysis={inflationAnalysis}
                cart={cart}
                products={products}
                stores={stores}
              />
            </div>
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
              <Activity className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                أضف سلعاً إلى السلة لبدء تحليل التضخم الحي
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                يقوم محرك حكيم بتحليل تاريخ الأسعار على مدى الأسابيع الماضية لحساب التغيرات التضخمية وتوقع التوفير التراكمي لنهاية الشهر.
              </p>
              <button
                onClick={onOpenStoreOffers}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
              >
                <span>استكشاف المنتجات وإضافتها للسلة</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* نافذة تفاصيل الفاتورة المنبثقة (Modal) */}
      {selectedOrderForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* رأس الفاتورة */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-emerald-300 font-mono font-bold">
                    فاتورة رقم {selectedOrderForModal.id}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {selectedOrderForModal.store}
                  </h3>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    {selectedOrderForModal.date} • {selectedOrderForModal.itemsCount} سلع
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* تفاصيل الفاتورة القابلة للتمرير */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* ملخص المبالغ والتوفير */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">المبلغ الإجمالي المدفوع:</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {selectedOrderForModal.total.toFixed(2)} ر.س
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">الوفر المحقق:</div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {selectedOrderForModal.savings.toFixed(2)} ر.س
                  </div>
                </div>
              </div>

              {/* توزيع الفئات في هذا الطلب */}
              {selectedOrderForModal.categories && selectedOrderForModal.categories.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    توزيع الفئات في هذا الطلب:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrderForModal.categories.map((cat) => (
                      <div
                        key={cat.category}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-700"
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[cat.category] || DEFAULT_CATEGORY_COLOR }}
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{cat.category}</span>
                        <span className="text-slate-500">({cat.amount} ر.س)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* قائمة الأصناف والسلع إن وجدت */}
              {selectedOrderForModal.items && selectedOrderForModal.items.length > 0 ? (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
                    المنتجات المشمولة في الفاتورة ({selectedOrderForModal.items.length}):
                  </h4>
                  <div className="space-y-2">
                    {selectedOrderForModal.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white">{item.name}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{item.category}</span>
                            <span>•</span>
                            <span>الكمية: {item.quantity} {item.unit || 'حبة'}</span>
                            {item.storeName && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.storeName}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-left font-black text-slate-900 dark:text-white">
                          {(item.price * item.quantity).toFixed(2)} ر.س
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-500">
                  تفاصيل الأصناف الفردية مسجلة إلكترونياً ومطابقة للمستودع المركزي.
                </div>
              )}
            </div>

            {/* أسفل النافذة */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500">
                طريقة الدفع: {selectedOrderForModal.paymentMethod || 'مدى'}
              </span>
              <button
                onClick={() => setSelectedOrderForModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
