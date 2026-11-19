import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { CartItem, PastOrder, PriceAlert, Product } from '../types';

// معرف مشروع سوبابيس المقدم من المستخدم
export const SUPABASE_PROJECT_ID = 'pcycuavbjpqvfuwwqlso';
export const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

// المفتاح العام (Anon Key) يمكن جلبه من متغيرات البيئة أو التخزين المحلي
const getStoredAnonKey = (): string => {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('hkeeem_supabase_anon_key');
    if (local && local.trim()) return local.trim();
  }
  return (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
};

export const getSupabaseUrl = (): string => {
  return (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
};

// إنشاء عميل سوبابيس ديناميكياً
let cachedClient: SupabaseClient | null = null;
let cachedKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const currentKey = getStoredAnonKey();
  const url = getSupabaseUrl();

  // في حال وجود مفتاح صالح أو مفتاح بديل
  if (!currentKey) {
    return null;
  }

  if (cachedClient && cachedKey === currentKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, currentKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedKey = currentKey;
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
};

export interface SupabaseSyncStatus {
  isConnected: boolean;
  projectId: string;
  projectUrl: string;
  hasAnonKey: boolean;
  lastSyncedAt: string | null;
  syncedCartCount: number;
  syncedWishlistCount: number;
  syncedOrdersCount: number;
  errorMessage?: string;
}

// دالة اختبار الاتصال مع سوبابيس
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'لم يتم إدخال Anon Public Key الخاص بمشروع Supabase بعد.',
    };
  }

  try {
    // محاولة استعلام خفيف للتأكد من الاتصال
    const { error } = await client.from('carts').select('id').limit(1);
    if (error && error.code === '42P01') {
      // الجدول غير منشأ بعد لكن الاتصال بالخادم ناجح 100%
      return {
        success: true,
        message: 'تم الاتصال بنجاح بمشروع Supabase (يمكنك إنشاء الجداول بالضغط على زر نسخ الـ SQL).',
      };
    }

    if (error && error.message.includes('Invalid API key')) {
      return {
        success: false,
        message: 'مفتاح Anon API Key غير صالح أو منتهي الصلاحية.',
      };
    }

    return {
      success: true,
      message: 'تم الاتصال بقاعدة بيانات Supabase بنجاح ومزامنة البيانات نشطة!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'تعذر الاتصال بخوادم Supabase حالياً.',
    };
  }
};

// مزامنة السلة مع سوبابيس
export const syncCartToSupabase = async (cart: CartItem[]): Promise<boolean> => {
  const client = getSupabaseClient();
  const sessionId = getOrCreateSessionId();

  // حفظ محلي أولاً دائماً لضمان العمل بلا إنترنت
  try {
    localStorage.setItem('hkeeem_cached_cart', JSON.stringify(cart));
  } catch {}

  if (!client) return false;

  try {
    const payload = {
      session_id: sessionId,
      items: cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        selected_store_id: item.selectedStoreId || null,
        product_name: item.product.nameAr,
        unit: item.product.unit,
      })),
      updated_at: new Date().toISOString(),
    };

    const { error } = await client
      .from('carts')
      .upsert(payload, { onConflict: 'session_id' });

    if (!error) {
      localStorage.setItem('hkeeem_last_supabase_sync', new Date().toISOString());
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Error syncing cart to Supabase:', err);
    return false;
  }
};

// استعادة السلة من سوبابيس
export const loadCartFromSupabase = async (products: Product[]): Promise<CartItem[] | null> => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const sessionId = getOrCreateSessionId();
    const { data, error } = await client
      .from('carts')
      .select('items')
      .eq('session_id', sessionId)
      .single();

    if (error || !data || !Array.isArray(data.items)) return null;

    const restoredCart: CartItem[] = [];
    data.items.forEach((saved: any) => {
      const prod = products.find(p => p.id === saved.product_id);
      if (prod) {
        restoredCart.push({
          product: prod,
          quantity: Number(saved.quantity) || 1,
          selectedStoreId: saved.selected_store_id || undefined,
          productId: prod.id,
        });
      }
    });

    return restoredCart;
  } catch {
    return null;
  }
};

