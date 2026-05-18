/* ============================================================
   GALLERY.JS — Loads from Google Sheets, no hardcoded items
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initScrollAnimations();
  await Promise.all([ loadImageGallery(), loadVideoGallery() ]);
});

/* ── IMAGE GALLERY ── */
async function loadImageGallery() {
  const grid    = document.getElementById('galleryAlbumsGrid');
  const emptyEl = document.getElementById('albumsEmpty');
  if (!grid) return;

  try {
    const items = await cmsGet('get_gallery_albums');

    // Remove skeleton loaders
    grid.innerHTML = '';

    if (!items || !items.length) {
      grid.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    grid.innerHTML = items.map(g => `
      <div class="album-card animate-on-scroll">
        <div class="album-thumb"
          onclick="openAlbum(${JSON.stringify(g.album_title)}, ${JSON.stringify(g.images||'')})">
          <div class="album-thumb-placeholder"
            style="${g.thumbnail_url ? 'background:#111;padding:0;' : ''}">
            ${g.thumbnail_url
              ? `<img src="${g.thumbnail_url}" loading="lazy"
                   style="width:100%;height:100%;object-fit:cover;"
                   alt="${g.album_title}"
                   onerror="this.parentElement.style.background='linear-gradient(135deg,var(--blue-dark),var(--blue-light))'"/>`
              : `<span>${g.album_title}</span>`}
          </div>
          <div class="album-overlay">
            <button class="album-view-btn">View Gallery</button>
          </div>
        </div>
        <div class="album-info">
          <h4>${g.album_title}</h4>
          ${g.date ? `<p style="font-size:11px;color:var(--gray);margin-bottom:6px;">${g.date}</p>` : ''}
          <a href="#" class="album-link"
            onclick="openAlbum(${JSON.stringify(g.album_title)},${JSON.stringify(g.images||'')});return false;">
            + View Gallery
          </a>
        </div>
      </div>
    `).join('');

    initScrollAnimations();
  } catch(e) {
    console.warn('Gallery albums failed', e);
    if (grid) grid.innerHTML =
      '<p style="color:var(--gray);padding:30px;text-align:center;">Could not load gallery.</p>';
  }
}

/* ── VIDEO GALLERY ── */
async function loadVideoGallery() {
  const grid    = document.getElementById('videosGrid');
  const emptyEl = document.getElementById('videosEmpty');
  if (!grid) return;

  try {
    const items = await cmsGet('get_gallery_videos');

    // Remove skeleton loaders
    grid.innerHTML = '';

    if (!items || !items.length) {
      grid.style.display = 'none';
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    grid.innerHTML = items.map(v => {
      const embed = toEmbed(v.youtube_url || '');
      const thumb = v.thumbnail_url || getYTThumb(v.youtube_url || '');
      return `
        <div class="video-card animate-on-scroll">
          <div class="video-thumb" data-embed="${embed}" onclick="playVideo(this)">
            <div class="video-thumb-bg" style="${thumb?'background:#000;':''}">
              ${thumb
                ? `<img src="${thumb}" loading="lazy"
                     style="width:100%;height:100%;object-fit:cover;"
                     alt="${v.title}"
                     onerror="this.remove()"/>`
                : `<div style="width:100%;height:100%;background:linear-gradient(135deg,#1a1a2e,#16213e);"></div>`}
            </div>
            <div class="play-overlay">
              <div class="play-btn-circle">
                <svg viewBox="0 0 24 24" fill="white" width="28" height="28">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
            </div>
          </div>
          <p class="video-title">${v.title}</p>
        </div>`;
    }).join('');

    initScrollAnimations();
  } catch(e) {
    console.warn('Video gallery failed', e);
    if (grid) grid.innerHTML =
      '<p style="color:var(--gray);padding:30px;text-align:center;">Could not load videos.</p>';
  }
}

/* ── Play video inline ── */
function playVideo(thumbEl) {
  const embed = thumbEl.dataset.embed;
  if (!embed) return;
  const iframe = document.createElement('iframe');
  iframe.src   = embed + '?autoplay=1&rel=0';
  iframe.allow = 'autoplay; encrypted-media; fullscreen';
  iframe.allowFullscreen = true;
  iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;';
  thumbEl.innerHTML = '';
  thumbEl.style.paddingTop = '56.25%';
  thumbEl.style.position   = 'relative';
  thumbEl.appendChild(iframe);
}

/* ── Open album lightbox ── */
function openAlbum(title, imagesStr) {
  const lightbox = document.getElementById('lightbox');
  const content  = document.getElementById('lightboxContent');
  if (!lightbox || !content) return;

  const urls = (imagesStr || '').split(',').map(u => u.trim()).filter(Boolean);

  if (urls.length) {
    content.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:24px;max-width:900px;
                  margin:0 auto;max-height:85vh;overflow-y:auto;">
        <h3 style="font-family:serif;color:var(--blue-dark);margin-bottom:16px;">${title}</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
          ${urls.map(url => `
            <div style="aspect-ratio:4/3;border-radius:8px;overflow:hidden;background:#f0f0f0;">
              <img src="${url}" loading="lazy"
                   style="width:100%;height:100%;object-fit:cover;"
                   alt="${title}"
                   onerror="this.parentElement.style.display='none'"/>
            </div>`).join('')}
        </div>
      </div>`;
  } else {
    content.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:40px;text-align:center;max-width:400px;margin:0 auto;">
        <h3 style="color:var(--blue-dark);margin-bottom:12px;">${title}</h3>
        <p style="color:var(--gray-dark);font-size:14px;">No images in this album yet.</p>
        <button onclick="closeLightbox()" style="margin-top:20px;background:var(--red);
          color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-weight:700;">
          Close
        </button>
      </div>`;
  }

  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox(e) {
  if (e && e.target !== document.getElementById('lightbox')
       && !e.target.classList.contains('lightbox-close')) return;
  document.getElementById('lightbox')?.classList.remove('open');
  document.getElementById('lightboxContent').innerHTML = '';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    const lb = document.getElementById('lightbox');
    if (lb?.classList.contains('open')) closeLightbox({ target: lb });
  }
});

/* ── Helpers ── */
function getYTThumb(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&\s]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : '';
}

function toEmbed(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&\s]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
}

function initScrollAnimations() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('animate-in'), i * 60);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.animate-on-scroll:not(.animate-in)').forEach(el => obs.observe(el));
}
