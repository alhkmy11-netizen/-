import React, { useState } from 'react';
import { 
  NavigationTab, 
  UserCity 
} from '../types';
import { trackEvent } from '../utils/analytics';
import { 
  Store, 
  ShoppingBag,
  Search, 
  MapPin, 
  ShoppingCart, 
  Sparkles, 
  Zap, 
  Camera, 
  Table2, 
  Bot, 
  Bell, 
  Compass, 
  CalendarClock, 
  TicketPercent, 
  BotMessageSquare, 
  Trophy, 
  History, 
  Check, 
  Mic,
  Sun,
  Moon,
  Laptop,
  HelpCircle,
  Globe,
  Radio,
  Wallet,
  Radar,
  Scale,
  BarChart3,
  Settings,
  Heart,
  Star,
  User,
  Database,
  Cloud
} from 'lucide-react';
import { HkeeemHelpModal } from './HkeeemHelpModal';
import { useLanguage } from '../context/LanguageContext';
import { useDataSaver } from '../context/DataSaverContext';

interface NavbarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  selectedCity: UserCity;
  onSelectCity: (city: UserCity) => void;
  cities: UserCity[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  cartCount: number;
  wishlistCount?: number;
  alertsCount: number;
  compareCount?: number;
  onOpenChat: () => void;
  onVoiceSearchClick: () => void;
  onOpenVoiceAdvisor?: () => void;
  onOpenDailyChallenge?: () => void;
  onOpenAnalytics?: () => void;
  onOpenSettings?: () => void;
  onOpenSupabaseSync?: () => void;
  walletBalance?: number;
  themeMode?: 'system' | 'dark' | 'light';
  isDark?: boolean;
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  selectedCity,
  onSelectCity,
  searchQuery,
  onSearchChange,
  cartCount,
  wishlistCount = 0,
  alertsCount,
  compareCount = 0,
  cities,
  onOpenChat,
  onVoiceSearchClick,
  onOpenVoiceAdvisor,
  onOpenDailyChallenge,
  onOpenAnalytics,
  onOpenSettings,
  onOpenSupabaseSync,
  walletBalance = 150.0,
  themeMode = 'system',
  isDark = false,
  onToggleTheme,
}) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { isDataSaverEnabled, dataSaverLevel } = useDataSaver();
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const getThemeLabel = () => {
    if (themeMode === 'system') return 'تلقائي (النظام)';
    if (themeMode === 'dark') return 'الوضع الداكن';
    return 'الوضع الفاتح';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors safe-area-top">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-emerald-850 via-emerald-700 to-teal-850 text-white text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded text-[10px]">
              تحديث اليوم
            </span>
            <span className="text-slate-100 hidden sm:inline">
              رادار عروض الهايبرماركت ومقارن الأسعار الذكي في السعودية • alhkmy.store
            </span>
            <span className="text-slate-100 sm:hidden">
              حكيم AI • مساعد التوفير الذكي
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-medium">
            {onOpenSupabaseSync && (
              <button
                onClick={onOpenSupabaseSync}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-400/40 text-[10px] text-emerald-200 transition-colors cursor-pointer"
                title="قاعدة بيانات Supabase (pcycuavbjpqvfuwwqlso)"
              >
                <Database className="w-3 h-3 text-emerald-300" />
                <span className="font-mono">Supabase Cloud</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            )}
            <button 
              onClick={() => onSelectTab('bots')}
              className="hover:underline hidden sm:flex items-center gap-1 text-emerald-100 hover:text-white transition-colors cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>4 بوتات آلية نشطة</span>
            </button>
            <span className="text-emerald-300 hidden sm:inline">|</span>
            <span className="text-emerald-200 hidden xs:inline">الضريبة 15% مشمولة</span>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-6">
          {/* Brand Logo */}
          <div 
            onClick={() => onSelectTab('home')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight">حكيم AI</span>
                <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-md border border-emerald-300/60 dark:border-emerald-700/60">
                  HkeeemAI
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">مساعد التوفير الذكي ومقارن العروض</p>
            </div>
          </div>

          {/* Desktop Search Bar - Optimized font size 16px to prevent iOS auto zoom */}
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <div className="relative flex items-center w-full">
              <input
                id="main-search-input"
                type="text"
                placeholder="ابحث عن سلعة، ماركة، باركود (حليب، أرز، زيت، حفاضات)..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    trackEvent('search', {
                      search_term: searchQuery.trim(),
                      source: 'navbar_search_enter',
                    });
                  }
                }}
                className="w-full bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-850 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base sm:text-sm rounded-xl pr-10 pl-16 py-2.5 border border-slate-200 dark:border-slate-700 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/20 transition-all outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 pointer-events-none" />
              <button
                type="button"
                onClick={onVoiceSearchClick}
                title="البحث الصوتي"
                className="absolute left-2.5 p-1.5 text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* City Selector & Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Supabase Button */}
            {onOpenSupabaseSync && (
              <button
                onClick={onOpenSupabaseSync}
                className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                title="إدارة الربط مع Supabase (pcycuavbjpqvfuwwqlso)"
                aria-label="قاعدة بيانات Supabase"
              >
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden xl:inline text-[11px] font-bold">Supabase</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            )}

            {/* Help / Guide Icon Button */}
            <button
              onClick={() => setIsHelpOpen(true)}
              className="hidden sm:flex p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer items-center gap-1.5 shadow-xs active:scale-95"
              title="المساعدة ودليل استخدام حكيم"
              aria-label="المساعدة ودليل استخدام حكيم"
            >
              <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden lg:inline text-[11px] font-bold">المساعدة</span>
            </button>

            {/* App Settings & Data Saver Button */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className={`hidden sm:flex p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer items-center gap-1.5 shadow-2xs active:scale-95 ${
                  isDataSaverEnabled
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-400/80 ring-2 ring-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}
                title={isDataSaverEnabled ? `الوضع الاقتصادي مفعل (${dataSaverLevel === 'ultra' ? 'توفير أقصى' : 'توفير 80%'}) - اضغط لتغيير الإعدادات` : 'إعدادات التطبيق والوضع الاقتصادي'}
                aria-label="إعدادات التطبيق والوضع الاقتصادي"
              >
                <Zap className={`w-4 h-4 ${isDataSaverEnabled ? 'text-emerald-600 dark:text-emerald-400 fill-emerald-500' : 'text-slate-500'}`} />
                <span className="hidden lg:inline text-[11px] font-bold">
                  {isDataSaverEnabled ? 'اقتصادي ⚡' : 'الإعدادات'}
                </span>
                {isDataSaverEnabled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden sm:inline" />
                )}
              </button>
            )}

            {/* Google Analytics 4 Button */}
            {onOpenAnalytics && (
              <button
                onClick={onOpenAnalytics}
                className="hidden md:flex p-2 sm:p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 transition-all cursor-pointer items-center gap-1.5 shadow-2xs active:scale-95"
                title="إحصاءات وتحليلات Google Analytics 4 المباشرة"
                aria-label="Google Analytics"
              >
                <BarChart3 className="w-4 h-4 text-amber-500" />
                <span className="hidden xl:inline text-[11px] font-bold">التحليلات</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden sm:inline" />
              </button>
            )}

            {/* Dark / Light Mode Switch Toggle */}
            {onToggleTheme && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDark}
                  onClick={onToggleTheme}
                  className={`relative inline-flex h-8 w-14 sm:w-15 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-xs ${
                    isDark
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-amber-100 border-amber-300'
                  }`}
                  title={isDark ? 'الوضع الحالي: داكن (اضغط للتبديل إلى الفاتح)' : 'الوضع الحالي: فاتح (اضغط للتبديل إلى الداكن)'}
                  aria-label="مفتاح تبديل الوضع الفاتح والداكن"
                >
                  <span className="sr-only">تبديل الوضع الفاتح والداكن</span>
                  
                  {/* Icons inside track */}
                  <span className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none text-[10px]" dir="ltr">
                    <Sun className={`w-3.5 h-3.5 transition-opacity ${!isDark ? 'text-amber-500 opacity-100' : 'text-slate-500 opacity-20'}`} />
                    <Moon className={`w-3.5 h-3.5 transition-opacity ${isDark ? 'text-amber-300 opacity-100' : 'text-slate-400 opacity-20'}`} />
                  </span>

                  {/* Sliding Thumb */}
                  <span
                    dir="ltr"
                    className={`pointer-events-none inline-flex items-center justify-center h-6 w-6 transform rounded-full bg-white dark:bg-slate-900 shadow-md transition-transform duration-200 ease-in-out ${
                      isDark ? 'translate-x-6 sm:translate-x-7' : 'translate-x-0.5'
                    }`}
                  >
                    {isDark ? (
                      <Moon className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                    )}
                  </span>
                </button>
              </div>
            )}

            {/* Language Switcher */}
            <button
              id="lang-toggle-btn"
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-black text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="تغيير لغة التطبيق / Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Daily Challenge 20% Off Quiz Button */}
            {onOpenDailyChallenge && (
              <button
                id="header-daily-challenge-btn"
                onClick={onOpenDailyChallenge}
                className="hidden lg:flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-black text-amber-950 dark:text-amber-300 bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 transition-colors cursor-pointer"
                title="تحدي حكيم اليومي لكسب كود خصم 20% VIP"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">تحدي 20%</span>
              </button>
            )}

            {/* Live Voice Advisor Button */}
            {onOpenVoiceAdvisor && (
              <button
                id="header-live-voice-btn"
                onClick={onOpenVoiceAdvisor}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-xs transition-all active:scale-95 cursor-pointer"
                title="المستشار الصوتي الحي (Gemini 3.8 Live)"
              >
                <Radio className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
                <span className="hidden lg:inline">مستشار صوتي</span>
              </button>
            )}

            {/* City Dropdown */}
            <div className="relative">
              <button
                id="city-selector-btn"
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center gap-1 px-2 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="max-w-[68px] sm:max-w-none truncate">{selectedCity.nameAr}</span>
              </button>

              {cityDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    اختر مدينتك لمقارنة الفروع
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {cities.map((city) => (
                      <button
                        key={city.id}
                        onClick={() => {
                          onSelectCity(city);
                          setCityDropdownOpen(false);
                        }}
                        className="w-full text-right px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span>{city.nameAr}</span>
                        {selectedCity.id === city.id && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* AI Advisor Quick Button */}
            <button
              id="header-ai-chat-btn"
              onClick={onOpenChat}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>اسأل حكيم AI</span>
            </button>

            {/* Wishlist Button */}
            <button
              id="header-wishlist-btn"
              onClick={() => onSelectTab('wishlist')}
              className={`hidden sm:flex relative p-2.5 rounded-xl border transition-colors cursor-pointer ${
                currentTab === 'wishlist'
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
              title="قائمة أمنياتي والمفضلة"
              aria-label="قائمة المفضلة"
            >
              <Heart className={`w-5 h-5 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              id="header-cart-btn"
              onClick={() => onSelectTab('cart')}
              className="relative p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="السلة وتحسين التوفير"
              aria-label="السلة"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar - Visible only on mobile screens */}
        <div className="md:hidden pt-2">
          <div className="relative flex items-center w-full">
            <input
              id="mobile-main-search-input"
              type="text"
              placeholder="ابحث عن سلعة، ماركة، باركود (حليب، أرز، زيت)..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  trackEvent('search', {
                    search_term: searchQuery.trim(),
                    source: 'navbar_search_enter_mobile',
                  });
                }
              }}
              className="w-full bg-slate-100/90 dark:bg-slate-800/90 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm rounded-xl pr-9 pl-10 py-2 border border-slate-200 dark:border-slate-700 focus:border-emerald-600 outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none" />
            <button
              type="button"
              onClick={onVoiceSearchClick}
              title="البحث الصوتي"
              className="absolute left-2 p-1.5 text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg cursor-pointer"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="border-t border-slate-200/70 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-1.5 no-scrollbar">
            {/* Tab: Exclusive Deals & Cashback */}
            <button
              id="nav-exclusive-deals"
              onClick={() => onSelectTab('exclusive-deals')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'exclusive-deals'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                  : 'text-amber-950 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-300/60 dark:border-amber-700/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-300" />
              <span>العروض والكاش باك</span>
              <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-md">
                VIP
              </span>
            </button>

            {/* Tab: Wishlist */}
            <button
              id="nav-wishlist"
              onClick={() => onSelectTab('wishlist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'wishlist'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-rose-900 dark:text-rose-300 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200/60 dark:border-rose-800/60'
              }`}
            >
              <Heart className={`w-4 h-4 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>المفضلة</span>
              {wishlistCount > 0 && (
                <span className="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.2 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Tab: Customer Reviews & Ratings */}
            <button
              id="nav-reviews"
              onClick={() => onSelectTab('reviews')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'reviews'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-amber-900 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-300/60 dark:border-amber-700/60'
              }`}
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>آراء العملاء</span>
              <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-md">
                ⭐ 4.9
              </span>
            </button>

            {/* Tab: Price Radar (Gemini 3.5 Flash + Google Search) */}
            <button
              id="nav-price-radar"
              onClick={() => onSelectTab('price-radar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'price-radar'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-cyan-900 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 border border-cyan-300/60 dark:border-cyan-700/60'
              }`}
            >
              <Radar className="w-4 h-4 text-cyan-500 animate-spin" />
              <span>رادار الأسعار الحي</span>
              <span className="text-[10px] font-black bg-cyan-500 text-white px-1.5 py-0.2 rounded-md">
                Google
              </span>
            </button>

            {/* Tab 1: Home */}
            <button
              id="nav-home"
              onClick={() => onSelectTab('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'home'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>الرئيسية والعروض</span>
            </button>

            {/* Tab: Product Comparison (Side-by-Side) */}
            <button
              id="nav-compare"
              onClick={() => onSelectTab('compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'compare'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md'
                  : 'text-indigo-900 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/60 dark:border-indigo-800/60'
              }`}
            >
              <Scale className="w-4 h-4 text-indigo-500" />
              <span>مقارنة السلع</span>
              {compareCount > 0 && (
                <span className="text-[10px] font-black bg-indigo-600 text-white px-1.5 py-0.2 rounded-full">
                  {compareCount}/3
                </span>
              )}
            </button>

            {/* Tab: Alhkmy Store (Merged) */}
            <button
              id="nav-alhkmy-store"
              onClick={() => onSelectTab('alhkmy-store')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'alhkmy-store'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md border border-emerald-400/50'
                  : 'text-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300/60 dark:border-emerald-700/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>متجر حكيم (alhkmy.store)</span>
              <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-md shadow-2xs">
                570C
              </span>
            </button>

            {/* Tab 2: Quick List */}
            <button
              id="nav-quicklist"
              onClick={() => onSelectTab('quicklist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'quicklist'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4 text-emerald-500" />
              <span>القائمة السريعة</span>
              <span className="text-[10px] font-extrabold bg-amber-400/30 text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded-md">
                جديد
              </span>
            </button>

            {/* Tab 3: Image Search */}
            <button
              id="nav-image-search"
              onClick={() => onSelectTab('image-search')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'image-search'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-amber-900 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 hover:bg-amber-100/90 dark:hover:bg-amber-900/50 hover:text-amber-950 dark:hover:text-amber-200 border border-amber-300/40 dark:border-amber-700/40'
              }`}
            >
              <Camera className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>البحث بالصور</span>
              <span className="text-[10px] font-black bg-amber-600 text-white px-1.5 py-0.5 rounded-md">
                Vision AI
              </span>
            </button>

            {/* Tab 4: Cart */}
            <button
              id="nav-cart"
              onClick={() => onSelectTab('cart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'cart'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>السلة والتحسين</span>
              {cartCount > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full font-bold ${
                    currentTab === 'cart' ? 'bg-white text-emerald-800' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* Tab 5: Matrix */}
            <button
              id="nav-matrix"
              onClick={() => onSelectTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'matrix'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table2 className="w-4 h-4" />
              <span>مقارن المتاجر</span>
            </button>

            {/* Tab 6: Bots */}
            <button
              id="nav-bots"
              onClick={() => onSelectTab('bots')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'bots'
                  ? 'bg-indigo-800 text-white shadow-xs'
                  : 'text-indigo-900 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/50 hover:text-indigo-950 dark:hover:text-indigo-200 font-black'
              }`}
            >
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>بوتات حكيم</span>
              <span className="text-[10px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded-md">
                4 بوتات
              </span>
            </button>

            {/* Tab: AI Tools Hub */}
            <button
              id="nav-ai-tools"
              onClick={() => onSelectTab('ai-tools')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'ai-tools'
                  ? 'bg-slate-900 dark:bg-slate-800 text-amber-300 shadow-xs border border-amber-400/40'
                  : 'text-slate-700 dark:text-slate-300 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100/80 dark:hover:bg-amber-900/50 hover:text-slate-950 dark:hover:text-white border border-amber-200/60 dark:border-amber-700/40'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>أدوات AI</span>
              <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-md">
                Hub
              </span>
            </button>

            {/* Tab 7: Alerts */}
            <button
              id="nav-alerts"
              onClick={() => onSelectTab('alerts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'alerts'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bell className={`w-4 h-4 ${alertsCount > 0 ? 'text-amber-500 animate-pulse' : ''}`} />
              <span>التنبيهات والمفضلة</span>
              {alertsCount > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    currentTab === 'alerts' ? 'bg-amber-400 text-slate-950' : 'bg-rose-500 text-white'
                  }`}
                >
                  {alertsCount}
                </span>
              )}
            </button>

            {/* Tab 8: Maps */}
            <button
              id="nav-maps"
              onClick={() => onSelectTab('maps')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'maps'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4 text-rose-500" />
              <span>خريطتي</span>
            </button>

            {/* Tab 9: Shopping Times */}
            <button
              id="nav-shopping-times"
              onClick={() => onSelectTab('shopping-times')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'shopping-times'
                  ? 'bg-sky-800 text-white shadow-xs'
                  : 'text-sky-900 dark:text-sky-300 bg-sky-50/70 dark:bg-sky-950/40 hover:bg-sky-100/90 dark:hover:bg-sky-900/50 hover:text-sky-950 dark:hover:text-sky-200 font-black border border-sky-300/40 dark:border-sky-700/40'
              }`}
            >
              <CalendarClock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>أوقات التسوق</span>
              <span className="text-[10px] font-black bg-sky-600 text-white px-1.5 py-0.5 rounded-md">
                تذكير التقويم
              </span>
            </button>

            {/* Tab 10: Coupons */}
            <button
              id="nav-coupons"
              onClick={() => onSelectTab('coupons')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'coupons'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TicketPercent className="w-4 h-4 text-amber-500" />
              <span>الكوبونات</span>
            </button>

            {/* Tab 11: Chat */}
            <button
              id="nav-chat"
              onClick={() => onSelectTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'chat'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BotMessageSquare className="w-4 h-4 text-amber-400" />
              <span>مساعد حكيم</span>
            </button>

            {/* Tab 12: Rewards */}
            <button
              id="nav-rewards"
              onClick={() => onSelectTab('rewards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'rewards'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>الجوائز</span>
            </button>

            {/* Tab 13: History */}
            <button
              id="nav-history"
              onClick={() => onSelectTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'history'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>سجل السلال</span>
            </button>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      <HkeeemHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onOpenChat={onOpenChat}
      />
    </header>
  );
};