// مزامنة قائمة المفضلة
export const syncWishlistToSupabase = async (productIds: string[]): Promise<boolean> => {
  const client = getSupabaseClient();
  const sessionId = getOrCreateSessionId();

  if (!client) return false;

  try {
    const { error } = await client
      .from('wishlists')
      .upsert(
        {
          session_id: sessionId,
          product_ids: productIds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id' }
      );
    return !error;
  } catch {
    return false;
  }
};

// حفظ الطلب والفاتورة إلى سوبابيس
export const saveOrderToSupabase = async (order: PastOrder): Promise<boolean> => {
  const client = getSupabaseClient();
  const sessionId = getOrCreateSessionId();

  if (!client) return false;

  try {
    const { error } = await client.from('orders').insert({
      id: order.id,
      session_id: sessionId,
      store: order.store,
      total_amount: order.total,
      savings_amount: order.savings,
      items_count: order.itemsCount,
      order_date: order.date,
      payment_method: order.paymentMethod || 'مدى',
      items: order.items || [],
      created_at: new Date().toISOString(),
    });

    return !error;
  } catch {
    return false;
  }
};

// ==========================================
// Supabase Realtime — تنبيهات انخفاض أسعار قائمة المراقبة
// ==========================================

export type RealtimeConnectionState =
  | 'unconfigured'
  | 'connecting'
  | 'subscribed'
  | 'channel_error'
  | 'closed';

export interface RealtimePriceDropEvent {
  id: string;
  productId: string;
  productName: string;
  storeId?: string;
  storeName: string;
  oldPrice: number;
  newPrice: number;
  dropAmount: number;
  dropPercent: number;
  targetPrice?: number;
  reachedTarget: boolean;
  source: 'postgres_changes' | 'broadcast';
  receivedAt: string;
}

export interface PublishPriceDropInput {
  productId: string;
  productName: string;
  storeId?: string;
  storeName: string;
  oldPrice: number;
  newPrice: number;
  targetPrice?: number;
}

const REALTIME_CHANNEL_NAME = 'hkeeem-price-radar-watchlist';

// مزامنة قائمة المراقبة (Watchlist) مع سوبابيس
export const syncWatchlistAlertsToSupabase = async (alerts: PriceAlert[]): Promise<boolean> => {
  const client = getSupabaseClient();
  const sessionId = getOrCreateSessionId();

  try {
    localStorage.setItem('hkeeem_cached_watchlist_alerts', JSON.stringify(alerts));
  } catch {
    // ignore storage quota errors
  }

  if (!client) return false;

  try {
    if (alerts.length === 0) {
      await client.from('price_alerts').delete().eq('session_id', sessionId);
      return true;
    }

    const rows = alerts.map((a) => ({
      alert_id: a.id,
      session_id: sessionId,
      product_id: a.productId,
      product_name: a.productName,
      store_name: a.storeName,
      target_price: a.targetPrice,
      current_price: a.currentLowestPrice,
      triggered: a.triggered,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await client
      .from('price_alerts')
      .upsert(rows, { onConflict: 'session_id,product_id' });

    return !error;
  } catch (err) {
    console.warn('Error syncing watchlist alerts to Supabase:', err);
    return false;
  }
};

// الاشتراك الفوري عبر Supabase Realtime (Postgres Changes + Broadcast)
export const subscribeToWatchlistPriceDrops = (options: {
  getWatchlistAlerts: () => PriceAlert[];
  onPriceDrop: (event: RealtimePriceDropEvent) => void;
  onStatusChange: (status: RealtimeConnectionState) => void;
}): { channel: RealtimeChannel | null; unsubscribe: () => void } => {
  const client = getSupabaseClient();
  if (!client) {
    options.onStatusChange('unconfigured');
    return {
      channel: null,
      unsubscribe: () => {},
    };
  }

  options.onStatusChange('connecting');

  const handleCandidateDrop = (
    raw: {
      id?: string;
      productId?: string;
      productName?: string;
      storeId?: string;
      storeName?: string;
      oldPrice?: number;
      newPrice?: number;
      receivedAt?: string;
    },
    source: 'postgres_changes' | 'broadcast'
  ) => {
    const productId = raw.productId;
    const newPrice = Number(raw.newPrice);
    if (!productId || !Number.isFinite(newPrice) || newPrice <= 0) return;

    const watchlist = options.getWatchlistAlerts();
    const matchedAlert = watchlist.find((a) => a.productId === productId);
    if (!matchedAlert) return;

    const oldPrice =
      Number.isFinite(Number(raw.oldPrice)) && Number(raw.oldPrice) > 0
        ? Number(raw.oldPrice)
        : matchedAlert.currentLowestPrice;

    // أرسل التنبيه فقط عند حدوث انخفاض فعلي في السعر
    if (newPrice >= oldPrice) return;

    const dropAmount = Number((oldPrice - newPrice).toFixed(2));
    const dropPercent = oldPrice > 0 ? Math.max(1, Math.round((dropAmount / oldPrice) * 100)) : 0;
    const reachedTarget = newPrice <= matchedAlert.targetPrice;

    const event: RealtimePriceDropEvent = {
      id: raw.id || `drop_${productId}_${newPrice.toFixed(2)}_${Math.floor(Date.now() / 1000)}`,
      productId,
      productName: raw.productName || matchedAlert.productName,
      storeId: raw.storeId,
      storeName: raw.storeName || matchedAlert.storeName,
      oldPrice: Number(oldPrice.toFixed(2)),
      newPrice: Number(newPrice.toFixed(2)),
      dropAmount,
      dropPercent,
      targetPrice: matchedAlert.targetPrice,
      reachedTarget,
      source,
      receivedAt:
        raw.receivedAt ||
        new Date().toLocaleTimeString('ar-SA', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
    };

    options.onPriceDrop(event);
  };

  const channel = client
    .channel(REALTIME_CHANNEL_NAME, {
      config: {
        broadcast: { self: true },
      },
    })
    // 1. الاستماع الفوري لتغييرات جدول تحديثات الأسعار (Postgres Changes)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'price_updates',
      },
      (payload: any) => {
        const record = payload?.new;
        if (!record) return;
        handleCandidateDrop(
          {
            id: record.id ? `pg_upd_${record.id}` : undefined,
            productId: record.product_id,
            productName: record.product_name,
            storeId: record.store_id,
            storeName: record.store_name,
            oldPrice: Number(record.old_price),
            newPrice: Number(record.new_price),
          },
          'postgres_changes'
        );
      }
    )
    // 2. الاستماع لتحديثات جدول قائمة المراقبة نفسها (Postgres Changes)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'price_alerts',
      },
      (payload: any) => {
        const record = payload?.new;
        const previous = payload?.old;
        if (!record) return;
        handleCandidateDrop(
          {
            id: record.id ? `pg_alert_${record.id}_${record.current_price}` : undefined,
            productId: record.product_id,
            productName: record.product_name,
            storeName: record.store_name,
            oldPrice: Number(previous?.current_price),
            newPrice: Number(record.current_price),
          },
          'postgres_changes'
        );
      }
    )
    // 3. الاستماع لقناة البث الفوري (Supabase Realtime Broadcast)
    .on('broadcast', { event: 'price_drop' }, ({ payload }: { payload: any }) => {
      if (!payload) return;
      handleCandidateDrop(
        {
          id: payload.id,
          productId: payload.productId,
          productName: payload.productName,
          storeId: payload.storeId,
          storeName: payload.storeName,
          oldPrice: Number(payload.oldPrice),
          newPrice: Number(payload.newPrice),
          receivedAt: payload.receivedAt,
        },
        'broadcast'
      );
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        options.onStatusChange('subscribed');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        options.onStatusChange('channel_error');
      } else if (status === 'CLOSED') {
        options.onStatusChange('closed');
      }
    });

  return {
    channel,
    unsubscribe: () => {
      client.removeChannel(channel).catch(() => {});
    },
  };
};

