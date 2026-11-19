import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Lock, 
  AlertTriangle, 
  X, 
  CheckCircle, 
  Scale, 
  Sparkles, 
  Building2, 
  ExternalLink 
} from 'lucide-react';

export type LegalTab = 'disclaimer' | 'terms' | 'privacy';

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'disclaimer',
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 transition-colors"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shadow-md">
              <Scale className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  الميثاق القانوني والشفافية التنظيمية
                </h2>
                <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300/60 dark:border-emerald-700/60">
                  نطاق alhkmy.store
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                وفقاً لأنظمة التجارة الإلكترونية ونظام حماية البيانات الشخصية (PDPL) في المملكة العربية السعودية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/90 px-4 sm:px-6 gap-2">
          <button
            onClick={() => setActiveTab('disclaimer')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'disclaimer'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>إخلاء المسؤولية والتسويق بالعمولة</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'terms'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>الشروط والأحكام</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 rounded-t-xl'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4 text-emerald-500" />
            <span>سياسة الخصوصية (PDPL)</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          
          {/* TAB 1: Disclaimer & Affiliate Disclosure */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300/70 dark:border-amber-700/50 rounded-2xl p-4.5 text-amber-950 dark:text-amber-200">
                <div className="flex items-center gap-2 font-black text-sm mb-1 text-amber-900 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>تنويه قانوني جوهري: طبيعة عمل منصة حكيم AI (alhkmy.store)</span>
                </div>
                <p className="text-xs leading-relaxed">
                  منصة «حكيم AI» هي محرك بحث تقني وأداة ذكاء اصطناعي مخصصة للمقارنة وتحليل الأسعار وجمع بيانات العروض العامة. المنصة <strong>ليست متجراً إلكترونياً بائعاً</strong>، ولا تملك المنتجات المعروضة ولا تقدم خدمات الشحن المباشر أو الفوترة المالية للسلع الاستهلاكية.
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  1. مسؤولية الأسعار والعروض والكوبونات
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  تُجلب بيانات الأسعار والعروض الترويجية وأكواد الخصم آلياً من نشرات ومواقع المتاجر والأسواق المركزية المعلنة (مثل بنده، العثيم، الدانوب، كارفور، لولو، نون، أمازون). على الرغم من سعينا الدؤوب لضمان دقة وتحديث الأسعار عبر خوارزميات الفحص المستمر:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 pr-2">
                  <li>قد تقوم المتاجر بتغيير أسعار المنتجات أو إنهاء العروض الترويجية أو سحب الكوبونات في أي لحظة دون إشعار مسبق.</li>
                  <li>السعر النهائي المعتمد والملزم قانوناً للمستهلك هو السعر المسجل على صندوق المحاسبة (POS) بالفرع أو صفحة الدفع النهائية في التطبيق/المتجر البائع.</li>
                  <li>تخلي المنصة وإدارتها مسؤوليتها الكاملة عن أي تباين سعري، أو نفاد كميات، أو عيوب تصنيعية في المنتجات المشتراة من المتاجر المعنية.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  2. الإفصاح عن الشراكات التسويقية بالعمولة (Affiliate Disclosure)
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  التزاماً بمبادئ الشفافية وحماية المستهلك وأحكام نظام التجارة الإلكترونية السعودي:
                </p>
                <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <p>
                    تعلن المنصة بوضوح أنها قد تشارك في برامج تسويق بالعمولة (Affiliate Marketing Programs) مع عدد من المتاجر الإلكترونية وتطبيقات التوصيل.
                  </p>
                  <p>
                    عند نقرك على بعض روابط الكوبونات أو العروض والشراء من خلالها، <strong>قد تتلقى منصة حكيم AI عمولة إحالة تسويقية رمزية من المتجر التابع</strong> دون أن يترتب على ذلك أي كلفة إضافية أو زيادة في السعر على المتسوق مطلقاً، بل يحصل المتسوق على كامل الخصم المعلن.
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-400 font-bold">
                    تُستثمر هذه العائدات بالكامل في تشغيل خوادم الذكاء الاصطناعي وتطوير الأدوات المجانية للمستخدمين.
                  </p>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  3. العلاقات التعاقدية وحل النزاعات
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  أي معاملة شراء أو توصيل أو استرجاع أو استبدال تتم بين المستخدم والمتجر المستهدف تخضع كلياً لشروط وأحكام وسياسات المتجر البائع، وتختص وزارة التجارة وهيئة حماية المستهلك بالمملكة العربية السعودية بالرقابة عليها وفق الأنظمة السارية.
                </p>
              </section>
            </div>
          )}

          {/* TAB 2: Terms of Service */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <section className="space-y-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  1. القبول والامتثال
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  يمثل دخولك أو استخدامك لموقع وتطبيقات «حكيم AI» (alhkmy.store) موافقة كاملة وصريحة غير مشروطة على الالتزام بهذه الشروط والأحكام وجميع القوانين واللوائح المعمول بها في المملكة العربية السعودية. إذا كنت لا توافق على هذه الشروط، يُرجى الامتناع عن استخدام المنصة.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  2. الاستخدام المسموح وحقوق الملكية
                </h3>
                <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 pr-2">
                  <li>المنصة وأدوات مقارنة الأسعار ونماذج الذكاء الاصطناعي مخصصة للاستخدام الشخصي غير التجاري فقط.</li>
                  <li>يُحظر كلياً سحب البيانات آلياً (Web Scraping أو Bot Crawling) غير المصرح به، أو استنساخ البنية البرمجية لمنصة حكيم AI بدون إذن خطي مسبق.</li>
                  <li>العلامات التجارية والشعارات للمتاجر (بنده، العثيم، لولو، نون، إلخ) هي ملكية حصرية لأصحابها، واستخدامها في المنصة يأتي لغرض التعريف والإشارة المرجعية العادلة طبقاً للقانون.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  3. ضريبة القيمة المضافة والأسعار
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  تلتزم المنصة بعرض أسعار السلع الاستهلاكية بما يشمل ضريبة القيمة المضافة (15% VAT) المطبقة في المملكة العربية السعودية وفق ما هو معلن رسمياً في أنظمة المتاجر المرصودة.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  4. القانون الواجب التطبيق والاختصاص القضائي
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  تخضع هذه الشروط وتُفسر وفقاً للأنظمة واللوائح والقرارات الوزارية المعمول بها في المملكة العربية السعودية، وتختص المحاكم السعودية بمدينة الرياض بالنظر في أي نزاع قد ينشأ بخصوص هذا الموقع.
                </p>
              </section>
            </div>
          )}

          {/* TAB 3: Privacy Policy (PDPL Compliance) */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300/70 dark:border-emerald-700/50 rounded-2xl p-4.5 text-emerald-950 dark:text-emerald-200">
                <div className="flex items-center gap-2 font-black text-sm mb-1 text-emerald-900 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>الامتثال لنظام حماية البيانات الشخصية السعودي (PDPL)</span>
                </div>
                <p className="text-xs leading-relaxed">
                  تلتزم منصة حكيم AI (alhkmy.store) بأعلى معايير الحماية والخصوصية المنصوص عليها في نظام حماية البيانات الشخصية الصادر بالمرسوم الملكي رقم (م/19) وتعديلاته ولوائحه التنفيذية الصادرة عن الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا - SDAIA).
                </p>
              </div>

              <section className="space-y-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  1. البيانات التي نقوم بجمعها
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  نحن نؤمن بمبدأ تقليل جمع البيانات (Data Minimization)، حيث تقتصر البيانات على:
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-slate-600 dark:text-slate-400 pr-2">
                  <li><strong>البيانات التقنية وتفضيلات التصفح:</strong> المدينة المختارة (مثل الرياض، جدة)، وضع الشاشة (داكن/فاتح)، وقائمة التنبيهات المفضلة المخزنة محلياً في متصفحك (LocalStorage).</li>
                  <li><strong>بيانات البحث:</strong> الكلمات الدلالية أو الصور المرفوعة لتحليل الأسعار دون ربطها بهوية شخصية محددة.</li>
                  <li><strong>ملفات تعريف الارتباط (Cookies):</strong> ملفات تقنية أساسية لحفظ سلة المقاضي وتفضيلات النظام فقط.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  2. الغرض من معالجة البيانات
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  تُستخدم البيانات حصراً لتخصيص نتائج المقارنة للفروع القريبة منك، وحساب نسبة التوفير على سلة مقاضيك، وإرسال تنبيهات انخفاض الأسعار الفورية بعد موافقتك الصريحة. لا نقوم إطلاقاً ببيع أو تأجير أي بيانات لطرف ثالث.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  3. حقوق صاحب البيانات الشخصية بموجب النظام
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  وفقاً لنظام حماية البيانات الشخصية السعودي، يحق لك ممارسة الحقوق التالية في أي وقت:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white block mb-0.5">الحق في العلم:</strong>
                    معرفة المسوغ النظامي والغرض من جمع ومعالجة بياناتك.
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white block mb-0.5">الحق في الوصول:</strong>
                    الاطلاع على بياناتك المحفوظة وطلب نسخة مقروءة منها.
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white block mb-0.5">الحق في التصحيح والإتلاف:</strong>
                    تحديث بياناتك أو حذفها بالكامل ومسح سجل السلال والتنبيهات.
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                    <strong className="text-slate-900 dark:text-white block mb-0.5">الحق في الرجوع عن الموافقة:</strong>
                    إلغاء اشتراك الإشعارات الفورية أو تنبيهات الأسعار بضغطة زر.
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  4. مسؤول حماية البيانات والاتصال
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  لأي استفسار أو ممارسة حقوقك المتعلقة ببياناتك، يمكنك التواصل مع فريق الدعم القانوني والتقني عبر البريد الإلكتروني المعتمد:
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mr-2">privacy@alhkmy.store</span>
                </p>
              </section>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>وثيقة معتمدة ومحدثة لعام 2026 • حكيم AI</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold transition-all cursor-pointer shadow-xs"
          >
            فهمت وموافق على الشروط
          </button>
        </div>
      </div>
    </div>
  );
};
