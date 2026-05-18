/* ============================================================
   CMS-CONFIG.JS
   Single file — update only this when API URL changes
   Include BEFORE any other script on ALL pages
   ============================================================ */

const CMS_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbyJ4wacUTKX2WFW65wDpc0eHW0iEok2JmVDcJKUBu58cToQayriPL9SVIiWWT0QvdoRXA/exec',
  CACHE_MS: 5 * 60 * 1000, // 5 min cache
};

/* ── Simple cache ── */
const _cache = {
  _store: {},
  get(k) {
    const v = this._store[k];
    if (!v) return null;
    if (Date.now() > v.exp) { delete this._store[k]; return null; }
    return v.data;
  },
  set(k, d) { this._store[k] = { data: d, exp: Date.now() + CMS_CONFIG.CACHE_MS }; },
  clear()   { this._store = {}; },
};

/* ── Public GET (website pages use this — no token needed) ── */
async function cmsGet(action, params = {}) {
  const url = new URL(CMS_CONFIG.API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const key    = url.toString();
  const cached = _cache.get(key);
  if (cached) return cached;

  try {
    const res  = await fetch(key);
    const json = await res.json();
    if (json.success) { _cache.set(key, json.data); return json.data; }
    return null;
  } catch(e) {
    console.warn('cmsGet failed:', action, e);
    return null;
  }
}

/* ── POST (used by website enquiry form + CMS) ── */
async function cmsPost(action, body = {}) {
  try {
    const res  = await fetch(CMS_CONFIG.API_URL, {
      method : 'POST',
      body   : JSON.stringify({ action, ...body }),
    });
    return await res.json();
  } catch(e) {
    console.warn('cmsPost failed:', action, e);
    return { success: false, error: e.message };
  }
}
