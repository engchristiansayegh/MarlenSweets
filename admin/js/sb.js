// Supabase client for the admin panel (library is self-hosted in /admin/vendor).
import { SUPABASE_URL, SUPABASE_KEY, MEDIA_BUCKET } from '/js/config.js';

export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, storageKey: 'ms_admin_auth_v2', flowType: 'pkce' },
});

export const storage = () => sb.storage.from(MEDIA_BUCKET);

/*
 * Remembered answers (the connection can be very slow): a view gets the last known data instantly,
 * then `onFresh` is called with fresh data if anything changed in the meantime.
 */
const memo = new Map();
export async function remembered(key, fetcher, onFresh) {
  const fresh = fetcher().then((d) => { memo.set(key, d); return d; });
  if (memo.has(key)) {
    const old = memo.get(key);
    fresh.then((d) => { if (onFresh && JSON.stringify(d) !== JSON.stringify(old)) onFresh(d); }).catch((e) => console.warn(e));
    return old;
  }
  return fresh;
}
export const forget = (...keys) => keys.forEach((k) => memo.delete(k));

// Throws the Supabase error so callers can use try/catch
export async function q(promise) {
  const { data, error, count } = await promise;
  if (error) throw error;
  return count ?? data;
}
