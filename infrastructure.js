/* ============================================================
   INFRASTRUCTURE.JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initScrollAnimations();
  initSidebarActiveLink();
  await Promise.all([ loadSettings(), loadInfraContent() ]);
});

async function loadSettings() {
  try {
    const data = await cmsGet('get_settings');
    if (!data) return;
    document.querySelectorAll('[data-setting]').forEach(el => {
      if (data[el.dataset.setting]) el.textContent = data[el.dataset.setting];
    });
  } catch(e) {}
}

async function loadInfraContent() {
  try {
    const items = await cmsGet('get_infra');
    if (!items || !items.length) return;

    items.forEach(item => {
      const sectionEl = document.getElementById(item.section_id);
      if (!sectionEl) return;

      // Update title in header
      const headerEl = sectionEl.querySelector('.content-box-header');
      if (headerEl && item.title) headerEl.textContent = item.title;

      // Update content paragraph
      const bodyEl = sectionEl.querySelector('.content-box-body > p');
      if (bodyEl && item.content) bodyEl.textContent = item.content;

      // Update images
      if (item.images) {
        const urls     = item.images.split(',').map(u => u.trim()).filter(Boolean);
        const galleryEl = sectionEl.querySelector('.infra-gallery');
        if (galleryEl && urls.length) {
          galleryEl.innerHTML = urls.map(url => `
            <div class="infra-img-placeholder" style="background:#000;padding:0;">
              <img src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" alt="${item.title}" onerror="this.parentElement.style.background='var(--gray-light)'"/>
            </div>
          `).join('');
        }
      }
    });
  } catch(e) { console.warn('Infra content failed', e); }
}

function initScrollAnimations() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('animate-in'); obs.unobserve(entry.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.animate-on-scroll').forEach(el => obs.observe(el));
}

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
