export interface AnalyticsEvent {
  event: string;
  params?: Record<string, any>;
  timestamp: string;
}

const DEFAULT_MEASUREMENT_ID = 'G-HKEEEM2026';
const GA_STORAGE_KEY = 'hkeeem_ga_id';

export const getActiveMeasurementId = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(GA_STORAGE_KEY) || DEFAULT_MEASUREMENT_ID;
  }
  return DEFAULT_MEASUREMENT_ID;
};

export const setActiveMeasurementId = (measurementId: string): void => {
  if (typeof window !== 'undefined') {
    const cleanId = measurementId.trim();
    localStorage.setItem(GA_STORAGE_KEY, cleanId);
    initGA(cleanId);
  }
};

// Internal recent events buffer for live debugging & UI feedback
export const getRecentEvents = (): AnalyticsEvent[] => {
  if (typeof window !== 'undefined') {
    try {
      const stored = sessionStorage.getItem('hkeeem_recent_ga_events');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const saveRecentEvent = (event: AnalyticsEvent) => {
  if (typeof window !== 'undefined') {
    try {
      const events = getRecentEvents();
      const updated = [event, ...events.slice(0, 19)];
      sessionStorage.setItem('hkeeem_recent_ga_events', JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
};

export const initGA = (measurementId: string = getActiveMeasurementId()) => {
  if (typeof window === 'undefined') return;

  try {
    // 1. Setup dataLayer and gtag function
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;

    // 2. Ensure Google Analytics Tag script is dynamically inserted if not already present
    const scriptId = 'google-analytics-script';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.async = true;
      scriptEl.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(scriptEl);
    } else if (!scriptEl.src.includes(measurementId)) {
      scriptEl.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    }

    gtag('js', new Date());
    gtag('config', measurementId, {
      send_page_view: false, // controlled by our trackPageView
      cookie_flags: 'SameSite=None;Secure'
    });

    (window as any).gtagInitialized = true;
    (window as any).activeGaId = measurementId;
  } catch (err) {
    console.warn('[Google Analytics] initialization notice:', err);
  }
};

export const trackEvent = (eventName: string, params: Record<string, any> = {}) => {
  if (typeof window === 'undefined') return;

  const eventPayload: AnalyticsEvent = {
    event: eventName,
    params,
    timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };

  // 1. Dispatch custom DOM event
  window.dispatchEvent(
    new CustomEvent('hkeeem_analytics', {
      detail: eventPayload,
    })
  );

  // 2. Save in session buffer for UI inspect modal
  saveRecentEvent(eventPayload);

  // 3. Send to Google Analytics if gtag exists
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', eventName, params);
  }
};

export const trackPageView = (pageName: string, title?: string) => {
  trackEvent('page_view', {
    page_title: title || `حكيم AI - ${pageName}`,
    page_location: typeof window !== 'undefined' ? window.location.href : '',
    page_path: `/${pageName}`,
  });
};

export const trackAddToCart = (productName: string, storeName: string, price: number, quantity: number = 1) => {
  trackEvent('add_to_cart', {
    currency: 'SAR',
    value: price * quantity,
    items: [
      {
        item_name: productName,
        item_brand: storeName,
        price: price,
        quantity: quantity,
      }
    ]
  });
};

export const trackPurchase = (orderId: string, total: number, savings: number) => {
  trackEvent('purchase', {
    transaction_id: orderId,
    value: total,
    currency: 'SAR',
    savings_amount: savings,
    shipping_partner: 'alhkmy.store',
  });
};

export const trackSearch = (searchTerm: string, resultsCount: number) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_found: resultsCount,
  });
};
