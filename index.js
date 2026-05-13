/* ============================================================
   INDEX.JS — Homepage: loads ALL content from Google Sheets
   NOTE: cms-config.js must be loaded before this file
         Remove any CMS_CONFIG you added manually here
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initBirthdayDate();
  initScrollAnimations();

  // Load everything from Sheets in parallel
  await Promise.all([
    loadSettings(),
    loadSlider(),
    loadNewsTicker(),
    loadQuickLinks(),
    loadToppers(),
    loadBirthdays(),
    loadCirculars(),
    loadDepartments(),
    loadDirectorPrincipal(),
    loadGalleryPreview(),
    loadPartners(),
    loadAboutText(),
  ]);

  // Slider must init AFTER slides are injected into DOM
  initSlider();
  initStatCounters();
  duplicatePartners();
  initScrollAnimations(); // re-run for newly added elements
});

/* ── SETTINGS ── */
async function loadSettings() {
  try {
    const data = await cmsGet('get_settings');
    if (!data) return;
    document.querySelectorAll('[data-setting]').forEach(el => {
      const key = el.dataset.setting;
      if (data[key]) el.textContent = data[key];
    });
  } catch(e) { console.warn('Settings load failed', e); }
}

/* ── HERO SLIDER ── */
async function loadSlider() {
  try {
    const slides = await cmsGet('get_slider');
    const track  = document.getElementById('sliderTrack');
    if (!track || !slides || !slides.length) return;

    track.innerHTML = slides.map(s => `
      <div class="slide" style="background:${s.bg_color || '#1a3a6b'};">
        ${s.image_url ? `<img src="${s.image_url}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.35;" onerror="this.remove()"/>` : ''}
        <div class="slide-overlay"></div>
        <div class="slide-content">
          ${s.tag ? `<span class="slide-tag">${s.tag}</span>` : ''}
          <h1 class="slide-title">${s.title || ''}</h1>
          ${s.subtitle ? `<p class="slide-sub">${s.subtitle}</p>` : ''}
          <div class="slide-actions">
            ${s.button1_text ? `<a href="${s.button1_link||'#'}" class="btn btn-red">${s.button1_text}</a>` : ''}
            ${s.button2_text ? `<a href="${s.button2_link||'#'}" class="btn btn-outline" style="color:#fff;border-color:#fff;">${s.button2_text}</a>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  } catch(e) { console.warn('Slider load failed', e); }
}

/* ── NEWS TICKER ── */
async function loadNewsTicker() {
  try {
    const items = await cmsGet('get_news');
    const track = document.getElementById('tickerTrack');
    if (!track || !items || !items.length) return;

    track.innerHTML = items.map(n =>
      `<span class="ticker-item">${n.news_text}${n.link_url ? ` — <a href="${n.link_url}">Read More</a>` : ''}</span>`
    ).join('');
  } catch(e) { console.warn('News ticker load failed', e); }
}

/* ── QUICK LINKS ── */
async function loadQuickLinks() {
  try {
    const items = await cmsGet('get_quicklinks');
    const grid  = document.querySelector('.quick-links-grid');
    if (!grid || !items || !items.length) return;

    const icons = {
      form: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>`,
      users: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
      book: `<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>`,
      phone: `<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>`,
    };

    grid.innerHTML = items.map(q => `
      <a href="${q.link_url||'#'}" class="quick-link-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
          ${icons[q.icon] || icons.form}
        </svg>
        <span>${q.label}</span>
      </a>
    `).join('');
  } catch(e) { console.warn('Quick links load failed', e); }
}

/* ── ABOUT TEXT (homepage) ── */
async function loadAboutText() {
  try {
    const data = await cmsGet('get_content', { page:'about', section:'intro' });
    if (!data || !data.intro) return;
    const el = document.querySelector('#about-home .about-para');
    if (el && data.intro.content) el.textContent = data.intro.content;
  } catch(e) { console.warn('About text load failed', e); }
}

/* ── TOPPERS ── */
async function loadToppers() {
  try {
    const items = await cmsGet('get_toppers');
    const wrap  = document.querySelector('.topper-placeholder');
    if (!wrap) return;

    if (!items || !items.length) {
      wrap.innerHTML = `<p style="color:var(--gray);text-align:center;padding:30px 0;font-size:14px;">No toppers added yet</p>`;
      return;
    }

    wrap.innerHTML = items.map(t => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--gray-light);">
        <div style="width:48px;height:48px;border-radius:50%;overflow:hidden;border:2px solid var(--blue-dark);flex-shrink:0;background:var(--gray-light);display:flex;align-items:center;justify-content:center;">
          ${t.photo_url
            ? `<img src="${t.photo_url}" style="width:100%;height:100%;object-fit:cover;" alt="${t.student_name}" onerror="this.parentElement.textContent='👤'"/>`
            : `<span style="font-size:18px;">👤</span>`}
        </div>
        <div>
          <div style="font-weight:700;font-size:14px;color:var(--blue-dark);">${t.student_name}</div>
          <div style="font-size:12px;color:var(--gray);">Class ${t.class} — <strong style="color:var(--red);">${t.percentage}%</strong>${t.year ? ` (${t.year})` : ''}</div>
        </div>
      </div>
    `).join('');
  } catch(e) { console.warn('Toppers load failed', e); }
}

/* ── BIRTHDAYS ── */
async function loadBirthdays() {
  try {
    const now   = new Date();
    const dd    = String(now.getDate()).padStart(2,'0');
    const mm    = String(now.getMonth()+1).padStart(2,'0');
    const items = await cmsGet('get_birthdays', { date:`${dd}-${mm}` });
    const wraps = document.querySelectorAll('.topper-placeholder');
    const wrap  = wraps[1];
    if (!wrap) return;

    if (!items || !items.length) {
      wrap.innerHTML = `<p style="color:var(--gray);text-align:center;padding:20px 0;font-size:14px;">No birthdays today 🎂</p>`;
      return;
    }

    wrap.innerHTML = items.map(b => `
      <div style="padding:8px 0;border-bottom:1px solid var(--gray-light);font-size:14px;">
        🎂 <strong>${b.student_name}</strong>
        <span style="color:var(--gray);font-size:12px;"> — Class ${b.class||''}</span>
      </div>
    `).join('');
  } catch(e) { console.warn('Birthdays load failed', e); }
}

/* ── CIRCULARS ── */
async function loadCirculars() {
  try {
    const items = await cmsGet('get_circulars');
    const wraps = document.querySelectorAll('.topper-placeholder');
    const wrap  = wraps[2];
    if (!wrap) return;

    if (!items || !items.length) {
      wrap.innerHTML = `<p style="color:var(--gray);text-align:center;padding:30px 0;font-size:14px;">No circulars yet</p>`;
      return;
    }

    wrap.innerHTML = items.map(c => `
      <div style="padding:9px 0;border-bottom:1px solid var(--gray-light);">
        <div style="font-size:13px;font-weight:600;">
          ${c.file_url
            ? `<a href="${c.file_url}" target="_blank" style="color:var(--blue-mid);">📄 ${c.title}</a>`
            : `📄 ${c.title}`}
        </div>
        ${c.date ? `<div style="font-size:11px;color:var(--gray);margin-top:2px;">${c.date}</div>` : ''}
      </div>
    `).join('');
  } catch(e) { console.warn('Circulars load failed', e); }
}

/* ── DEPARTMENTS ── */
async function loadDepartments() {
  try {
    const items = await cmsGet('get_departments');
    const grid  = document.getElementById('deptGrid');
    if (!grid || !items || !items.length) return;

    const fallbackColors = ['#1a3a6b','#c8102e','#1a6b3a','#6b3a1a'];

    grid.innerHTML = items.map((d, i) => `
      <div class="dept-card animate-on-scroll">
        <div class="dept-img" style="background:${d.bg_color||fallbackColors[i%4]};">
          ${d.image_url
            ? `<img src="${d.image_url}" style="width:100%;height:100%;object-fit:cover;opacity:0.6;" alt="" onerror="this.remove()"/>`
            : ''}
        </div>
        <div class="dept-body">
          <h4 class="dept-title">${d.dept_name}</h4>
          <p class="dept-desc">${d.short_desc||''}</p>
          <a href="${d.link_url||'#'}" class="dept-link">Read More ›</a>
        </div>
      </div>
    `).join('');
  } catch(e) { console.warn('Departments load failed', e); }
}

/* ── DIRECTOR & PRINCIPAL ── */
async function loadDirectorPrincipal() {
  try {
    const data = await cmsGet('get_content', { page:'about' });
    if (!data) return;

    const dir = data.director  || {};
    const pri = data.principal || {};

    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
    set('directorName',  dir.name);
    set('directorQuote', dir.quote);
    set('principalName', pri.name);
    set('principalQuote',pri.quote);

    const avatars = document.querySelectorAll('.message-card .avatar-placeholder');
    if (dir.photo_url && avatars[0])
      avatars[0].innerHTML = `<img src="${dir.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="Director"/>`;
    if (pri.photo_url && avatars[1])
      avatars[1].innerHTML = `<img src="${pri.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="Principal"/>`;
  } catch(e) { console.warn('Director/Principal load failed', e); }
}

/* ── GALLERY PREVIEW ── */
async function loadGalleryPreview() {
  try {
    const items = await cmsGet('get_gallery_albums');
    const grid  = document.getElementById('galleryPreviewGrid');
    if (!grid || !items || !items.length) return;

    grid.innerHTML = items.slice(0,4).map(g => `
      <div class="gallery-item animate-on-scroll">
        <div class="gallery-img-placeholder" style="${g.thumbnail_url ? 'background:#000;padding:0;' : ''}">
          ${g.thumbnail_url
            ? `<img src="${g.thumbnail_url}" style="width:100%;height:100%;object-fit:cover;" alt="${g.album_title}" onerror="this.parentElement.style.background='linear-gradient(135deg,var(--blue-dark),var(--blue-light))'"/>`
            : `<span>${g.album_title}</span>`}
        </div>
        <div class="gallery-overlay">
          <span>${g.album_title}</span>
          <a href="gallery.html#images" class="gallery-view-btn">+ View Gallery</a>
        </div>
      </div>
    `).join('');
  } catch(e) { console.warn('Gallery preview load failed', e); }
}

/* ── PARTNERS ── */
async function loadPartners() {
  try {
    const items = await cmsGet('get_partners');
    const track = document.getElementById('partnersTrack') || document.querySelector('.partners-track');
    if (!track || !items || !items.length) return;

    track.innerHTML = items.map(p =>
      `<div class="partner-logo">${p.logo_url
        ? `<img src="${p.logo_url}" alt="${p.name}" style="max-height:36px;max-width:120px;object-fit:contain;" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'${p.name}'}))"/>`
        : `<span>${p.name}</span>`
      }</div>`
    ).join('');

    duplicatePartners();
  } catch(e) { console.warn('Partners load failed', e); }
}

/* ── SLIDER INIT (called after slides injected) ── */
function initSlider() {
  const track = document.getElementById('sliderTrack');
  const dotsWrap = document.getElementById('sliderDots');
  const prevBtn  = document.getElementById('sliderPrev');
  const nextBtn  = document.getElementById('sliderNext');
  if (!track) return;

  const slides = track.querySelectorAll('.slide');
  if (!slides.length) return;

  let current = 0;
  let timer;

  dotsWrap.innerHTML = '';
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  function goTo(n) {
    slides[current].classList.remove('active');
    dotsWrap.children[current]?.classList.remove('active');
    current = (n + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    slides[current].classList.add('active');
    dotsWrap.children[current]?.classList.add('active');
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 5000);
  }

  slides[0].classList.add('active');
  prevBtn?.addEventListener('click', () => goTo(current - 1));
  nextBtn?.addEventListener('click', () => goTo(current + 1));
  let tx = 0;
  track.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive:true });
  track.addEventListener('touchend',   e => { const d = tx - e.changedTouches[0].clientX; if(Math.abs(d)>50) goTo(d>0?current+1:current-1); });
  timer = setInterval(() => goTo(current + 1), 5000);
}

/* ── STAT COUNTERS ── */
function initStatCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      let cur = 0;
      const step = target / (2000/16);
      const t = setInterval(() => {
        cur += step;
        if (cur >= target) { el.textContent = target.toLocaleString(); clearInterval(t); }
        else el.textContent = Math.floor(cur).toLocaleString();
      }, 16);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-number[data-target]').forEach(el => obs.observe(el));
}

/* ── SCROLL ANIMATIONS ── */
function initScrollAnimations() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('animate-in'), i * 80);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.animate-on-scroll:not(.animate-in)').forEach(el => obs.observe(el));
}

/* ── BIRTHDAY DATE ── */
function initBirthdayDate() {
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const now = new Date();
  const m = document.getElementById('bdMonth');
  const d = document.getElementById('bdDay');
  if (m) m.textContent = months[now.getMonth()];
  if (d) d.textContent = String(now.getDate()).padStart(2,'0');
}

/* ── PARTNERS DUPLICATE ── */
function duplicatePartners() {
  const track = document.querySelector('.partners-track');
  if (!track || track.dataset.dup) return;
  track.innerHTML += track.innerHTML;
  track.dataset.dup = '1';
}
