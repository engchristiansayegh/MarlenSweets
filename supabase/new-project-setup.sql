-- =====================================================================
--  Marlen Sweets — FULL SETUP for a NEW Supabase project (one file)
--  Tables + security (RLS) + storage + all features + YOUR saved data.
--  Paste the whole file into: SQL Editor → New query → Run.
-- =====================================================================

-- =====================================================================
--  Marlen Sweets — Supabase schema
--  Paste this whole file into: Supabase Dashboard → SQL Editor → New query → Run
--  Safe to run more than once.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) Admin check
--    The only account allowed to write. Change the email here if needed.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') = 'akfalymarlen@gmail.com';
$$;

-- keeps updated_at fresh on every update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1) Tables
-- ---------------------------------------------------------------------

-- Main categories: شوكولا، كاتو، كيك بوبس ...
create table if not exists public.categories (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name_ar         text not null,
  name_en         text not null,
  description_ar  text not null default '',
  description_en  text not null default '',
  image_path      text,                       -- path inside the "media" bucket
  sort_order      int  not null default 0,
  is_visible      boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Occasions: عيد ميلاد، أعراس، خطوبة ... (a product can belong to many)
create table if not exists public.occasions (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  name_ar         text not null,
  name_en         text not null,
  description_ar  text not null default '',
  description_en  text not null default '',
  icon            text not null default 'cake', -- built-in icon key used by the site
  image_path      text,
  sort_order      int  not null default 0,
  is_visible      boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.products (
  id              uuid primary key default gen_random_uuid(),
  category_id     uuid not null references public.categories(id) on delete restrict,
  slug            text not null unique,
  name_ar         text not null,
  name_en         text not null,
  description_ar  text not null default '',
  description_en  text not null default '',
  is_featured     boolean not null default false,  -- shown on the home page
  is_visible      boolean not null default true,
  sort_order      int  not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.product_images (
  id              uuid primary key default gen_random_uuid(),
  product_id      uuid not null references public.products(id) on delete cascade,
  path            text not null,               -- path inside the "media" bucket
  sort_order      int  not null default 0,
  created_at      timestamptz not null default now()
);

create table if not exists public.product_occasions (
  product_id      uuid not null references public.products(id)  on delete cascade,
  occasion_id     uuid not null references public.occasions(id) on delete cascade,
  primary key (product_id, occasion_id)
);

-- Site settings: exactly one row (id = 1)
create table if not exists public.settings (
  id                   smallint primary key default 1 check (id = 1),
  whatsapp             text not null default '',  -- international format, digits only: 9639XXXXXXXX
  email                text not null default '',
  instagram_url        text not null default '',
  facebook_url         text not null default '',
  address_ar           text not null default '',
  address_en           text not null default '',
  hero_title_ar        text not null default '',
  hero_title_en        text not null default '',
  hero_subtitle_ar     text not null default '',
  hero_subtitle_en     text not null default '',
  about_ar             text not null default '',
  about_en             text not null default '',
  whatsapp_message_ar  text not null default '',  -- {product} is replaced by the product name
  whatsapp_message_en  text not null default '',
  updated_at           timestamptz not null default now()
);

create index if not exists products_category_idx       on public.products (category_id, sort_order);
create index if not exists products_featured_idx       on public.products (is_featured) where is_featured;
create index if not exists product_images_product_idx  on public.product_images (product_id, sort_order);
create index if not exists product_occasions_occ_idx   on public.product_occasions (occasion_id);

drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

drop trigger if exists occasions_updated_at on public.occasions;
create trigger occasions_updated_at before update on public.occasions
  for each row execute function public.set_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists settings_updated_at on public.settings;
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2) Permissions (RLS decides what each role can actually touch)
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.occasions, public.products,
                public.product_images, public.product_occasions, public.settings
  to anon, authenticated;
grant insert, update, delete on public.categories, public.occasions, public.products,
                public.product_images, public.product_occasions, public.settings
  to authenticated;

alter table public.categories        enable row level security;
alter table public.occasions         enable row level security;
alter table public.products          enable row level security;
alter table public.product_images    enable row level security;
alter table public.product_occasions enable row level security;
alter table public.settings          enable row level security;

-- categories
drop policy if exists "categories: public read" on public.categories;
create policy "categories: public read" on public.categories
  for select to anon, authenticated
  using (is_visible or public.is_admin());

drop policy if exists "categories: admin write" on public.categories;
create policy "categories: admin write" on public.categories
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- occasions
drop policy if exists "occasions: public read" on public.occasions;
create policy "occasions: public read" on public.occasions
  for select to anon, authenticated
  using (is_visible or public.is_admin());

drop policy if exists "occasions: admin write" on public.occasions;
create policy "occasions: admin write" on public.occasions
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- products: visible only if the product AND its category are visible
drop policy if exists "products: public read" on public.products;
create policy "products: public read" on public.products
  for select to anon, authenticated
  using (
    public.is_admin()
    or (is_visible and exists (
          select 1 from public.categories c
          where c.id = category_id and c.is_visible))
  );

drop policy if exists "products: admin write" on public.products;
create policy "products: admin write" on public.products
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- product_images: follow the product's visibility
drop policy if exists "product_images: public read" on public.product_images;
create policy "product_images: public read" on public.product_images
  for select to anon, authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.products p
               where p.id = product_id and p.is_visible)
  );

