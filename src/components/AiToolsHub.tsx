import React, { useState, useEffect } from 'react';
import { trackEvent } from '../utils/analytics';
import {
  Sparkles,
  MessageSquare,
  Brain,
  Globe,
  Zap,
  Rocket,
  Search,
  Cpu,
  Workflow,
  Github,
  Triangle,
  Bot,
  ExternalLink,
  Star,
  Pin,
  Layers,
  Code2,
  PenTool,
  Compass,
} from 'lucide-react';

export type ToolBadgeType = 'new' | 'beta' | 'featured';
export type ToolStatusType = 'online' | 'beta';
export type ToolCategory = 'all' | 'search' | 'coding' | 'writing' | 'general';

interface ToolItem {
  id: string;
  name: string;
  url: string;
  icon: React.ElementType;
  isSpecialGold?: boolean;
  lightColor: string;
  darkColor: string;
  badge?: ToolBadgeType;
  status?: ToolStatusType;
  category: Exclude<ToolCategory, 'all'>;
}

interface CategoryTab {
  id: ToolCategory;
  label: string;
  icon: React.ElementType;
}

const CATEGORY_TABS: CategoryTab[] = [
  { id: 'all', label: 'الكل', icon: Layers },
  { id: 'search', label: 'بحث واستكشاف', icon: Search },
  { id: 'coding', label: 'برمجة وتطوير', icon: Code2 },
  { id: 'writing', label: 'كتابة وتوليد', icon: PenTool },
  { id: 'general', label: 'عام ومساعدات', icon: Compass },
];

const AI_TOOLS: ToolItem[] = [
  {
    id: 'alhkmy',
    name: 'Alhkmy.app',
    url: 'https://alhkmy.app',
    icon: Sparkles,
    isSpecialGold: true,
    lightColor: 'text-amber-600',
    darkColor: 'text-amber-400',
    badge: 'featured',
    status: 'online',
    category: 'general',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com',
    icon: Sparkles,
    lightColor: 'text-sky-600',
    darkColor: 'text-sky-400',
    status: 'online',
    category: 'general',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chat.openai.com',
    icon: MessageSquare,
    lightColor: 'text-emerald-600',
    darkColor: 'text-emerald-400',
    status: 'online',
    category: 'writing',
  },
  {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai',
    icon: Brain,
    lightColor: 'text-amber-700',
    darkColor: 'text-amber-400',
    status: 'online',
    category: 'writing',
  },
  {
    id: 'meta-ai',
    name: 'Meta AI',
    url: 'https://www.meta.ai',
    icon: Globe,
    lightColor: 'text-blue-600',
    darkColor: 'text-blue-400',
    status: 'online',
    category: 'general',
  },
  {
    id: 'grok',
    name: 'Grok',
    url: 'https://grok.com',
    icon: Zap,
    lightColor: 'text-slate-900',
    darkColor: 'text-slate-100',
    status: 'online',
    category: 'search',
  },
  {
    id: 'genspark',
    name: 'Genspark',
    url: 'https://genspark.ai',
    icon: Rocket,
    lightColor: 'text-purple-600',
    darkColor: 'text-purple-400',
    badge: 'new',
    status: 'online',
    category: 'search',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    url: 'https://www.perplexity.ai',
    icon: Search,
    lightColor: 'text-teal-600',
    darkColor: 'text-teal-400',
    status: 'online',
    category: 'search',
  },
  {
    id: 'ai-studio',
    name: 'Google AI Studio',
    url: 'https://aistudio.google.com',
    icon: Cpu,
    lightColor: 'text-indigo-600',
    darkColor: 'text-indigo-400',
    status: 'online',
    category: 'coding',
  },
  {
    id: 'manus',
    name: 'Manus',
    url: '#',
    icon: Workflow,
    lightColor: 'text-rose-600',
    darkColor: 'text-rose-400',
    badge: 'new',
    status: 'beta',
    category: 'coding',
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com',
    icon: Github,
    lightColor: 'text-slate-900',
    darkColor: 'text-slate-100',
    status: 'online',
    category: 'coding',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    url: 'https://vercel.com',
    icon: Triangle,
    lightColor: 'text-slate-900',
    darkColor: 'text-slate-100',
    status: 'online',
    category: 'coding',
  },
  {
    id: 'smart-assistant',
    name: 'المساعد الذكي',
    url: '#',
    icon: Bot,
    lightColor: 'text-emerald-600',
    darkColor: 'text-emerald-400',
    badge: 'beta',
    status: 'beta',
    category: 'general',
  },
];

