from flask import Flask, render_template, request, jsonify, abort

import data

app = Flask(__name__)

DEMO_SESSION_COOKIE_NAME = "session_id"
DEMO_SESSION_COOKIE_VALUE = "PTIT_ADMIN_TOKEN_12345"


@app.after_request
def ensure_demo_session_cookie(response):
    if DEMO_SESSION_COOKIE_NAME not in request.cookies:
        response.set_cookie(
            DEMO_SESSION_COOKIE_NAME,
            DEMO_SESSION_COOKIE_VALUE,
            httponly=False,   # cố tình để JS đọc được qua document.cookie
            samesite="Lax",
        )
    return response

#  PAGES (server-rendered shells; data is fetched client-side)

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/post/<int:post_id>")
def post_detail(post_id):
    """
    Trang chi tiết bài viết (route riêng, không còn dùng modal).
    Đây cũng là nơi demo Stored XSS: nếu một comment độc hại đã được
    lưu ở backend, bất kỳ ai mở link này cũng sẽ "dính" payload.
    (DOM-based XSS được demo ngay ở trang chủ, trong tính năng lọc
    bài viết theo thẻ qua URL — xem static/js/index.js)
    """
    post = next((p for p in data.POSTS if p["id"] == post_id), None)
    if not post:
        abort(404)
    return render_template("post.html", post=post)


#  JSON API

@app.route("/api/posts")
def api_posts():
    # Không trả field "content" (nội dung dài) ở danh sách, cho nhẹ payload
    light = [{k: v for k, v in p.items() if k != "content"} for p in data.POSTS]
    return jsonify(light)


@app.route("/api/posts/<int:post_id>")
def api_post_detail(post_id):
    post = next((p for p in data.POSTS if p["id"] == post_id), None)
    if not post:
        return jsonify({"error": "not_found"}), 404
    return jsonify(post)


@app.route("/api/search")
def api_search():
    """
    Reflected XSS demo endpoint.

    Backend KHÔNG lọc/encode chuỗi tìm kiếm trước khi trả về — giống hệt
    rất nhiều API tìm kiếm thực tế chỉ "echo" lại từ khoá người dùng gửi
    lên (q) để hiển thị kiểu "Kết quả tìm kiếm cho: <q>").

    Lỗ hổng Reflected XSS thực sự nằm ở chỗ FRONTEND ghi giá trị này vào
    DOM bằng innerHTML mà không encode (xem static/js/index.js,
    hàm renderSearchStatus). Vì vậy endpoint này luôn trả dữ liệu "thô";
    chế độ Vulnerable/Secure chỉ thay đổi cách FRONTEND render nó —
    đúng với nguyên tắc: output encoding phải làm tại nơi xuất dữ liệu
    ra, không phải tại nơi nhận input.
    """
    q = request.args.get("q", "")
    results = [
        {k: v for k, v in p.items() if k != "content"}
        for p in data.POSTS
        if q.lower() in p["title"].lower()
        or q.lower() in p["excerpt"].lower()
        or q.lower() in p["tag"].lower()
    ]
    return jsonify({"query": q, "total": len(results), "results": results})


@app.route("/api/comments/<int:post_id>", methods=["GET"])
def api_comments_get(post_id):
    if post_id not in data.COMMENTS:
        return jsonify({"error": "not_found"}), 404
    return jsonify(data.COMMENTS[post_id])


@app.route("/api/comments/<int:post_id>", methods=["POST"])
def api_comments_post(post_id):
    """
    Stored XSS demo endpoint.

    Backend lưu NGUYÊN VĂN nội dung comment — không "làm sạch" input.
    Đây là thực hành đúng theo nguyên tắc bảo mật hiện đại: không cố lọc
    dữ liệu lúc lưu (dễ bị bypass bằng encoding lạ), mà phải ENCODE lúc
    xuất ra HTML. Vì vậy ở đây ta để nguyên, và việc demo "Vulnerable"
    hay "Secure" nằm ở tầng hiển thị (xem static/js/post.js).
    """
    if post_id not in data.COMMENTS:
        return jsonify({"error": "not_found"}), 404

    body = request.get_json(silent=True) or {}
    name = (body.get("name") or "").strip()
    content = (body.get("content") or "").strip()

    if not name or not content:
        return jsonify({"error": "missing_fields"}), 400

    comment = {
        "id": data.next_comment_id(),
        "name": name,
        "content": content,
        "created": data.now_str(),
    }
    data.COMMENTS[post_id].append(comment)
    return jsonify(comment), 201


if __name__ == "__main__":
    app.run(debug=True, port=5000)
