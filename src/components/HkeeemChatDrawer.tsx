import React, { useState, useRef, useEffect, useMemo } from 'react';
import { UserCity, CartItem } from '../types';
import { trackEvent } from '../utils/analytics';
import { 
  Send, 
  X, 
  Sparkles, 
  Bot, 
  User, 
  RefreshCw, 
  Lightbulb, 
  Mic, 
  Volume2, 
  VolumeX, 
  Globe, 
  MapPin, 
  ExternalLink, 
  Zap, 
  BrainCircuit, 
  Navigation, 
  CheckCircle2, 
  Play, 
  Square, 
  Check, 
  ChevronDown, 
  Sliders, 
  Settings2,
  Heart,
  Store
} from 'lucide-react';

interface SourceItem {
  title: string;
  uri: string;
  reviewSnippet?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  webSources?: SourceItem[];
  mapSources?: SourceItem[];
  modeUsed?: 'search' | 'maps' | 'fast' | 'pro';
  modelUsed?: string;
  speakerPersona?: 'male' | 'female';
}

interface HkeeemChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userCity: UserCity;
  cart: CartItem[];
}

export type VoiceGender = 'male' | 'female';

export const HkeeemChatDrawer: React.FC<HkeeemChatDrawerProps> = ({
  isOpen,
  onClose,
  userCity,
  cart,
}) => {
  const [chatMode, setChatMode] = useState<'search' | 'maps' | 'fast' | 'pro'>('search');
  const [deviceCoords, setDeviceCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsActive, setGpsActive] = useState(false);

  // إعدادات الأصوات: أبو حكيم (ذكور - شامي) وأم حكيم (إناث - شامي)
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hkeeem_voice_gender');
      if (saved === 'male' || saved === 'female') return saved;
    }
    return 'male';
  });

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hkeeem_voice_uri') || '';
    }
    return '';
  });

  const [speechRate, setSpeechRate] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hkeeem_speech_rate');
      return saved ? parseFloat(saved) : 1.0;
    }
    return 1.0;
  });

  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hkeeem_auto_speak') === 'true';
    }
    return false;
  });

  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `أهلاً وسهلاً بك! 🛒\n\nنحن معك هنا «ابو حكيم» و«ام حكيم» باللغة العربية الواضحة والمباشرة لمساعدتك في مقارنة الأسعار واقتناص أقوى العروض في أسواق ومتاجر ${userCity.nameAr}.\n\n- **ابو حكيم:** يمنحك خلاصة الأسعار في المتاجر بالأرقام الدقيقة وفرق التوفير.\n- **ام حكيم:** تقدم لك أفضل النصائح لتدبير ميزانية البيت وشراء السلع الأساسية بأوفر سعر.\n\nيمكنك اختيار المتحدث (ابو حكيم أو ام حكيم) من القائمة بالأعلى والاستماع للردود صوتياً. كيف يمكننا مساعدتك اليوم؟`,
      modeUsed: 'search',
      modelUsed: 'gemini-3.5-flash',
      speakerPersona: 'male',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // تحميل الأصوات المتاحة في المتصفح عبر Web Speech API
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const populateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // ترشيح الأصوات العربية وأصوات النظام
  const arabicVoices = useMemo(() => {
    return availableVoices.filter(
      (v) => v.lang.toLowerCase().startsWith('ar') || v.lang.toLowerCase().includes('arabic')
    );
  }, [availableVoices]);

  // حفظ تفضيلات الصوت
  const handleVoiceGenderChange = (gender: VoiceGender) => {
    setVoiceGender(gender);
    try {
      localStorage.setItem('hkeeem_voice_gender', gender);
    } catch (e) {}
    trackEvent('chat_bot_persona_switched', { persona: gender });
    
    // إيقاف الصوت الحالي عند التبديل
    stopAudio();
  };

  const handleVoiceURIChange = (uri: string) => {
    setSelectedVoiceURI(uri);
    try {
      localStorage.setItem('hkeeem_voice_uri', uri);
    } catch (e) {}
    stopAudio();
  };

  const handleSpeechRateChange = (rate: number) => {
    setSpeechRate(rate);
    try {
      localStorage.setItem('hkeeem_speech_rate', String(rate));
    } catch (e) {}
  };

  const handleToggleAutoSpeak = () => {
    setAutoSpeak((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('hkeeem_auto_speak', String(next));
      } catch (e) {}
      trackEvent('chat_bot_autospeak_toggled', { enabled: next });
      return next;
    });
  };

  const handleModeChange = (mode: 'search' | 'maps' | 'fast' | 'pro') => {
    setChatMode(mode);
    trackEvent('chat_bot_mode_switched', { mode });
  };

  // إيقاف تشغيل الصوت
  const stopAudio = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingIndex(null);
    setIsSpeaking(false);
    setIsTestingVoice(false);
  };

  // الحصول على الصوت الأنسب لأبو حكيم أو أم حكيم في Web Speech API
  const getSelectedWebVoice = (gender: VoiceGender): { voice: SpeechSynthesisVoice | null; pitch: number; rate: number } => {
    // 1. إذا اختار المستخدم صوتاً محدداً يدوياً من القائمة
    if (selectedVoiceURI) {
      const customVoice = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
      if (customVoice) {
        return {
          voice: customVoice,
          pitch: gender === 'female' ? 1.15 : 0.80, // نبرة رجالية عميقة لأبو حكيم ونبرة أنثوية لأم حكيم
          rate: speechRate,
        };
      }
    }

    // الكلمات الدلالية للأصوات الرجالية المؤكدة
    const maleKeywords = [
      'maged', 'majed', 'tarik', 'tariq', 'naayf', 'naif', 'shakir', 'hamed', 
      'bader', 'omar', 'salim', 'ali', 'khalid', 'youssef', 'ibrahim', 'ahmed',
      'male', 'man', 'david', 'mark', 'george', 'hakeem', 'saudi',
      'standard-b', 'standard-c', 'wavenet-b', 'wavenet-c', 'neural2-b', 'neural2-c'
    ];

    // الكلمات الدلالية للأصوات النسائية
    const femaleKeywords = [
      'laila', 'salma', 'zeina', 'hoda', 'zariyah', 'fatima', 'female', 'woman',
      'susan', 'mary', 'zira', 'hakeema', 'yasmin', 'nour', 'huda', 'mariam',
      'noura', 'standard-a', 'standard-d', 'wavenet-a', 'wavenet-d', 'neural2-a', 'neural2-d'
    ];

    if (gender === 'male') {
      // 1. البحث عن صوت عربي رجالي صريح أولاً
      const matchedMale = arabicVoices.find((v) => {
        const text = (v.name + ' ' + v.voiceURI).toLowerCase();
        return maleKeywords.some((kw) => text.includes(kw));
      });
      if (matchedMale) {
        return {
          voice: matchedMale,
          pitch: 0.80, // نبرة رجالية فخمة وعميقة
          rate: speechRate,
        };
      }

      // 2. البحث عن صوت عربي لا يحمل أسماء نسائية
      const nonFemaleVoice = arabicVoices.find((v) => {
        const text = (v.name + ' ' + v.voiceURI).toLowerCase();
        return !femaleKeywords.some((kw) => text.includes(kw));
      });
      if (nonFemaleVoice) {
        return {
          voice: nonFemaleVoice,
          pitch: 0.78, // نبرة رجالية واضحة
          rate: speechRate,
        };
      }

      // 3. إذا لم يتوفر سوى صوت عام، نخفض النبرة لتكون صوتاً رجالياً حقيقياً
      if (arabicVoices.length > 0) {
        return {
          voice: arabicVoices[0],
          pitch: 0.75, // تحويل النبرة إلى صوت رجالي عميق
          rate: speechRate,
        };
      }

      // 4. البحث في الأصوات العالمية البديلة للذكور
      const fallbackMale = availableVoices.find((v) => {
        const text = (v.name + ' ' + v.voiceURI).toLowerCase();
        return maleKeywords.some((kw) => text.includes(kw));
      });
      return {
        voice: fallbackMale || null,
        pitch: 0.78,
        rate: speechRate,
      };
    } else {
      // أنثى: ام حكيم
      const matchedFemale = arabicVoices.find((v) => {
        const text = (v.name + ' ' + v.voiceURI).toLowerCase();
        return femaleKeywords.some((kw) => text.includes(kw));
      });
      if (matchedFemale) {
        return {
          voice: matchedFemale,
          pitch: 1.15,
          rate: speechRate,
        };
      }

      const nonMaleVoice = arabicVoices.find((v) => {
        const text = (v.name + ' ' + v.voiceURI).toLowerCase();
        return !maleKeywords.some((kw) => text.includes(kw));
      });
      if (nonMaleVoice) {
        return {
          voice: nonMaleVoice,
          pitch: 1.2,
          rate: speechRate,
        };
      }

      return {
        voice: arabicVoices[0] || null,
        pitch: 1.2,
        rate: speechRate,
      };
    }
  };

  // تشغيل النص باستخدام Web Speech API بنبرة أبو حكيم أو أم حكيم
  const speakWithWebSpeech = (text: string, msgIndex?: number, forcedGender?: VoiceGender) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('المتصفح الحالي لا يدعم مكتبة Web Speech API.');
      return;
    }

    const currentGender = forcedGender || voiceGender;

    // إذا كان المقطع نفسه قيد التشغيل، قم بإيقافه
    if (msgIndex !== undefined && playingIndex === msgIndex && isSpeaking) {
      stopAudio();
      return;
    }

    stopAudio();

    // تنظيف النص من علامات Markdown والروابط لنطق لغوي شامي سليم
    const cleanText = text
      .replace(/[*#_`~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[|—•]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    // اختصار النص الطويل للتركيز على الزبدة التوفيرية وتجنب إطالة النطق
    const voiceText = cleanText.length > 600 ? cleanText.slice(0, 590) + '...' : cleanText;

    const utterance = new SpeechSynthesisUtterance(voiceText);
    utterance.lang = 'ar-SA';

    const { voice, pitch, rate } = getSelectedWebVoice(currentGender);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.pitch = pitch;
    utterance.rate = rate;

    utterance.onstart = () => {
      if (msgIndex !== undefined) setPlayingIndex(msgIndex);
      setIsSpeaking(true);
      trackEvent('chat_bot_voice_played', {
        persona: currentGender,
      });
    };

    utterance.onend = () => {
      setPlayingIndex(null);
      setIsSpeaking(false);
      setIsTestingVoice(false);
    };

    utterance.onerror = (e) => {
      console.warn('Web Speech API playback error:', e);
      setPlayingIndex(null);
      setIsSpeaking(false);
      setIsTestingVoice(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // تجربة نبرة الصوت المحددة باللغة العربية الواضحة بدون تكلف
  const handleTestVoiceSample = (targetGender?: VoiceGender) => {
    const genderToTest = targetGender || voiceGender;
    stopAudio();
    setIsTestingVoice(true);

    const sampleText = genderToTest === 'female'
      ? 'أهلاً بك! أنا ام حكيم، يسعدني مساعدتك في تدبير ميزانية البيت واختيار أفضل العروض والسلع التموينية بأقل تكلفة.'
      : 'مرحباً بك! أنا ابو حكيم، مستشارك لمقارنة أسعار المتاجر وإيجاد أرخص السلع لتوفير مالك بكل دقة ووضوح.';

    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.lang = 'ar-SA';

    const { voice, pitch, rate } = getSelectedWebVoice(genderToTest);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.pitch = pitch;
    utterance.rate = rate;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsTestingVoice(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsTestingVoice(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsTestingVoice(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // إيقاف الصوت عند إغلاق النافذة
  useEffect(() => {
    if (!isOpen) {
      stopAudio();
    }
  }, [isOpen]);

  // تحديد الموقع الجغرافي للجهاز
  const requestDeviceLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDeviceCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setGpsActive(true);
        },
        (err) => {
          console.warn('GPS location declined, using city defaults:', err.message);
          setGpsActive(false);
        },
        { timeout: 8000 }
      );
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPromptsByMode: Record<string, string[]> = {
    search: [
      `أرخص عروض الأرز والزيت هذا الأسبوع في أسواق ${userCity.nameAr}؟`,
      'أحدث تخفيضات بنده والعثيم الأسبوعية يا ابو حكيم؟',
      'يا ام حكيم ما هي مقاضي وجبة غداء اقتصادية لـ 5 أشخاص؟',
      'كوبونات خصم نون وكارفور الفعالة اليوم؟',
    ],
    maps: [
      `أقرب فرع هايبر بنده أو لولو من موقعي في ${userCity.nameAr}؟`,
      `أين أجد فروع أسواق العثيم القريبة وساعات دوامها؟`,
      `فروع صيدلية النهدي القريبة في ${userCity.nameAr}؟`,
      `أرخص هايبرماركت قريب من موقعي؟`,
    ],
    fast: [
      'قارن سعر كرتون مياه نوفا وبيرين',
      'أرخص زيت ذرة 1.5 لتر في المتاجر',
      'سعر حليب المراعي 2 لتر اليوم',
      'أفضل بديل محلي لمنتج مستورد',
    ],
    pro: [
      'حلل سلتي الحالية واقترح أفضل تقسيم بين بنده والعثيم',
      'كيف أوفر 30% من فاتورة التموين الشهرية في الرياض؟',
      'أفضل بطاقة بنكية تقدم كاش باك على السوبرماركت',
      'جدول المقاضي الأسبوعية الاقتصادية للأسرة',
    ],
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || loading) return;

    trackEvent('chat_bot_message_sent', {
      chat_mode: chatMode,
      persona: voiceGender,
      is_quick_prompt: !!customPrompt,
      prompt_length: textToSend.length,
      city: userCity.nameAr,
    });

    stopAudio();

    const userMessage: Message = { role: 'user', content: textToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const effectiveCoords = deviceCoords || {
        latitude: userCity.lat || 24.7136,
        longitude: userCity.lng || 46.6753,
      };

      const res = await fetch('/api/gemini/hkeeem-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          userCity: userCity.nameAr,
          userLocation: effectiveCoords,
          mode: chatMode,
          voicePersona: voiceGender, // 'male' = أبو حكيم، 'female' = أم حكيم
          currentCart: cart.map((c) => ({
            name: c.product.nameAr,
            qty: c.quantity,
          })),
        }),
      });

      if (!res.ok) throw new Error('فشل التواصل مع مساعد حكيم');
      const data = await res.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
        webSources: data.webSources,
        mapSources: data.mapSources,
        modeUsed: data.modeUsed || chatMode,
        modelUsed: data.modelUsed || 'gemini-3.5-flash',
        speakerPersona: voiceGender,
      };

      setMessages([...newMessages, assistantMessage]);

      // تشغيل الرد صوتياً عبر Web Speech API تلقائياً إذا كان الخيار مفعلاً
      if (autoSpeak && data.reply) {
        setTimeout(() => {
          speakWithWebSpeech(data.reply, newMessages.length, voiceGender);
        }, 150);
      }
    } catch (err: any) {
      console.warn('Hkeeem chat client notice:', err);
      const fallbackReply = voiceGender === 'female'
        ? `أهلاً بك! بحسب بيانات العروض الحالية في ${userCity.nameAr}، أسواق العثيم وبنده توفران أفضل الأسعار في السلع الأساسية كالزيوت والأرز والدواجن، بينما كارفور ولولو يملكان عروضاً ممتازة على المنظفات والمعلبات. يسعدني الإجابة عن أي استفسار آخر.`
        : `مرحباً بك! بناءً على رصد الأسعار في ${userCity.nameAr}، العثيم وبنده هما الخيار الأوفر حالياً في السلع الغذائية الأساسية، بينما تجد أقوى التخفيضات على مواد النظافة في كارفور. أنا جاهز لمساعدتك في أي مقارنة أخرى.`;

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: fallbackReply,
          modeUsed: chatMode,
          modelUsed: 'gemini-3.5-flash',
          speakerPersona: voiceGender,
        },
      ]);
      if (autoSpeak) {
        setTimeout(() => {
          speakWithWebSpeech(fallbackReply, newMessages.length, voiceGender);
        }, 150);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSpeech = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('ميزة التعرف على الصوت غير مدعومة في هذا المتصفح.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
      };
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Simple Markdown text formatter
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Header
          if (line.startsWith('### ') || line.startsWith('## ')) {
            return (
              <h4 key={idx} className="font-black text-emerald-950 dark:text-emerald-300 text-xs sm:text-sm mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                {line.replace(/^#+\s*/, '')}
              </h4>
            );
          }

          // Bullet points
          const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim());
          const cleanLine = line.replace(/^[-*]\s+|\d+\.\s+/, '');

          // Replace bold markdown with span
          const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);

          return (
            <div key={idx} className={isBullet ? 'flex items-start gap-1.5 pr-2' : ''}>
              {isBullet && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-1.5 shrink-0" />
              )}
              <p className="flex-1">
                {parts.map((part, pIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={pIdx} className="font-extrabold text-emerald-900 dark:text-emerald-200">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return <span key={pIdx}>{part}</span>;
                })}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in" dir="rtl">
      <div className="w-full max-w-lg bg-white dark:bg-slate-950 h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300 relative">
        
        {/* Header with Title, Location, and Voice Dropdown (أبو حكيم / أم حكيم) */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-850 via-teal-900 to-slate-900 text-white flex flex-col gap-2.5 border-b border-emerald-900/60 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-400/20 text-lg">
                {voiceGender === 'female' ? '🧕' : '🧔🏻'}
              </div>
              <div>
                <div className="font-black text-sm sm:text-base flex items-center gap-1.5">
                  <span>{voiceGender === 'female' ? 'ام حكيم' : 'ابو حكيم'}</span>
                  <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>مساعد ذكي</span>
                  </span>
                </div>
                <div className="text-[11px] text-emerald-200/90 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3 h-3 text-amber-300" />
                  <span>عروض {userCity.nameAr}</span>
                  {gpsActive && (
                    <span className="text-[9px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> GPS
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* زر تفاصيل إعدادات الصوت المتقدمة */}
              <button
                onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                title="إعدادات صوت أبو حكيم وأم حكيم"
                className={`p-2 rounded-xl transition-all cursor-pointer relative ${
                  showVoiceSettings
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Settings2 className="w-4 h-4" />
                {autoSpeak && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
                )}
              </button>

              <button
                onClick={requestDeviceLocation}
                title={gpsActive ? 'الموقع الجغرافي مفعل' : 'تفعيل إحداثيات موقعي الحالية'}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  gpsActive 
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <Navigation className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* القائمة المنسدلة لاختيار شخصية ونبرة الصوت: أبو حكيم أو أم حكيم باللهجة الشامية */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-emerald-200/90 shrink-0 font-medium">
                <Volume2 className="w-3.5 h-3.5 text-amber-300" />
                <span>الشخصية والصوت:</span>
              </div>

              {/* القائمة المنسدلة الأساسية */}
              <div className="relative flex-1 min-w-[145px] max-w-[210px]">
                <select
                  value={voiceGender}
                  onChange={(e) => handleVoiceGenderChange(e.target.value as VoiceGender)}
                  className="w-full appearance-none bg-slate-900/90 hover:bg-slate-900 border border-amber-400/60 text-white text-xs font-bold py-1.5 pr-3 pl-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer shadow-inner"
                  title="اختر: ابو حكيم (صوت رجالي) أو ام حكيم (صوت نسائي)"
                >
                  <option value="male" className="bg-slate-900 text-white py-1">
                    ابو حكيم (صوت رجالي)
                  </option>
                  <option value="female" className="bg-slate-900 text-white py-1">
                    ام حكيم (صوت نسائي)
                  </option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-amber-300 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* زر تجربة نبرة الصوت بنقرة واحدة */}
            <button
              onClick={() => handleTestVoiceSample(voiceGender)}
              disabled={isTestingVoice}
              title={`استمع لتجربة صوت ${voiceGender === 'female' ? 'ام حكيم (نسائي)' : 'ابو حكيم (رجالي)'}`}
              className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 shrink-0"
            >
              {isTestingVoice ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>جارِ النطق...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>تجربة الصوت</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* لوحة خيارات وإعدادات الصوت المتقدمة (Web Speech API Settings) */}
        {showVoiceSettings && (
          <div className="absolute top-[115px] inset-x-3 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-4 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    إعدادات الصوت (ابو حكيم / ام حكيم)
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    تقنية Web Speech API لتحويل النص إلى كلام عربي واضح
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVoiceSettings(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* التبديل بين ابو حكيم وام حكيم */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                اختر المتحدث:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleVoiceGenderChange('male')}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-1 ${
                    voiceGender === 'male'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-100 ring-1 ring-amber-500/30'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">ابو حكيم (صوت رجالي)</span>
                    {voiceGender === 'male' && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    نبرة رجالية عميقة وخبير الأسعار
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleVoiceGenderChange('female')}
                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col gap-1 ${
                    voiceGender === 'female'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-100 ring-1 ring-amber-500/30'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">ام حكيم (صوت نسائي)</span>
                    {voiceGender === 'female' && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    نبرة نسائية واضحة ومستشارة التدبير
                  </span>
                </button>
              </div>
            </div>

            {/* قائمة منسدلة بالأصوات المكتشفة في متصفح المستخدم عبر Web Speech API */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  صوت المتصفح المختار (Speech Engine):
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  {arabicVoices.length} صوت عربي مثبت
                </span>
              </div>
              <div className="relative">
                <select
                  value={selectedVoiceURI}
                  onChange={(e) => handleVoiceURIChange(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 pr-3 pl-8 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">✨ تلقائي بحسب اختيار الشخصية (موصى به)</option>
                  {arabicVoices.length > 0 && (
                    <optgroup label="الأصوات العربية في جهازك">
                      {arabicVoices.map((v, idx) => (
                        <option key={`ar-voice-${v.voiceURI || v.name}-${idx}`} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {availableVoices.filter((v) => !v.lang.toLowerCase().startsWith('ar')).length > 0 && (
                    <optgroup label="أصوات النظام الأخرى">
                      {availableVoices
                        .filter((v) => !v.lang.toLowerCase().startsWith('ar'))
                        .slice(0, 15)
                        .map((v, idx) => (
                          <option key={`sys-voice-${v.voiceURI || v.name}-${idx}`} value={v.voiceURI}>
                            {v.name} ({v.lang})
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* سرعة النطق + القراءة التلقائية */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={handleToggleAutoSpeak}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  نطق الردود صوتياً تلقائياً
                </span>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">السرعة:</span>
                {[0.9, 1.0, 1.15].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleSpeechRateChange(rate)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      speechRate === rate
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Multi-turn Mode Selector (Search Grounding, Maps Grounding, Flash Lite, Pro) */}
        <div className="p-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleModeChange('search')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              chatMode === 'search'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>بحث الويب المباشر</span>
            <span className="text-[9px] opacity-75 font-mono">Google</span>
          </button>

          <button
            onClick={() => handleModeChange('maps')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              chatMode === 'maps'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>خرائط الفروع</span>
            <span className="text-[9px] opacity-75 font-mono">Maps</span>
          </button>

          <button
            onClick={() => handleModeChange('fast')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              chatMode === 'fast'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>مقارنة فورية</span>
          </button>

          <button
            onClick={() => handleModeChange('pro')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              chatMode === 'pro'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
            <span>تدبير وتوفير</span>
          </button>
        </div>

        {/* Message History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, idx) => {
            const isOmHakeem = m.speakerPersona === 'female' || (m.role === 'assistant' && voiceGender === 'female');
            return (
              <div
                key={idx}
                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                    m.role === 'user'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      : isOmHakeem
                      ? 'bg-rose-600 text-white shadow-xs shadow-rose-600/30'
                      : 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                  }`}
                >
                  {m.role === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : isOmHakeem ? (
                    <span className="text-sm">🧕</span>
                  ) : (
                    <span className="text-sm">🧔🏻</span>
                  )}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    m.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-xs'
                      : 'bg-slate-50 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-tl-xs'
                  }`}
                >
                  {m.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 pb-1 mb-2 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black text-amber-700 dark:text-amber-400">
                      <span>{isOmHakeem ? '🧕 ام حكيم:' : '🧔🏻 ابو حكيم:'}</span>
                    </div>
                  )}

                  {renderFormattedContent(m.content)}

                  {/* Google Maps Grounded Sources */}
                  {m.mapSources && m.mapSources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-rose-100 dark:border-rose-900/30 space-y-1.5">
                      <div className="text-[11px] font-black text-rose-700 dark:text-rose-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>المواقع الموثقة من خرائط Google:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {m.mapSources.map((source, sIdx) => (
                          <a
                            key={sIdx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shadow-2xs"
                          >
                            <span>{source.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-rose-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Google Search Grounding Web Sources */}
                  {m.webSources && m.webSources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-sky-100 dark:border-sky-900/30 space-y-1.5">
                      <div className="text-[11px] font-black text-sky-700 dark:text-sky-400 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        <span>المصادر المرجعية لأسعار وعروض الويب:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {m.webSources.slice(0, 4).map((source, sIdx) => (
                          <a
                            key={sIdx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors shadow-2xs"
                          >
                            <span>{source.title}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-sky-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Audio Read-out Button using Web Speech API */}
                  {m.role === 'assistant' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>
                          {isOmHakeem ? 'صوت ام حكيم' : 'صوت ابو حكيم'}
                        </span>
                      </div>

                      <button
                        onClick={() => speakWithWebSpeech(m.content, idx, isOmHakeem ? 'female' : 'male')}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          playingIndex === idx && isSpeaking
                            ? 'bg-rose-500 text-white shadow-xs animate-pulse'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 border border-amber-200 dark:border-amber-800/60'
                        }`}
                        title={
                          playingIndex === idx && isSpeaking
                            ? 'إيقاف الاستماع'
                            : `استماع لصوت ${isOmHakeem ? 'ام حكيم' : 'ابو حكيم'}`
                        }
                      >
                        {playingIndex === idx && isSpeaking ? (
                          <>
                            <Square className="w-3 h-3 fill-current" />
                            <span>إيقاف الصوت</span>
                            {/* Animated Wave Equalizer bars */}
                            <span className="flex items-center gap-0.5 mr-1">
                              <span className="w-0.5 h-2.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <span className="w-0.5 h-3.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <span className="w-0.5 h-2 bg-white rounded-full animate-bounce" />
                            </span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>
                              استماع: {isOmHakeem ? 'ام حكيم' : 'ابو حكيم'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-fit shadow-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
              <span>
                {chatMode === 'maps'
                  ? `${voiceGender === 'female' ? 'ام حكيم' : 'ابو حكيم'} يبحث عن أقرب الفروع في خرائط Google...`
                  : chatMode === 'search'
                  ? `${voiceGender === 'female' ? 'ام حكيم' : 'ابو حكيم'} يبحث في أحدث عروض الويب والأسعار المباشرة...`
                  : chatMode === 'pro'
                  ? `${voiceGender === 'female' ? 'ام حكيم' : 'ابو حكيم'} يحلل ميزانية المقاضي ويحسب نسبة التوفير...`
                  : 'جارِ تحضير الرد المباشر...'}
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips based on selected mode */}
        <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mr-0.5" />
          {(quickPromptsByMode[chatMode] || quickPromptsByMode.search).map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-900 dark:hover:text-amber-200 text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap transition-colors cursor-pointer border border-transparent hover:border-amber-200 dark:hover:border-amber-800"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar with Speech and Send */}
        <div className="p-3.5 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <button
            onClick={handleSpeech}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-400/40'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="تحدث صوتياً"
          >
            <Mic className="w-4 h-4" />
          </button>

          <input
            type="text"
            placeholder={
              chatMode === 'maps'
                ? `اسأل ${voiceGender === 'female' ? 'ام حكيم' : 'ابو حكيم'} عن أقرب فرع في ${userCity.nameAr}...`
                : chatMode === 'search'
                ? `اسأل ${voiceGender === 'female' ? 'ام حكيم' : 'ابو حكيم'} عن العروض والأسعار...`
                : `اكتب سؤالك لـ ${voiceGender === 'female' ? 'ام حكيم' : 'ابو حكيم'}...`
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-40 text-slate-950 font-black transition-all transform active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Send className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
};
