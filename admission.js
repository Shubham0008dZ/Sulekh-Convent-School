/* ============================================================
   ADMISSION.JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initScrollAnimations();
  initSidebarActiveLink();
  await Promise.all([
    loadSettings(),
    loadFeeTable(),
    loadAdmissionDocs(),
    loadGuidelinesContent(),
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

async function loadFeeTable() {
  try {
    const result = await cmsGet('get_admission_fee');
    if (!result) return;
    const tbody = document.querySelector('#feeTable tbody');
    if (tbody && result.fee_table?.length) {
      tbody.innerHTML = result.fee_table.map(r =>
        `<tr><td>${r.quarter}</td><td>${r.month}</td><td>${r.last_date}</td></tr>`
      ).join('');
    }
  } catch(e) {}
}

async function loadAdmissionDocs() {
  try {
    const result = await cmsGet('get_admission_fee');
    const docs   = result?.docs || [];
    docs.forEach(doc => {
      const map = {
        transport:'transportDownload', syllabus_nur:'sylNurDownload',
        syllabus_vi:'sylViDownload',   fee:'feeDownload',
      };
      const el = document.getElementById(map[doc.type]);
      if (el && doc.file_url) el.href = doc.file_url;
    });
  } catch(e) {}
}

async function loadGuidelinesContent() {
  try {
    const data = await cmsGet('get_content', { page:'admission', section:'guidelines' });
    if (!data?.guidelines?.intro) return;
    const el = document.querySelector('#guidelines .content-box-body > p');
    if (el) el.textContent = data.guidelines.intro;
  } catch(e) {}
}

/* ── Enquiry form submit ── */
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

  // Use cmsPost from cms-config.js (no token = public enquiry)
  cmsPost('enquiry', {
    student_name: name,
    class: cls,
    parent_name: parent,
    mobile,
    email: email || '',
    dob:   dob   || '',
    message: msg || '',
  }).then(res => {
    const successEl = document.getElementById('enqSuccess');
    if (res.success) {
      if (successEl) {
        successEl.style.display = 'block';
        successEl.scrollIntoView({ behavior:'smooth', block:'nearest' });
      }
      ['enqStudentName','enqClass','enqParentName','enqMobile','enqEmail','enqDOB','enqMessage']
        .forEach(id => { const e = document.getElementById(id); if(e) e.value=''; });
    } else {
      alert('Submission failed: ' + (res.error || 'Please try again.'));
    }
  }).catch(() => alert('Network error. Please try again.'));
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
