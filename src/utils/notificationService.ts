// Push and Email Notification Service for Hkeeem AI
export interface InAppPushPayload {
  id: string;
  title: string;
  body: string;
  productName: string;
  productImage: string;
  storeName: string;
  oldPrice?: number;
  newPrice: number;
  targetPrice?: number;
  savings?: number;
  timestamp: string;
  emailSent?: boolean;
  userEmail?: string;
  alertId?: string;
}

export interface EmailNotificationResult {
  success: boolean;
  message: string;
  recipientEmail?: string;
  deliveredAt?: string;
}

// Pleasant audio chime using Web Audio API
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play a delightful harmonic three-tone chime (F5 -> A5 -> C6)
    const playTone = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    playTone(659.25, 0, 0.18); // E5
    playTone(880.00, 0.12, 0.28); // A5
    playTone(1046.50, 0.24, 0.35); // C6
  } catch (e) {
    console.debug('Notification audio playback was suppressed or unsupported:', e);
  }
};

// Check if browser notifications are supported
export const isPushSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

// Get current permission status
export const getPushPermissionState = (): NotificationPermission => {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
};

// Request user permission for Push Notifications
export const requestPushPermission = async (): Promise<NotificationPermission> => {
  if (!isPushSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
};

// Send real native browser push notification
export const sendNativePushNotification = (
  title: string,
  options?: {
    body?: string;
    icon?: string;
    tag?: string;
    onClick?: () => void;
  }
) => {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(title, {
      body: options?.body,
      icon: options?.icon || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=128&q=80',
      badge: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=128&q=80',
      tag: options?.tag || `hkeeem-alert-${Date.now()}`,
      dir: 'rtl',
      lang: 'ar',
    });

    notification.onclick = () => {
      window.focus();
      if (options?.onClick) {
        options.onClick();
      }
      notification.close();
    };

    return true;
  } catch (error) {
    console.warn('Native notification failed (likely iframe sandbox), using in-app alert banner:', error);
    return false;
  }
};

// Send email price alert via backend API
export const sendPriceAlertEmail = async (payload: {
  email: string;
  productName: string;
  storeName: string;
  currentPrice: number;
  targetPrice: number;
  oldPrice?: number;
  savings?: number;
  productImage?: string;
}): Promise<EmailNotificationResult> => {
  try {
    const response = await fetch('/api/alerts/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.error || 'فشل إرسال إشعار البريد الإلكتروني',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'تم إرسال إشعار السعر للبريد الإلكتروني بنجاح',
      recipientEmail: payload.email,
      deliveredAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };
  } catch (err: any) {
    console.warn('Failed to dispatch alert email:', err);
    return {
      success: false,
      message: 'تعذر الاتصال بخادم البريد الإلكتروني حالياً',
    };
  }
};
