/* ============================================================
   ABOUT.JS — Loads all About page content from Google Sheets
   NOTE: cms-config.js must be loaded before this file
         Remove any CMS_CONFIG you added manually here
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initScrollAnimations();
  initSidebarActiveLink();

  await Promise.all([
    loadSettings(),
    loadAboutContent(),
    loadValues(),
    loadPolicies(),
    loadTrailblazers(),
    loadSalientFeatures(),
  ]);
});

/* ── SETTINGS (footer, navbar) ── */
async function loadSettings() {
  try {
    const data = await cmsGet('get_settings');
    if (!data) return;
    document.querySelectorAll('[data-setting]').forEach(el => {
      const key = el.dataset.setting;
      if (data[key]) el.textContent = data[key];
    });
  } catch(e) {}
}

/* ── ALL CONTENT BLOCKS ── */
async function loadAboutContent() {
  try {
    const data = await cmsGet('get_content', { page: 'about' });
    if (!data) return;

    // About intro
    if (data.intro?.content) {
      const el = document.getElementById('aboutIntro');
      if (el) el.textContent = data.intro.content;
    }

    // Vision
    if (data.vision?.content) {
      const el = document.getElementById('visionContent');
      if (el) el.textContent = data.vision.content;
    }

    // Mission
    if (data.mission?.content) {
      const el = document.getElementById('missionContent');
      if (el) el.textContent = data.mission.content;
    }

    // Philosophy
    if (data.philosophy?.content) {
      const el = document.getElementById('philosophyContent');
      if (el) el.textContent = data.philosophy.content;
    }

    // DEAR
    if (data.dear?.content) {
      const el = document.getElementById('dearContent');
      if (el) el.textContent = data.dear.content;
    }

    // Director
    const dir = data.director || {};
    setEl('directorName',  dir.name);
    setEl('directorMsg',   dir.message || dir.quote);
    setPhoto('.msg-avatar-placeholder', 0, dir.photo_url, 'Director');

    // Principal
    const pri = data.principal || {};
    setEl('principalName', pri.name);
    setEl('principalMsg',  pri.message || pri.quote);
    setPhoto('.msg-avatar-placeholder', 1, pri.photo_url, 'Principal');

  } catch(e) { console.warn('About content failed', e); }
}

/* ── VALUES ── */
async function loadValues() {
  try {
    const items = await cmsGet('get_values');
    const el    = document.getElementById('valuesList');
    if (!el || !items || !items.length) return;

    el.innerHTML = items.map(v =>
      `<li>${v.value}</li>`
    ).join('');
  } catch(e) { console.warn('Values failed', e); }
}

/* ── POLICIES ── */
async function loadPolicies() {
  try {
    const items = await cmsGet('get_policies');
    if (!items || !items.length) return;

    // Replace each policy-block content
    items.forEach((pol, i) => {
      const block = document.querySelectorAll('.policy-block')[i];
      if (!block) {
        // Create new block if doesn't exist
        const parentEl = document.querySelector('#policies .content-box-body');
        if (!parentEl) return;
        const div = document.createElement('div');
        div.className = 'policy-block';
        div.innerHTML = `<div class="sub-section-title">${pol.policy_name}</div><p>${pol.content}</p>`;
        parentEl.appendChild(div);
      } else {
        const title = block.querySelector('.sub-section-title');
        const para  = block.querySelector('p');
        if (title) title.textContent = pol.policy_name;
        if (para)  para.textContent  = pol.content;
      }
    });
  } catch(e) { console.warn('Policies failed', e); }
}

/* ── TRAIL BLAZERS ── */
async function loadTrailblazers() {
  try {
    const items = await cmsGet('get_trailblazers');
    const grid  = document.getElementById('trailblazersGrid');
    if (!grid || !items || !items.length) return;

    grid.innerHTML = items.map(t => `
      <div class="trailblazer-card">
        <div class="tb-photo">
          ${t.photo_url
            ? `<img src="${t.photo_url}" style="width:100%;height:100%;object-fit:cover;" alt="${t.name}" onerror="this.parentElement.innerHTML='<div class=tb-photo-placeholder><span>Photo</span></div>'"/>`
            : `<div class="tb-photo-placeholder"><span>Photo</span></div>`}
        </div>
        <h4 class="tb-name">${t.name}</h4>
        <p class="tb-role">(${t.designation||''})${t.organization ? '<br>'+t.organization : ''}</p>
      </div>
    `).join('');
  } catch(e) { console.warn('Trailblazers failed', e); }
}

/* ── SALIENT FEATURES ── */
async function loadSalientFeatures() {
  try {
    const items = await cmsGet('get_salient');
    const parent = document.querySelector('#salient .content-box-body');
    if (!parent || !items || !items.length) return;

    // Clear existing static content and replace
    parent.innerHTML = items.map(s => `
      <div class="salient-block">
        <div class="sub-section-title">${s.title}</div>
        <div class="salient-grid">
          <div><p>${s.content}</p></div>
          ${s.image_url
            ? `<div class="salient-img-wrap"><img src="${s.image_url}" style="width:100%;border-radius:8px;" alt="${s.title}" onerror="this.remove()"/></div>`
            : ''}
        </div>
      </div>
    `).join('');
  } catch(e) { console.warn('Salient features failed', e); }
}

/* ── HELPERS ── */
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el && val) el.textContent = val;
}

function setPhoto(selector, index, url, alt) {
  if (!url) return;
  const els = document.querySelectorAll(selector);
  const el  = els[index];
  if (!el) return;
  el.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="${alt}" onerror="this.remove()"/>`;
}

/* ── SCROLL ANIMATIONS ── */
function initScrollAnimations() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.animate-on-scroll').forEach(el => obs.observe(el));
}

/* ── SIDEBAR ACTIVE LINK ── */
function initSidebarActiveLink() {
  const sections = document.querySelectorAll('.content-box[id]');
  const links    = document.querySelectorAll('.sidebar-link');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const a = document.querySelector(`.sidebar-link[href="#${entry.target.id}"]`);
        if (a) a.classList.add('active');
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  sections.forEach(s => obs.observe(s));
}
