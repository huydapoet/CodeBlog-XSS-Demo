const MODE_KEY = 'xss_demo_mode';

(function syncModeFromUrl() {
  const m = new URLSearchParams(window.location.search).get('mode');
  if (m === 'secure' || m === 'vulnerable') {
    try { localStorage.setItem('xss_demo_mode', m); } catch (e) {}
  }
})();

function getMode() {
  return localStorage.getItem(MODE_KEY) === 'secure' ? 'secure' : 'vulnerable';
}

function setMode(mode) {
  const normalized = mode === 'secure' ? 'secure' : 'vulnerable';
  localStorage.setItem(MODE_KEY, normalized);

  document.cookie = `${MODE_KEY}=${normalized}; path=/; SameSite=Lax; max-age=31536000`;
  renderModeToggle();
  window.dispatchEvent(new CustomEvent('xssmodechange', { detail: { mode: getMode() } }));

  const url = new URL(window.location.href);
  url.searchParams.set('mode', normalized);
  window.location.href = url.toString();
}


function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function renderModeToggle() {
  const mount = document.getElementById('modeToggleMount');
  if (!mount) return;
  const mode = getMode();
  const secure = mode === 'secure';
  mount.innerHTML = `
    <div class="mode-toggle">
      <span class="mode-label">Chế độ:</span>
      <button class="mode-switch${secure ? ' secure' : ''}" id="modeSwitchBtn" title="Chuyển đổi Vulnerable / Secure">
        <span class="knob"></span>
      </button>

    </div>
  `;
  document.getElementById('modeSwitchBtn').addEventListener('click', () => {
    setMode(secure ? 'vulnerable' : 'secure');
  });
}


const ACTIONS = {};
function registerActions(map) { Object.assign(ACTIONS, map); }
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.action];
  if (fn) fn(el.dataset.arg, el);
});

function renderXssBanner(kind, mountId = 'xssBannerMount') {
  // Đã gỡ bỏ banner hướng dẫn demo
}

function injectModeMount() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks && !document.getElementById('modeToggleMount')) {
    const span = document.createElement('span');
    span.id = 'modeToggleMount';
    navLinks.appendChild(span);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  injectModeMount();
  renderModeToggle();
});
