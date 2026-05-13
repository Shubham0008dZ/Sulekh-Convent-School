/* ============================================================
   COMMON.JS — Shared JS for all pages
   Sulekh Convent Public School
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Load navbar + footer
  loadPartial('navbar-placeholder', 'navbar.html', initNavbar);
  loadPartial('footer-placeholder',  'footer.html',  initFooter);

  // Scroll to top button
  initScrollTop();

  // Handle hash anchor on load
  handleHashOnLoad();

  // Lazy image observer
  initLazyImages();
});

/* ── Load HTML partials (navbar / footer) ── */
function loadPartial(targetId, file, callback) {
  const target = document.getElementById(targetId);
  if (!target) { if (callback) callback(); return; }

  fetch(file)
    .then(r => r.text())
    .then(html => {
      target.innerHTML = html;
      if (callback) callback();
    })
    .catch(() => { if (callback) callback(); });
}

/* ── NAVBAR ── */
function initNavbar() {
  setActiveNav();

  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('navMenu');
  if (!hamburger || !navMenu) return;

  // Toggle
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navMenu.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
      navMenu.classList.remove('open');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Mobile: dropdown toggle on link click
  document.querySelectorAll('.nav-item.has-dropdown').forEach(item => {
    const link = item.querySelector('.nav-link');
    if (!link) return;
    link.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        // Close others
        document.querySelectorAll('.nav-item.has-dropdown').forEach(other => {
          if (other !== item) other.classList.remove('open');
        });
        item.classList.toggle('open');
      }
    });
  });

  // Close menu on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      navMenu.classList.remove('open');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  // Load settings into footer/navbar (school name, phone etc)
  loadSettingsIntoPage();
}

/* ── Set active nav item ── */
function setActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    const link = item.querySelector('.nav-link');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    const page = href.split('#')[0].split('/').pop();
    if (page && page === currentPage.split('#')[0]) {
      item.classList.add('active');
    }
  });
}

/* ── Load settings into page (data-setting elements) ── */
async function loadSettingsIntoPage() {
  if (typeof cmsGet !== 'function') return;
  try {
    const data = await cmsGet('get_settings');
    if (!data) return;
    document.querySelectorAll('[data-setting]').forEach(el => {
      const key = el.dataset.setting;
      if (data[key] && data[key].trim()) el.textContent = data[key];
    });
    // Update social links in footer
    const socials = { facebook_url:'fb', twitter_url:'tw', youtube_url:'yt', linkedin_url:'li' };
    Object.entries(socials).forEach(([key, cls]) => {
      const el = document.querySelector(`.social-btn.${cls}`);
      if (el && data[key]) el.href = data[key];
    });
  } catch(e) {}
}

/* ── FOOTER ── */
function initFooter() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  loadSettingsIntoPage();
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

/* ── HASH ANCHOR SCROLL ── */
function handleHashOnLoad() {
  if (!window.location.hash) return;
  const target = document.querySelector(window.location.hash);
  if (!target) return;
  setTimeout(() => {
    const navH = document.querySelector('.navbar')?.offsetHeight || 72;
    const top  = target.getBoundingClientRect().top + window.scrollY - navH - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  }, 500);
}

/* Smooth hash link clicks */
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href*="#"]');
  if (!link) return;
  const href = link.getAttribute('href') || '';
  const [page, hash] = href.split('#');
  if (!hash) return;

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const isSamePage  = !page || page === '' || page === currentPage;

  if (isSamePage) {
    const target = document.getElementById(hash);
    if (target) {
      e.preventDefault();
      const navH = document.querySelector('.navbar')?.offsetHeight || 72;
      const top  = target.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }
}, { passive: false });

/* ── LAZY IMAGE LOADING ── */
function initLazyImages() {
  const imgs = document.querySelectorAll('img[loading="lazy"]');
  if (!imgs.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
        obs.unobserve(img);
      }
    });
  });
  imgs.forEach(img => obs.observe(img));
}
