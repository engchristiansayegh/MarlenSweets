import { sb } from '../sb.js';
import { ic, toast, friendlyError, busy, field, formData } from '../ui.js';

const shell = (inner) => `
  <div class="auth">
    <div class="auth-card">
      <span class="logo logo--auth" role="img" aria-label="Marlen Sweets"></span>
      ${inner}
    </div>
    <a class="auth-back" href="/">← العودة إلى الموقع</a>
  </div>`;

export function loginView(el) {
  el.innerHTML = shell(`
    <h1>لوحة التحكم</h1>
    <p class="muted">سجلي الدخول لإدارة الموقع</p>
    <form class="form" novalidate>
      ${field({ name: 'email', label: 'البريد الإلكتروني', type: 'email', dir: 'ltr', required: true })}
      ${field({ name: 'password', label: 'كلمة المرور', type: 'password', dir: 'ltr', required: true })}
      <button class="btn btn--primary btn--lg btn--block" type="submit">${ic.lock}<span>دخول</span></button>
      <button class="link-btn" type="button" data-act="forgot">نسيتِ كلمة المرور؟</button>
    </form>`);
  const form = el.querySelector('form');
  form.email.setAttribute('autocomplete', 'username');
  form.password.setAttribute('autocomplete', 'current-password');
  form.email.focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { email, password } = formData(form);
    if (!email || !password) { toast('اكتبي الإيميل وكلمة المرور.', 'error'); return; }
    try {
      await busy(form.querySelector('[type=submit]'), 'جارٍ الدخول…', async () => {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      });
      // app.js reacts to the SIGNED_IN event
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  });

  form.querySelector('[data-act=forgot]').addEventListener('click', async (e) => {
    const email = form.email.value.trim();
    if (!email) { toast('اكتبي بريدك الإلكتروني أولًا ثم اضغطي "نسيتِ كلمة المرور".', 'error'); form.email.focus(); return; }
    try {
      await busy(e.currentTarget, 'جارٍ الإرسال…', async () => {
        const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: new URL('./', location.href).href });
        if (error) throw error;
      });
      toast('أرسلنا رابط تغيير كلمة المرور إلى بريدك. افتحيه من نفس هذا المتصفح.', 'success', 9000);
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  });
}

// Shown after opening the "reset password" link from the email
export function newPasswordView(el, onDone) {
  el.innerHTML = shell(`
    <h1>كلمة مرور جديدة</h1>
    <p class="muted">اختاري كلمة مرور جديدة لحسابك</p>
    <form class="form" novalidate>
      ${field({ name: 'password', label: 'كلمة المرور الجديدة', type: 'password', dir: 'ltr', hint: '8 أحرف على الأقل.' })}
      ${field({ name: 'password2', label: 'تأكيد كلمة المرور', type: 'password', dir: 'ltr' })}
      <button class="btn btn--primary btn--lg btn--block" type="submit">${ic.check}<span>حفظ</span></button>
    </form>`);
  const form = el.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { password, password2 } = formData(form);
    if (password.length < 8) { toast('كلمة المرور يجب أن تكون 8 أحرف على الأقل.', 'error'); return; }
    if (password !== password2) { toast('كلمتا المرور غير متطابقتين.', 'error'); return; }
    try {
      await busy(form.querySelector('[type=submit]'), 'جارٍ الحفظ…', async () => {
        const { error } = await sb.auth.updateUser({ password });
        if (error) throw error;
      });
      toast('تم تغيير كلمة المرور بنجاح');
      onDone();
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  });
}