// نشر تحديث انخفاض سعر فعلي عبر Supabase Realtime (جدول price_updates + بث Broadcast)
export const publishRealtimePriceDrop = async (
  channel: RealtimeChannel | null,
  input: PublishPriceDropInput
): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  if (!client || !channel) {
    return {
      success: false,
      error: 'قناة Supabase Realtime غير متصلة حالياً. اربط مشروع Supabase أولاً.',
    };
  }

  const eventId = `drop_${input.productId}_${Date.now()}`;
  const receivedAt = new Date().toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  try {
    // محاولة تسجيل التحديث في جدول price_updates إن كان مُنشأً في قاعدة البيانات
    try {
      await client.from('price_updates').insert({
        product_id: input.productId,
        product_name: input.productName,
        store_id: input.storeId || null,
        store_name: input.storeName,
        old_price: input.oldPrice,
        new_price: input.newPrice,
      });
    } catch {
      // استمر في بث التنبيه عبر Realtime Broadcast حتى لو لم يُنشأ الجدول بعد
    }

    // إرسال بث فوري عبر خادم Supabase Realtime WebSocket
    const status = await channel.send({
      type: 'broadcast',
      event: 'price_drop',
      payload: {
        id: eventId,
        productId: input.productId,
        productName: input.productName,
        storeId: input.storeId,
        storeName: input.storeName,
        oldPrice: input.oldPrice,
        newPrice: input.newPrice,
        targetPrice: input.targetPrice,
        receivedAt,
      },
    });

    if (status !== 'ok') {
      return {
        success: false,
        error: 'تعذر إرسال التحديث عبر قناة Supabase Realtime.',
      };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'حدث خطأ أثناء إرسال التحديث عبر Supabase Realtime.',
    };
  }
};

