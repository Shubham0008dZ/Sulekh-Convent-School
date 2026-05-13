/* ============================================================
   BEYOND-ACADEMICS.JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initScrollAnimations();
  initSidebarActiveLink();
  await Promise.all([
    loadSettings(),
    loadClubs(),
    loadHouses(),
    loadDiscipline(),
    loadCouncilContent(),
  ]);
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

async function loadClubs() {
  try {
    const data = await cmsGet('get_clubs');
    if (!data) return;

    const groupMap = { A: 'clubsGroupA', B: 'clubsGroupB', C: 'clubsGroupC' };
    Object.entries(groupMap).forEach(([grp, elId]) => {
      const items = data[grp] || [];
      const el    = document.getElementById(elId);
      if (!el) return;
      if (!items.length) { el.innerHTML = '<li>No clubs added yet</li>'; return; }
      el.innerHTML = items.map(c => `<li>${c.club_name}</li>`).join('');
    });
  } catch(e) { console.warn('Clubs failed', e); }
}

async function loadHouses() {
  try {
    const items = await cmsGet('get_houses');
    const el    = document.getElementById('houseList');
    if (!el || !items || !items.length) return;
    el.innerHTML = items.map(h =>
      `<li style="border-left:4px solid ${h.color||'var(--blue-dark)'};padding-left:10px;">${h.house_name}</li>`
    ).join('');
  } catch(e) { console.warn('Houses failed', e); }
}

async function loadDiscipline() {
  try {
    const data = await cmsGet('get_discipline');
    if (!data) return;

    // Timings
    const timingsEl = document.getElementById('timingsList');
    if (timingsEl && data.timings?.length) {
      timingsEl.innerHTML = data.timings.map(t => `<li>${t.content}</li>`).join('');
    }

    // Cards (Yellow, Orange, Red, Black)
    const cardsEl = document.querySelector('.discipline-cards-grid');
    if (cardsEl && data.cards?.length) {
      const colorMap = { yellow:'yellow-card', orange:'orange-card', red:'red-card', black:'black-card' };
      cardsEl.innerHTML = data.cards.map(c => {
        const colorKey = (c.category||'').toLowerCase().split(' ')[0];
        const cls      = colorMap[colorKey] || 'yellow-card';
        return `
          <div class="disc-card ${cls}">
            <h4>${c.category}</h4>
            <p>${c.content}</p>
          </div>
        `;
      }).join('');
    }

  } catch(e) { console.warn('Discipline failed', e); }
}

async function loadCouncilContent() {
  try {
    const data = await cmsGet('get_content', { page: 'academics', section: 'council' });
    if (!data || !data.council) return;

    const quoteEl   = document.querySelector('.council-quote');
    const contentEl = document.querySelector('#council .council-text p');
    const levelsEl  = document.getElementById('councilLevels');

    if (quoteEl   && data.council.quote)   quoteEl.textContent   = `"${data.council.quote}"`;
    if (contentEl && data.council.content) contentEl.textContent = data.council.content;
  } catch(e) { console.warn('Council content failed', e); }
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
