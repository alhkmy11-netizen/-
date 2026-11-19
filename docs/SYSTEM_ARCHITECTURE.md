# البنية التحتية البرمجية الشاملة لمنصة HkeeemAI (Lovable + Google AI Studio + Supabase)

يقدم هذا المستند المخطط الهندسي الشامل والشيفرات البرمجية الجاهزة (Boilerplate) لربط منصة **HkeeemAI** المبنية على بيئة **Lovable** مع **Google AI Studio (Gemini)**، قاعدة بيانات **Supabase** (للذاكرة والتعلم الذاتي)، أتمتة **GitHub Actions**، ومنظومة استدعاء الأدوات الخارجية (**Tool Calling**).

---

## 1. مخطط البنية التحتية الشامل (System Architecture Diagram)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Lovable Client (React 19)                       │
│  - User Interface (Chat, Offers, Cart Optimizer, Watchlist)            │
│  - Supabase Auth Client (JWT Bearer Token)                             │
│  - Streaming UI (ReadableStream / Server-Sent Events)                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / WSS
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               Backend / Supabase Edge Functions (Deno/Node)            │
│  - Authenticate User (RLS Context)                                     │
│  - Retrieve Long-Term Memory & User Profile (Supabase pgvector)        │
│  - Orchestrate Gemini Agent Loop (Function Calling Dispatcher)         │
└─────────────┬───────────────────────────┬──────────────────────────────┘
              │                           │
   Semantic Memory Query                  │ Direct Tool Invocation
              ▼                           ▼
┌───────────────────────────────┐  ┌─────────────────────────────────────┐
│       Supabase Database       │  │        External Tools & APIs        │
│  - PostgreSQL + pgvector      │  │  1. Coupon Engine (affiliate APIs)  │
│  - conversations & messages   │  │  2. Cashback Calculator (Mada/Visa) │
│  - user_memories (embeddings) │  │  3. Google Search Grounding         │
│  - user_preferences           │  │  4. Store Price Scraping            │
└───────────────────────────────┘  └─────────────────────────────────────┘
              ▲                                   ▲
              │ Context & Historical Embeddings   │ Tool Outputs
              └───────────────────┬───────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│              Google AI Studio (Gemini 2.5 Flash / Pro)                 │
│  - Model: gemini-2.5-flash (Low latency, high reasoning)               │
│  - Injected System Instructions (Saudi Consumer & Financial Advisor)   │
│  - Vector Semantic Context (Short & Long Term Memory)                  │
│  - Native Function Calling / Tool Calling (Declarations & Execution)   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. جدول المخطط البياني للبيانات (Database Schema for Supabase)

قم بتنفيذ استعلامات SQL التالية في **Supabase SQL Editor**:

```sql
-- 1. تفعيل ملحق البحث الشعاعي pgvector
create extension if not exists vector;

-- 2. جدول الملف الشخصي وتفضيلات المستخدم الذكية
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  city text default 'الرياض',
  monthly_budget numeric default 3000,
  preferred_stores text[] default array['العثيم', 'بنده', 'لولو', 'أمازون السعودية'],
  dietary_preferences text[] default array[]::text[],
  payment_methods text[] default array['mada', 'apple_pay', 'tamara'],
  savings_achieved numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. جدول جلسات المحادثة
create table public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text default 'محادثة توفير ذكية',
  category text default 'shopping',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. جدول رسائل المحادثة (الذاكرة المؤقتة / السياق النشط)
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  tool_calls jsonb,
  tool_results jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. جدول الذاكرة طويلة المدى للتعلم الذاتي (Long-term Self-Learning Memory)
create table public.user_memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  memory_fact text not null, -- حقيقة مستخلصة: "يفضل شراء حليب المراعي قليل الدسم فقط"
  category text default 'preference', -- 'preference', 'budget_habit', 'family_size'
  embedding vector(768), -- المتجه الشعاعي الناتج من text-embedding-004
  confidence numeric default 0.9,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. دالة استرجاع الحقائق والذاكرة ذات الصلة بالسياق (Vector Similarity Search)
create or replace function match_user_memories (
  query_embedding vector(768),
  target_user_id uuid,
  match_threshold float default 0.65,
  match_count int default 5
)
returns table (
  id uuid,
  memory_fact text,
  category text,
  similarity float
)
language plpgsql
security definer
as $$
begin
  return query
  select
    user_memories.id,
    user_memories.memory_fact,
    user_memories.category,
    1 - (user_memories.embedding <=> query_embedding) as similarity
  from user_memories
  where user_memories.user_id = target_user_id
    and 1 - (user_memories.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;

-- 7. تفعيل سياسات الأمان (Row Level Security - RLS)
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.user_memories enable row level security;

create policy "Users can view own profile" on public.profiles for all using (auth.uid() = id);
create policy "Users can manage conversations" on public.conversations for all using (auth.uid() = user_id);
create policy "Users can manage messages" on public.messages for all using (
  conversation_id in (select id from public.conversations where user_id = auth.uid())
);
create policy "Users can manage memories" on public.user_memories for all using (auth.uid() = user_id);
```

