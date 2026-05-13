/* ============================================================
   CAREER.JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initScrollAnimations();
  await Promise.all([ loadSettings(), loadCareerCards(), loadCareerResources() ]);
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

async function loadCareerCards() {
  try {
    const items = await cmsGet('get_career_cards');
    const grid  = document.querySelector('.career-grid');
    if (!grid || !items || !items.length) return;

    grid.innerHTML = items.map(c => `
      <div class="career-card animate-on-scroll">
        <div class="career-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="28" height="28">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h3>${c.title}</h3>
        <p>${c.content}</p>
      </div>
    `).join('');

    initScrollAnimations();
  } catch(e) { console.warn('Career cards failed', e); }
}

async function loadCareerResources() {
  try {
    const items = await cmsGet('get_career_resources');
    const el    = document.getElementById('resourcesList');
    if (!el || !items || !items.length) return;

    el.innerHTML = items.map(r => `
      <div class="resource-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <div class="resource-info">
          <span class="resource-title">${r.title}</span>
          <span class="resource-sub">${r.file_size ? 'PDF • '+r.file_size : 'PDF'}</span>
        </div>
        <a href="${r.file_url||'#'}" target="_blank" class="btn btn-outline" style="padding:6px 16px;font-size:12px;">Download</a>
      </div>
    `).join('');
  } catch(e) { console.warn('Career resources failed', e); }
}

function initScrollAnimations() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('animate-in'); obs.unobserve(entry.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.animate-on-scroll:not(.animate-in)').forEach(el => obs.observe(el));
}