const LOCAL_STORAGE_FAVORITES_KEY = 'alhkmy_favorite_ai_tools';
const DEFAULT_FAVORITES: string[] = ['alhkmy', 'gemini', 'chatgpt'];

// إعدادات وتدرجات الأيقونات ثلاثية الأبعاد (3D Glossy Glass Pods)
interface ToolGlossyStyle {
  bgGradient: string;
  glowColor: string;
  ringColor: string;
  accentColor: string;
}

const TOOL_GLOSSY_STYLES: Record<string, ToolGlossyStyle> = {
  'alhkmy': {
    bgGradient: 'from-amber-400 via-amber-500 to-yellow-600',
    glowColor: 'shadow-[0_12px_28px_-4px_rgba(245,158,11,0.55)]',
    ringColor: 'ring-amber-300/70',
    accentColor: 'text-amber-500',
  },
  'gemini': {
    bgGradient: 'from-blue-500 via-indigo-600 to-cyan-400',
    glowColor: 'shadow-[0_12px_28px_-4px_rgba(59,130,246,0.55)]',
    ringColor: 'ring-sky-300/70',
    accentColor: 'text-sky-500',
  },
  'chatgpt': {
    bgGradient: 'from-emerald-400 via-teal-600 to-emerald-800',
    glowColor: 'shadow-[0_12px_28px_-4px_rgba(16,185,129,0.55)]',
    ringColor: 'ring-emerald-300/70',
    accentColor: 'text-emerald-500',
  },
  'claude': {
    bgGradient: 'from-amber-500 via-orange-600 to-amber-800',
    glowColor: 'shadow-[0_12px_28px_-4px_rgba(234,88,12,0.55)]',
    ringColor: 'ring-amber-300/70',
    accentColor: 'text-orange-500',
  },
  'meta-ai': {
    bgGradient: 'from-blue-500 via-blue-600 to-indigo-800',
    glowColor: 'shadow-[0_12px_28px_-4px_rgba(37,99,235,0.55)]',
    ringColor: 'ring-blue-300/70',
    accentColor: 'text-blue-500',
  },
  'grok': {
    bgGradient: 'from-slate-600 via-zinc-800 to-black',
    glowColor: 'shadow-[0_12px_28px_-4px_rgba(100,116,139,0.45)]',
    ringColor: 'ring-slate-300/60',
    accentColor: 'text-slate-400',
  },
  'genspark': {
    bgGradient: 'from-purple-500 via-fuchsia-600 to-pink-600',
    glowColor: 'shadow-[0_12px_28px_-4px_rgba(168,85,247,0.55)]',
    ringColor: 'ring-purple-300/70',
    accentColor: 'text-purple-500',
  },
  'perplexity': {
    bgGradient: 'from-teal-400 via-teal-600 to-cyan-800',
    glowColor: 'shadow-[0_12px_28px_-4px_rgba(20,184,166,0.55)]',
    ringColor: 'ring-teal-300/70',
    accentColor: 'text-teal-500',
  },
  'ai-studio': {
    bgGradient: 'from-indigo-500 via-blue-600 to-violet-700',
    glowColor: 'shadow-[0_12px_28px_-4px_rgba(99,102,241,0.55)]',
    ringColor: 'ring-indigo-300/70',
    accentColor: 'text-indigo-500',
  },
  'manus': {
    bgGradient: 'from-rose-500 via-pink-600 to-red-700',
    glowColor: 'shadow-[0_12px_28px_-4px_rgba(244,63,94,0.55)]',
    ringColor: 'ring-rose-300/70',
    accentColor: 'text-rose-500',
  },
  'github': {
    bgGradient: 'from-slate-700 via-slate-800 to-zinc-950',
    glowColor: 'shadow-[0_12px_28px_-4px_rgba(71,85,105,0.45)]',
    ringColor: 'ring-slate-400/60',
    accentColor: 'text-slate-400',
  },
  'vercel': {
    bgGradient: 'from-neutral-700 via-neutral-900 to-black',
    glowColor: 'shadow-[0_12px_28px_-4px_rgba(15,23,42,0.55)]',
    ringColor: 'ring-neutral-400/60',
    accentColor: 'text-neutral-300',
  },
  'smart-assistant': {
    bgGradient: 'from-emerald-400 via-teal-500 to-emerald-700',
    glowColor: 'shadow-[0_12px_28px_-4px_rgba(16,185,129,0.55)]',
    ringColor: 'ring-emerald-300/70',
    accentColor: 'text-emerald-500',
  },
};

