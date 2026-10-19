/* ═══════════════════════════════════════════
   post.js — trang chi tiết bài viết
   DEMO STORED XSS: nội dung bình luận được server lưu nguyên văn.
   Bất kỳ ai mở lại trang /post/<id> này đều load lại comment đó.
   Vulnerable: render bằng innerHTML không encode.
   Secure: render bằng escapeHtml() / textContent.
   ═══════════════════════════════════════════ */
const API = '/api';

async function loadComments() {
  const cmtList = document.getElementById('commentsList');
  try {
    const res = await fetch(`${API}/comments/${POST_ID}`);
    const comments = await res.json();
    document.getElementById('commentCount').textContent = comments.length;

    if (comments.length === 0) {
      cmtList.innerHTML = '<div class="no-comments">Chưa có bình luận. Hãy là người đầu tiên! 😊</div>';
      return;
    }

    const mode = getMode();

    cmtList.innerHTML = comments.map(c => {
      const initial = (c.name || 'U')[0].toUpperCase();
      const safeInitial = escapeHtml(initial);
      const safeName = escapeHtml(c.name);
      const safeTime = escapeHtml(c.created);

      // Phần khung (avatar, tên, giờ) luôn được escape — chỉ phần
      // NỘI DUNG bình luận (c.content) là nơi minh hoạ sự khác biệt
      // giữa chế độ Vulnerable và Secure.
      const bodyHtml = mode === 'vulnerable'
        /* ⚠️ VULNERABLE: innerHTML trực tiếp với dữ liệu chưa encode = Stored XSS */
        ? c.content
        /* ✅ SECURE: encode trước khi đưa vào HTML */
        : escapeHtml(c.content);

      return `
        <div class="comment-item">
          <div class="comment-avatar">${safeInitial}</div>
          <div class="comment-content">
            <div class="comment-header">
              <span class="comment-name">${safeName}</span>
              <span class="comment-time">🕐 ${safeTime}</span>
            </div>
            <div class="comment-text">${bodyHtml}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Lỗi tải bình luận:', err);
  }
}

async function submitComment() {
  const name = document.getElementById('cmtName').value.trim();
  const content = document.getElementById('cmtText').value.trim();

  if (!name) { showToast('⚠️ Vui lòng nhập tên của bạn!'); return; }
  if (!content) { showToast('⚠️ Vui lòng nhập nội dung bình luận!'); return; }

  try {
    const res = await fetch(`${API}/comments/${POST_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, content }),
    });

    if (res.ok) {
      document.getElementById('cmtName').value = '';
      document.getElementById('cmtEmail').value = '';
      document.getElementById('cmtText').value = '';

      await loadComments();
      showToast('✅ Bình luận của bạn đã được đăng! (lưu ở server — mở lại trang sẽ vẫn thấy)', true);
    }
  } catch (err) {
    console.error('Lỗi gửi bình luận:', err);
    showToast('❌ Không thể gửi bình luận.');
  }
}

function showToast(msg, success = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (success ? ' success' : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

window.addEventListener('xssmodechange', () => {
  loadComments();
});

loadComments();
