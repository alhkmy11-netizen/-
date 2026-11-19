import React, { useState } from 'react';
import { NavigationTab } from '../types';
import { Store, ShieldCheck, Heart, Sparkles, Bot, Phone, Mail, Scale, FileText, Lock, AlertTriangle, BarChart3, Radio, Zap } from 'lucide-react';
import { LegalNoticeModal, LegalTab } from './LegalNoticeModal';
import { GoogleAnalyticsModal } from './GoogleAnalyticsModal';
import { AppSettingsModal } from './AppSettingsModal';
import { getActiveMeasurementId } from '../utils/analytics';

interface HkeeemFooterProps {
  onSelectTab: (tab: NavigationTab) => void;
}

export const HkeeemFooter: React.FC<HkeeemFooterProps> = ({ onSelectTab }) => {
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('disclaimer');
  const [isGaModalOpen, setIsGaModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const openLegal = (tab: LegalTab) => {
    setLegalTab(tab);
    setLegalModalOpen(true);
  };

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs mt-16 transition-colors pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-black">
                <Store className="w-4 h-4 text-amber-300" />
              </div>
              <span className="font-extrabold text-lg text-white">حكيم AI</span>
              <span className="text-[10px] font-bold bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded">
                alhkmy.store
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              المنصة السعودية الذكية الأولى المتخصصة في رصد وتحديث أسعار السلع الاستهلاكية، مقارنة عروض الأسواق المركزية الكبرى وتوفير ميزانية الأسرة بأحدث نماذج الذكاء الاصطناعي.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>مطابق للائحة التجارة الإلكترونية وضريبة القيمة المضافة 15%</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-sm">أقسام المنصة</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <button onClick={() => onSelectTab('alhkmy-store')} className="hover:text-emerald-400 transition-colors cursor-pointer text-emerald-300 font-bold flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-emerald-400" />
                  <span>متجر حكيم الذكي (alhkmy.store)</span>
                  <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1 rounded">570C</span>
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('home')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  عروض الهايبرماركت الأسبوعية
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('quicklist')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  القائمة السريعة للمقاضي
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('image-search')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  البحث الذكي بالصور والفواتير
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('matrix')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  جدول مقارن الأسعار الشامل
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('coupons')} className="hover:text-emerald-400 transition-colors cursor-pointer">
                  أكواد الخصم والكوبونات النشطة
                </button>
              </li>
              <li>
                <button onClick={() => onSelectTab('ai-tools')} className="hover:text-amber-400 transition-colors cursor-pointer text-amber-300/90 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>أدوات الذكاء الاصطناعي</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Regulatory Compliance */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-sm">الميثاق القانوني والشفافية</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button 
                  onClick={() => openLegal('disclaimer')} 
                  className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1.5 text-right"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>إخلاء المسؤولية والتسويق بالعمولة</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => openLegal('terms')} 
                  className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5 text-right"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>الشروط والأحكام العامة</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => openLegal('privacy')} 
                  className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5 text-right"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>سياسة الخصوصية وحماية البيانات (PDPL)</span>
                </button>
              </li>
              <li className="pt-1 text-[11px] text-slate-500">
                <span>تخضع المنصة لأنظمة وزارة التجارة وهيئة حماية المستهلك ونظام سدايا (SDAIA).</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Payments & Guarantee */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-white text-sm">بوابات الدفع والاعتماد</h4>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold border border-slate-700">
                مدى Mada
              </span>
              <span className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold border border-slate-700">
                Apple Pay
              </span>
              <span className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold border border-slate-700">
                تمارا Tamara
              </span>
              <span className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold border border-slate-700">
                Visa / Master
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              جميع الأسعار المعروضة بالريال السعودي شاملة ضريبة القيمة المضافة (15% VAT). المنصة لا تخزن أي بيانات بطاقات ائتمانية.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>جميع الحقوق محفوظة © {new Date().getFullYear()} منصة حكيم AI (alhkmy.store) • المملكة العربية السعودية</span>
            <button
              onClick={() => setIsGaModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/40 transition-colors text-[11px] font-bold cursor-pointer"
              title="عرض وتخصيص إحصاءات Google Analytics"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Google Analytics 4</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-emerald-300 border border-slate-700 hover:border-emerald-500/40 transition-colors text-[11px] font-bold cursor-pointer"
              title="الوضع الاقتصادي وإعدادات جودة الصور للتصفح السريع"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>الوضع الاقتصادي ⚡</span>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <button onClick={() => openLegal('disclaimer')} className="hover:underline">إخلاء المسؤولية</button>
            <span>•</span>
            <button onClick={() => openLegal('terms')} className="hover:underline">الشروط</button>
            <span>•</span>
            <button onClick={() => openLegal('privacy')} className="hover:underline">الخصوصية (PDPL)</button>
            <span>•</span>
            <span>بنده • العثيم • الدانوب • كارفور • لولو • أمازون</span>
          </div>
        </div>
      </div>

      {/* Interactive Legal Notice Modal */}
      <LegalNoticeModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalTab}
      />

      {/* Google Analytics 4 Management Modal */}
      <GoogleAnalyticsModal
        isOpen={isGaModalOpen}
        onClose={() => setIsGaModalOpen(false)}
      />

      {/* App Settings & Data Saver Modal */}
      <AppSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </footer>
  );
};
