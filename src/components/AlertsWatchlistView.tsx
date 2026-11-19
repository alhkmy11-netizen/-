import React, { useState, useEffect } from 'react';
import { Product, Store, PriceAlert } from '../types';
import { ProductImage } from './SmartIcon';
import { 
  Bell, 
  Trash2, 
  TrendingDown, 
  ShoppingCart, 
  Check, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Radio, 
  AlertCircle, 
  Send, 
  RefreshCw, 
  X, 
  CheckCircle2, 
  Clock, 
  Store as StoreIcon, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Mail,
  MailCheck,
  AtSign,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { 
  isPushSupported, 
  getPushPermissionState, 
  requestPushPermission, 
  sendNativePushNotification, 
  playNotificationChime,
  sendPriceAlertEmail,
  InAppPushPayload
} from '../utils/notificationService';

interface AlertsWatchlistViewProps {
  alerts: PriceAlert[];
  stores: Store[];
  onRemoveAlert: (alertId: string) => void;
  onAddToCart: (product: Product) => void;
  products: Product[];
  onUpdateAlerts?: (newAlerts: PriceAlert[]) => void;
}

export const AlertsWatchlistView: React.FC<AlertsWatchlistViewProps> = ({
  alerts,
  stores,
  onRemoveAlert,
  onAddToCart,
  products,
  onUpdateAlerts,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [activeToast, setActiveToast] = useState<InAppPushPayload | null>(null);

  // إعدادات تنبيهات البريد الإلكتروني العامة والخاصة بالسلع
  const [globalEmailAlertsEnabled, setGlobalEmailAlertsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hkeeem_email_alerts_active') === 'true';
    }
    return true;
  });

  const [savedUserEmail, setSavedUserEmail] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hkeeem_user_alert_email') || 'alhkmy11@gmail.com';
    }
    return 'alhkmy11@gmail.com';
  });

  const [emailInput, setEmailInput] = useState(savedUserEmail);
  const [isEmailSaved, setIsEmailSaved] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState<string | null>(null);
  const [showEmailSettings, setShowEmailSettings] = useState(false);

  // قراءة إذن الإشعارات عند التحميل
  useEffect(() => {
    if (isPushSupported()) {
      setPermission(getPushPermissionState());
    }
  }, []);

  // طلب إذن إشعارات المتصفح
  const handleEnablePush = async () => {
    const result = await requestPushPermission();
    setPermission(result);
    if (result === 'granted') {
      if (soundEnabled) playNotificationChime();
      triggerToast({
        id: `toast-${Date.now()}`,
        title: 'تم تفعيل الإشعارات الفورية (Push)!',
        body: 'ستصلك تنبيهات فورية ومباشرة بمجرد انخفاض أسعار السلع المراقبة إلى سعرك المستهدف.',
        productName: 'حكيم AI للرصد الذكي',
        productImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
        storeName: 'جميع المتاجر',
        newPrice: 0,
        timestamp: 'الآن',
      });
      sendNativePushNotification('تفعيل الإشعارات الفورية في حكيم AI', {
        body: 'تم تفعيل التنبيهات الفورية بنجاح! سنخبرك فور هبوط أي سعر.',
      });
    }
  };

  // حفظ عنوان البريد الإلكتروني وتفعيله
  const handleSaveEmail = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setEmailStatusMessage('يرجى إدخال عنوان بريد إلكتروني صحيح');
      return;
    }

    setSavedUserEmail(emailInput.trim());
    try {
      localStorage.setItem('hkeeem_user_alert_email', emailInput.trim());
      localStorage.setItem('hkeeem_email_alerts_active', String(globalEmailAlertsEnabled));
    } catch (e) {}

    setIsEmailSaved(true);
    setEmailStatusMessage(`تم حفظ البريد (${emailInput.trim()}) لتلقي إشعارات انخفاض الأسعار`);
    setTimeout(() => {
      setIsEmailSaved(false);
      setEmailStatusMessage(null);
    }, 4000);
  };

  // التبديل بين تفعيل وتعطيل إشعارات البريد الإلكتروني العامة
  const handleToggleGlobalEmail = () => {
    const nextVal = !globalEmailAlertsEnabled;
    setGlobalEmailAlertsEnabled(nextVal);
    try {
      localStorage.setItem('hkeeem_email_alerts_active', String(nextVal));
    } catch (e) {}
    
    // تحديث كافة التنبيهات إذا رغب المستخدم
    if (onUpdateAlerts && alerts.length > 0) {
      const updated = alerts.map((a) => ({
        ...a,
        emailNotificationEnabled: nextVal,
        userEmail: savedUserEmail,
      }));
      onUpdateAlerts(updated);
    }
  };

  // تفعيل أو تعطيل تنبيه الإيميل لسلعة محددة
  const handleToggleAlertEmail = (alertId: string) => {
    if (!onUpdateAlerts) return;
    const updated = alerts.map((a) => {
      if (a.id === alertId) {
        const currentVal = a.emailNotificationEnabled !== undefined ? a.emailNotificationEnabled : globalEmailAlertsEnabled;
        return {
          ...a,
          emailNotificationEnabled: !currentVal,
          userEmail: savedUserEmail,
        };
      }
      return a;
    });
    onUpdateAlerts(updated);
  };

  // إرسال إشعار تجريبي عبر البريد الإلكتروني
  const handleSendTestEmail = async () => {
    if (!savedUserEmail) {
      setShowEmailSettings(true);
      return;
    }

    setIsSendingTestEmail(true);
    const sample = alerts[0];
    const pName = sample ? sample.productName : 'أرز الشعلان سيلا بسمتي (5 كجم)';
    const sName = sample ? sample.storeName : 'أسواق عبد الله العثيم';
    const currentPrice = sample ? sample.targetPrice : 38.50;
    const oldPrice = sample ? sample.currentLowestPrice : 44.00;

    const res = await sendPriceAlertEmail({
      email: savedUserEmail,
      productName: pName,
      storeName: sName,
      currentPrice,
      targetPrice: currentPrice,
      oldPrice,
      savings: Number((oldPrice - currentPrice).toFixed(2)),
      productImage: sample?.productImage,
    });

    setIsSendingTestEmail(false);
    if (res.success) {
      setEmailStatusMessage(`✅ تم إرسال إيميل تجريبي بنجاح إلى: ${savedUserEmail}`);
      triggerPushAlert({
        id: `email-test-${Date.now()}`,
        title: '📧 تم إرسال إشعار السعر إلى بريدك الإلكتروني',
        body: `تم إرسال تنبيه تجريبي لهبوط سعر «${pName}» إلى ${savedUserEmail}.`,
        productName: pName,
        productImage: sample ? sample.productImage : 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
        storeName: sName,
        newPrice: currentPrice,
        oldPrice,
        savings: Number((oldPrice - currentPrice).toFixed(2)),
        timestamp: 'الآن',
        emailSent: true,
        userEmail: savedUserEmail,
      });
    } else {
      setEmailStatusMessage(`⚠️ ${res.message}`);
    }

    setTimeout(() => setEmailStatusMessage(null), 5000);
  };

  // إطلاق الإشعار الفوري (Push Toast + نغمة صوتية + تنبيه المتصفح + إرسال بريد إذا كان مفعلاً)
  const triggerPushAlert = (payload: InAppPushPayload) => {
    if (soundEnabled) {
      playNotificationChime();
    }

    // إشعار المتصفح الأصلي (Native Push)
    sendNativePushNotification(payload.title, {
      body: payload.body,
      tag: payload.id,
      onClick: () => {
        const prod = products.find((p) => p.nameAr === payload.productName);
        if (prod) onAddToCart(prod);
      },
    });

    // إشعار Toast التفاعلي داخل التطبيق
    triggerToast(payload);
  };

  const triggerToast = (payload: InAppPushPayload) => {
    setActiveToast(payload);
    setTimeout(() => {
      setActiveToast((current) => (current?.id === payload.id ? null : current));
    }, 8000);
  };

  // إرسال إشعار فوري تجريبي
  const handleTestNotification = () => {
    const sampleAlert = alerts[0];
    const pName = sampleAlert ? sampleAlert.productName : 'أرز الشعلان سيلا 5 كجم';
    const oldPrice = sampleAlert ? sampleAlert.currentLowestPrice : 42.50;
    const newPrice = sampleAlert ? Number((sampleAlert.targetPrice - 1.5).toFixed(2)) : 35.95;
    const sName = sampleAlert ? sampleAlert.storeName : 'أسواق عبد الله العثيم';

    triggerPushAlert({
      id: `test-${Date.now()}`,
      title: 'انخفاض سعر حقيقي: السلعة وصلت للمستهدف!',
      body: `انخفض سعر «${pName}» في ${sName} من ${oldPrice.toFixed(2)} إلى ${newPrice.toFixed(2)} ر.س!`,
      productName: pName,
      productImage: sampleAlert ? sampleAlert.productImage : 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
      storeName: sName,
      oldPrice,
      newPrice,
      targetPrice: sampleAlert ? sampleAlert.targetPrice : 37.0,
      savings: Number((oldPrice - newPrice).toFixed(2)),
      timestamp: 'الآن',
      emailSent: globalEmailAlertsEnabled && !!savedUserEmail,
      userEmail: savedUserEmail,
    });
  };

  // محاكاة فورية لهبوط سعر أحد المنتجات المراقبة
  const handleSimulatePriceDrop = async () => {
    if (alerts.length === 0) return;

    // اختيار أول سلعة لم تنخفض بعد، أو أول سلعة
    const targetIdx = alerts.findIndex((a) => !a.triggered) >= 0 
      ? alerts.findIndex((a) => !a.triggered) 
      : 0;

    const targetAlert = alerts[targetIdx];
    const previousPrice = targetAlert.currentLowestPrice;
    const discountedPrice = Math.max(2, Number((targetAlert.targetPrice - 2.50).toFixed(2)));
    const savings = Number((previousPrice - discountedPrice).toFixed(2));
    const storesList = ['أسواق العثيم', 'هايبر بنده', 'كارفور', 'لولو هايبرماركت'];
    const chosenStore = storesList[Math.floor(Math.random() * storesList.length)];

    const willSendEmail = (targetAlert.emailNotificationEnabled ?? globalEmailAlertsEnabled) && !!savedUserEmail;

    const updatedAlerts = [...alerts];
    updatedAlerts[targetIdx] = {
      ...targetAlert,
      currentLowestPrice: discountedPrice,
      previousPrice,
      storeName: chosenStore,
      triggered: true,
      lastNotifiedAt: 'الآن',
      discountPercent: Math.round(((previousPrice - discountedPrice) / previousPrice) * 100),
      emailNotificationEnabled: willSendEmail,
      userEmail: savedUserEmail,
    };

    if (onUpdateAlerts) {
      onUpdateAlerts(updatedAlerts);
    }

    // إرسال إشعار البريد الإلكتروني في الخلفية إذا كان مفعلاً
    if (willSendEmail) {
      sendPriceAlertEmail({
        email: savedUserEmail,
        productName: targetAlert.productName,
        storeName: chosenStore,
        currentPrice: discountedPrice,
        targetPrice: targetAlert.targetPrice,
        oldPrice: previousPrice,
        savings,
        productImage: targetAlert.productImage,
      });
    }

    // إطلاق الإشعار الفوري (Push-like Notification Toast)
    triggerPushAlert({
      id: `drop-${Date.now()}`,
      title: `📉 هبوط سعر مستهدف: ${targetAlert.productName}`,
      body: `وصل للسعر المستهدف في ${chosenStore}! السعر الجديد: ${discountedPrice.toFixed(2)} ر.س (توفير ${savings.toFixed(2)} ر.س)${willSendEmail ? ` • تم إرسال نسخة لبريدك (${savedUserEmail})` : ''}`,
      productName: targetAlert.productName,
      productImage: targetAlert.productImage,
      storeName: chosenStore,
      oldPrice: previousPrice,
      newPrice: discountedPrice,
      targetPrice: targetAlert.targetPrice,
      savings,
      timestamp: 'الآن',
      emailSent: willSendEmail,
      userEmail: savedUserEmail,
      alertId: targetAlert.id,
    });
  };

  // فحص الأسعار لجميع السلع
  const handleScanPrices = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      handleSimulatePriceDrop();
    }, 1200);
  };

  // تعديل السعر المستهدف للسلعة
  const handleAdjustTargetPrice = (alertId: string, delta: number) => {
    if (!onUpdateAlerts) return;
    const updated = alerts.map((a) => {
      if (a.id === alertId) {
        const nextPrice = Math.max(1, Number((a.targetPrice + delta).toFixed(2)));
        const isNowTriggered = a.currentLowestPrice <= nextPrice;
        return {
          ...a,
          targetPrice: nextPrice,
          triggered: isNowTriggered,
        };
      }
      return a;
    });
    onUpdateAlerts(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 transition-colors duration-300" dir="rtl">
      
      {/* Floating Interactive Push-like In-App Notification Toast */}
      {activeToast && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/95 dark:bg-slate-950/95 text-white p-4 rounded-3xl shadow-2xl border border-amber-400/50 backdrop-blur-md flex items-start gap-3.5 ring-2 ring-amber-400/20">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
              <ProductImage src={activeToast.productImage} alt={activeToast.productName} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-ping text-amber-400" />
                  إشعار فوري (Push Alert)
                </span>
                <button
                  onClick={() => setActiveToast(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <h4 className="font-extrabold text-xs sm:text-sm text-slate-100 mt-1 truncate">
                {activeToast.title}
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {activeToast.body}
              </p>

              {activeToast.emailSent && activeToast.userEmail && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-lg w-fit border border-emerald-500/30">
                  <MailCheck className="w-3 h-3 text-emerald-400" />
                  <span>أُرسلت نسخة للبريد الإلكتروني ({activeToast.userEmail})</span>
                </div>
              )}

              {activeToast.newPrice > 0 && (
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5">
                    {activeToast.oldPrice && (
                      <span className="line-through text-slate-400 text-[11px]">
                        {activeToast.oldPrice.toFixed(2)} ر.س
                      </span>
                    )}
                    <span className="font-black text-emerald-400 text-sm">
                      {activeToast.newPrice.toFixed(2)} ر.س
                    </span>
                  </div>

                  {products.find((p) => p.nameAr === activeToast.productName) && (
                    <button
                      onClick={() => {
                        const prod = products.find((p) => p.nameAr === activeToast.productName);
                        if (prod) onAddToCart(prod);
                        setActiveToast(null);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      <span>أضف للسلة</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header Banner with Scan & Email Controls */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-slate-950 text-amber-400 font-black shadow-md">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black">رادار التنبيهات والإشعارات الفورية</h1>
                <p className="text-xs text-amber-100 font-medium">نظام مراقبة السعر المستهدف عبر إشعارات Push والبريد الإلكتروني</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-amber-100/90 max-w-xl leading-relaxed pt-1">
              يراقب حكيم AI أسعار السلع على مدار الساعة. فور انخفاض السعر إلى سعرك المستهدف، تتلقى إشعاراً فورياً على شاشتك مع إمكانية إرسال إشعار لبريدك الإلكتروني مباشرة!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            <button
              onClick={handleScanPrices}
              disabled={isScanning || alerts.length === 0}
              className="px-3.5 py-2.5 rounded-xl bg-slate-950/90 hover:bg-slate-950 text-amber-300 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'جارِ فحص الأسعار...' : 'فحص الأسعار الآن'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Push & Email Notification Controls Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-colors space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Permission State Indicator */}
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              permission === 'granted'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                : permission === 'denied'
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
            }`}>
              <Radio className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  حالة إشعارات المتصفح الفورية (Push)
                </span>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  permission === 'granted'
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                    : permission === 'denied'
                    ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                    : 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    permission === 'granted'
                      ? 'bg-emerald-500 animate-pulse'
                      : permission === 'denied'
                      ? 'bg-rose-500'
                      : 'bg-amber-500'
                  }`} />
                  <span>
                    {permission === 'granted'
                      ? 'مفعّلة بنجاح'
                      : permission === 'denied'
                      ? 'محظورة بالمتصفح'
                      : 'بانتظار الإذن'}
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {permission === 'granted'
                  ? 'سيتلقى هذا المتصفح تنبيهات منبثقة مباشرة فور هبوط السعر المستهدف.'
                  : permission === 'denied'
                  ? 'تم حظر الإشعارات بالمتصفح. يمكنك تمكينها بالنقر على أيقونة القفل في شريط العنوان.'
                  : 'انقر لتفعيل وصول الإشعارات لتصلك تنبيهات الخصم الفورية على شاشتك.'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* زر فتح إعدادات البريد الإلكتروني */}
            <button
              onClick={() => setShowEmailSettings(!showEmailSettings)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showEmailSettings || globalEmailAlertsEnabled
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
              title="إعدادات تنبيهات البريد الإلكتروني"
            >
              <Mail className={`w-4 h-4 ${globalEmailAlertsEnabled ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
              <span>تنبيهات الإيميل</span>
              {globalEmailAlertsEnabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400'
              }`}
              title={soundEnabled ? 'صوت التنبيه مفعّل' : 'صوت التنبيه صامت'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-[11px]">{soundEnabled ? 'النغمة مفعلة' : 'صامت'}</span>
            </button>

            {/* Enable Push Button */}
            {permission !== 'granted' && (
              <button
                onClick={handleEnablePush}
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>تفعيل Push</span>
              </button>
            )}

            {/* Test Notification Button */}
            <button
              onClick={handleTestNotification}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              title="إرسال إشعار تجريبي للتأكد من وصوله"
            >
              <Send className="w-3.5 h-3.5 text-sky-500 rtl:rotate-180" />
              <span>إشعار تجريبي</span>
            </button>

            {/* Simulate Real Price Drop */}
            {alerts.length > 0 && (
              <button
                onClick={handleSimulatePriceDrop}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="محاكاة هبوط سعر سلعة من قائمتك وإطلاق إشعار Push وإيميل"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>محاكاة هبوط السعر</span>
              </button>
            )}
          </div>
        </div>

        {/* لوحة خيارات تفعيل وإعدادات تنبيهات البريد الإلكتروني (Email Alerts Settings) */}
        {(showEmailSettings || globalEmailAlertsEnabled) && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 bg-amber-50/50 dark:bg-slate-850/50 rounded-2xl p-4 space-y-3 transition-all animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>خدمة إشعارات البريد الإلكتروني عند وصول السعر المستهدف</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      globalEmailAlertsEnabled 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {globalEmailAlertsEnabled ? 'مفعلة تلقائياً' : 'معطلة'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    سيصلك بريد إلكتروني فوري يحتوي على السعر الجديد، اسم المتجر، ورابط إضافة السلعة للسلة فور توفر الخصم.
                  </p>
                </div>
              </div>

              {/* مفتاح تفعيل/تعطيل التنبيهات بالبريد */}
              <label className="flex items-center gap-2 cursor-pointer select-none self-start sm:self-center bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <input
                  type="checkbox"
                  checked={globalEmailAlertsEnabled}
                  onChange={handleToggleGlobalEmail}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  تفعيل تنبيهات البريد
                </span>
              </label>
            </div>

            {/* نموذج إدخال وحفظ البريد الإلكتروني */}
            <form onSubmit={handleSaveEmail} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <AtSign className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني لتلقي التنبيهات (مثال: user@domain.com)..."
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pr-9 pl-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                  required
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>حفظ البريد</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTestEmail || !savedUserEmail}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="إرسال تجربة فورية إلى البريد المحفوظ"
                >
                  {isSendingTestEmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جارِ الإرسال...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 rtl:rotate-180" />
                      <span>إرسال تجربة للإيميل</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {emailStatusMessage && (
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{emailStatusMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {alerts.length === 0 ? (
        <div className="max-w-xl mx-auto py-16 text-center space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 transition-colors">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner border border-amber-200/50 dark:border-amber-800/40">
            <Bell className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">لا توجد سلع مضافة في قائمة المراقبة حالياً</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            انقر على أيقونة الجرس بجانب أي سلعة في قائمة العروض الرئيسية، وسيقوم حكيم AI بإرسال إشعار فوري (Push) وبريد إلكتروني لك فور انخفاض سعرها للهدف المحدد!
          </p>
        </div>
      ) : (
        /* Alerts List */
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>السلع المراقبة ({alerts.length})</span>
            <span>التحكم في السعر المستهدف وخيارات التنبيه (Push & Email)</span>
          </div>

          {alerts.map((alert) => {
            const matchedProd = products.find((p) => p.id === alert.productId);
            const isTriggered = alert.currentLowestPrice <= alert.targetPrice || alert.triggered;
            const diff = Number((alert.currentLowestPrice - alert.targetPrice).toFixed(2));
            const savings = alert.previousPrice 
              ? Number((alert.previousPrice - alert.currentLowestPrice).toFixed(2))
              : Number((alert.targetPrice - alert.currentLowestPrice).toFixed(2));
            
            const isEmailActiveForThisAlert = alert.emailNotificationEnabled !== undefined 
              ? alert.emailNotificationEnabled 
              : globalEmailAlertsEnabled;

            return (
              <div
                key={alert.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl border p-4 sm:p-5 transition-all shadow-xs ${
                  isTriggered
                    ? 'border-emerald-500/70 dark:border-emerald-500/50 ring-1 ring-emerald-500/20 bg-gradient-to-r from-emerald-50/20 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-600/40'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Product Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <ProductImage src={alert.productImage} alt={alert.productName} size="md" />
                    
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {alert.productName}
                        </h3>

                        {isTriggered && (
                          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-pulse">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>وصل للسعر المستهدف!</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                          <StoreIcon className="w-3.5 h-3.5 text-amber-500" />
                          <span>{alert.storeName}</span>
                        </span>

                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-black">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>السعر الحالي: {alert.currentLowestPrice.toFixed(2)} ر.س</span>
                        </span>

                        {alert.previousPrice && (
                          <span className="line-through text-slate-400 text-[11px]">
                            كان: {alert.previousPrice.toFixed(2)} ر.س
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>تاريخ الإضافة: {alert.createdAt}</span>
                        </span>

                        {alert.lastNotifiedAt && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>تم إرسال إشعار: {alert.lastNotifiedAt}</span>
                          </span>
                        )}

                        {/* مؤشر تفعيل تنبيه البريد الإلكتروني الخاص بالسلعة */}
                        <button
                          type="button"
                          onClick={() => handleToggleAlertEmail(alert.id)}
                          className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer border ${
                            isEmailActiveForThisAlert
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                          title="تفعيل أو إلغاء إرسال إيميل عند هبوط سعر هذه السلعة"
                        >
                          <Mail className="w-3 h-3" />
                          <span>{isEmailActiveForThisAlert ? 'تنبيه الإيميل مفعل' : 'إيميل معطل'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Target Price Control & Actions */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                    
                    {/* Target Price Adjuster */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => handleAdjustTargetPrice(alert.id, -1)}
                        className="w-7 h-7 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center font-black transition-colors cursor-pointer shadow-2xs"
                        title="خفض السعر المستهدف (-1 ر.س)"
                      >
                        -
                      </button>

                      <div className="text-center px-2">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">السعر المستهدف</div>
                        <div className="text-xs font-black text-amber-600 dark:text-amber-400">
                          {alert.targetPrice.toFixed(2)} ر.س
                        </div>
                      </div>

                      <button
                        onClick={() => handleAdjustTargetPrice(alert.id, 1)}
                        className="w-7 h-7 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center font-black transition-colors cursor-pointer shadow-2xs"
                        title="رفع السعر المستهدف (+1 ر.س)"
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Cart button */}
                    {matchedProd && (
                      <button
                        onClick={() => onAddToCart(matchedProd)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>أضف للسلة</span>
                      </button>
                    )}

                    {/* Delete Alert Button */}
                    <button
                      onClick={() => onRemoveAlert(alert.id)}
                      className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                      title="حذف التنبيه"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5 font-bold">
                    {isTriggered ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>وصل للسعر المستهدف! التوفير الحالي: {Math.abs(savings) > 0 ? `${Math.abs(savings).toFixed(2)} ر.س` : 'ممتاز'}</span>
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>بانتظار هبوط السعر بمقدار {diff.toFixed(2)} ر.س للوصول للهدف المحدد</span>
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400">
                    رادار حكيم AI يفحص فروع {alert.storeName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
