/* ═══════════════════════════════════════════
   common.js
   - Quản lý chế độ demo: "vulnerable" | "secure"
   - Lưu trong localStorage để giữ nguyên khi chuyển trang
   - Vẽ công tắc chuyển đổi trong thanh nav
   - Hàm escapeHtml() dùng chung cho chế độ "secure"
   ═══════════════════════════════════════════ */

const MODE_KEY = 'xss_demo_mode';

function getMode() {
  return localStorage.getItem(MODE_KEY) === 'secure' ? 'secure' : 'vulnerable';
}

function setMode(mode) {
  localStorage.setItem(MODE_KEY, mode === 'secure' ? 'secure' : 'vulnerable');
  renderModeToggle();
  window.dispatchEvent(new CustomEvent('xssmodechange', { detail: { mode: getMode() } }));
}

/**
 * Escape an giá trị trước khi chèn vào HTML — đây là cách CHỐNG XSS
 * chuẩn: encode output theo đúng ngữ cảnh (ở đây là HTML text context).
 */
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
