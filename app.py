from flask import Flask, render_template, request, jsonify, abort

import data

app = Flask(__name__)

DEMO_SESSION_COOKIE_NAME = "session_id"
DEMO_SESSION_COOKIE_VALUE = "PTIT_ADMIN_TOKEN_12345"

DEMO_MODE_COOKIE_NAME = "xss_demo_mode"


def resolve_mode():
    """
    Ưu tiên: ?mode=... trên URL (để demo "gửi link kèm sẵn mode" hoạt
    động độc lập, không phụ thuộc cookie của trình duyệt nạn nhân) >
    cookie do công tắc 🔓/🛡️ ở nav ghi lại > mặc định "vulnerable".
    """
    mode = request.args.get("mode")
    if mode not in ("vulnerable", "secure"):
        mode = request.cookies.get(DEMO_MODE_COOKIE_NAME)
    if mode not in ("vulnerable", "secure"):
        mode = "vulnerable"
    return mode


# Content-Security-Policy áp dụng ở chế độ Secure (defense-in-depth).
CSP_POLICY = "; ".join([
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
])


@app.after_request
def apply_security_controls(response):
    """
    Bật/tắt các lớp phòng thủ theo mode (cùng công tắc 🔓/🛡️ ở nav):

    Vulnerable: cookie session_id KHÔNG HttpOnly (JS đọc được qua
                document.cookie -> payload XSS đánh cắp được), không CSP.
    Secure:     cookie session_id có HttpOnly (document.cookie không thấy
                nó) + gửi header CSP.

    Cookie được ghi đè mỗi response để khi đổi mode, thuộc tính HttpOnly
    của cookie đang có trên trình duyệt đổi theo ngay.
    """
    mode = resolve_mode()
    secure = mode == "secure"

    if request.args.get("mode") in ("vulnerable", "secure"):
        response.set_cookie(DEMO_MODE_COOKIE_NAME, mode, samesite="Lax")

    response.set_cookie(
        DEMO_SESSION_COOKIE_NAME,
        request.cookies.get(DEMO_SESSION_COOKIE_NAME, DEMO_SESSION_COOKIE_VALUE),
        httponly=secure,
        samesite="Lax",
    )

    if secure:
        response.headers["Content-Security-Policy"] = CSP_POLICY
        response.headers["X-Content-Type-Options"] = "nosniff"
    return response

#  PAGES (server-rendered shells; data is fetched client-side)

def render_search_page():
    q = request.args.get("q", "")
    mode = resolve_mode()
    secure = mode == "secure"
    return render_template("index.html", q=q, mode=mode, secure=secure)


@app.route("/")
def index():
    return render_search_page()


@app.route("/post/<int:post_id>")
def post_detail(post_id):

    post = next((p for p in data.POSTS if p["id"] == post_id), None)
    if not post:
        abort(404)
    return render_template("post.html", post=post)


#  JSON API

@app.route("/api/posts")
def api_posts():

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

    wants_json = "application/json" in request.headers.get("Accept", "")

    if wants_json:
        q = request.args.get("q", "")
        results = [
            {k: v for k, v in p.items() if k != "content"}
            for p in data.POSTS
            if q.lower() in p["title"].lower()
            or q.lower() in p["excerpt"].lower()
            or q.lower() in p["tag"].lower()
        ]
        return jsonify({"query": q, "total": len(results), "results": results})

    return render_search_page()


@app.route("/api/comments/<int:post_id>", methods=["GET"])
def api_comments_get(post_id):
    if post_id not in data.COMMENTS:
        return jsonify({"error": "not_found"}), 404
    return jsonify(data.COMMENTS[post_id])


@app.route("/api/comments/<int:post_id>", methods=["POST"])
def api_comments_post(post_id):

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
