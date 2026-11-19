import React, { useState } from 'react';
import { Trophy, Check, X, Sparkles, Award } from 'lucide-react';

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyVipCode: (code: string) => void;
}

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  isOpen,
  onClose,
  onApplyVipCode,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (idx: number) => {
    setSelectedOption(idx);
    setIsAnswered(true);
  };

  const handleClaim = () => {
    onApplyVipCode('HKM20');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-amber-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">تحدي التوفير اليومي (سؤال وجائزة)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
          <strong>سؤال اليوم:</strong> ما هو أفضل يوم أسبوعي للتسوق في كبرى الهايبرماركت السعودية للاستفادة من أحدث مجلات العروض وتحديث الأسعار؟
        </div>

        <div className="space-y-2">
          {['يوم الأربعاء والخميس صباحاً', 'يوم الجمعة بعد العصر', 'يوم الأحد ليلاً'].map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={`w-full p-3 rounded-xl border text-xs font-bold text-right flex items-center justify-between transition-all cursor-pointer ${
                selectedOption === i
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-amber-400'
              }`}
            >
              <span>{opt}</span>
              {selectedOption === i && <Check className="w-4 h-4 text-slate-950" />}
            </button>
          ))}
        </div>

        {isAnswered && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-300">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>إجابة صحيحة وممتازة! كسبت كود خصم VIP: HKM20</span>
            </div>
            <button
              onClick={handleClaim}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
            >
              تطبيق كود الخصم في السلة الآن
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
