import React, { useState, useId } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { CartItem, Store } from '../types';
import { trackEvent } from '../utils/analytics';
import {
  Share2,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Send,
  Download,
  Sparkles,
  X,
  ShoppingBag,
  Smartphone,
  FileText,
  Layers,
  ArrowRight,
  TrendingDown,
  CheckCheck,
} from 'lucide-react';

interface ShareCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  stores: Store[];
  optimizationMode: 'single' | 'split';
  totalAmount: number;
  savingsAmount: number;
  selectedStoreName?: string;
}

export function generateCartDeepLink(cart: CartItem[], mode: 'single' | 'split' = 'split'): string {
  try {
    const payload = {
      v: 1,
      mode,
      items: cart.map((i) => ({ id: i.product.id, q: i.quantity })),
      createdAt: Date.now(),
    };
    const jsonStr = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(jsonStr);
    let binaryStr = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryStr += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binaryStr);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    return `${origin}${pathname}?shared_cart=${encodeURIComponent(base64)}`;
  } catch (err) {
    console.error('Error generating cart deep link', err);
    return typeof window !== 'undefined' ? window.location.href : '';
  }
}

export const ShareCartModal: React.FC<ShareCartModalProps> = ({
  isOpen,
  onClose,
  cart,
  optimizationMode,
  totalAmount,
  savingsAmount,
  selectedStoreName,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'qr' | 'checklist'>('link');
  const [isCopied, setIsCopied] = useState(false);
  const [isChecklistCopied, setIsChecklistCopied] = useState(false);

  const canvasId = useId();

  if (!isOpen) return null;

  const deepLinkUrl = generateCartDeepLink(cart, optimizationMode);
  const totalItemsCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  // Formatted WhatsApp message
  const whatsappMessage =
    `🛒 *سلة مقاضي موفرة من تطبيق حكيم (Hkeeem)* 🇸🇦\n\n` +
    `قمت بمقارنة وتحسين سلة التسوق الخاصة بي وحصلت على توفير بقيمة *${savingsAmount.toFixed(2)} ر.س*:\n\n` +
    cart
      .map(
        (item, idx) =>
          `▫️ ${idx + 1}. ${item.product.nameAr} × ${item.quantity} (${item.product.unit})`
      )
      .join('\n') +
    `\n\n💰 *المجموع النهائي:* ${totalAmount.toFixed(2)} ر.س` +
    `\n⚡ *استراتيجية الشراء:* ${
      optimizationMode === 'split' ? 'تقسيم السلة الذكي (الأوفر)' : selectedStoreName || 'متجر موحد'
    }` +
    `\n\n🔗 *افتح واستعرض السلة مباشرة في تطبيق حكيم:* \n${deepLinkUrl}`;

  // Formatted Text Checklist for easy SMS / Notes sharing
  const formattedChecklist =
    `📋 قائمة مقاضي حكيم الذكية:\n` +
    cart
      .map(
        (item, idx) =>
          `[ ] ${item.product.nameAr} - الكمية: ${item.quantity} (${item.product.unit})`
      )
      .join('\n') +
    `\n\nالمجموع المقدر: ${totalAmount.toFixed(2)} ر.س (توفير: ${savingsAmount.toFixed(2)} ر.س)\nرابط السلة: ${deepLinkUrl}`;

  // Copy Deep Link
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(deepLinkUrl);
      setIsCopied(true);
      trackEvent('share_cart_copy_link', {
        item_count: cart.length,
        total_amount: totalAmount,
        savings_amount: savingsAmount,
      });
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // Copy Checklist Text
  const handleCopyChecklist = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(formattedChecklist);
      setIsChecklistCopied(true);
      trackEvent('share_cart_checklist', {
        item_count: cart.length,
      });
      setTimeout(() => setIsChecklistCopied(false), 2500);
    }
  };

  // Native Web Share
  const handleNativeShare = async () => {
    trackEvent('share_cart_native', {
      item_count: cart.length,
      total_amount: totalAmount,
    });
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'سلة مقاضي ذكية وموفرة - تطبيق حكيم',
          text: `تفضل سلة تسوق موفرة مع توفير ${savingsAmount.toFixed(2)} ر.س عبر حكيم:`,
          url: deepLinkUrl,
        });
      } catch {
        // User dismissed
      }
    } else {
      handleCopyLink();
    }
  };

  // Download QR Code Canvas as PNG
  const handleDownloadQr = () => {
    trackEvent('share_cart_download_qr', {
      item_count: cart.length,
    });
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `hkeeem-shared-cart-${Date.now()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      dir="rtl"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 left-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black mb-2 shadow-xs">
            <Share2 className="w-3.5 h-3.5" />
            <span>مشاركة السلة الذكية • Deep Link & QR</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black">شارك سلة المقاضي والتوفير</h2>
          <p className="text-xs text-emerald-100/90 mt-1">
            أرسل قائمتك المحسوبة لعائلتك أو أصدقائك عبر الواتساب أو رمز QR لفتحها مباشرة.
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-300" />
              <span>{cart.length} سلع ({totalItemsCount} قطعة)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-200">
                المجموع: <span className="text-white font-black">{totalAmount.toFixed(2)} ر.س</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-black">
                وفرت {savingsAmount.toFixed(2)} ر.س
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-1.5">
          <button
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'link'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>رابط المشاركة السريعة</span>
          </button>

          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>رمز الاستجابة (QR Code)</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'checklist'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>قائمة نصية</span>
          </button>
        </div>

        {/* Tab 1: Deep Link & Social Networks */}
        {activeTab === 'link' && (
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
            {/* Direct Deep Link Field */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>الرابط المباشر للسلة (Deep Link):</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  يفتح السلة فورا دون تسجيل
                </span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={deepLinkUrl}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-xs font-mono select-all focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>نسخ الرابط</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Social Share Buttons Grid */}
            <div className="space-y-2.5">
              <div className="text-xs font-black text-slate-800 dark:text-slate-200">
                شارك مباشرة عبر تطبيقات التواصل:
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xs">واتساب (WhatsApp)</div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400">إرسال القائمة كاملة</div>
                  </div>
                </a>

                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(deepLinkUrl)}&text=${encodeURIComponent(
                    `سلة مقاضي موفرة من تطبيق حكيم 🛒 (وفرت ${savingsAmount.toFixed(0)} ر.س):`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-sky-50 hover:bg-sky-100/80 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 border border-sky-300 dark:border-sky-800/60 text-sky-900 dark:text-sky-200 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Send className="w-5 h-5 -translate-x-0.5" />
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xs">تيليجرام (Telegram)</div>
                    <div className="text-[10px] text-sky-700 dark:text-sky-400">مشاركة سريعة</div>
                  </div>
                </a>

                {/* Twitter / X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `قارنت سلة مقاضي اليوم عبر تطبيق حكيم الذكي 🛒✨ ووفرت ${savingsAmount.toFixed(0)} ر.س على نفس السلع من كبرى المتاجر!`
                  )}&url=${encodeURIComponent(deepLinkUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-center shrink-0 shadow-xs font-black text-sm">
                    𝕏
                  </div>
                  <div className="text-right">
                    <div className="font-black text-xs">منصة إكس (X)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">تغريد بالتوفير</div>
                  </div>
                </a>

                {/* Native Device Share */}
                <button
                  onClick={handleNativeShare}
                  className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex items-center gap-3 transition-colors text-right cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-black">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-xs">مشاركة الجوال</div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400">AirDrop، رسائل...</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>ماذا يحدث عندما يفتح الطرف الآخر الرابط؟</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                ستُفتح السلة مباشرة في متصفح صديقك مع نفس السلع والكميات مع المقارنة بين المتاجر وإجمالي التوفير، ويمكنه بنقرة واحدة إكمال الطلب أو التعديل عليه.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Full-Resolution QR Code */}
        {activeTab === 'qr' && (
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto text-center flex flex-col items-center">
            <div className="p-4 rounded-3xl bg-white border-2 border-emerald-500/30 shadow-lg inline-block">
              {/* Visible SVG QR Code */}
              <QRCodeSVG
                value={deepLinkUrl}
                size={220}
                level="M"
                includeMargin={true}
                fgColor="#047857"
                bgColor="#ffffff"
              />

              {/* Hidden Canvas used for clean PNG export */}
              <div style={{ display: 'none' }}>
                <QRCodeCanvas
                  id={canvasId}
                  value={deepLinkUrl}
                  size={480}
                  level="H"
                  includeMargin={true}
                  fgColor="#047857"
                  bgColor="#ffffff"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="font-black text-sm text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>امسح الباركود بكاميرا الجوال</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                وجّه كاميرا أي هاتف ذكي لمسح الرمز وفتح سلة التسوق المحسوبة فوراً.
              </p>
            </div>

            {/* QR Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                onClick={handleDownloadQr}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-emerald-700 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-300" />
                <span>تحميل كصورة (PNG)</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>تم نسخ الرابط</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>نسخ رابط الـ QR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Text Checklist */}
        {activeTab === 'checklist' && (
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                قائمة المقاضي النصية المنسقة:
              </label>
              <button
                onClick={handleCopyChecklist}
                className="text-xs font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                {isChecklistCopied ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تم النسخ إلى الحافظة!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ القائمة النصية كاملة</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto select-all">
              {formattedChecklist}
            </div>

            <button
              onClick={handleCopyChecklist}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {isChecklistCopied ? (
                <>
                  <CheckCheck className="w-4 h-4" />
                  <span>تم نسخ القائمة النصية!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ القائمة للملاحظات أو الرسائل</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            تطبيق حكيم • وفر ذكياً وشارك عائلتك
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