drop policy if exists "product_images: admin write" on public.product_images;
create policy "product_images: admin write" on public.product_images
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- product_occasions
drop policy if exists "product_occasions: public read" on public.product_occasions;
create policy "product_occasions: public read" on public.product_occasions
  for select to anon, authenticated
  using (true);

drop policy if exists "product_occasions: admin write" on public.product_occasions;
create policy "product_occasions: admin write" on public.product_occasions
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- settings
drop policy if exists "settings: public read" on public.settings;
create policy "settings: public read" on public.settings
  for select to anon, authenticated
  using (true);

drop policy if exists "settings: admin write" on public.settings;
create policy "settings: admin write" on public.settings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 3) Storage bucket for images
--    Public read (anyone can view images by URL), only admin can upload/delete.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880,
        array['image/webp', 'image/jpeg', 'image/png', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media: admin select" on storage.objects;
create policy "media: admin select" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and public.is_admin());

drop policy if exists "media: admin insert" on storage.objects;
create policy "media: admin insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media: admin update" on storage.objects;
create policy "media: admin update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media: admin delete" on storage.objects;
create policy "media: admin delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());


insert into public.settings (id) values (1) on conflict (id) do nothing;

-- =====================================================================
--  Marlen Sweets — update 01
--  Adds: FAQ table (Q&A page), hero image setting, Instagram & Facebook links.
--  Paste into Supabase → SQL Editor → New query → Run. Safe to run more than once.
-- =====================================================================

-- Hero photo (uploaded from the admin panel later)
alter table public.settings add column if not exists hero_image_path text;

-- Questions & answers
create table if not exists public.faqs (
  id           uuid primary key default gen_random_uuid(),
  question_ar  text not null,
  question_en  text not null default '',
  answer_ar    text not null default '',
  answer_en    text not null default '',
  sort_order   int  not null default 0,
  is_visible   boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists faqs_updated_at on public.faqs;
create trigger faqs_updated_at before update on public.faqs
  for each row execute function public.set_updated_at();

grant select on public.faqs to anon, authenticated;
grant insert, update, delete on public.faqs to authenticated;
alter table public.faqs enable row level security;

drop policy if exists "faqs: public read" on public.faqs;
create policy "faqs: public read" on public.faqs
  for select to anon, authenticated
  using (is_visible or public.is_admin());

drop policy if exists "faqs: admin write" on public.faqs;
create policy "faqs: admin write" on public.faqs
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());


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

