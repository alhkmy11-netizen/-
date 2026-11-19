-- ==============================================================================
-- HkeeemAI - Supabase Architecture Schema
-- Long-Term Memory, Vector Embeddings (pgvector), Conversations & User Profiles
-- ==============================================================================

-- 1. تفعيل ملحق البحث الشعاعي pgvector
create extension if not exists vector;

-- 2. جدول الملف الشخصي وتفضيلات المستخدم الذكية
create table if not exists public.profiles (
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
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text default 'محادثة توفير ذكية',
  category text default 'shopping',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. جدول رسائل المحادثة (الذاكرة المؤقتة / السياق النشط)
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content text not null,
  tool_calls jsonb,
  tool_results jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. جدول الذاكرة طويلة المدى للتعلم الذاتي (Long-term Self-Learning Memory)
create table if not exists public.user_memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  memory_fact text not null,
  category text default 'preference',
  embedding vector(768),
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
