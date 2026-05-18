/* ============================================================
   COMMON.JS — Shared JS for all pages
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  loadPartial('navbar-placeholder', 'navbar.html', () => {
    initNavbar();
    setActiveNav();
    loadSettingsIntoPage(); // load after navbar HTML is injected
  });
  loadPartial('footer-placeholder', 'footer.html', () => {
    initFooter();
    loadSettingsIntoPage(); // load after footer HTML is injected
  });
  initScrollTop();
  handleHashOnLoad();
});

/* ── Load HTML partials ── */
function loadPartial(targetId, file, callback) {
  const el = document.getElementById(targetId);
  if (!el) { callback && callback(); return; }
  fetch(file)
    .then(r => r.text())
    .then(html => { el.innerHTML = html; callback && callback(); })
    .catch(() => { callback && callback(); });
}

/* ── Load settings into page ── */
async function loadSettingsIntoPage() {
  if (typeof cmsGet !== 'function') return;
  try {
    const data = await cmsGet('get_settings');
    if (!data) return;

    // Update all [data-setting] elements
    document.querySelectorAll('[data-setting]').forEach(el => {
      const key = el.dataset.setting;
      if (data[key] && data[key].trim()) el.textContent = data[key];
    });

    // ERP login link
    const erp = document.getElementById('erpLoginLink');
    if (erp && data.erp_login_url && data.erp_login_url !== '#')
      erp.href = data.erp_login_url;

    // Social links in footer
    const socMap = {
      facebook_url : '.social-btn.fb',
      twitter_url  : '.social-btn.tw',
      youtube_url  : '.social-btn.yt',
      linkedin_url : '.social-btn.li',
    };
    Object.entries(socMap).forEach(([key, sel]) => {
      const el = document.querySelector(sel);
      if (el && data[key] && data[key] !== '#') el.href = data[key];
    });

    // Google Map in footer
    const mapFrame = document.querySelector('.footer-map iframe');
    if (mapFrame && data.map_embed_url && data.map_embed_url.trim())
      mapFrame.src = data.map_embed_url;

  } catch(e) {}
}

/* ── NAVBAR init ── */
function initNavbar() {
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('navMenu');
  if (!hamburger || !navMenu) return;

  hamburger.addEventListener('click', e => {
    e.stopPropagation();
    const open = navMenu.classList.toggle('open');
    hamburger.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
      navMenu.classList.remove('open');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Mobile dropdown toggle
  document.querySelectorAll('.nav-item.has-dropdown').forEach(item => {
    const link = item.querySelector('.nav-link');
    if (!link) return;
    link.addEventListener('click', e => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        document.querySelectorAll('.nav-item.has-dropdown')
          .forEach(o => { if (o !== item) o.classList.remove('open'); });
        item.classList.toggle('open');
      }
    });
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      navMenu.classList.remove('open');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

/* ── Set active nav ── */
function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.querySelector('.nav-link')?.getAttribute('href') || '';
    const hPage = href.split('#')[0].split('/').pop();
    if (hPage && hPage === page.split('#')[0]) item.classList.add('active');
  });
}

/* ── FOOTER init ── */
function initFooter() {
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
}

/* ── SCROLL TO TOP ── */
function initScrollTop() {
  const btn = document.getElementById('scrollTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── HASH ANCHOR on load ── */
function handleHashOnLoad() {
  if (!window.location.hash) return;
  setTimeout(() => {
    const target = document.querySelector(window.location.hash);
    if (!target) return;
    const navH = document.querySelector('.navbar')?.offsetHeight || 72;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH - 16, behavior: 'smooth' });
  }, 600);
}

/* ── Smooth hash clicks ── */
document.addEventListener('click', e => {
  const link = e.target.closest('a[href*="#"]');
  if (!link) return;
  const [page, hash] = (link.getAttribute('href') || '').split('#');
  if (!hash) return;
  const curPage = window.location.pathname.split('/').pop() || 'index.html';
  if (!page || page === '' || page === curPage) {
    const target = document.getElementById(hash);
    if (target) {
      e.preventDefault();
      const navH = document.querySelector('.navbar')?.offsetHeight || 72;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH - 16, behavior: 'smooth' });
    }
  }
}, { passive: false });
