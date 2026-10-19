"""
data.py
────────────────────────────────────────────────────────────────
In-memory "database" for the CodeBlog XSS demo app.

Everything lives in plain Python lists/dicts and resets whenever the
Flask process restarts. That's intentional: this project exists to
demo three classes of Cross-Site Scripting (XSS), not to be a real
blog, so there is no real database, auth, or persistence layer.
────────────────────────────────────────────────────────────────
"""
import itertools
from datetime import datetime

# BLOG POSTS (trusted content — written by "us", not user input)
POSTS = [
    {
        "id": 1,
        "tag": "Python",
        "category": "data",
        "date": "12/10/2026",
        "emoji": "🐍",
        "image": "/static/images/python-icon.png",
        "bg": "linear-gradient(135deg,#dbeafe,#bfdbfe)",
        "avatarColor": "#1d4ed8",
        "authorInitial": "A",
        "author": "An Nguyen",
        "title": "Python cho Xử Lý Dữ Liệu: Từ Cơ Bản Đến Nâng Cao",
        "excerpt": "Khám phá cách Python trở thành ngôn ngữ số một cho khoa học dữ liệu, với Pandas, NumPy và hệ sinh thái mạnh mẽ.",
        "content": """
            <p>Python đã khẳng định vị thế là ngôn ngữ hàng đầu trong lĩnh vực xử lý và phân tích dữ liệu
            nhờ cú pháp dễ đọc và hệ sinh thái thư viện phong phú.</p>
            <h3>Vì sao Python phù hợp với Data?</h3>
            <ul>
              <li>Thư viện Pandas giúp thao tác bảng dữ liệu cực kỳ trực quan</li>
              <li>NumPy tối ưu các phép toán ma trận, vector hoá tính toán</li>
              <li>Cộng đồng lớn, tài liệu phong phú, dễ học</li>
            </ul>
            <h3>Ví dụ nhanh</h3>
            <pre><code>import pandas as pd
df = pd.read_csv("sales.csv")
print(df.groupby("region")["revenue"].sum())</code></pre>
            <p>Chỉ với vài dòng code, bạn đã có thể tổng hợp doanh thu theo khu vực.</p>
        """,
    },
    {
        "id": 2,
        "tag": "JavaScript",
        "category": "web",
        "date": "10/10/2026",
        "emoji": "🟨",
        "image": "/static/images/javascript-icon.png",
        "bg": "linear-gradient(135deg,#fef3c7,#fde68a)",
        "avatarColor": "#b45309",
        "authorInitial": "B",
        "author": "Bao Tran",
        "title": "JavaScript Hiện Đại: ES6+ Và Những Điều Cần Biết",
        "excerpt": "Tổng hợp các tính năng ES6+ quan trọng nhất mà mọi lập trình viên JavaScript nên nắm vững.",
        "content": """
            <p>JavaScript không ngừng phát triển kể từ khi ES6 (ES2015) ra mắt, mang đến hàng loạt
            cú pháp và tính năng mới giúp code gọn gàng, dễ bảo trì hơn.</p>
            <h3>Những tính năng nổi bật</h3>
            <ul>
              <li>Arrow functions và lexical <code>this</code></li>
              <li>Destructuring, spread/rest operator</li>
              <li>Promise, async/await cho bất đồng bộ</li>
              <li>Template literals</li>
            </ul>
            <pre><code>const greet = (name) => `Xin chào, ${name}!`;
console.log(greet("CodeBlog"));</code></pre>
        """,
    },
    {
        "id": 3,
        "tag": "Rust",
        "category": "system",
        "date": "08/10/2026",
        "emoji": "🦀",
        "image": "/static/images/rust-icon.png",
        "bg": "linear-gradient(135deg,#fee2e2,#fecaca)",
        "avatarColor": "#b91c1c",
        "authorInitial": "C",
        "author": "Chi Pham",
        "title": "Rust: Hiệu Năng Của C++ Với Sự An Toàn Bộ Nhớ",
        "excerpt": "Tìm hiểu vì sao Rust liên tục được bình chọn là ngôn ngữ được yêu thích nhất trong nhiều năm liền.",
        "content": """
            <p>Rust giải quyết bài toán hóc búa nhất của lập trình hệ thống: hiệu năng cao nhưng vẫn
            an toàn bộ nhớ, nhờ cơ chế <em>ownership</em> và <em>borrow checker</em> độc đáo.</p>
            <h3>Ownership trong 3 quy tắc</h3>
            <ul>
              <li>Mỗi giá trị có đúng một chủ sở hữu (owner)</li>
              <li>Chỉ có một owner tại một thời điểm</li>
              <li>Khi owner ra khỏi phạm vi, giá trị bị giải phóng</li>
            </ul>
            <pre><code>fn main() {
    let s = String::from("CodeBlog");
    println!("{}", s);
}</code></pre>
        """,
    },
    {
        "id": 4,
        "tag": "Go",
        "category": "system",
        "date": "05/10/2026",
        "emoji": "🐹",
        "image": "/static/images/go-icon.png",
        "bg": "linear-gradient(135deg,#cffafe,#a5f3fc)",
        "avatarColor": "#0e7490",
        "authorInitial": "D",
        "author": "Duy Le",
        "title": "Go: Lựa Chọn Hàng Đầu Cho Microservices",
        "excerpt": "Go (Golang) với goroutine và channel đã trở thành tiêu chuẩn cho hệ thống backend hiệu năng cao.",
        "content": """
            <p>Go được Google phát triển với mục tiêu đơn giản hoá lập trình đồng thời (concurrency)
            mà vẫn giữ hiệu năng gần với các ngôn ngữ biên dịch truyền thống.</p>
            <h3>Goroutine nhẹ như thế nào?</h3>
            <p>Một goroutine chỉ tốn vài KB bộ nhớ ban đầu, cho phép hàng chục nghìn goroutine chạy
            song song trên một máy duy nhất.</p>
            <pre><code>go func() {
    fmt.Println("Hello from goroutine")
}()</code></pre>
        """,
    },
    {
        "id": 5,
        "tag": "TypeScript",
        "category": "web",
        "date": "02/10/2026",
        "emoji": "🔷",
        "image": "/static/images/typescript-icon.png",
        "bg": "linear-gradient(135deg,#eff6ff,#dbeafe)",
        "avatarColor": "#2563eb",
        "authorInitial": "E",
        "author": "Em Vu",
        "title": "TypeScript: Thêm Type Cho JavaScript Của Bạn",
        "excerpt": "TypeScript giúp bắt lỗi sớm, cải thiện khả năng tự động hoàn thành code và bảo trì dự án lớn.",
        "content": """
            <p>TypeScript là một superset của JavaScript, bổ sung hệ thống kiểu tĩnh (static typing)
            giúp phát hiện lỗi ngay khi biên dịch thay vì lúc chạy.</p>
            <h3>Ví dụ Interface</h3>
            <pre><code>interface User {
  name: string;
  age: number;
}

function greet(u: User): string {
  return `Hi ${u.name}`;
}</code></pre>
        """,
    },
    {
        "id": 6,
        "tag": "C++",
        "category": "system",
        "date": "28/09/2026",
        "emoji": "⚙️",
        "image": "/static/images/c++-icon.png",
        "bg": "linear-gradient(135deg,#ede9fe,#ddd6fe)",
        "avatarColor": "#6d28d9",
        "authorInitial": "F",
        "author": "Phuc Hoang",
        "title": "C++ Hiện Đại (C++17/20): Không Còn Đáng Sợ Như Bạn Nghĩ",
        "excerpt": "Các tiêu chuẩn C++ mới mang đến smart pointer, ranges, concepts giúp code an toàn và hiện đại hơn.",
        "content": """
            <p>C++ hiện đại đã rất khác so với C++ của 20 năm trước, với nhiều tính năng giúp quản lý
            bộ nhớ an toàn hơn và cú pháp biểu cảm hơn.</p>
            <h3>Smart pointers</h3>
            <pre><code>#include &lt;memory&gt;
auto ptr = std::make_unique&lt;int&gt;(42);</code></pre>
            <p>Không còn phải tự gọi <code>delete</code> thủ công, giảm nguy cơ rò rỉ bộ nhớ.</p>
        """,
    },
]


# COMMENTS (untrusted user input — stored exactly as submitted)

_comment_id_counter = itertools.count(1)

COMMENTS = {
    1: [
        {
            "id": next(_comment_id_counter),
            "name": "Hoa Nguyen",
            "content": "Bài viết rất hữu ích, cảm ơn admin!",
            "created": "12/10/2026 09:15",
        }
    ],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
}


def next_comment_id():
    return next(_comment_id_counter)


def now_str():
    return datetime.now().strftime("%d/%m/%Y %H:%M")
