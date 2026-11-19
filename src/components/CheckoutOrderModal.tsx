import React, { useState } from 'react';
import { Coupon } from '../types';
import { X, CheckCircle2, ShieldCheck, CreditCard, Sparkles, Truck, Lock, Wallet, Smartphone } from 'lucide-react';

interface CheckoutOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: {
    total: number;
    subtotal: number;
    savings: number;
    shipping: number;
    appliedCoupon?: Coupon;
    cashbackEarned?: number;
  };
  onOrderSuccess: (orderData: any) => void;
  userCity: string;
}

export const CheckoutOrderModal: React.FC<CheckoutOrderModalProps> = ({
  isOpen,
  onClose,
  summary,
  onOrderSuccess,
  userCity,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'apple_pay' | 'mada' | 'tamara' | 'card'>('apple_pay');
  const [fullName, setFullName] = useState('عبدالعزيز الحكمي');
  const [phone, setPhone] = useState('0551234567');
  const [district, setDistrict] = useState('حي الملقا');
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/checkout/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { fullName, phone, district, city: userCity },
          total: summary.total,
          subtotal: summary.subtotal,
          savings: summary.savings,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReceipt(data.receipt);
        onOrderSuccess(data.receipt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">تأكيد طلب السلة الأوفر</h3>
              <p className="text-[11px] text-emerald-200">دفع آمن ومحمي مع ضمان أقل سعر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {receipt ? (
          /* Receipt Success State */
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-3xl">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">تم اعتماد طلب مقاضيك بنجاح!</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                رقم الفاتورة: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{receipt.orderId}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-right space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>المستلم:</span>
                <span className="font-bold text-slate-900 dark:text-white">{receipt.customer.fullName} ({receipt.customer.phone})</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>العنوان:</span>
                <span className="font-bold text-slate-900 dark:text-white">{userCity} - {receipt.customer.district}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>المبلغ المدفوع:</span>
                <span className="font-black text-emerald-800 dark:text-emerald-300 text-sm">{receipt.total.toFixed(2)} ر.س</span>
              </div>
              {receipt.savings > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-extrabold pt-1 border-t border-emerald-200 dark:border-emerald-800">
                  <span>إجمالي ما وفرته:</span>
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>{receipt.savings.toFixed(2)} ر.س</span>
                  </span>
                </div>
              )}

              {summary.cashbackEarned && summary.cashbackEarned > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-300 font-extrabold pt-1 border-t border-amber-200 dark:border-amber-800">
                  <span>كاش باك فوري أضيف لمحفظتك:</span>
                  <span className="font-mono font-black">+{summary.cashbackEarned.toFixed(2)} ر.س</span>
                </div>
              )}
            </div>

            {/* Live Order Tracking Timeline */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-right space-y-2">
              <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 block">
                تتبع حالة الطلب الفوري:
              </span>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم الدفع</span>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>جارٍ التجهيز</span>
                </span>
                <span>توصيل سريع</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              تم، العودة للصفحة الرئيسية
            </button>
          </div>
        ) : (
          /* Checkout Form */
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Delivery Details */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>بيانات التوصيل السريع ({userCity}):</span>
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">الاسم الكامل:</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-850 dark:text-white text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">رقم الجوال:</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-850 dark:text-white text-xs focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">الحي السكني والشارع:</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-850 dark:text-white text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300">طريقة الدفع المعتمدة:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'apple_pay'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Apple Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('mada')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'mada'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>بطاقة مدى (Mada)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('tamara')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'tamara'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>تمارا (4 دفعات)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    paymentMethod === 'card'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>فيزا / ماستركارد</span>
                </button>
              </div>
            </div>

            {/* Total Price Box */}
            <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400">المبلغ الإجمالي للدفع:</span>
                <div className="text-base font-black text-emerald-800 dark:text-emerald-300">{summary.total.toFixed(2)} ر.س</div>
              </div>
              <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-extrabold bg-emerald-100 dark:bg-emerald-950 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                وفرت {summary.savings.toFixed(2)} ر.س
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 disabled:bg-slate-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{loading ? 'جاري التحقق والدفع الآمن...' : `تأكيد الدفع المباشر (${summary.total.toFixed(2)} ر.س)`}</span>
            </button>

            <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 pt-1 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>معتمد وموثق عبر متجر حكيم الذكي <strong>alhkmy.store</strong> • كود <strong>570C</strong></span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
