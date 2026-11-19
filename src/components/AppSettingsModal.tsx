import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Zap, 
  Wifi, 
  WifiOff, 
  Gauge, 
  Image as ImageIcon, 
  Check, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  HardDrive, 
  SlidersHorizontal,
  Info,
  Smartphone,
  Eye
} from 'lucide-react';
import { useDataSaver, DataSaverLevel } from '../context/DataSaverContext';
import { trackEvent } from '../utils/analytics';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearCache?: () => void;
}

export const AppSettingsModal: React.FC<AppSettingsModalProps> = ({
  isOpen,
  onClose,
  onClearCache,
}) => {
  const { 
    dataSaverLevel, 
    setDataSaverLevel, 
    isSlowConnectionDetected, 
    networkType 
  } = useDataSaver();

  const [cacheCleared, setCacheCleared] = useState(false);
  const [activeTab, setActiveTab] = useState<'network' | 'general'>('network');

  if (!isOpen) return null;

  const handleClearCache = () => {
    try {
      sessionStorage.clear();
      setCacheCleared(true);
      if (onClearCache) onClearCache();
      trackEvent('cache_cleared_by_user');
      setTimeout(() => setCacheCleared(false), 2000);
    } catch {
      // ignore
    }
  };

  const levels: {
    id: DataSaverLevel;
    title: string;
    description: string;
    savings: string;
    speed: string;
    icon: any;
    color: string;
  }[] = [
    {
      id: 'off',
      title: 'الوضع العادي (دقة فائقة HD)',
      description: 'تحميل الصور بجودتها وأبعادها الأصلية الكاملة. مناسب لشبكات Wi-Fi وشبكات 5G/4G السريعة.',
      savings: '0% توفير',
      speed: 'سرعة عادية',
      icon: ImageIcon,
      color: 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850',
    },
    {
      id: 'economy',
      title: 'الوضع الاقتصادي (موصى به)',
      description: 'ضغط ذكي لصور السلع وتقليل أبعادها وجودتها لتسريع التصفح في المناطق ذات الاتصال الضعيف وتوفير بيانات الباقة.',
      savings: 'توفير ~80% من البيانات',
      speed: 'تصفح أسرع بـ 3 أضعاف',
      icon: Zap,
      color: 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200',
    },
    {
      id: 'ultra',
      title: 'التوفير الأقصى (Ultra Saver)',
      description: 'تحميل صور مصغرة فائقة الخفة بدقة منخفضة جداً للعمل بسلاسة فائقة حتى على شبكات 2G/3G الضعيفة جداً.',
      savings: 'توفير ~95% من البيانات',
      speed: 'تحميل فوري وفائق السرعة',
      icon: Gauge,
      color: 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200',
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in" 
      dir="rtl"
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 text-emerald-300 border border-white/20 flex items-center justify-center shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">إعدادات التطبيق وتوفير البيانات</h3>
                <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                  الوضع الاقتصادي ⚡
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                تحكم في جودة وسرعة تحميل الصور لضمان أفضل تجربة تصفح في أي مكان
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="إغلاق الإعدادات"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Network Detection Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isSlowConnectionDetected 
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              }`}>
                {isSlowConnectionDetected ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              </div>
              <div>
                <div className="font-black text-slate-800 dark:text-slate-200">
                  حالة الاتصال بالإنترنت المكتشفة: <span className="font-mono text-emerald-600 dark:text-emerald-400 uppercase">{networkType}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {isSlowConnectionDetected 
                    ? 'تم رصد اتصال بطيء أو ميزة توفير البيانات في المتصفح. نوصي بتفعيل الوضع الاقتصادي.'
                    : 'الاتصال مستقر وسريع. يمكنك تفعيل الوضع الاقتصادي لتوفير باقة بيانات الجوال.'}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${
                dataSaverLevel !== 'off'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}>
                {dataSaverLevel !== 'off' ? '⚡ التوفير مفعل' : 'دقة كاملة'}
              </span>
            </div>
          </div>

          {/* Data Saver Mode Tiers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>خيارات جودة تحميل الصور (الوضع الاقتصادي):</span>
              </label>
              <span className="text-[11px] text-slate-400 font-bold">حفظ تلقائي</span>
            </div>

            <div className="space-y-2.5">
              {levels.map((lvl) => {
                const IconComponent = lvl.icon;
                const isSelected = dataSaverLevel === lvl.id;

                return (
                  <div
                    key={lvl.id}
                    onClick={() => setDataSaverLevel(lvl.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      isSelected
                        ? lvl.color + ' ring-2 ring-emerald-500/30 shadow-md'
                        : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          <IconComponent className="w-5 h-5" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                              {lvl.title}
                            </h4>
                            {isSelected && (
                              <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>محدد</span>
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            {lvl.description}
                          </p>

                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                              {lvl.savings}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {lvl.speed}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Radio Indicator */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-all ${
                        isSelected 
                          ? 'border-emerald-600 bg-emerald-600 text-white' 
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Compression Preview Demo */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-850 dark:to-slate-900 border border-slate-200 dark:border-slate-750 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>معاينة حية لتأثير الوضع الاقتصادي على تحميل الصور:</span>
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                {dataSaverLevel === 'off' ? 'دقة 100%' : dataSaverLevel === 'economy' ? 'مضغوطة 80%' : 'مضغوطة 95%'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              {/* Normal Version */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400">الوضع العادي (Original)</div>
                <div className="w-16 h-16 mx-auto rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700">
                  <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80"
                    alt="معاينة دقة عادية"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 font-bold">~85 KB</div>
                <div className="text-[9px] text-slate-400">تحميل عادي</div>
              </div>

              {/* Economy Version */}
              <div className={`p-2.5 rounded-xl border space-y-1.5 transition-all ${
                dataSaverLevel !== 'off'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/20'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">الوضع الاقتصادي (Compressed)</div>
                <div className="w-16 h-16 mx-auto rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 relative">
                  <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=120&q=25"
                    alt="معاينة اقتصادية"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-1 left-1 bg-emerald-500 text-white rounded-full p-0.5">
                    <Zap className="w-2.5 h-2.5" />
                  </div>
                </div>
                <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 font-black">~6 KB (-93%)</div>
                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">تحميل فوري ⚡</div>
              </div>
            </div>
          </div>

          {/* Storage & Cache Management */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-800 dark:text-slate-200">الذاكرة المؤقتة للتطبيق</div>
                <div className="text-[10px] text-slate-400">مسح الكاش لتحديث أحدث الأسعار والعروض</div>
              </div>
            </div>

            <button
              onClick={handleClearCache}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                cacheCleared
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {cacheCleared ? <Check className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5 text-slate-500" />}
              <span>{cacheCleared ? 'تم التفريغ!' : 'مسح الكاش'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>يتم تطبيق الإعدادات وحفظها فورياً على جميع صفحات التطبيق</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            تم الحفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