// توليد معرف جلسة فريد للمستخدم غير المسجل
export const getOrCreateSessionId = (): string => {
  if (typeof window === 'undefined') return 'session_default';
  let id = localStorage.getItem('hkeeem_session_id');
  if (!id) {
    id = 'usr_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem('hkeeem_session_id', id);
  }
  return id;
};

// كود SQL الجاهز الذي يمكن للمستخدم نسخه ولصقه في SQL Editor بمشروع سوبابيس
export const SUPABASE_SQL_SETUP_SCRIPT = `-- ==========================================
-- جداول منصة حكيم الذكية على Supabase
-- Project: pcycuavbjpqvfuwwqlso
-- ==========================================

-- 1. جدول سلات التوفير (Carts)
CREATE TABLE IF NOT EXISTS public.carts (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- تمكين RLS وسياسات الوصول المفتوحة للـ Anon
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all on carts" ON public.carts FOR ALL USING (true) WITH CHECK (true);

-- 2. جدول قائمة المفضلة (Wishlists)
CREATE TABLE IF NOT EXISTS public.wishlists (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  product_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all on wishlists" ON public.wishlists FOR ALL USING (true) WITH CHECK (true);

-- 3. جدول فواتير وطلبات الشراء السابقة (Orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  store TEXT NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  savings_amount NUMERIC(10,2) NOT NULL,
  items_count INT NOT NULL,
  order_date TEXT,
  payment_method TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- 4. جدول قائمة مراقبة الأسعار (Price Alerts Watchlist)
CREATE TABLE IF NOT EXISTS public.price_alerts (
  id BIGSERIAL PRIMARY KEY,
  alert_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  store_name TEXT,
  target_price NUMERIC(10,2) NOT NULL,
  current_price NUMERIC(10,2) NOT NULL,
  triggered BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (session_id, product_id)
);

ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all on price_alerts" ON public.price_alerts FOR ALL USING (true) WITH CHECK (true);

-- 5. جدول تحديثات الأسعار اللحظية (Realtime Price Updates)
CREATE TABLE IF NOT EXISTS public.price_updates (
  id BIGSERIAL PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  store_id TEXT,
  store_name TEXT NOT NULL,
  old_price NUMERIC(10,2) NOT NULL,
  new_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.price_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anon all on price_updates" ON public.price_updates FOR ALL USING (true) WITH CHECK (true);

-- تمكين Supabase Realtime لجداول السلات وقائمة المراقبة وتحديثات الأسعار
ALTER PUBLICATION supabase_realtime ADD TABLE public.carts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_updates;
`;

