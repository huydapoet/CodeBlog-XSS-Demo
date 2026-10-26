
const API = '/api';

let allPosts = [];
let filteredPosts = [];
const POSTS_PER_PAGE = 4;
let currentPage = 1;

async function loadPosts() {
  try {
    const res = await fetch(`${API}/posts`);
    allPosts = await res.json();
    filteredPosts = [...allPosts];
    renderPosts();
    renderSidebar();
    // Sau khi có dữ liệu bài viết, áp dụng bộ lọc tag nếu URL có sẵn
    // (ví dụ người dùng vừa bấm vào 1 link chia sẻ dạng /?tag=...)
    applyTagFromUrl();
    // Và nếu URL có sẵn ?q=..., tự chạy tìm kiếm (kịch bản bấm vào
    // link reflected-XSS mà kẻ tấn công gửi, không cần tự gõ)
    applySearchFromUrl();
  } catch (err) {
    console.error('Lỗi kết nối backend:', err);
  }
}

function renderPosts() {
  const list = document.getElementById('postsList');
  const start = (currentPage - 1) * POSTS_PER_PAGE;
  const pagePosts = filteredPosts.slice(start, start + POSTS_PER_PAGE);

  if (pagePosts.length === 0) {
    list.innerHTML = `<div class="no-result"><div class="emoji">🔍</div><p>Không tìm thấy bài viết nào phù hợp.</p></div>`;
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  // Post data (title, tag, author...) là nội dung do chúng ta tạo sẵn
  // (trusted content), không phải input người dùng, nên render bình
  // thường ở đây không liên quan tới các demo XSS của bài này.
  list.innerHTML = pagePosts.map(p => `
    <a class="post-card" href="/post/${p.id}">
      <div class="post-card-thumb" style="background:${p.bg}">
        ${p.image ? `<img src="${p.image}" alt="${p.title}" class="post-thumb-img" />` : `<span>${p.emoji}</span>`}
      </div>
      <div class="post-card-body">
        <div class="post-meta">
          <span class="tag">${p.tag}</span>
          <span class="post-date">📅 ${p.date}</span>
        </div>
        <h2>${p.title}</h2>
        <p class="excerpt">${p.excerpt}</p>
      </div>
      <div class="post-footer">
        <div class="author">
          <div class="avatar" style="background:${p.avatarColor}">${p.authorInitial}</div>
          <span class="author-name">${p.author}</span>
        </div>
        <span class="read-btn">Đọc tiếp →</span>
      </div>
    </a>
  `).join('');

  renderPagination();
}

function renderPagination() {
  const total = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const pg = document.getElementById('pagination');
  if (total <= 1) { pg.innerHTML = ''; return; }
  pg.innerHTML = Array.from({ length: total }, (_, i) => i + 1).map(n =>
    `<button class="page-btn${n === currentPage ? ' active' : ''}" data-action="goPage" data-arg="${n}">${n}</button>`
  ).join('');
}

function goPage(n) {
  currentPage = Number(n);
  renderPosts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

const TAG_COLORS = {
  Python: { bg: '#dbeafe', color: '#1d4ed8' },
  JavaScript: { bg: '#fef3c7', color: '#b45309' },
  Rust: { bg: '#fee2e2', color: '#b91c1c' },
  Go: { bg: '#cffafe', color: '#0e7490' },
  TypeScript: { bg: '#eff6ff', color: '#2563eb' },
  'C++': { bg: '#ede9fe', color: '#6d28d9' },
};

function renderSidebar() {
  const tagList = document.getElementById('langTagList');
  const allTags = [...new Set(allPosts.map(p => p.tag))];
  tagList.innerHTML = allTags.map(tag => {
    const c = TAG_COLORS[tag] || { bg: '#f3f4f6', color: '#374151' };
    return `<span class="lang-tag" style="background:${c.bg};color:${c.color};border-color:${c.color}20" data-action="filterTag" data-arg="${tag}">${tag}</span>`;
  }).join('');

  const popList = document.getElementById('popularList');
  popList.innerHTML = allPosts.slice(0, 4).map((p, i) => `
    <li data-action="openPost" data-arg="${p.id}">
      <div class="pop-num">${i + 1}</div>
      <span class="pop-title">${p.title}</span>
    </li>
  `).join('');
}

function showAll() {
  // Banner tìm kiếm giờ do server render từ ?q=..., nên để xoá hẳn (và
  // quay về mode mặc định) cần điều hướng thật, không chỉ xoá DOM bằng JS.
  location.href = '/';
}

function filterByCategory(cat) {
  filteredPosts = allPosts.filter(p => p.category === cat);
  currentPage = 1;
  document.getElementById('searchStatusBar').innerHTML = '';
  renderPosts();
}

async function applySearchFromUrl() {
  const q = new URLSearchParams(window.location.search).get('q');
  if (!q) return;
  try {
    const res = await fetch(`${API}/search?q=${encodeURIComponent(q)}`, {
      headers: { Accept: 'application/json' },
    });
    const data = await res.json();
    filteredPosts = data.results;
    currentPage = 1;
    renderPosts();
  } catch (err) {
    console.error('Lỗi tìm kiếm:', err);
  }
}

function filterByTagAndShare(tag) {
  const url = new URL(window.location.href);
  url.searchParams.set('tag', tag);
  history.pushState(null, '', url);
  applyTagFilter(tag);
}

function applyTagFromUrl() {
  const tag = new URLSearchParams(window.location.search).get('tag');
  if (tag) applyTagFilter(tag);
  else renderTagAttackHint('');
}

function applyTagFilter(tagValue) {
  // So khớp gần đúng (không phân biệt hoa/thường) — mô phỏng đúng kiểu
  // bộ lọc "tìm theo từ khoá thẻ" mà nhiều blog thực tế hay làm, thay
  // vì so sánh tuyệt đối với danh sách thẻ hợp lệ.
  filteredPosts = allPosts.filter(p =>
    p.tag.toLowerCase().includes(tagValue.toLowerCase())
  );
  currentPage = 1;
  renderPosts();
  renderTagFilterBanner(tagValue);
  renderTagAttackHint(tagValue);
}

function clearTagFilter() {
  const url = new URL(window.location.href);
  url.searchParams.delete('tag');
  history.replaceState(null, '', url);
  document.getElementById('tagFilterBanner').innerHTML = '';
  filteredPosts = [...allPosts];
  currentPage = 1;
  renderPosts();
}

function renderTagFilterBanner(tagValue) {
  const banner = document.getElementById('tagFilterBanner');
  if (!banner) return;
  const mode = getMode();

  if (mode === 'vulnerable') {
    /* ⚠️ VULNERABLE — dữ liệu từ URL được nối thẳng vào chuỗi HTML rồi
       gán qua innerHTML. Nếu tagValue chứa thẻ <img>/<script>, trình
       duyệt sẽ dựng và thực thi nó ngay khi gán. */
    banner.innerHTML = `
      <div class="tag-filter-banner">
        🏷️ Đang lọc bài viết theo thẻ: <strong>${tagValue}</strong>
        <button class="clear-filter-btn" data-action="clearTag">✕ Bỏ lọc</button>
      </div>`;
  } else {
    /* ✅ SECURE — dựng DOM bằng createElement/textContent, giá trị từ
       URL luôn được trình duyệt hiểu là TEXT thuần, không bao giờ được
       diễn giải thành thẻ HTML, bất kể tagValue chứa gì. */
    banner.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'tag-filter-banner';

    const label = document.createTextNode('🏷️ Đang lọc bài viết theo thẻ: ');
    const strong = document.createElement('strong');
    strong.textContent = tagValue; // an toàn: luôn là text, không phải HTML

    const btn = document.createElement('button');
    btn.className = 'clear-filter-btn';
    btn.textContent = '✕ Bỏ lọc';
    btn.onclick = clearTagFilter;

    wrap.append(label, strong, btn);
    banner.appendChild(wrap);
  }
}

function renderTagAttackHint(currentTag) {
  const mount = document.getElementById('tagAttackHint');
  if (!mount) return;
  const secure = getMode() === 'secure';
  const payload = '<img src=x onerror=alert(document.cookie)>';
  const attackUrl = `${window.location.origin}${window.location.pathname}?tag=${encodeURIComponent(payload)}`;

  mount.innerHTML = `
    <div class="sidebar-title">🧪 Thử DOM-XSS qua link lọc</div>
    <p class="sidebar-note">${secure
      ? '✅ Đang ở chế độ Secure — link dưới đây giờ vô hại, "tag" chỉ hiện ra dưới dạng chữ.'
      : '⚠️ Dán link này vào thanh địa chỉ (hoặc gửi cho "nạn nhân") để kiểm chứng:'}
    </p>
    <code class="attack-url" id="tagAttackUrlText">${escapeHtml(attackUrl)}</code>
    <button class="copy-link-btn" data-action="copyAttackUrl">📋 Copy link</button>
  `;
}

function copyTagAttackUrl() {
  const text = document.getElementById('tagAttackUrlText').textContent;
  navigator.clipboard?.writeText(text).then(() => {
    showToast('📋 Đã copy link! Dán vào tab khác để thử với vai trò "nạn nhân".', true);
  });
}

function showToast(msg, success = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (success ? ' success' : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}


window.addEventListener('xssmodechange', () => {
  const tag = new URLSearchParams(window.location.search).get('tag');
  if (tag) applyTagFilter(tag);
  else renderTagAttackHint('');
});

registerActions({
  goPage,
  filterTag: filterByTagAndShare,
  openPost: (id) => { location.href = `/post/${id}`; },
  clearTag: clearTagFilter,
  copyAttackUrl: copyTagAttackUrl,
});

loadPosts();
