import React, { useState } from 'react';
import { NutritionInfo } from '../types';
import { Activity, ChevronDown, ChevronUp, ShieldCheck, Heart } from 'lucide-react';

interface NutritionLabelProps {
  nutrition: NutritionInfo;
  productName?: string;
}

export const NutritionLabel: React.FC<NutritionLabelProps> = ({ nutrition, productName }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getNutriColor = (score?: string) => {
    switch (score?.toUpperCase()) {
      case 'A': return 'bg-emerald-600 text-white';
      case 'B': return 'bg-teal-600 text-white';
      case 'C': return 'bg-amber-500 text-slate-950';
      case 'D': return 'bg-orange-500 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  return (
    <div className="mt-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 p-2.5 text-xs">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          {nutrition.nutriScore && (
            <span className={`w-5 h-5 rounded-md font-black text-[10px] flex items-center justify-center shadow-xs ${getNutriColor(nutrition.nutriScore)}`}>
              {nutrition.nutriScore}
            </span>
          )}
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>الحقائق الغذائية {nutrition.calories ? `(${nutrition.calories} كالوري)` : ''}</span>
          </span>
        </div>

        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 animate-in fade-in duration-200">
          {nutrition.servingSize && (
            <div className="text-[10px] text-slate-400">حجم الحصة: {nutrition.servingSize}</div>
          )}
          <div className="grid grid-cols-2 gap-1 font-mono">
            {nutrition.protein !== undefined && (
              <div className="flex justify-between bg-white dark:bg-slate-800 px-2 py-1 rounded">
                <span>بروتين:</span>
                <span className="font-bold text-emerald-600">{nutrition.protein}g</span>
              </div>
            )}
            {nutrition.carbohydrates !== undefined && (
              <div className="flex justify-between bg-white dark:bg-slate-800 px-2 py-1 rounded">
                <span>كربوهيدرات:</span>
                <span className="font-bold">{nutrition.carbohydrates}g</span>
              </div>
            )}
            {nutrition.fat !== undefined && (
              <div className="flex justify-between bg-white dark:bg-slate-800 px-2 py-1 rounded">
                <span>دهون:</span>
                <span className="font-bold">{nutrition.fat}g</span>
              </div>
            )}
            {nutrition.sugar !== undefined && (
              <div className="flex justify-between bg-white dark:bg-slate-800 px-2 py-1 rounded">
                <span>سكر:</span>
                <span className="font-bold">{nutrition.sugar}g</span>
              </div>
            )}
            {nutrition.sodium !== undefined && (
              <div className="flex justify-between bg-white dark:bg-slate-800 px-2 py-1 rounded col-span-2">
                <span>صوديوم:</span>
                <span className="font-bold">{nutrition.sodium}mg</span>
              </div>
            )}
          </div>

          {nutrition.healthHighlights && nutrition.healthHighlights.length > 0 && (
            <div className="pt-1.5 space-y-1">
              {nutrition.healthHighlights.map((hl, i) => (
                <div key={i} className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
                  <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>{hl}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
