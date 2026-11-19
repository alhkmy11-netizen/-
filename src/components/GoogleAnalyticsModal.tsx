import React, { useState, useEffect } from 'react';
import { 
  X, 
  BarChart3, 
  Check, 
  ShieldCheck, 
  Activity, 
  Send, 
  ExternalLink, 
  Sparkles, 
  Copy, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { 
  initGA, 
  getActiveMeasurementId, 
  setActiveMeasurementId, 
  trackEvent, 
  getRecentEvents, 
  AnalyticsEvent 
} from '../utils/analytics';

interface GoogleAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleAnalyticsModal: React.FC<GoogleAnalyticsModalProps> = ({ isOpen, onClose }) => {
  const [gaId, setGaId] = useState(getActiveMeasurementId());
  const [isEnabled, setIsEnabled] = useState(true);
  const [saved, setSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([]);

  useEffect(() => {
    if (isOpen) {
      setGaId(getActiveMeasurementId());
      setRecentEvents(getRecentEvents());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (gaId.trim()) {
      setActiveMeasurementId(gaId.trim());
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 1500);
    }
  };

  const handleSendTestEvent = () => {
    const testPayload = {
      test_source: 'hkeeem_ai_admin',
      platform: 'web',
      timestamp: new Date().toISOString(),
    };
    trackEvent('hkeeem_test_ping', testPayload);
    setTestSent(true);
    setRecentEvents(getRecentEvents());
    setTimeout(() => setTestSent(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  ربط تحليلات Google Analytics 4
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>متصل ونشط</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">تتبع أداء الزيارات، عمليات المقارنة، والطلبات لحظياً</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Measurement ID Config */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-750">
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
              معرف قياس Google Analytics (Measurement ID):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={gaId}
                onChange={(e) => setGaId(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                placeholder="G-XXXXXXXXXX"
              />
              <button
                onClick={handleSave}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                {saved ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                <span>{saved ? 'تم الحفظ!' : 'حفظ'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              يمكنك وضع معرف قياس حسابك الخاص في GA4 (يبدأ بحرف G-) أو استخدام المعرف المعتمد الافتراضي.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-750">
            <button
              onClick={handleSendTestEvent}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                testSent
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {testSent ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5 text-amber-500" />}
              <span>{testSent ? 'تم إرسال الحدث بنجاح!' : 'إرسال حدث تجريبي (Ping)'}</span>
            </button>

            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <span>فتح لوحة Google Analytics</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Live Tracked Events Stream */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>سجل الأحداث المباشرة (Live Stream):</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-bold">
              {recentEvents.length} حدث مسجل
            </span>
          </div>

          <div className="bg-slate-900 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-1.5 font-mono text-[11px] text-slate-300 border border-slate-800 scrollbar-thin">
            {recentEvents.length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-xs">
                لا توجد أحداث حتى الآن. تصفح الموقع أو أرسل حدثاً تجريبياً.
              </div>
            ) : (
              recentEvents.map((ev, index) => (
                <div key={index} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/60 border border-slate-750/60">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-300 truncate">{ev.event}</span>
                    {ev.params && Object.keys(ev.params).length > 0 && (
                      <span className="text-slate-400 text-[10px] truncate">
                        ({Object.keys(ev.params).slice(0, 2).map((k) => `${k}: ${ev.params?.[k]}`).join(', ')})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0 mr-2">{ev.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">
            مفعل لـ: <strong className="font-mono text-slate-700 dark:text-slate-300">{gaId}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs rounded-xl shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
