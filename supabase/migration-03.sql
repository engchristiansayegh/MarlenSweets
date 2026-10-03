-- =====================================================================
--  Marlen Sweets — update 03
--  Background photo for the "About us" page (separate from the home photo) + its framing.
--  Paste into Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- =====================================================================

alter table public.settings add column if not exists about_image_path text;
alter table public.settings add column if not exists about_focus_x real not null default 50;
alter table public.settings add column if not exists about_focus_y real not null default 50;
alter table public.settings add column if not exists about_zoom    real not null default 1;

alter table public.settings drop constraint if exists settings_about_focus_check;
alter table public.settings add constraint settings_about_focus_check
  check (about_focus_x between 0 and 100 and about_focus_y between 0 and 100 and about_zoom between 1 and 2.5);
