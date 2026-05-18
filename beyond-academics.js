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
      if (data[el.dataset.setting]?.trim()) el.textContent = data[el.dataset.setting];
    });
  } catch(e) {}
}

async function loadClubs() {
  try {
    const data = await cmsGet('get_clubs');
    const grid = document.getElementById('clubsGrid');
    if (!grid || !data) return;

    const groupA = data.A || [];
    const groupB = data.B || [];
    const groupC = data.C || [];

    if (!groupA.length && !groupB.length && !groupC.length) return;

    grid.innerHTML = `
      <div class="club-group">
        <h4 class="club-group-title">Group A</h4>
        <ul class="club-list">
          ${groupA.length
            ? groupA.map(c => `<li>${c.club_name}</li>`).join('')
            : '<li style="color:var(--gray)">No clubs added yet</li>'}
        </ul>
      </div>
      <div class="club-group">
        <h4 class="club-group-title">Group B</h4>
        <ul class="club-list">
          ${groupB.length
            ? groupB.map(c => `<li>${c.club_name}</li>`).join('')
            : '<li style="color:var(--gray)">No clubs added yet</li>'}
        </ul>
        <p class="club-note">*Guitar is offered from class Vth onwards only.</p>
      </div>
      <div class="club-group">
        <h4 class="club-group-title">Group C</h4>
        <ul class="club-list">
          ${groupC.length
            ? groupC.map(c => `<li>${c.club_name}</li>`).join('')
            : '<li style="color:var(--gray)">No clubs added yet</li>'}
        </ul>
      </div>`;
  } catch(e) { console.warn('Clubs failed', e); }
}

async function loadHouses() {
  try {
    const items = await cmsGet('get_houses');
    const el    = document.getElementById('houseList');
    if (!el || !items || !items.length) return;
    el.innerHTML = items.map(h =>
      `<li style="border-left:4px solid ${h.color||'var(--blue-dark)'};padding-left:10px;">
        ${h.house_name}
      </li>`
    ).join('');
  } catch(e) {}
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

    // Cards
    const cardsEl = document.querySelector('.discipline-cards-grid');
    if (cardsEl && data.cards?.length) {
      const clsMap = {
        yellow:'yellow-card', orange:'orange-card',
        red:'red-card', black:'black-card'
      };
      cardsEl.innerHTML = data.cards.map(c => {
        const key = (c.category || '').toLowerCase().split(' ')[0];
        const cls = clsMap[key] || 'yellow-card';
        return `<div class="disc-card ${cls}">
          <h4>${c.category || ''}</h4>
          <p>${c.content || ''}</p>
        </div>`;
      }).join('');
    }
  } catch(e) {}
}

async function loadCouncilContent() {
  try {
    const data = await cmsGet('get_content', { page: 'academics', section: 'council' });
    if (!data?.council) return;
    const quoteEl = document.querySelector('.council-quote');
    const paraEl  = document.querySelector('#council .council-text p');
    if (quoteEl && data.council.quote) quoteEl.textContent = `"${data.council.quote}"`;
    if (paraEl  && data.council.content) paraEl.textContent = data.council.content;
  } catch(e) {}
}

function initScrollAnimations() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('animate-in'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.animate-on-scroll').forEach(el => obs.observe(el));
}

function initSidebarActiveLink() {
  const sections = document.querySelectorAll('.content-box[id]');
  const links    = document.querySelectorAll('.sidebar-link');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        document.querySelector(`.sidebar-link[href="#${e.target.id}"]`)?.classList.add('active');
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  sections.forEach(s => obs.observe(s));
}
