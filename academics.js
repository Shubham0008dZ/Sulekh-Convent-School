/* ============================================================
   ACADEMICS.JS — Loads all Academics content from Sheets
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initScrollAnimations();
  initSidebarActiveLink();
  await Promise.all([
    loadSettings(),
    loadAcademicsContent(),
    loadHomeworkFiles(),
    loadSyllabusFiles(),
  ]);
});

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

async function loadAcademicsContent() {
  try {
    const data = await cmsGet('get_content', { page: 'academics' });
    if (!data) return;

    const map = {
      preprimary_intro : { id:'preprimaryContent' },
      primary_intro    : { id:'primaryContent'    },
      middle_intro     : { id:'middleContent'     },
      senior_intro     : { id:'seniorContent'     },
      senior_motto     : { id:'seniorMotto'       },
    };

    Object.entries(map).forEach(([section, cfg]) => {
      const val = data[section]?.content;
      const el  = document.getElementById(cfg.id);
      if (el && val) el.textContent = val;
    });

    // Lists (deliverables, facilities etc from academics_lists sheet)
    await loadAcademicLists();

  } catch(e) { console.warn('Academics content failed', e); }
}

async function loadAcademicLists() {
  try {
    const items = await cmsGet('get_academics_lists');
    if (!items || !items.length) return;

    // Group by dept+list_type
    const groups = {};
    items.forEach(item => {
      const key = `${item.dept}__${item.list_type}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item.item_text);
    });

    // Map group keys to element IDs
    const idMap = {
      'preprimary__key_areas'      : 'preprimaryAreas',
      'primary__deliverables'      : 'primaryDeliverables',
      'primary__facilities'        : 'primaryFacilities',
      'middle__helps'              : 'middleHelps',
      'middle__facilities'         : 'middleFacilities',
    };

    Object.entries(idMap).forEach(([key, elId]) => {
      if (!groups[key]) return;
      const el = document.getElementById(elId);
      if (el) el.innerHTML = groups[key].map(t => `<li>${t}</li>`).join('');
    });

  } catch(e) { console.warn('Academic lists failed', e); }
}

async function loadHomeworkFiles() {
  try {
    const items = await cmsGet('get_academics_lists');
    const hw    = (items || []).filter(i => i.dept === 'homework');
    const el    = document.getElementById('homeworkList');
    if (!el || !hw.length) return;

    el.innerHTML = hw.map(h => `
      <div class="hw-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <a href="${h.item_text.startsWith('http') ? h.item_text : '#'}" target="_blank">
          ${h.item_text.startsWith('http') ? 'Download File' : h.item_text}
        </a>
      </div>
    `).join('');
  } catch(e) { console.warn('Homework load failed', e); }
}

async function loadSyllabusFiles() {
  try {
    const items = await cmsGet('get_academics_lists');
    const syl   = (items || []).filter(i => i.dept === 'syllabus');
    const el    = document.getElementById('syllabusList');
    if (!el || !syl.length) return;

    el.innerHTML = syl.map(s => `
      <div class="hw-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <a href="${s.item_text.startsWith('http') ? s.item_text : '#'}" target="_blank">
          ${s.list_type ? s.list_type.replace(/_/g,' ').toUpperCase() : s.item_text}
        </a>
      </div>
    `).join('');
  } catch(e) { console.warn('Syllabus load failed', e); }
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
