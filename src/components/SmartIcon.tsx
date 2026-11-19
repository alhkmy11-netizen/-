import React, { useState } from 'react';
import { useDataSaver } from '../context/DataSaverContext';
import { 
  Store as StoreIcon, 
  ShoppingBag, 
  Pill, 
  Truck, 
  Sparkles, 
  Building2, 
  Car, 
  Zap, 
  TicketPercent, 
  Package, 
  CreditCard, 
  Flame, 
  ShieldCheck, 
  Layers,
  HeartPulse,
  Tag,
  Boxes,
  Leaf,
  HandHeart
} from 'lucide-react';

// ==========================================
// 1. Store Logos (Glassmorphic Brand Badges)
// ==========================================
interface StoreLogoProps {
  storeId?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const StoreLogoBadge: React.FC<StoreLogoProps> = ({
  storeId = '',
  name = '',
  size = 'md',
  className = '',
}) => {
  const normalized = (storeId || name).toLowerCase();

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px] rounded-lg',
    sm: 'w-8 h-8 text-xs rounded-xl',
    md: 'w-10 h-10 text-sm rounded-xl',
    lg: 'w-12 h-12 text-base rounded-2xl',
    xl: 'w-14 h-14 text-lg rounded-2xl',
  }[size];

  if (normalized.includes('alhkmy') || normalized.includes('حكيم الذكي') || normalized.includes('متجر حكيم') || normalized.includes('الحكمي')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white font-black flex items-center justify-center shadow-sm border border-emerald-400/50 relative overflow-hidden shrink-0 ${className}`}
        title="متجر حكيم الذكي (alhkmy.store)"
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xs" />
        <span className="relative z-10 tracking-tighter text-[9px] sm:text-[11px] font-black leading-tight text-center">حكيم الذكي</span>
      </div>
    );
  }

  if (normalized.includes('panda') || normalized.includes('بنده')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black flex items-center justify-center shadow-sm border border-emerald-400/40 relative overflow-hidden shrink-0 ${className}`}
        title="هايبر بنده"
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xs" />
        <span className="relative z-10 tracking-tighter">بنده</span>
      </div>
    );
  }

  if (normalized.includes('othaim') || normalized.includes('العثيم')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black flex items-center justify-center shadow-sm border border-amber-400/40 relative overflow-hidden shrink-0 ${className}`}
        title="أسواق عبد الله العثيم"
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xs" />
        <span className="relative z-10 tracking-tighter">العثيم</span>
      </div>
    );
  }

  if (normalized.includes('danube') || normalized.includes('الدانوب')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-purple-700 to-indigo-900 text-white font-black flex items-center justify-center shadow-sm border border-purple-400/40 relative overflow-hidden shrink-0 ${className}`}
        title="أسواق الدانوب"
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xs" />
        <span className="relative z-10 tracking-tighter">الدانوب</span>
      </div>
    );
  }

  if (normalized.includes('carrefour') || normalized.includes('كارفور')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-sky-600 via-blue-700 to-indigo-800 text-white font-black flex items-center justify-center shadow-sm border border-sky-400/40 relative overflow-hidden shrink-0 ${className}`}
        title="كارفور السعودية"
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xs" />
        <span className="relative z-10 font-bold tracking-tight">CRF</span>
      </div>
    );
  }

  if (normalized.includes('amazon_us') || normalized.includes('أمازون أمريكا')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-blue-800 via-sky-700 to-slate-900 text-amber-300 font-black flex items-center justify-center shadow-sm border border-sky-400/50 relative overflow-hidden shrink-0 ${className}`}
        title="أمازون أمريكا (Amazon US)"
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xs" />
        <span className="relative z-10 tracking-tight text-[9px] sm:text-[10px]">US امزون</span>
      </div>
    );
  }

  if (normalized.includes('walmart') || normalized.includes('وولمارت')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-blue-600 to-sky-700 text-amber-300 font-black flex items-center justify-center shadow-sm border border-amber-300/50 relative overflow-hidden shrink-0 ${className}`}
        title="وولمارت أمريكا (Walmart)"
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xs" />
        <span className="relative z-10 tracking-tight text-[10px]">WMT</span>
      </div>
    );
  }

  if (normalized.includes('iherb') || normalized.includes('آيهيرب')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-lime-600 to-emerald-800 text-white font-black flex items-center justify-center shadow-sm border border-lime-400/50 relative overflow-hidden shrink-0 ${className}`}
        title="آيهيرب الأمريكي (iHerb)"
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xs" />
        <span className="relative z-10 tracking-tight text-[10px]">iHerb</span>
      </div>
    );
  }

  if (normalized.includes('aliexpress') || normalized.includes('علي إكسبريس')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-red-600 to-orange-600 text-white font-black flex items-center justify-center shadow-sm border border-orange-300/50 relative overflow-hidden shrink-0 ${className}`}
        title="علي إكسبريس الصيني (AliExpress)"
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xs" />
        <span className="relative z-10 tracking-tight text-[10px]">AliEx</span>
      </div>
    );
  }

  if (normalized.includes('temu') || normalized.includes('تيمو')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black flex items-center justify-center shadow-sm border border-orange-300/50 relative overflow-hidden shrink-0 ${className}`}
        title="تيمو الصيني (Temu)"
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xs" />
        <span className="relative z-10 tracking-tight text-[10px]">TEMU</span>
      </div>
    );
  }

  if (normalized.includes('shein') || normalized.includes('شي إن')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-slate-950 to-slate-800 text-white font-black flex items-center justify-center shadow-sm border border-slate-600 relative overflow-hidden shrink-0 ${className}`}
        title="شي إن (SHEIN)"
      >
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xs" />
        <span className="relative z-10 tracking-tight text-[9px] sm:text-[10px]">SHEIN</span>
      </div>
    );
  }

  if (normalized.includes('amazon') || normalized.includes('أمازون')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-slate-900 to-amber-950 text-amber-400 font-black flex items-center justify-center shadow-sm border border-amber-500/40 relative overflow-hidden shrink-0 ${className}`}
        title="أمازون السعودية"
      >
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xs" />
        <span className="relative z-10 tracking-tight text-[11px]">amzn</span>
      </div>
    );
  }

  if (normalized.includes('lulu') || normalized.includes('لولو')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-teal-600 to-emerald-800 text-white font-black flex items-center justify-center shadow-sm border border-teal-400/40 relative overflow-hidden shrink-0 ${className}`}
        title="لولو هايبرماركت"
      >
        <div className="absolute inset-0 bg-white/10 backdrop-blur-xs" />
        <span className="relative z-10 tracking-tighter">لولو</span>
      </div>
    );
  }

  if (normalized.includes('nahdi') || normalized.includes('النهدي')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-cyan-600 to-blue-700 text-white font-black flex items-center justify-center shadow-sm border border-cyan-400/40 relative overflow-hidden shrink-0 ${className}`}
        title="صيدليات النهدي"
      >
        <HeartPulse className="w-5 h-5 relative z-10 text-white animate-pulse" />
      </div>
    );
  }

  if (normalized.includes('tamimi') || normalized.includes('التميمي')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-emerald-800 to-slate-900 text-amber-300 font-black flex items-center justify-center shadow-sm border border-amber-400/30 relative overflow-hidden shrink-0 ${className}`}
        title="أسواق التميمي"
      >
        <span className="relative z-10 tracking-tighter">التميمي</span>
      </div>
    );
  }

  if (normalized.includes('noon') || normalized.includes('نون')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-950 font-black flex items-center justify-center shadow-sm border border-yellow-300 relative overflow-hidden shrink-0 ${className}`}
        title="نون السعودية"
      >
        <span className="relative z-10 text-xs font-black">noon</span>
      </div>
    );
  }

  if (normalized.includes('hungerstation') || normalized.includes('هنقرستيشن')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 font-black flex items-center justify-center shadow-sm border border-amber-300 relative overflow-hidden shrink-0 ${className}`}
        title="هنقرستيشن"
      >
        <span className="relative z-10 text-xs font-black">هنقر</span>
      </div>
    );
  }

  if (normalized.includes('jahez') || normalized.includes('جاهز')) {
    return (
      <div 
        className={`${sizeClasses} bg-gradient-to-br from-rose-600 to-red-700 text-white font-black flex items-center justify-center shadow-sm border border-rose-400/40 relative overflow-hidden shrink-0 ${className}`}
        title="جاهز Jahez"
      >
        <span className="relative z-10 text-xs font-black">جاهز</span>
      </div>
    );
  }

  if (normalized.includes('aljouf_artisanal') || normalized.includes('خيرات الجوف')) {
    return (
      <div
        className={`${sizeClasses} bg-gradient-to-br from-amber-700 to-stone-800 text-amber-100 font-black flex items-center justify-center shadow-sm border border-amber-500/40 relative overflow-hidden shrink-0 ${className}`}
        title="خيرات الجوف والقصيم الحرفية"
      >
        <span className="relative z-10 text-[10px] font-black tracking-tighter">الجوف</span>
      </div>
    );
  }

  if (normalized.includes('najd_craft') || normalized.includes('نجد الحرفي')) {
    return (
      <div
        className={`${sizeClasses} bg-gradient-to-br from-orange-700 to-amber-900 text-amber-100 font-black flex items-center justify-center shadow-sm border border-amber-400/40 relative overflow-hidden shrink-0 ${className}`}
        title="متجر نجد الحرفي"
      >
        <span className="relative z-10 text-[10px] font-black tracking-tighter">نجد</span>
      </div>
    );
  }

  if (normalized.includes('abazeer_organic') || normalized.includes('أبازير')) {
    return (
      <div
        className={`${sizeClasses} bg-gradient-to-br from-lime-700 to-emerald-800 text-lime-50 font-black flex items-center justify-center shadow-sm border border-lime-400/40 relative overflow-hidden shrink-0 ${className}`}
        title="أبازير العضوية"
      >
        <span className="relative z-10 text-[10px] font-black tracking-tighter">أبازير</span>
      </div>
    );
  }

  if (normalized.includes('watania_organic') || normalized.includes('الوطنية العضوية')) {
    return (
      <div
        className={`${sizeClasses} bg-gradient-to-br from-emerald-700 to-green-900 text-emerald-50 font-black flex items-center justify-center shadow-sm border border-emerald-400/40 relative overflow-hidden shrink-0 ${className}`}
        title="مزارع الوطنية العضوية"
      >
        <span className="relative z-10 text-[9px] font-black tracking-tighter">الوطنية</span>
      </div>
    );
  }

  // Fallback generic glass store badge
  return (
    <div 
      className={`${sizeClasses} bg-gradient-to-br from-slate-800 to-slate-900 text-emerald-400 font-black flex items-center justify-center shadow-sm border border-slate-700 relative overflow-hidden shrink-0 ${className}`}
    >
      <StoreIcon className="w-4 h-4 text-emerald-400" />
    </div>
  );
};

// ==========================================
// 2. Product Image Component (High-Res Photography + Fallback)
// ==========================================
interface ProductImageProps {
  src: string;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
  className?: string;
  containerClassName?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  size,
  className = '',
  containerClassName,
}) => {
  const { getOptimizedImageUrl, isDataSaverEnabled, dataSaverLevel } = useDataSaver();
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Compute optimized URL based on current Data Saver level
  const optimizedSrc = getOptimizedImageUrl(src, size);

  // Derive container size classes if size is provided
  const derivedContainerClass = containerClassName || (
    size === 'xs' ? 'w-8 h-8 rounded-lg' :
    size === 'sm' ? 'w-10 h-10 rounded-xl' :
    size === 'md' ? 'w-14 h-14 rounded-2xl' :
    size === 'lg' ? 'w-20 h-20 rounded-2xl' :
    size === 'xl' ? 'w-28 h-28 rounded-3xl' :
    'w-14 h-14 rounded-2xl'
  );

  // If the src is not a valid URL or image failed, render a modern glassmorphic product badge
  const isUrl = src && (src.startsWith('http://') || src.startsWith('https://'));

  if (!isUrl || hasError) {
    return (
      <div 
        className={`${derivedContainerClass} bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner relative overflow-hidden shrink-0`}
      >
        <div className="absolute inset-0 bg-white/20 dark:bg-white/5 backdrop-blur-xs" />
        <Boxes className="w-6 h-6 relative z-10 text-slate-500 dark:text-slate-400" />
      </div>
    );
  }

  return (
    <div 
      className={`${derivedContainerClass} bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 overflow-hidden flex items-center justify-center shadow-xs shrink-0 relative group`}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse" />
      )}
      <img
        src={optimizedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
      />
      {isDataSaverEnabled && size !== 'xs' && (
        <div 
          className="absolute top-1 left-1 z-10 w-3.5 h-3.5 rounded-full bg-emerald-500/90 text-white flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
          title={`الوضع الاقتصادي مفعل (${dataSaverLevel === 'ultra' ? 'توفير أقصى' : 'ضغط 80%'})`}
        >
          <Zap className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. Category Glass Icons
// ==========================================
interface GlassCategoryIconProps {
  categoryId: string;
  className?: string;
}

export const GlassCategoryIcon: React.FC<GlassCategoryIconProps> = ({
  categoryId,
  className = 'w-6 h-6',
}) => {
  switch (categoryId) {
    case 'all':
      return <Sparkles className={`${className} text-amber-500`} />;
    case 'hypermarket':
      return <StoreIcon className={`${className} text-emerald-600 dark:text-emerald-400`} />;
    case 'local_artisanal':
      return <HandHeart className={`${className} text-amber-600 dark:text-amber-400`} />;
    case 'organic_shop':
      return <Leaf className={`${className} text-lime-600 dark:text-lime-400`} />;
    case 'small_retail':
      return <ShoppingBag className={`${className} text-teal-600 dark:text-teal-400`} />;
    case 'pharmacy':
      return <Pill className={`${className} text-cyan-600 dark:text-cyan-400`} />;
    case 'ecommerce':
      return <Truck className={`${className} text-indigo-600 dark:text-indigo-400`} />;
    case 'chinese_store':
      return <Package className={`${className} text-orange-600 dark:text-orange-400`} />;
    case 'american_store':
      return <ShieldCheck className={`${className} text-blue-600 dark:text-blue-400`} />;
    default:
      return <Layers className={`${className} text-slate-500`} />;
  }
};

// ==========================================
// 4. Bot Hologram / Glass Badges
// ==========================================
interface BotAvatarProps {
  botId: 'cars' | 'real_estate' | 'offers' | 'coupons';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
  className?: string;
}

export const BotAvatar: React.FC<BotAvatarProps> = ({
  botId,
  size,
  className,
}) => {
  const defaultSizeClass = size === 'sm' ? 'w-10 h-10 rounded-xl' :
    size === 'lg' ? 'w-16 h-16 rounded-3xl' :
    'w-12 h-12 rounded-2xl';
  const effectiveClass = className || defaultSizeClass;
  switch (botId) {
    case 'cars':
      return (
        <div className={`${effectiveClass} bg-gradient-to-br from-blue-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-blue-500/20 border border-blue-400/40 relative overflow-hidden shrink-0`}>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xs" />
          <Car className="w-6 h-6 relative z-10 text-white" />
        </div>
      );
    case 'real_estate':
      return (
        <div className={`${effectiveClass} bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 border border-emerald-400/40 relative overflow-hidden shrink-0`}>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xs" />
          <Building2 className="w-6 h-6 relative z-10 text-white" />
        </div>
      );
    case 'offers':
      return (
        <div className={`${effectiveClass} bg-gradient-to-br from-amber-500 to-orange-700 text-white flex items-center justify-center shadow-md shadow-amber-500/20 border border-amber-400/40 relative overflow-hidden shrink-0`}>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xs" />
          <Zap className="w-6 h-6 relative z-10 text-white" />
        </div>
      );
    case 'coupons':
      return (
        <div className={`${effectiveClass} bg-gradient-to-br from-purple-600 to-pink-700 text-white flex items-center justify-center shadow-md shadow-purple-500/20 border border-purple-400/40 relative overflow-hidden shrink-0`}>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xs" />
          <TicketPercent className="w-6 h-6 relative z-10 text-white" />
        </div>
      );
    default:
      return (
        <div className={`${effectiveClass} bg-slate-900 text-white flex items-center justify-center border border-slate-700 shrink-0`}>
          <Sparkles className="w-6 h-6 text-amber-400" />
        </div>
      );
  }
};

// ==========================================
// 5. Agency Crests for Automotive
// ==========================================
interface AgencyBadgeProps {
  name: string;
  className?: string;
}

export const AgencyBadge: React.FC<AgencyBadgeProps> = ({
  name,
  className = 'w-10 h-10 rounded-xl',
}) => {
  return (
    <div className={`${className} bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center border border-slate-700 shadow-sm shrink-0 font-black text-xs`}>
      <Car className="w-5 h-5 text-sky-400" />
    </div>
  );
};
