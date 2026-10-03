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

-- ---------------------------------------------------------------------
-- 4) Starter data (demo — edit or delete it later from /admin)
-- ---------------------------------------------------------------------
insert into public.settings (id, whatsapp, email, instagram_url, facebook_url,
  address_ar, address_en,
  hero_title_ar, hero_title_en, hero_subtitle_ar, hero_subtitle_en,
  about_ar, about_en,
  whatsapp_message_ar, whatsapp_message_en)
values (1, '963955542024', 'akfalymarlen@gmail.com', '', '',
  'سوريا، حلب — شارع الفيلات، جانب مشفى مظلوميان',
  'Villas Street, next to Mazloumian Hospital, Aleppo, Syria',
  'حلويات مصنوعة بحب، لكل مناسباتك',
  'Sweets made with love, for every occasion',
  'قوالب كاتو، شوكولا وكيك بوبس مصنوعة يدويًا بأجود المكونات، ومصممة خصيصًا لتفرح قلبك.',
  'Handcrafted cakes, chocolates and cake pops made with the finest ingredients, designed to delight you.',
  'في Marlen Sweets نؤمن أن كل مناسبة تستحق لمسة حلوة. نصنع حلوياتنا يدويًا بعناية وحب، من اختيار المكونات إلى آخر تفصيلة في التزيين.',
  'At Marlen Sweets we believe every occasion deserves a sweet touch. Everything is handmade with care and love, from choosing the ingredients to the very last detail of decoration.',
  'مرحبًا Marlen Sweets 🌸 أود طلب: {product}',
  'Hello Marlen Sweets 🌸 I would like to order: {product}')
on conflict (id) do nothing;

insert into public.categories (slug, name_ar, name_en, description_ar, description_en, sort_order) values
  ('chocolate', 'شوكولا',   'Chocolate', 'تشكيلة شوكولا فاخرة بنكهات مميزة', 'Premium chocolates in unique flavours', 1),
  ('gateau',    'كاتو',     'Gateau',    'قوالب كاتو طرية بنكهات متنوعة',     'Soft cakes in a variety of flavours',   2),
  ('cake-pops', 'كيك بوبس', 'Cake Pops', 'قطع كيك صغيرة ملونة على عصا',        'Colourful bite-sized cake on a stick',  3),
  ('cupcakes',  'كب كيك',   'Cupcakes',  'كب كيك مزين لكل المناسبات',          'Decorated cupcakes for every occasion', 4)
on conflict (slug) do nothing;

insert into public.occasions (slug, name_ar, name_en, icon, sort_order) values
  ('birthday',    'أعياد الميلاد', 'Birthday',     'birthday',    1),
  ('wedding',     'أعراس',         'Wedding',      'wedding',     2),
  ('engagement',  'خطوبة',         'Engagement',   'ring',        3),
  ('anniversary', 'ذكرى زواج',     'Anniversary',  'heart',       4),
  ('kids',        'أطفال',         'Kids',         'kids',        5),
  ('baby',        'مواليد',        'Baby Shower',  'baby',        6),
  ('graduation',  'تخرج',          'Graduation',   'graduation',  7)
on conflict (slug) do nothing;

insert into public.products (category_id, slug, name_ar, name_en, description_ar, description_en, is_featured, sort_order)
select c.id, v.slug, v.name_ar, v.name_en, v.desc_ar, v.desc_en, v.featured, v.sort_order
from (values
  ('chocolate', 'kinder-chocolate',  'شوكولا كيندر',  'Kinder Chocolate',  'شوكولا بالحليب محشوة بكريمة كيندر الناعمة.', 'Milk chocolate filled with smooth Kinder cream.', true,  1),
  ('chocolate', 'dubai-chocolate',   'شوكولا دبي',    'Dubai Chocolate',   'شوكولا محشوة بالفستق الحلبي والكنافة المقرمشة.', 'Chocolate filled with pistachio cream and crispy kunafa.', true, 2),
  ('chocolate', 'orange-chocolate',  'شوكولا برتقال', 'Orange Chocolate',  'شوكولا داكنة بنكهة البرتقال المنعشة.', 'Dark chocolate with a fresh orange twist.', false, 3),
  ('gateau',    'lotus-gateau',      'كاتو لوتس',     'Lotus Gateau',      'كاتو طري بكريمة وبسكويت اللوتس.', 'Soft cake layered with Lotus cream and biscuits.', true, 1),
  ('gateau',    'strawberry-gateau', 'كاتو فريز',     'Strawberry Gateau', 'كاتو بالفريز الطازج والكريمة الخفيفة.', 'Fresh strawberry cake with light cream.', true, 2),
  ('gateau',    'chocolate-gateau',  'كاتو شوكولا',   'Chocolate Gateau',  'كاتو غني بطبقات الشوكولا والغاناش.', 'Rich chocolate cake with ganache layers.', false, 3),
  ('gateau',    'birthday-cake',     'قالب عيد ميلاد', 'Birthday Cake',    'قالب مزين حسب الطلب مع الاسم والعمر.', 'Custom decorated cake with name and age.', true, 4),
  ('gateau',    'wedding-cake',      'قالب عرس',      'Wedding Cake',      'قالب أعراس بعدة طبقات وتزيين أنيق.', 'Elegant multi-tier wedding cake.', true, 5),
  ('gateau',    'heart-cake',        'قالب قلب',      'Heart Cake',        'قالب على شكل قلب بتزيين فينتج ناعم.', 'Heart-shaped cake with soft vintage piping.', false, 6),
  ('cake-pops', 'classic-cake-pops', 'كيك بوبس كلاسيك', 'Classic Cake Pops', 'كيك بوبس مغطى بالشوكولا بألوان من اختيارك.', 'Chocolate-coated cake pops in your colours.', false, 1),
  ('cupcakes',  'rose-cupcakes',     'كب كيك الورد',  'Rose Cupcakes',     'كب كيك مزين بورود الكريمة.', 'Cupcakes topped with buttercream roses.', false, 1)
) as v(cat_slug, slug, name_ar, name_en, desc_ar, desc_en, featured, sort_order)
join public.categories c on c.slug = v.cat_slug
on conflict (slug) do nothing;

insert into public.product_occasions (product_id, occasion_id)
select p.id, o.id
from (values
  ('birthday-cake',     'birthday'),
  ('birthday-cake',     'kids'),
  ('wedding-cake',      'wedding'),
  ('wedding-cake',      'engagement'),
  ('heart-cake',        'anniversary'),
  ('heart-cake',        'engagement'),
  ('heart-cake',        'birthday'),
  ('classic-cake-pops', 'kids'),
  ('classic-cake-pops', 'baby'),
  ('classic-cake-pops', 'birthday'),
  ('rose-cupcakes',     'baby'),
  ('rose-cupcakes',     'graduation'),
  ('strawberry-gateau', 'birthday')
) as v(product_slug, occasion_slug)
join public.products  p on p.slug = v.product_slug
join public.occasions o on o.slug = v.occasion_slug
on conflict do nothing;
