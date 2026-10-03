-- =====================================================================
--  Marlen Sweets — update 02
--  Hero photo framing: which part of the photo is shown (focus point) and zoom.
--  Paste into Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- =====================================================================

alter table public.settings add column if not exists hero_focus_x real not null default 50;  -- 0 = left edge, 100 = right edge (%)
alter table public.settings add column if not exists hero_focus_y real not null default 50;  -- 0 = top, 100 = bottom (%)
alter table public.settings add column if not exists hero_zoom    real not null default 1;   -- 1 = no zoom, up to 2.5

alter table public.settings drop constraint if exists settings_hero_focus_check;
alter table public.settings add constraint settings_hero_focus_check
  check (hero_focus_x between 0 and 100 and hero_focus_y between 0 and 100 and hero_zoom between 1 and 2.5);
