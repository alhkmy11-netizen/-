import React, { createContext, useContext, useState, useEffect } from 'react';
import { trackEvent } from '../utils/analytics';

export type DataSaverLevel = 'off' | 'economy' | 'ultra';

interface DataSaverContextType {
  dataSaverLevel: DataSaverLevel;
  isDataSaverEnabled: boolean;
  setDataSaverLevel: (level: DataSaverLevel) => void;
  toggleDataSaver: () => void;
  isSlowConnectionDetected: boolean;
  networkType: string;
  getOptimizedImageUrl: (src: string, targetSize?: string) => string;
}

const STORAGE_KEY = 'hkeeem_data_saver_mode';

const DataSaverContext = createContext<DataSaverContextType>({
  dataSaverLevel: 'off',
  isDataSaverEnabled: false,
  setDataSaverLevel: () => {},
  toggleDataSaver: () => {},
  isSlowConnectionDetected: false,
  networkType: '4g',
  getOptimizedImageUrl: (src) => src,
});

export const DataSaverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataSaverLevel, setDataSaverLevelState] = useState<DataSaverLevel>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'economy' || saved === 'ultra' || saved === 'off') {
        return saved;
      }
    }
    return 'off';
  });

  const [isSlowConnectionDetected, setIsSlowConnectionDetected] = useState(false);
  const [networkType, setNetworkType] = useState('4g');

  // Detect slow network connection using Network Information API if available
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn) {
        const updateNetworkInfo = () => {
          const effectiveType = conn.effectiveType || '4g';
          setNetworkType(effectiveType);
          const isSlow = effectiveType === '2g' || effectiveType === 'slow-2g' || effectiveType === '3g' || conn.saveData;
          setIsSlowConnectionDetected(isSlow);

          // If user hasn't explicitly set preference and browser reports saveData, turn economy on
          if (conn.saveData && !localStorage.getItem(STORAGE_KEY)) {
            setDataSaverLevelState('economy');
          }
        };

        updateNetworkInfo();
        conn.addEventListener('change', updateNetworkInfo);
        return () => conn.removeEventListener('change', updateNetworkInfo);
      }
    }
  }, []);

  const setDataSaverLevel = (level: DataSaverLevel) => {
    setDataSaverLevelState(level);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, level);
    }
    trackEvent('data_saver_changed', { level });
  };

  const toggleDataSaver = () => {
    const nextLevel: DataSaverLevel = dataSaverLevel === 'off' ? 'economy' : 'off';
    setDataSaverLevel(nextLevel);
  };

  const isDataSaverEnabled = dataSaverLevel !== 'off';

  /**
   * Transforms image URLs (such as Unsplash) to lower quality / compressed dimensions
   * to drastically cut network payload in weak connectivity environments.
   */
  const getOptimizedImageUrl = (src: string, targetSize?: string): string => {
    if (!src || typeof src !== 'string' || dataSaverLevel === 'off') {
      return src;
    }

    // Only process http(s) URLs
    if (!src.startsWith('http://') && !src.startsWith('https://')) {
      return src;
    }

    // Unsplash image optimization
    if (src.includes('images.unsplash.com')) {
      try {
        const url = new URL(src);
        
        if (dataSaverLevel === 'ultra') {
          // Micro thumbnail: 64px width, 15% quality, blur 5 for ultra fast render
          url.searchParams.set('w', '80');
          url.searchParams.set('q', '15');
          url.searchParams.set('auto', 'format');
          url.searchParams.set('fit', 'crop');
          return url.toString();
        }

        if (dataSaverLevel === 'economy') {
          // Standard Economy mode: 120-160px width, 25-30% quality (~85% size savings)
          let targetWidth = '140';
          if (targetSize === 'xs' || targetSize === 'sm') targetWidth = '100';
          if (targetSize === 'lg' || targetSize === 'xl') targetWidth = '220';

          url.searchParams.set('w', targetWidth);
          url.searchParams.set('q', '25');
          url.searchParams.set('auto', 'format');
          url.searchParams.set('fit', 'crop');
          return url.toString();
        }
      } catch {
        return src;
      }
    }

    return src;
  };

  return (
    <DataSaverContext.Provider
      value={{
        dataSaverLevel,
        isDataSaverEnabled,
        setDataSaverLevel,
        toggleDataSaver,
        isSlowConnectionDetected,
        networkType,
        getOptimizedImageUrl,
      }}
    >
      {children}
    </DataSaverContext.Provider>
  );
};

export const useDataSaver = () => useContext(DataSaverContext);
