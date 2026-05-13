/* ============================================================
   ADMISSION.JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initScrollAnimations();
  initSidebarActiveLink();
  await Promise.all([ loadSettings(), loadFeeTable(), loadAdmissionDocs(), loadGuidelinesContent() ]);
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

async function loadFeeTable() {
  try {
    const result = await cmsGet('get_admission_fee');
    if (!result) return;

    const feeRows = result.fee_table || [];
    const tbody   = document.querySelector('#feeTable tbody');
    if (tbody && feeRows.length) {
      tbody.innerHTML = feeRows.map(r =>
        `<tr><td>${r.quarter}</td><td>${r.month}</td><td>${r.last_date}</td></tr>`
      ).join('');
    }
  } catch(e) { console.warn('Fee table failed', e); }
}

async function loadAdmissionDocs() {
  try {
    const result = await cmsGet('get_admission_fee');
    const docs   = result?.docs || [];
    if (!docs.length) return;

    // Map doc types to download buttons
    docs.forEach(doc => {
      const typeMap = {
        transport    : 'transportDownload',
        syllabus_nur : 'sylNurDownload',
        syllabus_vi  : 'sylViDownload',
        fee          : 'feeDownload',
      };
      const elId = typeMap[doc.type];
      if (elId) {
        const el = document.getElementById(elId);
        if (el) el.href = doc.file_url || '#';
      }
    });
  } catch(e) { console.warn('Admission docs failed', e); }
}

async function loadGuidelinesContent() {
  try {
    const data = await cmsGet('get_content', { page:'admission', section:'guidelines' });
    if (!data?.guidelines?.intro) return;
    const el = document.querySelector('#guidelines .content-box-body > p');
    if (el) el.textContent = data.guidelines.intro;
  } catch(e) { console.warn('Guidelines content failed', e); }
}

function submitEnquiry() {
  const name   = document.getElementById('enqStudentName')?.value.trim();
  const cls    = document.getElementById('enqClass')?.value;
  const parent = document.getElementById('enqParentName')?.value.trim();
  const mobile = document.getElementById('enqMobile')?.value.trim();
  const email  = document.getElementById('enqEmail')?.value.trim();
  const dob    = document.getElementById('enqDOB')?.value;
  const msg    = document.getElementById('enqMessage')?.value.trim();

  if (!name || !cls || !parent || !mobile) {
    alert('Please fill all required fields (marked with *).'); return;
  }

  // POST to Google Sheets via CMS API
  cmsPost('enquiry', {
    student_name : name,
    class        : cls,
    parent_name  : parent,
    mobile,
    email        : email || '',
    dob          : dob   || '',
    message      : msg   || '',
  }).then(res => {
    const successEl = document.getElementById('enqSuccess');
    if (res.success) {
      if (successEl) { successEl.style.display = 'block'; successEl.scrollIntoView({ behavior:'smooth', block:'nearest' }); }
      ['enqStudentName','enqClass','enqParentName','enqMobile','enqEmail','enqDOB','enqMessage']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    } else {
      alert('Submission failed. Please try again.');
    }
  }).catch(() => alert('Network error. Please try again.'));
}

// Also override cmsPost for public enquiry (no token needed)
async function cmsPost(action, body = {}) {
  const res = await fetch(CMS_CONFIG.API_URL, {
    method : 'POST',
    body   : JSON.stringify({ action, ...body }),
  });
  return res.json();
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
