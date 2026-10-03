// Read-only access to the public data (plain fetch → Supabase REST, no library needed).
import { SUPABASE_URL, SUPABASE_KEY, MEDIA_BUCKET } from './config.js';

const REST = `${SUPABASE_URL}/rest/v1`;

// Stale-while-revalidate: in "cache" mode, answers come instantly from the last visit
// (if any); boot() then re-runs the page load in "network" mode and refreshes the page.
let mode = 'network';
let usedCache = false;
export function setCacheMode(m) { mode = m; usedCache = false; }
export const servedFromCache = () => usedCache;
export const isCacheMode = () => mode === 'cache';
// Tell boot() the page was drawn from partial data, so it fetches fresh data afterwards
export const markStale = () => { usedCache = true; };

// Runs fn using saved answers only (throws instead of touching the network)
export async function cacheOnly(fn) {
  const prev = mode;
  mode = 'cache-only';
  try { return await fn(); } finally { mode = prev; }
}

async function get(path) {
  const key = `ms_c:${path}`;
  if (mode === 'cache' || mode === 'cache-only') {
    try {
      const hit = localStorage.getItem(key);
      if (hit) { usedCache = true; return JSON.parse(hit); }
    } catch { /* storage unavailable */ }
    if (mode === 'cache-only') throw new Error('not cached');
  }
  const res = await fetch(`${REST}/${path}`, { headers: { apikey: SUPABASE_KEY } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota / private mode */ }
  return data;
}

const PRODUCT_FIELDS =
  'id,slug,name_ar,name_en,description_ar,description_en,category_id,is_featured,sort_order,' +
  'product_images(path,sort_order)';

function normalizeProduct(p) {
  const images = (p.product_images || []).slice().sort((a, b) => a.sort_order - b.sort_order);
  return { ...p, images: images.map((i) => i.path) };
}

// Every product seen in a list is remembered, so its page can open instantly.
function remember(list) {
  try {
    for (const p of list) localStorage.setItem(`ms_p:${p.slug}`, JSON.stringify(p));
  } catch { /* ignore */ }
  return list;
}
export function peekProduct(slug) {
  try { return JSON.parse(localStorage.getItem(`ms_p:${slug}`) || 'null'); } catch { return null; }
}

// size 'sm' → the small copy made by the admin on upload (cards, lists, thumbnails)
export function imageUrl(path, size) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  const p = size === 'sm' ? path.replace(/\.(webp|jpe?g|png)$/i, '_sm.$1') : path;
  return `${SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/${p.split('/').map(encodeURIComponent).join('/')}`;
}

export async function getSettings() {
  const [row] = await get('settings?select=*&id=eq.1');
  return row || {};
}

export const getCategories = () =>
  get('categories?select=*&order=sort_order.asc,created_at.asc');

export const getOccasions = () =>
  get('occasions?select=*&order=sort_order.asc,created_at.asc');

export async function getFeatured(limit = 8) {
  const rows = await get(`products?select=${PRODUCT_FIELDS}&is_featured=eq.true&order=sort_order.asc,created_at.desc&limit=${limit}`);
  return remember(rows.map(normalizeProduct));
}

export async function getProducts({ categoryId, occasionId } = {}) {
  let q = `products?order=sort_order.asc,created_at.desc`;
  if (occasionId) {
    q += `&select=${PRODUCT_FIELDS},product_occasions!inner(occasion_id)&product_occasions.occasion_id=eq.${occasionId}`;
  } else {
    q += `&select=${PRODUCT_FIELDS}`;
  }
  if (categoryId) q += `&category_id=eq.${categoryId}`;
  return remember((await get(q)).map(normalizeProduct));
}

export const getFaqs = () =>
  get('faqs?select=id,question_ar,question_en,answer_ar,answer_en&order=sort_order.asc,created_at.asc');

// { [category_id]: number of visible products }
export async function getCategoryCounts() {
  const rows = await get('products?select=category_id');
  return rows.reduce((acc, r) => ((acc[r.category_id] = (acc[r.category_id] || 0) + 1), acc), {});
}

export async function getProduct(slug) {
  const rows = await get(
    `products?select=${PRODUCT_FIELDS},categories(id,slug,name_ar,name_en),` +
    `product_occasions(occasions(slug,name_ar,name_en,icon))&slug=eq.${encodeURIComponent(slug)}&limit=1`
  );
  if (!rows.length) return null;
  const p = normalizeProduct(rows[0]);
  p.category = p.categories;
  p.occasions = (p.product_occasions || []).map((po) => po.occasions).filter(Boolean);
  return p;
}