/**
 * مكون أيقونة ثلاثية الأبعاد بلمعان زجاجي فاخر وانعكاس ضوئي ناعم
 */
const Glossy3DIcon: React.FC<{
  toolId: string;
  icon: React.ElementType;
  isSpecialGold?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ toolId, icon: Icon, size = 'md' }) => {
  const style = TOOL_GLOSSY_STYLES[toolId] || {
    bgGradient: 'from-slate-600 via-slate-700 to-slate-900',
    glowColor: 'shadow-[0_10px_25px_-4px_rgba(0,0,0,0.4)]',
    ringColor: 'ring-white/30',
    accentColor: 'text-slate-300',
  };

  const sizeClasses = {
    sm: 'w-12 h-12 rounded-xl',
    md: 'w-13 h-13 sm:w-15 sm:h-15 rounded-2xl',
    lg: 'w-16 h-16 sm:w-18 sm:h-18 rounded-3xl',
  }[size];

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7 sm:w-8 sm:h-8',
    lg: 'w-8 h-8 sm:w-9 sm:h-9',
  }[size];

  return (
    <div
      className={`relative ${sizeClasses} bg-gradient-to-br ${style.bgGradient} ${style.glowColor} ring-1 ${style.ringColor} shadow-xl flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:-rotate-1 shrink-0`}
    >
      {/* لمعان زجاجي علوي شبه بيضاوي (3D Specular Upper Glass Reflection) */}
      <div className="absolute inset-x-0 top-0 h-[48%] bg-gradient-to-b from-white/55 via-white/20 to-transparent rounded-t-2xl pointer-events-none z-10" />

      {/* حواف زجاجية مجسمة وانعكاس الحافة الداخلية (Internal Glass Bevel) */}
      <div className="absolute inset-0 rounded-2xl shadow-[inset_0_2px_1.5px_rgba(255,255,255,0.75),inset_0_-2.5px_5px_rgba(0,0,0,0.4)] pointer-events-none z-10" />

      {/* بؤرة بريق زجاجية في الزاوية العلوية (Specular Glint) */}
      <div className="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-white/40 blur-xs pointer-events-none z-10" />

      {/* توهج خفيف في الحافة السفلية للعمق (Bottom Ambient Lift) */}
      <div className="absolute inset-x-1.5 bottom-1 h-3 rounded-b-xl bg-white/10 blur-xs pointer-events-none" />

      {/* الرمز ثلاثي الأبعاد مع ظل مادي (3D Floating Icon Element) */}
      <Icon
        className={`${iconSizes} text-white relative z-20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-105`}
      />
    </div>
  );
};

