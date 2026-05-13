// ============================================================
//  cms-config.js
//  Sulekh Convent Public School
//
//  ⚠️  ONLY THIS FILE needs to be updated when API URL changes
//  Include this file in ALL html pages before any other script
// ============================================================

const CMS_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbyJ4wacUTKX2WFW65wDpc0eHW0iEok2JmVDcJKUBu58cToQayriPL9SVIiWWT0QvdoRXA/exec',
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes cache
};

// ── Universal API caller ──────────────────────────────────
async function cmsGet(action, params = {}) {
  const url = new URL(CMS_CONFIG.API_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  // Check cache
  const cacheKey = url.toString();
  const cached   = sessionCache.get(cacheKey);
  if (cached) return cached;

  const res  = await fetch(url.toString());
  const json = await res.json();
  if (json.success) sessionCache.set(cacheKey, json.data);
  return json.success ? json.data : null;
}

async function cmsPost(action, body = {}) {
  const token = localStorage.getItem('cms_token') || '';
  const res   = await fetch(CMS_CONFIG.API_URL, {
    method : 'POST',
    body   : JSON.stringify({ action, token, ...body }),
  });
  return res.json();
}

// ── Simple in-memory cache ────────────────────────────────
const sessionCache = {
  _store: {},
  get(key) {
    const item = this._store[key];
    if (!item) return null;
    if (Date.now() > item.expiry) { delete this._store[key]; return null; }
    return item.data;
  },
  set(key, data) {
    this._store[key] = { data, expiry: Date.now() + CMS_CONFIG.CACHE_TTL };
  },
  clear() { this._store = {}; },
};