---

## 3. محرك الاتصال بـ Google AI Studio مع استدعاء الأدوات (AI Engine)

هذا الكود يمثل الـ Agent الكامل في Node.js / Express أو Supabase Edge Function:

```typescript
import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// تهيئة عميل الذكاء الاصطناعي
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// تهيئة عميل قاعدة البيانات Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// تعريف الأدوات البرمجية للنموذج (Tool Declarations)
const searchCouponsDeclaration: FunctionDeclaration = {
  name: 'search_coupons',
  description: 'البحث عن أحدث كود خصم فعال لمتجر معين في السعودية مع نسبة التوفير وشروط الاستخدام',
  parameters: {
    type: Type.OBJECT,
    properties: {
      storeName: {
        type: Type.STRING,
        description: 'اسم المتجر مثل: نون، نمشي، جرير، أمازون، العثيم',
      },
      category: {
        type: Type.STRING,
        description: 'تصنيف المشتريات (إلكترونيات، بقالة، أزياء)',
      },
    },
    required: ['storeName'],
  },
};

const calculateCashbackDeclaration: FunctionDeclaration = {
  name: 'calculate_cashback',
  description: 'حساب أفضل نسبة كاش باك وعوائد مالية وفقاً لبطاقة الدفع والبنك السعودي (الراجحي، الأهلي، الإنماء، STC Pay، تمارا)',
  parameters: {
    type: Type.OBJECT,
    properties: {
      storeName: { type: Type.STRING },
      totalAmount: { type: Type.NUMBER },
      preferredCard: { type: Type.STRING },
    },
    required: ['storeName', 'totalAmount'],
  },
};

// تنفيذ الأدوات محلياً (Tool Resolvers)
async function executeTool(name: string, args: any) {
  if (name === 'search_coupons') {
    // محاكاة أو استدعاء API حقيقي لمنصة الكوبونات
    return {
      status: 'success',
      store: args.storeName,
      coupons: [
        { code: 'HKEEEM15', discount: '15%', minOrder: 100, verifiedAt: new Date().toISOString() },
        { code: 'SAVE10', discount: '10%', minOrder: 50, verifiedAt: new Date().toISOString() },
      ],
      tip: 'ينصح بالدمج مع بطاقة الراجحي الرقمية للحصول على كاش باك إضافي 3%',
    };
  }

  if (name === 'calculate_cashback') {
    const rate = args.preferredCard?.includes('stc') ? 0.05 : 0.02;
    const cashback = Number((args.totalAmount * rate).toFixed(2));
    return {
      store: args.storeName,
      cashbackAmount: cashback,
      ratePercentage: `${rate * 100}%`,
      recommendedPayment: 'بطاقة Urpay أو كاش باك بنك الإنماء للحد الأقصى',
    };
  }

  throw new Error(`أداة غير معروفة: ${name}`);
}

// الدالة الرئيسية لمعالجة محادثة حكيم الذكية واسترجاع الذاكرة
export async function runHkeeemAgent({
  userId,
  conversationId,
  userMessage,
}: {
  userId: string;
  conversationId: string;
  userMessage: string;
}) {
  // 1. توليد المتجه الشعاعي لرسالة المستخدم
  const embeddingResponse = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: userMessage,
  });
  const queryVector = embeddingResponse.embedding?.values;

  // 2. استرجاع الذاكرة طويلة المدى من Supabase
  let recalledMemories = '';
  if (queryVector) {
    const { data: memories } = await supabase.rpc('match_user_memories', {
      query_embedding: queryVector,
      target_user_id: userId,
      match_threshold: 0.65,
      match_count: 4,
    });
    if (memories && memories.length > 0) {
      recalledMemories = memories.map((m: any) => `- ${m.memory_fact}`).join('\n');
    }
  }

  // 3. استرجاع الملف الشخصي
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

  // 4. بناء التعليمات التوجيهية الحصيفة مع الذاكرة والتعلم الذاتي
  const systemInstruction = `
