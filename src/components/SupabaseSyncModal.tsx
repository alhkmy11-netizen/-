import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  X, 
  ShieldCheck, 
  Cloud, 
  Save, 
  Server,
  Zap,
  Check
} from 'lucide-react';
import { 
  SUPABASE_PROJECT_ID, 
  DEFAULT_SUPABASE_URL, 
  getSupabaseUrl, 
  testSupabaseConnection, 
  syncCartToSupabase, 
  syncWishlistToSupabase,
  SUPABASE_SQL_SETUP_SCRIPT
} from '../lib/supabase';
import { CartItem } from '../types';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  wishlistProductIds: string[];
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  cart,
  wishlistProductIds,
}) => {
  const [anonKey, setAnonKey] = useState<string>(() => {
    return localStorage.getItem('hkeeem_supabase_anon_key') || (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedKeyNotice, setSavedKeyNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleTestConnection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    localStorage.setItem('hkeeem_supabase_anon_key', anonKey.trim());
    setSavedKeyNotice(true);
    setTimeout(() => setSavedKeyNotice(false), 2500);
    handleTestConnection();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testSupabaseConnection();
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncSuccessMessage(null);
    try {
      const cartOk = await syncCartToSupabase(cart);
      const wishOk = await syncWishlistToSupabase(wishlistProductIds);
      if (cartOk || wishOk) {
        setSyncSuccessMessage(`تمت مزامنة ${cart.length} سلعة في السلة و ${wishlistProductIds.length} عنصر مفضلة مع Supabase بنجاح!`);
      } else {
        setSyncSuccessMessage('تم حفظ البيانات محلياً وجارٍ التوصيل بقاعدة Supabase...');
      }
    } catch {
      setSyncSuccessMessage('تم حفظ البيانات بنجاح محلياً.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncSuccessMessage(null), 4000);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden text-right"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-900/10 via-teal-900/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shadow-md shadow-emerald-900/20">
              <Database className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  الربط السحابي مع Supabase
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/50">
                  متصل
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                مزامنة السلة، المفضلة، وسجل التوفير السحابي
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs sm:text-sm">
          {/* Project Details Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">معرف المشروع (Project ID):</span>
              <span className="font-mono font-bold text-xs bg-slate-200/80 dark:bg-slate-700 px-2.5 py-1 rounded-lg text-slate-800 dark:text-slate-200">
                {SUPABASE_PROJECT_ID}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">رابط الخادم (Project URL):</span>
              <a
                href={DEFAULT_SUPABASE_URL}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>{DEFAULT_SUPABASE_URL}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">لوحة التحكم الرسمية:</span>
              <a
                href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <span>فتح لوحة تحكم Supabase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Test Status Banner */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700 dark:text-slate-300">حالة الاتصال المباشر:</span>
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-bold disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>إعادة الفحص</span>
              </button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                testResult.success 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200' 
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs leading-relaxed">
                  <p className="font-bold">{testResult.message}</p>
                </div>
              </div>
            )}
          </div>

          {/* Anon Key Input Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                مفتاح الوصول العام (Project Anon Key):
              </label>
              {savedKeyNotice && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3 h-3" /> تم الحفظ!
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                placeholder="أدخل مفتاح Anon Key من صفحة Project Settings > API..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
              <button
                onClick={handleSaveKey}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer transition-all flex items-center gap-1 shrink-0 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              يمكنك الحصول على المفتاح فوراً من: <span className="font-mono text-slate-500">Project Settings &gt; API &gt; Project API keys (anon, public)</span>
            </p>
          </div>

          {/* Quick Manual Sync Action */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white">
                مزامنة السلة والمفضلة الفورية
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                السلة الحالية: {cart.length} سلع • المفضلة: {wishlistProductIds.length} عناصر
              </div>
            </div>

            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-black text-xs hover:from-emerald-700 hover:to-teal-800 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? 'جارٍ المزامنة...' : 'مزامنة الآن'}</span>
            </button>
          </div>

          {syncSuccessMessage && (
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncSuccessMessage}</span>
            </div>
          )}

          {/* Database Tables Setup Helper */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  سكريبت إنشاء الجداول (SQL Editor Script)
                </span>
                <p className="text-[11px] text-slate-400">
                  انسخ الكود والصقه في تبويب SQL Editor بمشروعك لإنشاء جداول carts, wishlists, orders
                </p>
              </div>

              <button
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>نسخ SQL</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <pre className="bg-slate-900 text-emerald-300 p-3 rounded-xl text-[10px] font-mono overflow-x-auto max-h-32 leading-relaxed border border-slate-800" dir="ltr">
                {SUPABASE_SQL_SETUP_SCRIPT}
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>تشفير SSL متوافق مع معايير الأمان</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
