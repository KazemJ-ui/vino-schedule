-- Схема базы «Вино & Хинкали» для Supabase.
-- Запуск: Supabase → SQL Editor → New query → вставить всё → Run.

create table if not exists schedule_periods (
  id bigserial primary key,
  period text not null,
  is_open boolean default false,
  created_at timestamptz default now()
);

create table if not exists schedule_requests (
  id bigserial primary key,
  period text not null,
  staff_name text not null,
  day text not null,
  preference text,
  created_at timestamptz default now()
);

create table if not exists published_schedule (
  id bigserial primary key,
  period text not null,
  day text not null,
  zone text,
  staff_name text,
  start_time text,
  created_at timestamptz default now()
);

create table if not exists day_assignments (
  id bigserial primary key,
  period text not null,
  day int not null,
  manager text,
  hostess text,
  bartender text,
  created_at timestamptz default now()
);

create table if not exists zone_history (
  id bigserial primary key,
  period text,
  staff_name text,
  zone text,
  day int,
  created_at timestamptz default now()
);

create table if not exists swap_history (
  id bigserial primary key,
  period text,
  day int,
  zone text,
  idx int,
  new_name text,
  created_at timestamptz default now()
);

create table if not exists swap_requests (
  id bigserial primary key,
  from_name text,
  day text,
  reason text,
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists pending_swaps (
  id bigserial primary key,
  day text,
  from_name text,
  to_name text,
  zone text,
  idx int,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id bigserial primary key,
  for_name text,
  message text,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table if not exists staff_sessions (
  staff_name text primary key,
  password_hash text,
  session_token text,
  created_at timestamptz default now()
);

create table if not exists messages (
  id bigserial primary key,
  author text,
  text text,
  created_at timestamptz default now()
);

create table if not exists roulette_results (
  id bigserial primary key,
  date text,
  winner text,
  created_at timestamptz default now()
);

create table if not exists sales_records (
  id bigserial primary key,
  staff_name text,
  month text,
  amount numeric,
  updated_by text,
  updated_at timestamptz default now()
);

create table if not exists newspaper_posts (
  id bigserial primary key,
  author text,
  headline text,
  text text,
  created_at timestamptz default now()
);

create table if not exists newspaper_comments (
  id bigserial primary key,
  post_id bigint references newspaper_posts(id) on delete cascade,
  author text,
  text text,
  created_at timestamptz default now()
);

create table if not exists newspaper_reactions (
  id bigserial primary key,
  post_id bigint references newspaper_posts(id) on delete cascade,
  author text,
  emoji text,
  created_at timestamptz default now(),
  unique (post_id, author, emoji)
);

-- Переключение реакции (раньше делал отдельный сервер)
create or replace function toggle_reaction(p_post_id bigint, p_author text, p_emoji text)
returns void language plpgsql security definer as $$
begin
  if exists (select 1 from newspaper_reactions
             where post_id = p_post_id and author = p_author and emoji = p_emoji) then
    delete from newspaper_reactions
     where post_id = p_post_id and author = p_author and emoji = p_emoji;
  else
    insert into newspaper_reactions (post_id, author, emoji) values (p_post_id, p_author, p_emoji);
  end if;
end $$;

-- Приложение работает без логина, как на старом сервере: открываем таблицы для анонимного ключа.
do $$
declare t text;
begin
  foreach t in array array[
    'schedule_periods','schedule_requests','published_schedule','day_assignments',
    'zone_history','swap_history','swap_requests','pending_swaps','notifications',
    'staff_sessions','messages','roulette_results','sales_records',
    'newspaper_posts','newspaper_comments','newspaper_reactions'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists anon_all on %I', t);
    execute format('create policy anon_all on %I for all to anon using (true) with check (true)', t);
    execute format('grant all on %I to anon', t);
  end loop;
end $$;

grant usage, select on all sequences in schema public to anon;
grant execute on function toggle_reaction(bigint, text, text) to anon;
