-- Run this script in Supabase SQL Editor.
-- Create staff accounts in Authentication > Users. Never expose a service-role key.

create table if not exists public.school_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.school_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  venue text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.school_news enable row level security;
alter table public.school_events enable row level security;

-- Anyone can view published news and events.
create policy "Public can read published news" on public.school_news
  for select using (published = true);
create policy "Public can read published events" on public.school_events
  for select using (published = true);

-- Signed-in staff can manage website content. Only create accounts for trusted staff.
create policy "Staff can manage news" on public.school_news
  for all to authenticated using (true) with check (true);
create policy "Staff can manage events" on public.school_events
  for all to authenticated using (true) with check (true);

-- Public image bucket for photographs displayed on the school website.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('school-media', 'school-media', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "Anyone can view school photographs" on storage.objects
  for select using (bucket_id = 'school-media');
create policy "Signed-in staff can upload school photographs" on storage.objects
  for insert to authenticated with check (bucket_id = 'school-media');
create policy "Signed-in staff can delete school photographs" on storage.objects
  for delete to authenticated using (bucket_id = 'school-media');