أنت "حكيم AI" (Hkeeem AI) - المستشار المالي والاستهلاكي الذكي الرائد في المملكة العربية السعودية.
مهمتك: مساعدة المستخدم على تحقيق أعلى وفورات مالية، اختيار أفضل العروض، واقتراح بدائل اقتصادية بجودة عالية.

ملف المستخدم وسياقه:
- الاسم: ${profile?.full_name || 'صديق حكيم'}
- المدينة: ${profile?.city || 'الرياض'}
- المتاجر المفضلة: ${profile?.preferred_stores?.join(', ') || 'العثيم، بنده، أمازون'}
- الميزانية الشهرية المستهدفة: ${profile?.monthly_budget || 3000} ريال سعودي

الذاكرة السابقة والحقائق المستخلصة عن المستخدم (تعلّم ذاتي مستمر):
${recalledMemories || '- لا توجد تفضيلات مسبقة مسجلة، استمع للمستخدم وتكيف مع احتياجاته.'}

قواعد الإجابة:
1. استخدم دائماً العملة بالريال السعودي (ر.س).
2. استدعِ أداة البحث عن الكوبونات وحاسبة الكاش باك متى ما ناسب السؤال.
3. التزم بالأمانة والواقعية وراعِ المتاجر السعودية المعروفة.
4. قدم النصيحة بأسلوب ودود، حصيف، ومباشر.
`;

  // 5. استدعاء Gemini مع الأدوات والذاكرة
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userMessage,
    config: {
      systemInstruction,
      tools: [{ functionDeclarations: [searchCouponsDeclaration, calculateCashbackDeclaration] }],
    },
  });

  // معالجة طلبات الأدوات (Tool Calling Execution Loop)
  if (response.functionCalls && response.functionCalls.length > 0) {
    const call = response.functionCalls[0];
    const toolResult = await executeTool(call.name, call.args);

    // إعادة النتيجة لـ Gemini لتوليد الرد النهائي
    const finalResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: userMessage }] },
        { role: 'model', parts: [{ functionCall: call }] },
        {
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: call.name,
                response: toolResult,
              },
            },
          ],
        },
      ],
      config: { systemInstruction },
    });

    return finalResponse.text;
  }

  return response.text;
}
```

---

## 4. خط أتمتة سير العمل والنشر (GitHub Actions CI/CD Pipeline)

احفظ هذا الملف في المسار `.github/workflows/deploy.yml`:

```yaml
name: Hkeeem AI CI/CD & Lovable Deployment

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  validate-and-build:
    name: Code Quality & Type Check
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Lint & TypeScript Verification
        run: npm run lint

      - name: Build Application
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}

  deploy:
    name: Deploy to Lovable / Production Hosting
    needs: validate-and-build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
      - name: Trigger Lovable / Vercel Webhook Deploy
        run: |
          echo "Triggering automated webhook deployment..."
          curl -X POST "${{ secrets.DEPLOY_WEBHOOK_URL }}" \
            -H "Content-Type: application/json" \
            -d '{"ref": "${{ github.ref }}", "commit": "${{ github.sha }}"}'
```

---

## 5. متغيرات البيئة المطلوبة (.env.example)

```env
# Google AI Studio Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase Credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Deployment Webhook
DEPLOY_WEBHOOK_URL=https://api.lovable.dev/v1/deploy-webhook
```