-- ---------------------------------------------------------------------
-- Your data (from the backup of the old project)
-- ---------------------------------------------------------------------
-- Marlen Sweets data restore. Run AFTER schema.sql, migration-01.sql and migration-02.sql.
begin;
update public.settings set whatsapp = '963955542024', email = 'akfalymarlen@gmail.com', instagram_url = 'https://www.instagram.com/marlenakfali', facebook_url = 'https://www.facebook.com/share/1E38fd67uG/', address_ar = 'سوريا، حلب — شارع الفيلات، جانب مشفى مظلوميان', address_en = 'Villat Street, next to Mazloumian Hospital, Aleppo, Syria', hero_title_ar = 'حلويات مصنوعة بحب، لكل مناسباتك', hero_title_en = 'Sweets made with love, for every occasion', hero_subtitle_ar = 'قوالب كاتو، شوكولا وكيك بوبس مصنوعة يدويًا بأجود المكونات، ومصممة خصيصًا لتفرح قلبك.', hero_subtitle_en = 'Handcrafted cakes, chocolates and cake pops made with the finest ingredients, designed to delight you.', about_ar = 'في Marlen Sweets نؤمن أن كل مناسبة تستحق لمسة حلوة. نصنع حلوياتنا يدويًا بعناية وحب، من اختيار المكونات إلى آخر تفصيلة في التزيين.', about_en = 'At Marlen Sweets we believe every occasion deserves a sweet touch. Everything is handmade with care and love, from choosing the ingredients to the very last detail of decoration.', whatsapp_message_ar = 'مرحبًا Marlen Sweets 🌸 أود طلب: {product}', whatsapp_message_en = 'Hello Marlen Sweets 🌸 I would like to order: {product}', hero_image_path = 'hero/8855a5ac-d845-4756-9783-8f3672e21176.webp' where id = 1;
insert into public.categories (id, slug, name_ar, name_en, description_ar, description_en, image_path, sort_order, is_visible, created_at, updated_at) values
  ('1fcfb8cb-b631-4867-8c91-7e30152b6176', 'chocolate', 'شوكولا', 'Chocolate', 'تشكيلة شوكولا فاخرة بنكهات مميزة', 'Premium chocolates in unique flavours', null, 1, true, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('eb55d944-1d44-4a3c-90ee-82c488d68a18', 'gateau', 'كاتو', 'Gateau', 'قوالب كاتو طرية بنكهات متنوعة', 'Soft cakes in a variety of flavours', null, 2, true, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('e9da99dc-f165-44c8-81bf-af723ab233e1', 'cake-pops', 'كيك بوبس', 'Cake Pops', 'قطع كيك صغيرة ملونة على عصا', 'Colourful bite-sized cake on a stick', null, 3, true, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('5f036f91-1d77-4194-a8ec-235d6be35d80', 'cupcakes', 'كب كيك', 'Cupcakes', 'كب كيك مزين لكل المناسبات', 'Decorated cupcakes for every occasion', null, 4, true, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('5ab6702d-5d92-4da2-85f7-34c6d7ab8502', 'cheese-cake', 'تشيذ كيك', 'Cheese Cake', '', '', 'categories/c6921665-ca24-4c83-8378-2cb94a9016f4.webp', 5, true, '2026-09-30T21:17:42.245598+00:00', '2026-09-30T21:17:47.937448+00:00')
on conflict do nothing;
insert into public.occasions (id, slug, name_ar, name_en, description_ar, description_en, icon, image_path, sort_order, is_visible, created_at, updated_at) values
  ('20f8e38c-eb2b-424a-a193-2bf2c991eeec', 'birthday', 'أعياد الميلاد', 'Birthday', '', '', 'birthday', null, 1, true, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('2f49ebda-8e48-4b56-8299-3ca7649f9ff0', 'wedding', 'أعراس', 'Wedding', '', '', 'wedding', null, 2, true, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('565cfc2a-c884-4211-b6fd-aa449b4b7147', 'engagement', 'خطوبة', 'Engagement', '', '', 'ring', null, 3, true, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('48a1412c-0bea-45e0-b115-fbb9e47dedad', 'anniversary', 'ذكرى زواج', 'Anniversary', '', '', 'heart', null, 4, true, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('2333101e-e215-4c02-88a0-25c97786a34d', 'kids', 'أطفال', 'Kids', '', '', 'kids', null, 5, true, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('466680e5-f51d-4f5e-8135-db9d6c4838ab', 'baby', 'مواليد', 'Baby Shower', '', '', 'baby', null, 6, true, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('d77e9970-49e1-4576-b422-093768f49290', 'graduation', 'تخرج', 'Graduation', '', '', 'graduation', null, 7, true, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00')
on conflict do nothing;
insert into public.faqs (id, question_ar, question_en, answer_ar, answer_en, sort_order, is_visible, created_at, updated_at) values
  ('43e4ca2d-4376-4964-835e-0691c2fd4ffe', 'كيف أطلب؟', 'How do I order?', 'اختر المنتج الذي يعجبك واضغط زر "اطلب عبر واتساب"، ستصلنا رسالة فيها اسم المنتج ونكمل معك التفاصيل.', 'Pick the product you like and tap "Order on WhatsApp". We’ll receive a message with the product name and finish the details with you.', 1, true, '2026-09-29T21:05:25.455025+00:00', '2026-09-29T21:05:25.455025+00:00'),
  ('d3056e10-3899-46b7-8622-2fb3360baf14', 'هل يمكنني طلب قالب بتصميم خاص؟', 'Can I order a custom-designed cake?', 'بالتأكيد! أرسل لنا فكرتك أو صورة للتصميم الذي تحبه مع الألوان والمناسبة، ونصمم لك قالبًا خاصًا.', 'Of course! Send us your idea or a photo of a design you love, with your colours and occasion, and we’ll create a cake just for you.', 2, true, '2026-09-29T21:05:25.455025+00:00', '2026-09-29T21:05:25.455025+00:00'),
  ('8ac362c2-eaa9-4ffc-8ddc-3a27c002d4a0', 'قبل كم يوم يجب أن أطلب؟', 'How far in advance should I order?', 'ننصح بالطلب قبل يومين إلى ثلاثة أيام على الأقل، وقبل أسبوع لقوالب الأعراس والطلبات الكبيرة.', 'We recommend ordering at least 2–3 days ahead, and one week ahead for wedding cakes and large orders.', 3, true, '2026-09-29T21:05:25.455025+00:00', '2026-09-29T21:05:25.455025+00:00'),
  ('04a21200-c9db-4193-95e6-06bfea3712ca', 'ما هي الأسعار؟', 'What are your prices?', 'تختلف الأسعار حسب الحجم والتصميم، راسلنا على واتساب ونرسل لك السعر مباشرة.', 'Prices depend on size and design — message us on WhatsApp and we’ll send you a quote right away.', 4, true, '2026-09-29T21:05:25.455025+00:00', '2026-09-29T21:05:25.455025+00:00'),
  ('b48d0951-7f0f-41e4-a9e4-d9e98290d3be', 'هل يوجد توصيل؟', 'Do you deliver?', 'تواصل معنا عبر واتساب لمعرفة تفاصيل التوصيل إلى منطقتك.', 'Contact us on WhatsApp to check delivery to your area.', 5, true, '2026-09-29T21:05:25.455025+00:00', '2026-09-29T21:05:25.455025+00:00')
on conflict do nothing;
insert into public.products (id, category_id, slug, name_ar, name_en, description_ar, description_en, is_featured, is_visible, sort_order, created_at, updated_at) values
  ('51deb37a-5e0f-4e2f-ad69-921acdd944d7', '1fcfb8cb-b631-4867-8c91-7e30152b6176', 'kinder-chocolate', 'شوكولا كيندر', 'Kinder Chocolate', 'شوكولا بالحليب محشوة بكريمة كيندر الناعمة.', 'Milk chocolate filled with smooth Kinder cream.', true, true, 1, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('6ce6319d-6abc-46f0-bbbf-344534eb71ac', '1fcfb8cb-b631-4867-8c91-7e30152b6176', 'dubai-chocolate', 'شوكولا دبي', 'Dubai Chocolate', 'شوكولا محشوة بالفستق الحلبي والكنافة المقرمشة.', 'Chocolate filled with pistachio cream and crispy kunafa.', true, true, 2, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('16dfd924-742f-4149-be5c-4ac38bacadc9', '1fcfb8cb-b631-4867-8c91-7e30152b6176', 'orange-chocolate', 'شوكولا برتقال', 'Orange Chocolate', 'شوكولا داكنة بنكهة البرتقال المنعشة.', 'Dark chocolate with a fresh orange twist.', false, true, 3, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('0e78c5df-99be-471c-be02-6e6e1467e68e', 'eb55d944-1d44-4a3c-90ee-82c488d68a18', 'lotus-gateau', 'كاتو لوتس', 'Lotus Gateau', 'كاتو طري بكريمة وبسكويت اللوتس.', 'Soft cake layered with Lotus cream and biscuits.', true, true, 1, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('86a63c7b-d767-40ba-9d92-ac3e7d6b461d', 'eb55d944-1d44-4a3c-90ee-82c488d68a18', 'birthday-cake', 'قالب عيد ميلاد', 'Birthday Cake', 'قالب مزين حسب الطلب مع الاسم والعمر.', 'Custom decorated cake with name and age.', true, true, 4, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('2f015b70-8135-448f-a7dc-fa469a366116', 'e9da99dc-f165-44c8-81bf-af723ab233e1', 'classic-cake-pops', 'كيك بوبس كلاسيك', 'Classic Cake Pops', 'كيك بوبس مغطى بالشوكولا بألوان من اختيارك.', 'Chocolate-coated cake pops in your colours.', false, true, 1, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('f6d6e29f-8467-4724-81a8-1f13d6c69b67', '5f036f91-1d77-4194-a8ec-235d6be35d80', 'rose-cupcakes', 'كب كيك الورد', 'Rose Cupcakes', 'كب كيك مزين بورود الكريمة.', 'Cupcakes topped with buttercream roses.', false, true, 1, '2026-09-29T17:55:03.970698+00:00', '2026-09-29T17:55:03.970698+00:00'),
  ('7b6bb852-3b15-425f-9b6c-67b0a91e0c73', 'eb55d944-1d44-4a3c-90ee-82c488d68a18', 'chocolate-gateau', 'كاتو شوكولا', 'Chocolate Gateau', 'كاتو غني بطبقات الشوكولا والغاناش.', 'Rich chocolate cake with ganache layers.', false, true, 3, '2026-09-29T17:55:03.970698+00:00', '2026-09-30T21:15:37.844059+00:00'),
  ('8069f26b-a02f-4129-8fc5-5f7d2969f153', 'eb55d944-1d44-4a3c-90ee-82c488d68a18', 'strawberry-gateau', 'كاتو فريز', 'Strawberry Gateau', 'كاتو بالفريز الطازج والكريمة الخفيفة.', 'Fresh strawberry cake with light cream.', true, true, 2, '2026-09-29T17:55:03.970698+00:00', '2026-09-30T21:16:22.46594+00:00'),
  ('0b93f66e-0cb3-4743-95e9-f319c933b72a', 'eb55d944-1d44-4a3c-90ee-82c488d68a18', 'wedding-cake', 'قالب عرس', 'Wedding Cake', 'قالب أعراس بعدة طبقات وتزيين أنيق.', 'Elegant multi-tier wedding cake.', true, true, 6, '2026-09-29T17:55:03.970698+00:00', '2026-09-30T21:16:38.56189+00:00'),
  ('b15bb50c-77ed-4c8f-a207-6025a800b478', '5ab6702d-5d92-4da2-85f7-34c6d7ab8502', 'pistachio-cheescake', 'تشيذ كيك فستق', 'pistachio cheescake', '', '', false, true, 0, '2026-09-30T21:19:17.686506+00:00', '2026-09-30T21:19:17.686506+00:00'),
  ('3308fd92-2fc9-4e5a-9a53-e8cde7aa55fb', 'eb55d944-1d44-4a3c-90ee-82c488d68a18', 'strawberry-cake', 'كاتو فريز', 'Strawberry Cake', '', '', false, true, 0, '2026-09-30T21:20:58.809741+00:00', '2026-09-30T21:20:58.809741+00:00')
on conflict do nothing;
insert into public.product_images (id, product_id, path, sort_order, created_at) values
  ('e9ccfd47-caa4-43aa-ac37-ea4fe8d09fff', '7b6bb852-3b15-425f-9b6c-67b0a91e0c73', 'products/7b6bb852-3b15-425f-9b6c-67b0a91e0c73/ff7436b6-7b73-4372-bb4c-52a40999c42c.webp', 0, '2026-09-30T21:15:43.439507+00:00'),
  ('83ef3f48-e769-4c00-9a2b-5beeac673b6f', '8069f26b-a02f-4129-8fc5-5f7d2969f153', 'products/8069f26b-a02f-4129-8fc5-5f7d2969f153/0473900f-110c-4ef7-9963-42a278706eb3.webp', 0, '2026-09-30T21:16:17.485187+00:00'),
  ('b5d655da-3ea9-46ce-a1e8-4b6fe9dc21d8', 'b15bb50c-77ed-4c8f-a207-6025a800b478', 'products/b15bb50c-77ed-4c8f-a207-6025a800b478/cf72ab21-a71e-4f3b-bdfc-36baadd26f65.webp', 0, '2026-09-30T21:19:20.589899+00:00'),
  ('7f83c041-3498-4fbe-904f-5accc2b54f91', '3308fd92-2fc9-4e5a-9a53-e8cde7aa55fb', 'products/3308fd92-2fc9-4e5a-9a53-e8cde7aa55fb/a2a6017f-f053-40dc-b085-8e9837be512d.webp', 0, '2026-09-30T21:21:03.949101+00:00')
on conflict do nothing;
insert into public.product_occasions (product_id, occasion_id) values
  ('86a63c7b-d767-40ba-9d92-ac3e7d6b461d', '20f8e38c-eb2b-424a-a193-2bf2c991eeec'),
  ('86a63c7b-d767-40ba-9d92-ac3e7d6b461d', '2333101e-e215-4c02-88a0-25c97786a34d'),
  ('0b93f66e-0cb3-4743-95e9-f319c933b72a', '2f49ebda-8e48-4b56-8299-3ca7649f9ff0'),
  ('0b93f66e-0cb3-4743-95e9-f319c933b72a', '565cfc2a-c884-4211-b6fd-aa449b4b7147'),
  ('2f015b70-8135-448f-a7dc-fa469a366116', '2333101e-e215-4c02-88a0-25c97786a34d'),
  ('2f015b70-8135-448f-a7dc-fa469a366116', '466680e5-f51d-4f5e-8135-db9d6c4838ab'),
  ('2f015b70-8135-448f-a7dc-fa469a366116', '20f8e38c-eb2b-424a-a193-2bf2c991eeec'),
  ('f6d6e29f-8467-4724-81a8-1f13d6c69b67', '466680e5-f51d-4f5e-8135-db9d6c4838ab'),
  ('f6d6e29f-8467-4724-81a8-1f13d6c69b67', 'd77e9970-49e1-4576-b422-093768f49290'),
  ('8069f26b-a02f-4129-8fc5-5f7d2969f153', '20f8e38c-eb2b-424a-a193-2bf2c991eeec'),
  ('7b6bb852-3b15-425f-9b6c-67b0a91e0c73', '20f8e38c-eb2b-424a-a193-2bf2c991eeec'),
  ('3308fd92-2fc9-4e5a-9a53-e8cde7aa55fb', 'd77e9970-49e1-4576-b422-093768f49290')
on conflict do nothing;
commit;
