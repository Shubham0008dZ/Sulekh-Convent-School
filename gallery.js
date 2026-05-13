/* ============================================================
   GALLERY.JS
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  initScrollAnimations();
  await Promise.all([ loadSettings(), loadImageGallery(), loadVideoGallery() ]);
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

async function loadImageGallery() {
  try {
    const items = await cmsGet('get_gallery_albums');
    const grid  = document.getElementById('galleryAlbumsGrid');
    if (!grid || !items || !items.length) return;

    grid.innerHTML = items.map(g => `
      <div class="album-card animate-on-scroll">
        <div class="album-thumb" onclick="openAlbum('${g.sr_no}', ${JSON.stringify(g.images||'').replace(/'/g,"\\'")} , '${g.album_title}')">
          <div class="album-thumb-placeholder" style="${g.thumbnail_url?'background:#000;padding:0;':''}">
            ${g.thumbnail_url
              ? `<img src="${g.thumbnail_url}" style="width:100%;height:100%;object-fit:cover;" alt="${g.album_title}" onerror="this.parentElement.style.background='linear-gradient(135deg,var(--blue-dark),var(--blue-light))'"/>`
              : `<span>${g.album_title}</span>`}
          </div>
          <div class="album-overlay">
            <button class="album-view-btn">View Gallery</button>
          </div>
        </div>
        <div class="album-info">
          <h4>${g.album_title}</h4>
          ${g.date ? `<p style="font-size:11px;color:var(--gray);">${g.date}</p>` : ''}
          <a href="#" class="album-link" onclick="openAlbum('${g.sr_no}','${g.images||''}','${g.album_title}');return false;">+ View Gallery</a>
        </div>
      </div>
    `).join('');

    initScrollAnimations();
  } catch(e) { console.warn('Gallery albums failed', e); }
}

async function loadVideoGallery() {
  try {
    const items = await cmsGet('get_gallery_videos');
    const grid  = document.getElementById('videosGrid');
    if (!grid || !items || !items.length) return;

    grid.innerHTML = items.map(v => {
      const embedUrl = toEmbedUrl(v.youtube_url || '');
      return `
        <div class="video-card animate-on-scroll">
          <div class="video-thumb" onclick="playVideo(this,'${embedUrl}')">
            <div class="video-thumb-placeholder" style="${v.thumbnail_url?'background:#000;padding:0;':''}">
              ${v.thumbnail_url
                ? `<img src="${v.thumbnail_url}" style="width:100%;height:100%;object-fit:cover;" alt="${v.title}" onerror="this.parentElement.style.background='#1a1a1a'"/>`
                : ''}
              <div class="play-btn" style="position:absolute;">
                <svg viewBox="0 0 24 24" fill="white" width="32" height="32"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </div>
          </div>
          <p class="video-title">${v.title}</p>
        </div>
      `;
    }).join('');

    initScrollAnimations();
  } catch(e) { console.warn('Video gallery failed', e); }
}

function toEmbedUrl(url) {
  if (!url) return '';
  // Handle youtu.be and youtube.com/watch
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^?&\s]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function playVideo(thumbEl, embedUrl) {
  if (!embedUrl) return;
  const iframe       = document.createElement('iframe');
  iframe.src         = embedUrl + '?autoplay=1';
  iframe.allow       = 'autoplay; encrypted-media; fullscreen';
  iframe.allowFullscreen = true;
  iframe.style.cssText   = 'position:absolute;inset:0;width:100%;height:100%;border:none;';
  thumbEl.innerHTML  = '';
  thumbEl.appendChild(iframe);
}

function openAlbum(albumId, imagesStr, title) {
  const lightbox = document.getElementById('lightbox');
  const content  = document.getElementById('lightboxContent');
  if (!lightbox || !content) return;

  const urls = (imagesStr || '').split(',').map(u => u.trim()).filter(Boolean);

  if (urls.length) {
    content.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:24px;max-width:860px;margin:0 auto;">
        <h3 style="font-family:serif;color:var(--blue-dark);margin-bottom:16px;">${title}</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;">
          ${urls.map(url => `
            <div style="aspect-ratio:4/3;border-radius:8px;overflow:hidden;">
              <img src="${url}" style="width:100%;height:100%;object-fit:cover;" alt="" loading="lazy" onerror="this.parentElement.remove()"/>
            </div>
          `).join('')}
        </div>
      </div>`;
  } else {
    content.innerHTML = `
      <div style="background:#fff;border-radius:12px;padding:32px;text-align:center;max-width:480px;margin:0 auto;">
        <h3 style="color:var(--blue-dark);margin-bottom:12px;">${title}</h3>
        <p style="color:var(--gray-dark);font-size:14px;">No images uploaded yet for this album. Add images via CMS.</p>
        <button onclick="closeLightbox()" style="margin-top:20px;background:var(--red);color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-weight:700;">Close</button>
      </div>`;
  }

  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox(e) {
  if (e && e.target !== document.getElementById('lightbox') && !e.target.classList.contains('lightbox-close')) return;
  document.getElementById('lightbox')?.classList.remove('open');
  document.getElementById('lightboxContent').innerHTML = '';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox({ target: document.getElementById('lightbox') });
});

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