export default function AiToolsHub() {
  // تتبع وضع النظام تلقائياً (Dark / Light mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // حالة التصنيف النشط في شريط التصنيفات (Filter Bar)
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');

  // حالة المفضلة المخزنة في localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_FAVORITES;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading favorites from localStorage', e);
    }
    return DEFAULT_FAVORITES;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // تبديل حالة المفضلة لأداة معينة وحفظها في localStorage
  const toggleFavorite = (e: React.MouseEvent, toolId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setFavorites((prev) => {
      const willBeFav = !prev.includes(toolId);
      const nextFavorites = willBeFav
        ? [...prev, toolId]
        : prev.filter((id) => id !== toolId);

      trackEvent('smart_tool_toggle_favorite', {
        tool_id: toolId,
        is_favorite: willBeFav,
      });

      try {
        localStorage.setItem(LOCAL_STORAGE_FAVORITES_KEY, JSON.stringify(nextFavorites));
      } catch (err) {
        console.error('Error saving favorites to localStorage', err);
      }

      return nextFavorites;
    });
  };

  // الأدوات المفضلة
  const favoriteTools = AI_TOOLS.filter((tool) => favorites.includes(tool.id));

  // الأدوات المفلترة وفقاً للتصنيف المختار
  const filteredTools = selectedCategory === 'all'
    ? AI_TOOLS
    : AI_TOOLS.filter((tool) => tool.category === selectedCategory);

  // شارة الحالة والتوفر بنمط زجاجي بلوري شفاف (Glassmorphic Status Badge)
  const renderStatusBadge = (tool: ToolItem) => {
    if (tool.badge === 'new') {
      return (
        <span
          title="أداة مضافة حديثاً"
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-400/30 backdrop-blur-md shadow-xs"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
          </span>
          <span>جديد</span>
        </span>
      );
    }

    if (tool.badge === 'beta') {
      return (
        <span
          title="نسخة تجريبية مبكرة"
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30 backdrop-blur-md"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>تجريبي</span>
        </span>
      );
    }

    if (tool.badge === 'featured') {
      return (
        <span
          title="المنصة الرئيسية المعتمدة"
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400/25 dark:bg-amber-400/20 text-amber-800 dark:text-amber-200 border border-amber-400/40 backdrop-blur-md shadow-xs"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          <span>المنصة</span>
        </span>
      );
    }

    // الحالة الافتراضية: مؤشر توفر حي بلوري (Frosted Glass Online Availability Indicator)
    if (tool.status === 'online') {
      return (
        <span
          title="الأداة نشطة ومتاحة للعمل"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/60 dark:border-white/10"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-[8px] font-bold text-slate-600 dark:text-slate-300">نشط</span>
        </span>
      );
    }

    return null;
  };

  // بطاقة أداة فردية بنمط الزجاج المصنفر فائق الفخامة (Sophisticated Glassmorphism Card)
  const renderToolCard = (tool: ToolItem, isPinnedSection: boolean = false) => {
    const isGold = tool.isSpecialGold && !isPinnedSection;
    const isFav = favorites.includes(tool.id);

    return (
      <a
        key={`${isPinnedSection ? 'pinned-' : 'all-'}${tool.id}`}
        href={tool.url}
        target={tool.url !== '#' ? '_blank' : undefined}
        rel={tool.url !== '#' ? 'noopener noreferrer' : undefined}
        onClick={() => {
          trackEvent('smart_tool_open', {
            tool_id: tool.id,
            tool_name: tool.name,
            tool_url: tool.url,
            section: isPinnedSection ? 'pinned_favorites' : 'all_tools',
          });
        }}
        title={tool.name}
        aria-label={tool.name}
        className={`group relative flex flex-col items-center justify-between p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-xl ${
          isGold
            ? 'col-span-2 bg-gradient-to-br from-amber-400/20 via-yellow-200/15 to-amber-500/10 dark:from-amber-500/25 dark:via-yellow-500/10 dark:to-amber-950/45 border-2 border-amber-300/80 dark:border-amber-400/50 shadow-[0_12px_36px_0_rgba(245,158,11,0.22),inset_0_1px_2.5px_rgba(255,255,255,0.95)] dark:shadow-[0_12px_36px_0_rgba(245,158,11,0.32),inset_0_1px_1.5px_rgba(255,255,255,0.25)] hover:border-amber-400 dark:hover:border-amber-300 hover:shadow-[0_18px_44px_0_rgba(245,158,11,0.32)] hover:-translate-y-1.5 active:scale-95'
            : 'bg-white/65 dark:bg-slate-900/50 hover:bg-white/90 dark:hover:bg-slate-900/75 border border-white/80 dark:border-white/10 hover:border-slate-300/90 dark:hover:border-slate-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.12)] hover:shadow-xl hover:shadow-slate-300/40 dark:hover:shadow-black/60 hover:-translate-y-1.5 active:scale-95'
        }`}
      >
        {/* خط الإضاءة الزجاجي العلوي الشفاف (Specular Luminous Rim Line) */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/90 dark:via-white/25 to-transparent pointer-events-none" />

        {/* الشريط العلوي داخل البطاقة: التثبيت وشارة الحالة */}
        <div className="w-full flex items-center justify-between z-10 mb-2">
          {/* زر التثبيت / التفضيل بلوري شبه شفاف */}
          <button
            type="button"
            onClick={(e) => toggleFavorite(e, tool.id)}
            title={isFav ? 'إزالة من المفضلة' : 'تثبيت في المفضلة'}
            aria-label={isFav ? 'إزالة من المفضلة' : 'تثبيت في المفضلة'}
            className={`p-1.5 rounded-full backdrop-blur-md transition-all duration-200 cursor-pointer ${
              isFav
                ? 'opacity-100 bg-amber-400/25 text-amber-500 dark:text-amber-300 border border-amber-400/50 shadow-xs hover:scale-110'
                : 'opacity-0 group-hover:opacity-100 bg-white/70 dark:bg-slate-800/70 text-slate-400 hover:text-amber-500 hover:bg-amber-400/15 border border-white/50 dark:border-white/10 hover:scale-110'
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 transition-colors ${
                isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
              }`}
            />
          </button>

          {/* مؤشر الحالة */}
          <div>{renderStatusBadge(tool)}</div>
        </div>

        {/* أيقونة الأداة ثلاثية الأبعاد بلمعان زجاجي فاخر */}
        <div className="my-1 flex items-center justify-center">
          <Glossy3DIcon
            toolId={tool.id}
            icon={tool.icon}
            isSpecialGold={isGold}
            size={isGold ? 'lg' : 'md'}
          />
        </div>

        {/* اسم الأداة مع طباعة أنيقة ونظيفة */}
        <div className="w-full text-center mt-2.5">
          <div className="font-extrabold text-xs sm:text-[13px] text-slate-850 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors truncate px-1">
            {tool.name}
          </div>
          {isGold && (
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
              المنصة الشاملة
            </div>
          )}
        </div>
      </a>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 py-8 px-4" dir="rtl">
      {/* 1. قسم المفضلة والأدوات المثبتة (Pinned Favorites Section) */}
      {favoriteTools.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>أدواتي المفضلة المثبتة</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                  {favoriteTools.length}
                </span>
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Pin className="w-3 h-3 text-amber-500" />
              <span>مثبتة في الأعلى للوصول السريع</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {favoriteTools.map((tool) => renderToolCard(tool, true))}
          </div>
        </section>
      )}

      {/* 2. شريط التصنيفات (Filter Bar) العلوي لتصفية وتسهيل الوصول */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                تصفية الأدوات حسب المجال
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                اختر التصنيف لعرض الأدوات المخصصة لتسهيل الوصول إليها
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
            <span>المعروض:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">
              {filteredTools.length}
            </span>
            <span>من</span>
            <span className="font-mono">{AI_TOOLS.length} أداة</span>
          </div>
        </div>

        {/* أزرار شريط التصنيف (Filter Bar) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedCategory === tab.id;
            const count = tab.id === 'all'
              ? AI_TOOLS.length
              : AI_TOOLS.filter((t) => t.category === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedCategory(tab.id);
                  trackEvent('smart_tool_filter_category', { category: tab.id });
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer whitespace-nowrap backdrop-blur-md ${
                  isActive
                    ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-600/20 scale-[1.02]'
                    : 'bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/70 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* شبكة الأيقونات المفلترة */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-1">
          {filteredTools.map((tool) => renderToolCard(tool, false))}
        </div>
      </section>

      {/* 3. قسم "إخراج وتنفيذ" في الأسفل بنمط زجاجي بلوري داكن فخم */}
      <section className="bg-slate-950/90 dark:bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* توهج لوني محيطي خلفي */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center space-y-1.5 relative z-10">
          <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
            إخراج وتنفيذ
          </h3>
          <p className="text-xs text-slate-400">
            المنصات والمشاريع المعتمدة لمنظومة حكيم
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          {/* بطاقة Alhkmy.app - ذهبية زجاجية فاخرة */}
          <a
            href="https://alhkmy.app"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-between p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500/15 via-yellow-500/5 to-slate-900/90 backdrop-blur-xl border-2 border-amber-400/50 hover:border-amber-300 shadow-[0_12px_36px_0_rgba(245,158,11,0.18),inset_0_1px_2px_rgba(255,255,255,0.2)] hover:shadow-[0_18px_44px_0_rgba(245,158,11,0.3)] transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
          >
            {/* خط بريق علوي */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-300/60 to-transparent pointer-events-none" />

            <div className="flex items-center gap-4">
              <Glossy3DIcon toolId="alhkmy" icon={Sparkles} size="sm" isSpecialGold />
              <div className="text-right">
                <div className="text-base font-black text-amber-200 group-hover:text-amber-100 flex items-center gap-1.5">
                  <span>Alhkmy.app</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    الرئيسية
                  </span>
                </div>
                <div className="text-xs text-amber-400/80 font-mono mt-0.5">
                  alhkmy.app
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 backdrop-blur-md flex items-center justify-center text-amber-400 group-hover:bg-amber-400 group-hover:text-slate-950 transition-all duration-300 group-hover:scale-105">
              <ExternalLink className="w-4 h-4" />
            </div>
          </a>

          {/* بطاقة مساعد حكيم - خضراء زجاجية فاخرة */}
          <a
            href="https://offers-e2jkt3k49-alhkmy11project.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-between p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-slate-900/90 backdrop-blur-xl border-2 border-emerald-400/50 hover:border-emerald-300 shadow-[0_12px_36px_0_rgba(16,185,129,0.18),inset_0_1px_2px_rgba(255,255,255,0.2)] hover:shadow-[0_18px_44px_0_rgba(16,185,129,0.3)] transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
          >
            {/* خط بريق علوي */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent pointer-events-none" />

            <div className="flex items-center gap-4">
              <Glossy3DIcon toolId="smart-assistant" icon={Bot} size="sm" />
              <div className="text-right">
                <div className="text-base font-black text-emerald-200 group-hover:text-emerald-100 flex items-center gap-1.5">
                  <span>مساعد حكيم</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                    الوكيل
                  </span>
                </div>
                <div className="text-xs text-emerald-400/80 font-mono mt-0.5">
                  Hkeeem Assistant
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-white/5 border border-white/20 backdrop-blur-md flex items-center justify-center text-emerald-400 group-hover:bg-emerald-400 group-hover:text-slate-950 transition-all duration-300 group-hover:scale-105">
              <ExternalLink className="w-4 h-4" />
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
