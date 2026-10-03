// Language handling: Arabic (RTL, default) ⇄ English (LTR). Choice is remembered.
const KEY = 'ms_lang';

const dict = {
  ar: {
    'site.name': 'Marlen Sweets',
    'nav.home': 'الرئيسية',
    'nav.gallery': 'المعرض',
    'nav.about': 'من نحن',
    'nav.contact': 'تواصل معنا',
    'nav.faq': 'الأسئلة الشائعة',
    'nav.menu': 'القائمة',
    'nav.close': 'إغلاق',
    'lang.switch': 'English',
    'lang.label': 'Switch to English',

    'hero.badge': 'حلويات مصنوعة يدويًا',
    'hero.cta_gallery': 'تصفّح منتجاتنا',
    'hero.cta_whatsapp': 'اطلب عبر واتساب',
    'hero.scroll': 'اكتشف المزيد',

    'sec.occasions': 'حسب المناسبة',
    'sec.occasions_sub': 'قوالب وحلويات مصممة لكل لحظة مميزة',
    'sec.categories': 'تصنيفاتنا',
    'sec.categories_sub': 'اختر ما يحلو لك من تشكيلتنا',
    'sec.featured': 'منتجات مميزة',
    'sec.featured_sub': 'الأكثر طلبًا من زبائننا',
    'sec.view_all': 'عرض الكل',

    'card.order': 'اطلب',
    'card.details': 'التفاصيل',
    'card.products': (n) => (n === 0 ? 'قريبًا' : n === 1 ? 'منتج واحد' : n === 2 ? 'منتجان' : n <= 10 ? `${n} منتجات` : `${n} منتج`),

    'product.order': 'اطلب عبر واتساب',
    'product.occasions': 'مناسب لـ',
    'product.related': 'قد يعجبك أيضًا',
    'product.notfound': 'لم نجد هذا المنتج',
    'product.notfound_sub': 'ربما تم نقله أو حذفه. تصفّح المعرض لتجد ما يعجبك.',
    'product.back': 'العودة إلى المعرض',
    'product.prev': 'الصورة السابقة',
    'product.next': 'الصورة التالية',
    'product.zoom': 'تكبير الصورة',
    'product.note': 'الطلب والتفاصيل والسعر عبر واتساب مباشرة',

    'gallery.title': 'معرض المنتجات',
    'gallery.sub': 'تشكيلة من الحلويات المصنوعة بحب، اختر التصنيف أو المناسبة',
    'gallery.all': 'كل المنتجات',
    'gallery.categories': 'التصنيفات',
    'gallery.occasions': 'المناسبات',
    'gallery.empty': 'لا توجد منتجات هنا بعد',
    'gallery.empty_sub': 'نعمل على إضافة منتجات جديدة قريبًا.',

    'cta.title': 'عندك فكرة لقالب خاص؟',
    'cta.text': 'أخبرنا بتفاصيل مناسبتك وألوانك المفضلة، ونصمم لك قالبًا يشبهك تمامًا.',
    'cta.btn': 'راسلنا على واتساب',

    'faq.title': 'الأسئلة الشائعة',
    'faq.sub': 'إجابات لأكثر الأسئلة التي تصلنا',
    'faq.more': 'لم تجد إجابتك؟',
    'faq.more_text': 'راسلنا على واتساب وسنجيبك بكل سرور.',
    'faq.empty': 'لا توجد أسئلة بعد',

    'about.title': 'من نحن',
    'about.kicker': 'قصتنا',
    'about.sub': 'حكاية حلويات تُصنع بحب، من مطبخنا إلى مناسباتكم.',
    'about.v1': 'صنع يدوي',
    'about.v1_text': 'كل قطعة تُحضَّر يدويًا بعناية وتفاصيل دقيقة.',
    'about.v2': 'مكونات مختارة',
    'about.v2_text': 'نستخدم أجود المكونات لطعم لا يُنسى.',
    'about.v3': 'تصاميم خاصة',
    'about.v3_text': 'نصمم قوالب تناسب مناسبتك وذوقك.',

    'contact.title': 'تواصل معنا',
    'contact.sub': 'يسعدنا استقبال طلباتك واستفساراتك في أي وقت',
    'contact.whatsapp': 'واتساب',
    'contact.whatsapp_text': 'الطريقة الأسرع للطلب والاستفسار',
    'contact.instagram': 'إنستغرام',
    'contact.facebook': 'فيسبوك',
    'contact.follow': 'تابع أحدث أعمالنا',
    'contact.email': 'البريد الإلكتروني',
    'contact.address': 'العنوان',

    'footer.tagline': 'حلويات مصنوعة بحب لكل مناسباتك.',
    'footer.links': 'روابط',
    'footer.contact': 'تواصل',
    'footer.rights': 'جميع الحقوق محفوظة',

    'error.load': 'تعذّر تحميل البيانات. تحقق من الاتصال بالإنترنت.',
    'error.retry': 'إعادة المحاولة',
    'loading': 'جارٍ التحميل…',
  },
  en: {
    'site.name': 'Marlen Sweets',
    'nav.home': 'Home',
    'nav.gallery': 'Gallery',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.faq': 'FAQ',
    'nav.menu': 'Menu',
    'nav.close': 'Close',
    'lang.switch': 'العربية',
    'lang.label': 'التبديل إلى العربية',

    'hero.badge': 'Handcrafted sweets',
    'hero.cta_gallery': 'Browse our sweets',
    'hero.cta_whatsapp': 'Order on WhatsApp',
    'hero.scroll': 'Discover more',

    'sec.occasions': 'Shop by occasion',
    'sec.occasions_sub': 'Cakes and treats designed for every special moment',
    'sec.categories': 'Our categories',
    'sec.categories_sub': 'Pick your favourite from our collection',
    'sec.featured': 'Featured sweets',
    'sec.featured_sub': 'Our customers’ favourites',
    'sec.view_all': 'View all',

    'card.order': 'Order',
    'card.details': 'Details',
    'card.products': (n) => (n === 0 ? 'Coming soon' : n === 1 ? '1 item' : `${n} items`),

    'product.order': 'Order on WhatsApp',
    'product.occasions': 'Perfect for',
    'product.related': 'You may also like',
    'product.notfound': 'Product not found',
    'product.notfound_sub': 'It may have been moved or removed. Browse the gallery to find something you love.',
    'product.back': 'Back to gallery',
    'product.prev': 'Previous image',
    'product.next': 'Next image',
    'product.zoom': 'Zoom image',
    'product.note': 'Orders, details and prices directly on WhatsApp',

    'gallery.title': 'Our gallery',
    'gallery.sub': 'Sweets made with love — choose a category or an occasion',
    'gallery.all': 'All products',
    'gallery.categories': 'Categories',
    'gallery.occasions': 'Occasions',
    'gallery.empty': 'Nothing here yet',
    'gallery.empty_sub': 'New sweets are coming soon.',

    'cta.title': 'Dreaming of a custom cake?',
    'cta.text': 'Tell us about your occasion and favourite colours, and we’ll design a cake that feels just like you.',
    'cta.btn': 'Message us on WhatsApp',

    'faq.title': 'Questions & answers',
    'faq.sub': 'Answers to the questions we hear most',
    'faq.more': 'Didn’t find your answer?',
    'faq.more_text': 'Message us on WhatsApp — we’re happy to help.',
    'faq.empty': 'No questions yet',

    'about.title': 'About us',
    'about.kicker': 'Our story',
    'about.sub': 'The story of sweets made with love, from our kitchen to your celebrations.',
    'about.v1': 'Handmade',
    'about.v1_text': 'Every piece is prepared by hand with care and detail.',
    'about.v2': 'Selected ingredients',
    'about.v2_text': 'Only the finest ingredients for an unforgettable taste.',
    'about.v3': 'Custom designs',
    'about.v3_text': 'Cakes designed around your occasion and style.',

    'contact.title': 'Contact us',
    'contact.sub': 'We’d love to hear from you — orders and questions welcome anytime',
    'contact.whatsapp': 'WhatsApp',
    'contact.whatsapp_text': 'The fastest way to order or ask',
    'contact.instagram': 'Instagram',
    'contact.facebook': 'Facebook',
    'contact.follow': 'Follow our latest creations',
    'contact.email': 'Email',
    'contact.address': 'Address',

    'footer.tagline': 'Sweets made with love, for every occasion.',
    'footer.links': 'Links',
    'footer.contact': 'Contact',
    'footer.rights': 'All rights reserved',

    'error.load': 'We couldn’t load the content. Please check your connection.',
    'error.retry': 'Try again',
    'loading': 'Loading…',
  },
};

export function getLang() {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'ar' || v === 'en') return v;
  } catch { /* storage unavailable */ }
  return 'ar';
}

export function setLang(lang) {
  try { localStorage.setItem(KEY, lang); } catch { /* ignore */ }
  applyLang(lang);
}

export function applyLang(lang = getLang()) {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

export function t(key, ...args) {
  const lang = getLang();
  const v = dict[lang][key] ?? dict.ar[key] ?? key;
  return typeof v === 'function' ? v(...args) : v;
}

// Picks the right language field from a DB row: pick(row, 'name') → row.name_ar / row.name_en
export function pick(row, field) {
  if (!row) return '';
  const lang = getLang();
  const other = lang === 'ar' ? 'en' : 'ar';
  return row[`${field}_${lang}`] || row[`${field}_${other}`] || '';
}

// Fills static markup: <span data-i18n="nav.home"></span>, <a data-i18n-aria="nav.menu">
export function translateDom(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
}
