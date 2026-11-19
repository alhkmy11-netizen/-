import React, { useState } from 'react';
import { NavigationTab } from '../types';
import { 
  Home, 
  ShoppingBag, 
  Scale, 
  ShoppingCart, 
  Menu, 
  X, 
  Camera, 
  ListOrdered, 
  Table2, 
  Bot, 
  TicketPercent, 
  MapPin, 
  Award, 
  History, 
  Sparkles, 
  Sun, 
  Moon, 
  ChevronLeft, 
  ExternalLink, 
  BarChart3, 
  Settings, 
  Zap,
  Heart,
  Star,
  Radar,
  Clock,
  MessageSquare
} from 'lucide-react';
import { useDataSaver } from '../context/DataSaverContext';

interface MobileBottomNavProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  cartCount: number;
  wishlistCount?: number;
  compareCount: number;
  onOpenChat: () => void;
  selectedCity: string;
  themeMode?: 'light' | 'dark' | 'system';
  isDark?: boolean;
  onToggleTheme?: () => void;
  onOpenAnalytics?: () => void;
  onOpenSettings?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  cartCount,
  wishlistCount = 0,
  compareCount,
  onOpenChat,
  selectedCity,
  themeMode = 'system',
  isDark = false,
  onToggleTheme,
  onOpenAnalytics,
  onOpenSettings,
}) => {
  const { isDataSaverEnabled, dataSaverLevel } = useDataSaver();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const handleTabClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    setIsMoreMenuOpen(false);
  };

  // Primary 4 tabs + More button for iPhone bottom bar
  const navItems = [
    {
      id: 'home' as NavigationTab,
      label: 'الرئيسية',
      icon: Home,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'alhkmy-store' as NavigationTab,
      label: 'متجر حكيم',
      icon: ShoppingBag,
      badge: '570C',
      badgeColor: 'bg-amber-400 text-slate-950',
    },
    {
      id: 'wishlist' as NavigationTab,
      label: 'المفضلة',
      icon: Heart,
      badge: wishlistCount > 0 ? wishlistCount : null,
      badgeColor: 'bg-rose-600 text-white',
    },
    {
      id: 'cart' as NavigationTab,
      label: 'السلة',
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : null,
      badgeColor: 'bg-emerald-600 text-white',
    },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Visible only on md:hidden, tailored for iPhone) */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800 shadow-2xl safe-area-bottom select-none"
        dir="rtl"
        aria-label="التنقل الرئيسي للهاتف"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id && !isMoreMenuOpen;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex flex-col items-center justify-center h-full relative py-1 transition-all active:scale-90 cursor-pointer ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400 font-black'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-bold'
                }`}
              >
                <div className="relative">
                  <Icon 
                    className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''} ${
                      item.id === 'wishlist' && wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''
                    }`} 
                  />
                  {item.badge !== null && item.badge !== undefined && (
                    <span 
                      className={`absolute -top-1.5 -right-2 text-[9px] font-black px-1.5 py-0.2 rounded-full leading-tight shadow-xs ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 truncate max-w-[64px] ${isActive ? 'font-black' : 'font-medium'}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-0.5 animate-pulse" />
                )}
              </button>
            );
          })}

          {/* More Menu Toggle Button */}
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`flex flex-col items-center justify-center h-full relative py-1 transition-all active:scale-90 cursor-pointer ${
              isMoreMenuOpen
                ? 'text-emerald-700 dark:text-emerald-400 font-black'
                : 'text-slate-500 dark:text-slate-400 font-bold'
            }`}
          >
            <div className="relative">
              {isMoreMenuOpen ? <X className="w-5 h-5 text-rose-500" /> : <Menu className="w-5 h-5" />}
            </div>
            <span className={`text-[10px] mt-1 ${isMoreMenuOpen ? 'font-black text-rose-500' : 'font-medium'}`}>
              {isMoreMenuOpen ? 'إغلاق' : 'القوائم'}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" Full Screen Sheet / Drawer */}
      {isMoreMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-35 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
          dir="rtl"
          onClick={() => setIsMoreMenuOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-28 shadow-2xl border-t border-slate-200 dark:border-slate-800 space-y-5 animate-in slide-in-from-bottom duration-300 safe-area-bottom -webkit-overflow-scrolling-touch"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto -mt-1" />

            {/* Header with City & Theme Info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">قوائم وأقسام حكيم الذكي</h3>
                <p className="text-xs text-slate-400">المدينة المحددة: <span className="font-bold text-emerald-600">{selectedCity}</span></p>
              </div>

              <div className="flex items-center gap-2">
                {onOpenSettings && (
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onOpenSettings();
                    }}
                    className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border transition-colors ${
                      isDataSaverEnabled
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                    title="الوضع الاقتصادي وإعدادات التطبيق"
                  >
                    <Zap className={`w-4 h-4 ${isDataSaverEnabled ? 'text-emerald-500 fill-emerald-500' : 'text-slate-500'}`} />
                    <span>{isDataSaverEnabled ? 'اقتصادي ⚡' : 'الإعدادات'}</span>
                  </button>
                )}

                {onToggleTheme && (
                  <button
                    onClick={onToggleTheme}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    title="تبديل المظهر"
                  >
                    {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                    <span>{isDark ? 'نهاري' : 'ليلي'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Section 1: متجر حكيم والتوفير الحصري */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                متجر حكيم والتوفير الحصري
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleTabClick('alhkmy-store')}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'alhkmy-store'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-black'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black block">متجر حكيم المباشر</span>
                      <span className="text-[10px] text-amber-500 font-bold">كود 570C</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabClick('exclusive-deals')}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'exclusive-deals'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-200 font-black'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black block">عروض VIP وكاش باك</span>
                      <span className="text-[10px] text-slate-400">توفير حتى 75 ريال</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabClick('price-radar')}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'price-radar'
                      ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-500 text-cyan-950 dark:text-cyan-200 font-black'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-900/60 text-cyan-700 dark:text-cyan-300 flex items-center justify-center">
                      <Radar className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black block">رادار الأسعار الحي</span>
                      <span className="text-[10px] text-cyan-600 font-bold">Google Live</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabClick('coupons')}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'coupons'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-200 font-black'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                      <TicketPercent className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black block">الكوبونات والخصومات</span>
                      <span className="text-[10px] text-slate-400">أكواد نون والعثيم</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Section 2: المفضلة والتقييمات والمقارنة */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                المفضلة والمراجعات والتسوق
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleTabClick('wishlist')}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'wishlist'
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-950 dark:text-rose-200 font-black'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center">
                      <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                    </div>
                    <div>
                      <span className="text-xs font-black block">قائمة أمنياتي</span>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                        {wishlistCount > 0 ? `${wishlistCount} سلع محفوظة` : 'فارغة'}
                      </span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabClick('reviews')}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'reviews'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-200 font-black'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-xs font-black block">تقييمات العملاء</span>
                      <span className="text-[10px] text-amber-600 font-bold">⭐ 4.9 موثقة</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabClick('compare')}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'compare'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-950 dark:text-indigo-200 font-black'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black block">مقارنة السلع</span>
                      <span className="text-[10px] text-indigo-600 font-bold">
                        {compareCount > 0 ? `${compareCount} سلع بالمقارنة` : 'جنباً إلى جنب'}
                      </span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabClick('history')}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'history'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-black'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black block">سجل الفواتير</span>
                      <span className="text-[10px] text-slate-400">مشترياتك السابقة</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Section 3: الذكاء الاصطناعي والمقاضي الذكية */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                الذكاء الاصطناعي والمقاضي
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onOpenChat();
                  }}
                  className="p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer bg-gradient-to-r from-emerald-700 to-teal-800 text-white shadow-xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black block">اسأل حكيم AI</span>
                      <span className="text-[10px] text-emerald-200">ابو حكيم وام حكيم</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-emerald-200" />
                </button>

                <button
                  onClick={() => handleTabClick('image-search')}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'image-search'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-950 dark:text-amber-200 font-black'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black block">البحث بالصور</span>
                      <span className="text-[10px] text-slate-400">Vision AI</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabClick('quicklist')}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'quicklist'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-black'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                      <ListOrdered className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black block">القائمة السريعة</span>
                      <span className="text-[10px] text-slate-400">توليد سلة مقاضي</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabClick('bots')}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'bots'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-950 dark:text-indigo-200 font-black'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black block">بوتات حكيم</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">4 بوتات نشطة</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Section 4: الفروع والإعدادات */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                الفروع والإحصاءات
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleTabClick('maps')}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'maps'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-black'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black block">خريطة الفروع</span>
                      <span className="text-[10px] text-slate-400">أقرب فرع لموقعك</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => handleTabClick('shopping-times')}
                  className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === 'shopping-times'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-black'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black block">أوقات التسوق</span>
                      <span className="text-[10px] text-slate-400">تجنب الزحام</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>

                {onOpenSettings && (
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onOpenSettings();
                    }}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                      isDataSaverEnabled
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-750 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isDataSaverEnabled
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                      }`}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black block">الوضع الاقتصادي</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                          {isDataSaverEnabled ? `مفعل (${dataSaverLevel === 'ultra' ? 'أقصى' : '80%'})` : 'تسريع التصفح'}
                        </span>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </button>
                )}

                {onOpenAnalytics && (
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      onOpenAnalytics();
                    }}
                    className="p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black block">Google Analytics 4</span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">متصل • إحصاءات حية</span>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Direct Visit to alhkmy.store */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white border border-emerald-500/30 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black">متجر حكيم الذكي alhkmy.store</div>
                  <div className="text-[10px] text-emerald-200">كود الخصم الحصري 570C</div>
                </div>
              </div>
              <a
                href="https://alhkmy.store"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center gap-1 shrink-0"
              >
                <span>فتح المتجر</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
