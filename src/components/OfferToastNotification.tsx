import React, { useEffect } from 'react';
import { Sparkles, X, Check, ExternalLink, TicketPercent } from 'lucide-react';

export interface ToastData {
  title: string;
  message: string;
  type?: 'success' | 'info' | 'offer' | 'coupon';
  storeId?: string;
  storeName?: string;
  productName?: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface OfferToastNotificationProps {
  toast: ToastData | null;
  onClose: () => void;
}

export const OfferToastNotification: React.FC<OfferToastNotificationProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div 
      className="fixed bottom-20 left-4 sm:left-6 z-[120] max-w-sm w-full bg-slate-900/95 text-white p-4 rounded-2xl border border-emerald-500/40 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${
            toast.type === 'coupon' 
              ? 'bg-yellow-400/20 text-yellow-400' 
              : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {toast.type === 'coupon' ? <TicketPercent className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-black text-white">{toast.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toast.message}</p>
            {toast.storeName && (
              <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800">
                {toast.storeName}
              </span>
            )}
            {toast.actionUrl && (
              <a
                href={toast.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-400 font-bold hover:underline"
              >
                <span>الانتقال للعرض</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
