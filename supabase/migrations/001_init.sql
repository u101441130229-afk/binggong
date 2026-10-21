-- 兵工铸魂·智绘易学AI思政教学应用软件 V1.0
-- 初始化账号资料、测评结果与学习行为三张业务表及行级安全策略。
-- 本脚本可重复执行：表、索引和策略均采用幂等写法。

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  login_id text unique not null,
  name text not null,
  role text not null check (role in ('student', 'teacher', 'admin')),
  class_code text,
  major text,
  group_name text not null default '装备工程学院试点组',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  scores jsonb not null,
  profile_type text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  event_type text not null check (
    event_type in ('case_study', 'daily_question', 'ai_deepseek', 'ai_qwen')
  ),
  reference_id text,
  success boolean,
  created_at timestamptz not null default now()
);

create index if not exists profiles_class_code_idx on public.profiles (class_code);
create index if not exists assessment_results_user_id_idx on public.assessment_results (user_id);
create index if not exists assessment_results_created_at_idx on public.assessment_results (created_at);
create index if not exists activity_records_user_id_idx on public.activity_records (user_id);
create index if not exists activity_records_created_at_idx on public.activity_records (created_at);
create index if not exists activity_records_user_event_time_idx
  on public.activity_records (user_id, event_type, created_at desc);

-- 以 security definer 读取当前用户角色，避免策略互相递归；
-- 账号停用后返回空值，所有依赖角色的读取权限随之失效。
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid() and is_active = true
$$;

revoke all on function public.current_user_role() from public;
grant execute on function public.current_user_role() to authenticated;

alter table public.profiles enable row level security;
alter table public.assessment_results enable row level security;
alter table public.activity_records enable row level security;

-- 学生只能读取自己的资料；教师与管理员可读取全部。
-- 客户端没有任何写入策略，资料只能由 service_role 脚本维护。
drop policy if exists profiles_select_scope on public.profiles;
create policy profiles_select_scope
  on public.profiles
  for select
  to authenticated
  using (
    id = auth.uid()
    or public.current_user_role() in ('teacher', 'admin')
  );

-- 测评记录只追加：学生可读自己的、写自己的；教师与管理员只能读全部。
drop policy if exists assessment_results_select_scope on public.assessment_results;
create policy assessment_results_select_scope
  on public.assessment_results
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() in ('teacher', 'admin')
  );

drop policy if exists assessment_results_insert_own on public.assessment_results;
create policy assessment_results_insert_own
  on public.assessment_results
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.current_user_role() = 'student'
  );

-- 学习行为记录：学生只能写案例学习与每日问题；
-- AI 调用记录只允许 service_role 写入，避免客户端伪造使用次数。
drop policy if exists activity_records_select_scope on public.activity_records;
create policy activity_records_select_scope
  on public.activity_records
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.current_user_role() in ('teacher', 'admin')
  );

drop policy if exists activity_records_insert_own on public.activity_records;
create policy activity_records_insert_own
  on public.activity_records
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.current_user_role() = 'student'
    and event_type in ('case_study', 'daily_question')
  );
