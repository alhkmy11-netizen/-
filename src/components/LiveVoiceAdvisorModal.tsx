import React, { useState } from 'react';
import { Mic, MicOff, X, Sparkles, Volume2 } from 'lucide-react';

interface LiveVoiceAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveVoiceAdvisorModal: React.FC<LiveVoiceAdvisorModalProps> = ({ isOpen, onClose }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('مرحباً بك! أنا مستشارك الصوتي للتوفير في المقاضي والعروض. اسألني عن أي سلعة أو متجر وسأدلك على أفضل صفقة فوراً.');

  if (!isOpen) return null;

  const toggleListen = () => {
    if (!isListening) {
      setIsListening(true);
      setTranscript('أبحث عن زيت زيتون بكر ممتاز وأوفر سعر...');
      setTimeout(() => {
        setIsListening(false);
        setResponse('أفضل خيار لزيت الزيتون البكر الممتاز هو زيت الجوف 500 مل في متجر حكيم الذكي alhkmy.store بسعر 28.50 ر.س مع كود 570C، يليه أسواق العثيم.');
      }, 2500);
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in" dir="rtl">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl w-full max-w-md p-6 text-white text-center shadow-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-black">المستشار الصوتي الذكي (AI Voice)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-6 flex flex-col items-center gap-4">
          <button
            onClick={toggleListen}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xl ${
              isListening
                ? 'bg-rose-600 animate-ping text-white ring-8 ring-rose-500/30'
                : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white hover:scale-105 ring-4 ring-indigo-500/20'
            }`}
          >
            {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
          </button>
          <span className="text-xs text-slate-400 font-bold">
            {isListening ? 'أنا أستمع لصوتك الآن...' : 'اضغط على الميكروفون للتحدث مع حكيم'}
          </span>
        </div>

        {transcript && (
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            "{transcript}"
          </div>
        )}

        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 text-right leading-relaxed flex items-start gap-2.5">
          <Volume2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <p>{response}</p>
        </div>
      </div>
    </div>
  );
};
