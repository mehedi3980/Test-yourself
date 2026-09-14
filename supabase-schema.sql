-- EduTest production database setup
-- Run this in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  role text not null check (role in ('master','admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  duration_minutes int not null default 20 check(duration_minutes between 1 and 180),
  questions_per_page int not null default 10 check(questions_per_page in (10,15,20)),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  question_text text not null,
  options jsonb not null,
  correct_index int not null check(correct_index between 0 and 3),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create or replace function public.set_exam_owner()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.owner_id is null then new.owner_id := auth.uid(); end if;
  return new;
end $$;

drop trigger if exists exam_owner_trigger on public.exams;
create trigger exam_owner_trigger before insert on public.exams
for each row execute function public.set_exam_owner();

create or replace function public.set_question_owner()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  select owner_id into new.owner_id from public.exams where id=new.exam_id;
  return new;
end $$;

drop trigger if exists question_owner_trigger on public.questions;
create trigger question_owner_trigger before insert or update on public.questions
for each row execute function public.set_question_owner();

create or replace function public.is_master()
returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='master' and active=true);
$$;

create or replace function public.resolve_username(p_username text)
returns text language sql stable security definer set search_path=public as $$
 select u.email
 from public.profiles p join auth.users u on u.id=p.id
 where lower(p.username)=lower(p_username) and p.active=true and p.role in ('master','admin')
 limit 1;
$$;

revoke all on function public.resolve_username(text) from public;
grant execute on function public.resolve_username(text) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.exams enable row level security;
alter table public.questions enable row level security;

drop policy if exists "profiles self or master" on public.profiles;
create policy "profiles self or master" on public.profiles for select to authenticated
using (id=auth.uid() or public.is_master());

drop policy if exists "exams owner or master" on public.exams;
create policy "exams owner or master" on public.exams for all to authenticated
using (owner_id=auth.uid() or public.is_master())
with check (owner_id=auth.uid() or public.is_master());

drop policy if exists "questions owner or master" on public.questions;
create policy "questions owner or master" on public.questions for all to authenticated
using (owner_id=auth.uid() or public.is_master())
with check (owner_id=auth.uid() or public.is_master());

-- Public visitors can read only published exam/question content.
-- IMPORTANT: correct_index is exposed by this simple client-side demo.
-- For high-stakes exams, move answer checking to a server-side Edge Function.
drop policy if exists "public published exams" on public.exams;
create policy "public published exams" on public.exams for select to anon,authenticated
using (published=true);

drop policy if exists "public published questions" on public.questions;
create policy "public published questions" on public.questions for select to anon,authenticated
using (exists(select 1 from public.exams e where e.id=exam_id and e.published=true));

-- First Master Admin:
-- 1) Create a user in Supabase Authentication > Users.
-- 2) Copy that user's UUID and run:
-- insert into public.profiles(id,username,role) values('AUTH_USER_UUID','masteradmin','master');
-- The normal Admin accounts are created by the Master Admin Edge Function.
