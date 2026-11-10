-- Run this one-time migration in Supabase SQL Editor after the original school setup.
-- Adds a dedicated public photo gallery. Existing school data is not deleted.

create table if not exists public.school_gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  caption text,
  image_url text not null,
  storage_path text not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.school_gallery enable row level security;

drop policy if exists "Public can read published gallery" on public.school_gallery;
drop policy if exists "Staff can manage gallery" on public.school_gallery;

create policy "Public can read published gallery"
on public.school_gallery for select
using (published = true);

create policy "Staff can manage gallery"
on public.school_gallery for all to authenticated
using (true) with check (true);
