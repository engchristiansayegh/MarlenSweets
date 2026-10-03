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

-- Social links
update public.settings
set instagram_url = 'https://www.instagram.com/marlenakfali',
    facebook_url  = 'https://www.facebook.com/share/1E38fd67uG/'
where id = 1;

-- Starter questions (demo — edit them from /admin)
insert into public.faqs (question_ar, question_en, answer_ar, answer_en, sort_order)
select * from (values
  ('كيف أطلب؟', 'How do I order?',
   'اختر المنتج الذي يعجبك واضغط زر "اطلب عبر واتساب"، ستصلنا رسالة فيها اسم المنتج ونكمل معك التفاصيل.',
   'Pick the product you like and tap "Order on WhatsApp". We’ll receive a message with the product name and finish the details with you.', 1),
  ('هل يمكنني طلب قالب بتصميم خاص؟', 'Can I order a custom-designed cake?',
   'بالتأكيد! أرسل لنا فكرتك أو صورة للتصميم الذي تحبه مع الألوان والمناسبة، ونصمم لك قالبًا خاصًا.',
   'Of course! Send us your idea or a photo of a design you love, with your colours and occasion, and we’ll create a cake just for you.', 2),
  ('قبل كم يوم يجب أن أطلب؟', 'How far in advance should I order?',
   'ننصح بالطلب قبل يومين إلى ثلاثة أيام على الأقل، وقبل أسبوع لقوالب الأعراس والطلبات الكبيرة.',
   'We recommend ordering at least 2–3 days ahead, and one week ahead for wedding cakes and large orders.', 3),
  ('ما هي الأسعار؟', 'What are your prices?',
   'تختلف الأسعار حسب الحجم والتصميم، راسلنا على واتساب ونرسل لك السعر مباشرة.',
   'Prices depend on size and design — message us on WhatsApp and we’ll send you a quote right away.', 4),
  ('هل يوجد توصيل؟', 'Do you deliver?',
   'تواصل معنا عبر واتساب لمعرفة تفاصيل التوصيل إلى منطقتك.',
   'Contact us on WhatsApp to check delivery to your area.', 5)
) as v(question_ar, question_en, answer_ar, answer_en, sort_order)
where not exists (select 1 from public.faqs);
