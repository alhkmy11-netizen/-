import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { 
  Camera, 
  UploadCloud, 
  Sparkles, 
  TrendingDown, 
  CheckCircle2, 
  ShoppingCart, 
  ArrowRight, 
  RefreshCw, 
  FileText, 
  Layers,
  Receipt,
  Milk,
  Wheat,
  Search
} from 'lucide-react';

interface VisionResult {
  detectedItem: string;
  category: string;
  confidence: number;
  lowestPriceSar: number;
  lowestStore: string;
  storeComparisons: {
    storeName: string;
    price: number;
    isPromo?: boolean;
    notes?: string;
  }[];
  savingAdvice: string;
  healthyAlternative?: string;
}

interface VisionSearchViewProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  onGoToCart: () => void;
}

export const VisionSearchView: React.FC<VisionSearchViewProps> = ({
  products,
  onAddToCart,
  onGoToCart,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sample quick test presets
  const sampleScans = [
    {
      title: 'حليب المراعي طازج (2 لتر)',
      icon: Milk,
      mockResult: {
        detectedItem: 'حليب المراعي كامل الدسم (2 لتر)',
        category: 'ألبان وأجبان',
        confidence: 97,
        lowestPriceSar: 11.0,
        lowestStore: 'أسواق عبد الله العثيم',
        storeComparisons: [
          { storeName: 'أسواق العثيم', price: 11.0, isPromo: true, notes: 'عرض مهرجان الطازج' },
          { storeName: 'كارفور السعودية', price: 11.5, isPromo: false },
          { storeName: 'هايبر بنده', price: 12.0, isPromo: true },
          { storeName: 'الدانوب', price: 13.0, isPromo: false },
          { storeName: 'لولو هايبرماركت', price: 11.75, isPromo: false },
        ],
        savingAdvice: 'وفّر ريالين بشراء الحليب من العثيم أو كارفور بدلاً من الدانوب.',
        healthyAlternative: 'حليب المراعي قليل الدسم (2 لتر) - دهون أقل بنسبة 50% بنفس السعر.',
      },
    },
    {
      title: 'أرز الشعلان سيلا بنجابي (5 كجم)',
      icon: Wheat,
      mockResult: {
        detectedItem: 'أرز الشعلان سيلا بسمتي بنجابي (5 كجم)',
        category: 'مؤن وحبوب',
        confidence: 95,
        lowestPriceSar: 37.5,
        lowestStore: 'أسواق عبد الله العثيم',
        storeComparisons: [
          { storeName: 'أسواق العثيم', price: 37.5, isPromo: true, notes: 'سعر ترويجي مخفض' },
          { storeName: 'لولو هايبرماركت', price: 38.5, isPromo: true },
          { storeName: 'أمازون السعودية', price: 39.0, isPromo: false },
          { storeName: 'كارفور', price: 40.0, isPromo: false },
          { storeName: 'بنده', price: 42.0, isPromo: false },
          { storeName: 'الدانوب', price: 45.0, isPromo: false },
        ],
        savingAdvice: 'أرز الشعلان بالعثيم يوفر لك 7.5 ريال كاملة مقارنة بالدانوب و 4.5 ريال مقارنة ببنده.',
        healthyAlternative: 'أرز بني الشعلان كامل الحبة - ألياف أعلى واستقرار أفضل لسكر الدم.',
      },
    },
    {
      title: 'فاتورة مقاضي سوبرماركت',
      icon: Receipt,
      mockResult: {
        detectedItem: 'فاتورة مشتريات سوبرماركت (مؤن وألبان)',
        category: 'فاتورة مشتريات شهرية',
        confidence: 94,
        lowestPriceSar: 122.5,
        lowestStore: 'سلة هجينة (العثيم + كارفور)',
        storeComparisons: [
          { storeName: 'تقسيم السلة الذكي (حكيم)', price: 122.5, isPromo: true, notes: 'أقصى توفير ممكن' },
          { storeName: 'أسواق العثيم', price: 131.0, isPromo: false },
          { storeName: 'هايبر بنده', price: 138.5, isPromo: false },
          { storeName: 'كارفور', price: 136.0, isPromo: false },
          { storeName: 'الدانوب', price: 154.0, isPromo: false },
        ],
        savingAdvice: 'بإمكانك خفض قيمة هذه الفاتورة بمقدار 31.5 ريال عبر تفعيل ميزة تقسيم السلة بين العثيم وبنده.',
        healthyAlternative: 'استبدال الزيوت النباتية المهدرجة بزيت ذرة أو زيت كانولا محلي الصنع.',
      },
    },
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      analyzeImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (base64: string, mimeType: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/gemini/vision-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      if (!res.ok) throw new Error('فشل فحص الصورة بواسطة الذكاء الاصطناعي');
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('تعذر تحليل الصورة بالكامل، تم عرض بيانات المقارنة القياسية.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSample = (sample: typeof sampleScans[0]) => {
    setImagePreview(null);
    setResult(sample.mockResult);
  };

  const handleAddMatchedToCart = () => {
    if (!result) return;
    // Find closest product in catalog
    const matched = products.find(
      (p) =>
        result.detectedItem.includes(p.nameAr) ||
        p.nameAr.includes(result.detectedItem) ||
        result.detectedItem.toLowerCase().includes(p.nameEn.toLowerCase())
    ) || products[0];

    onAddToCart(matched);
    onGoToCart();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-xl bg-slate-950 text-amber-400 font-black">
            <Camera className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold">البحث بالصور وفواتير المقاضي (Vision AI)</h1>
        </div>
        <p className="text-sm text-amber-100 max-w-2xl leading-relaxed">
          التقط صورة لعلبة المنتج، الباركود، أو فاتورة سوبرماركت ورقية؛ وسيقوم الذكاء الاصطناعي بالتعرف الفوري على السلعة ومقارنة أسعارها في كافة المتاجر السعودية.
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 hover:border-amber-500 transition-colors p-8 text-center space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div>
          <h3 className="font-extrabold text-base text-slate-900">
            ارفع صورة السلعة أو الفاتورة لمطابقة الأسعار
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            يدعم صور الجوال، الكاميرا المباشرة، لقطات الشاشة وفواتير الكاشير (PNG, JPG, WEBP)
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-sm"
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span>اختر صورة أو التقط بالكاميرا</span>
          </button>
        </div>

        {/* Sample Quick Try Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-bold text-slate-400 mb-2">أو جرّب نماذج فحص فورية جاهزة:</div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {sampleScans.map((s, idx) => {
              const IconComp = s.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(s)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-slate-700 dark:text-slate-200 hover:text-amber-900 dark:hover:text-amber-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 border border-slate-200/80 dark:border-slate-750"
                >
                  <IconComp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
          <div className="font-bold text-sm text-slate-800 dark:text-white">جاري قراءة الصورة ومطابقتها بمؤشر أسعار المتاجر السعودية...</div>
          <p className="text-xs text-slate-500 dark:text-slate-400">نفحص أسعار بنده، العثيم، كارفور، الدانوب، ولولو بالذكاء الاصطناعي</p>
        </div>
      )}

      {/* Results View */}
      {result && !loading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
          {/* Top Result Card */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 flex items-center justify-center shrink-0 shadow-inner">
                <Search className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    دقة التعرف {result.confidence}%
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{result.category}</span>
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  {result.detectedItem}
                </h2>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  تمت مطابقة أسعار المنتج في الأسواق السعودية الكبرى
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-right">
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 justify-end">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>أقل سعر متوفر في: {result.lowestStore}</span>
              </div>
              <div className="text-xl font-black text-emerald-900 dark:text-emerald-200 mt-0.5">
                {result.lowestPriceSar.toFixed(2)} <span className="text-xs font-bold">ر.س</span>
              </div>
            </div>
          </div>

          {/* Saving Advice Box */}
          <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-xs sm:text-sm text-amber-950 dark:text-amber-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold">نصيحة حكيم AI الذكية: </span>
              <span>{result.savingAdvice}</span>
              {result.healthyAlternative && (
                <div className="mt-1 pt-1 border-t border-amber-200/60 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300">
                  <span className="font-bold">بديل صحي موصى به: </span>
                  <span>{result.healthyAlternative}</span>
                </div>
              )}
            </div>
          </div>

          {/* Comparison Matrix Table */}
          <div className="space-y-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              مقارنة سعر هذه السلعة بين المتاجر:
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              {result.storeComparisons.map((row, idx) => {
                const isLowest = row.price === result.lowestPriceSar;
                return (
                  <div
                    key={idx}
                    className={`p-3 flex items-center justify-between text-xs sm:text-sm ${
                      isLowest ? 'bg-emerald-50/70 dark:bg-emerald-950/40 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white">{row.storeName}</span>
                      {row.isPromo && (
                        <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded">
                          عرض ترويجي
                        </span>
                      )}
                      {row.notes && (
                        <span className="text-[11px] text-slate-400">({row.notes})</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={isLowest ? 'font-black text-emerald-800 dark:text-emerald-300 text-base' : 'font-bold text-slate-800 dark:text-slate-200'}>
                        {row.price.toFixed(2)} ر.س
                      </span>
                      {isLowest && (
                        <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                          الخيار الأوفر
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button: Add to Cart */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              onClick={handleAddMatchedToCart}
              className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>أضف السلعة الأرخص إلى سلة المشتريات</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
