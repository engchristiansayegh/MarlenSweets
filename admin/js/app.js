// Admin panel entry: auth gate, app shell (sidebar / bottom tabs) and a tiny hash router.
import { sb } from './sb.js';
import { ic, esc, confirmDialog, toast } from './ui.js';
import { loginView, newPasswordView } from './views/login.js';
import { dashboard } from './views/dashboard.js';
import { productsList, productEdit } from './views/products.js';
import { taxonomyList, taxonomyEdit } from './views/taxonomy.js';
import { faqsView } from './views/faqs.js';
import { settingsView } from './views/settings.js';
import { restoreView } from './views/restore.js';

const ADMIN_EMAIL = 'akfalymarlen@gmail.com'; // must match public.is_admin() in the SQL
const app = document.getElementById('app');

const NAV = [
  { hash: '#/', label: 'الرئيسية', icon: ic.home },
  { hash: '#/products', label: 'المنتجات', icon: ic.box },
  { hash: '#/categories', label: 'التصنيفات', icon: ic.grid },
  { hash: '#/occasions', label: 'المناسبات', icon: ic.heart },
  { hash: '#/faqs', label: 'الأسئلة', icon: ic.help },
  { hash: '#/settings', label: 'الإعدادات', icon: ic.settings },
];

const ROUTES = [
  [/^\/?$/, (el) => dashboard(el)],
  [/^\/products$/, (el) => productsList(el)],
  [/^\/products\/([\w-]+)$/, (el, ctx, id) => productEdit(el, id, ctx)],
  [/^\/categories$/, (el) => taxonomyList(el, 'categories')],
  [/^\/categories\/([\w-]+)$/, (el, ctx, id) => taxonomyEdit(el, 'categories', id, ctx)],
  [/^\/occasions$/, (el) => taxonomyList(el, 'occasions')],
  [/^\/occasions\/([\w-]+)$/, (el, ctx, id) => taxonomyEdit(el, 'occasions', id, ctx)],
  [/^\/faqs$/, (el) => faqsView(el)],
  [/^\/settings$/, (el, ctx) => settingsView(el, ctx)],
  [/^\/restore$/, (el) => restoreView(el)],
];

// small photo copy missing (older uploads) → show the full photo instead
document.addEventListener('error', (e) => {
  const el = e.target;
  if (el.tagName === 'IMG' && el.dataset.full && el.src !== el.dataset.full) {
    el.src = el.dataset.full;
    delete el.dataset.full;
  }
}, true);

/* ---------------------------------------------------------------- shell */
function shell(email) {
  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <a class="sidebar-brand" href="#/"><span class="logo logo--side" role="img" aria-label="Marlen Sweets"></span><small>لوحة التحكم</small></a>
        <nav class="sidenav">
          ${NAV.map((n) => `<a href="${n.hash}" data-nav="${n.hash}">${n.icon}<span>${n.label}</span></a>`).join('')}
        </nav>
        <div class="sidebar-foot">
          <a href="../" target="_blank" rel="noopener">${ic.external}<span>فتح الموقع</span></a>
          <button type="button" data-act="logout">${ic.logout}<span>تسجيل الخروج</span></button>
          <small class="muted" dir="ltr">${esc(email)}</small>
        </div>
      </aside>
      <header class="topbar">
        <a href="#/" class="topbar-brand"><span class="logo logo--top" role="img" aria-label="Marlen Sweets"></span></a>
        <div class="topbar-actions">
          <a class="icon-btn" href="../" target="_blank" rel="noopener" aria-label="فتح الموقع">${ic.external}</a>
          <button class="icon-btn" type="button" data-act="logout" aria-label="تسجيل الخروج">${ic.logout}</button>
        </div>
      </header>
      <main class="view" id="view"></main>
      <nav class="tabbar">
        ${NAV.map((n) => `<a href="${n.hash}" data-nav="${n.hash}">${n.icon}<span>${n.label}</span></a>`).join('')}
      </nav>
    </div>`;
  app.querySelectorAll('[data-act=logout]').forEach((b) => b.addEventListener('click', async () => {
    if (!(await confirmDialog('تسجيل الخروج من لوحة التحكم؟', { ok: 'خروج' }))) return;
    dirtyCheck = null;
    await sb.auth.signOut();
  }));
}

/* ---------------------------------------------------------------- router */
let dirtyCheck = null;
let currentHash = location.hash || '#/';

function go(hash, { replace = false } = {}) {
  dirtyCheck = null;
  if (replace) {
    history.replaceState(null, '', hash);
    currentHash = hash;
    route();
  } else {
    location.hash = hash;
  }
}

function route() {
  const view = document.getElementById('view');
  if (!view) return;
  const hash = location.hash || '#/';
  const [path, query] = hash.slice(1).split('?');
  dirtyCheck = null;

  const section = `#/${path.split('/')[1] || ''}`;
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === section));

  const found = ROUTES.map(([re, fn]) => [path.match(re), fn]).find(([m]) => m);
  view.classList.remove('view-enter');
  void view.offsetWidth;
  view.classList.add('view-enter');
  window.scrollTo(0, 0);
  if (!found) {
    view.innerHTML = `<div class="empty-box">${ic.alert}<p>الصفحة غير موجودة.</p><a class="btn btn--primary" href="#/">الرئيسية</a></div>`;
    return;
  }
  const [m, fn] = found;
  const ctx = { params: new URLSearchParams(query || ''), setDirtyCheck: (f) => { dirtyCheck = f; }, go };
  Promise.resolve(fn(view, ctx, ...m.slice(1))).catch((err) => {
    console.error(err);
    toast('حدث خطأ أثناء فتح الصفحة.', 'error');
  });
}

window.addEventListener('hashchange', async () => {
  if (location.hash === currentHash) return;
  if (dirtyCheck?.()) {
    const target = location.hash;
    history.replaceState(null, '', currentHash);
    const ok = await confirmDialog('لديك تغييرات غير محفوظة. المغادرة بدون حفظ؟', { ok: 'مغادرة بدون حفظ', danger: true });
    if (!ok) return;
    dirtyCheck = null;
    history.replaceState(null, '', target);
  }
  currentHash = location.hash;
  route();
});

window.addEventListener('beforeunload', (e) => {
  if (dirtyCheck?.()) { e.preventDefault(); e.returnValue = ''; }
});

/* ---------------------------------------------------------------- auth gate */
let mode = null; // 'login' | 'app' | 'recovery'

function showLogin() {
  if (mode === 'login') return;
  mode = 'login';
  document.body.classList.remove('is-app');
  loginView(app);
}

async function showApp(session) {
  const email = (session.user.email || '').toLowerCase();
  if (email !== ADMIN_EMAIL) {
    toast('هذا الحساب ليس لديه صلاحية الدخول إلى لوحة التحكم.', 'error');
    await sb.auth.signOut();
    return;
  }
  if (mode === 'app') return;
  mode = 'app';
  document.body.classList.add('is-app');
  shell(email);
  currentHash = location.hash || '#/';
  route();
}

sb.auth.onAuthStateChange((event, session) => {
  // strip ?code=… left by the password-reset link
  if (location.search) history.replaceState(null, '', location.pathname + location.hash);
  if (event === 'PASSWORD_RECOVERY') {
    mode = 'recovery';
    newPasswordView(app, () => { mode = null; showApp(session); });
    return;
  }
  if (mode === 'recovery') return;
  // defer: Supabase recommends not awaiting other auth calls inside this callback
  setTimeout(() => {
    if (!session) showLogin();
    else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') showApp(session);
  }, 0);
});
