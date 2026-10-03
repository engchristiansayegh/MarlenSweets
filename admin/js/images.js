// Image helpers: shrink photos in the browser before upload (saves storage + makes the site fast).
import { storage } from './sb.js';
import { imageUrl } from '/js/api.js';

export { imageUrl };

async function decode(file) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch { /* fall back */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressImage(file, { max = 1600, quality = 0.82 } = {}) {
  let src;
  try {
    src = await decode(file);
  } catch {
    throw new Error('لم نتمكن من قراءة هذه الصورة. جرّبي صورة أخرى (JPG أو PNG).');
  }
  const w0 = src.width, h0 = src.height;
  const scale = Math.min(1, max / Math.max(w0, h0));
  const w = Math.round(w0 * scale), h = Math.round(h0 * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, w, h);
  src.close?.();
  let blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', quality));
  if (!blob || blob.type !== 'image/webp') blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.86));
  return blob;
}

// Small copy used by cards and lists ("products/x/abc.webp" → "products/x/abc_sm.webp")
export const thumbPath = (path) => String(path || '').replace(/\.(webp|jpe?g|png)$/i, '_sm.$1');

const put = async (path, blob, upsert = false) => {
  const { error } = await storage().upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert });
  if (error) throw error;
};

/** Compresses + uploads one image (full size + small copy) into folder/, returns its storage path. */
export async function uploadImage(folder, file, opts) {
  const [blob, small] = await Promise.all([compressImage(file, opts), compressImage(file, { max: 640, quality: 0.78 })]);
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  // the small copy must use the same extension as the full one so thumbPath() finds it
  const smallBlob = small.type === blob.type ? small : blob;
  await Promise.all([put(path, blob), put(thumbPath(path), smallBlob)]);
  return path;
}

/** Creates the small copy for a photo uploaded before small copies existed. */
export async function makeThumb(path) {
  const res = await fetch(imageUrl(path), { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const src = await res.blob();
  const small = await compressImage(src, { max: 640, quality: 0.78 });
  await put(thumbPath(path), small, true);
}

/** Runs async jobs with a small concurrency limit (parallel uploads without choking the connection). */
export async function runLimited(items, limit, job) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      await job(items[i], i);
    }
  });
  await Promise.all(workers);
}

/** Deletes files (and their small copies) from storage. Failures are logged, not thrown. */
export async function removeFiles(paths) {
  const list = paths.filter(Boolean).flatMap((p) => [p, thumbPath(p)]);
  if (!list.length) return;
  const { error } = await storage().remove(list);
  if (error) console.warn('storage remove failed', error);
}
