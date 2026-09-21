import os
path = r"d:\Study\HTX\src\main\resources\static\chi-tiet-tin-tuc.html"
html = """<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chi tiết tin tức - HTX Lam Hồng</title>
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <style>
        .news-detail-container { max-width: 800px; margin: 50px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .news-title { font-size: 2.2rem; color: #0056b3; margin-bottom: 10px; }
        .news-date { color: #888; font-size: 0.95rem; margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px;}
        .news-thumb { width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; margin-bottom: 25px; }
        .news-content { font-size: 1.1rem; line-height: 1.8; color: #333; }
        .back-link { display: inline-block; margin-bottom: 20px; color: #0056b3; text-decoration: none; font-weight: 500; }
        .back-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <header class="site-header">
        <div class="container header-inner">
            <a href="index.html" class="brand">
                <img src="static/logo.png" alt="Logo HTX Lam Hồng" class="brand-logo">
                <span class="brand-copy">HTX VẬN TẢI LAM HỒNG</span>
            </a>
            <nav class="main-nav">
                <a href="index.html">Trang chủ</a>
                <a href="dich-vu.html">Dịch vụ</a>
                <a href="tin-tuc.html" class="active">Tin tức</a>
            </nav>
        </div>
    </header>

    <div class="news-detail-container">
        <a href="tin-tuc.html" class="back-link">← Quay lại danh sách</a>
        <div id="detail-content">
            <div style="text-align:center; padding: 50px;">Đang tải nội dung...</div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('id');
            if(!id) {
                document.getElementById('detail-content').innerHTML = '<p style="color:red">Không tìm thấy bài viết.</p>';
                return;
            }

            // Dùng trick lấy danh sách rồi lọc vì ta chưa có API chi tiết GET /api/public/posts/{id}
            // Nhưng Spring Data REST có thể hỗ trợ, để chắc chắn ta cứ gọi API list (size lớn) 
            fetch('/api/public/posts?size=100')
                .then(res => res.json())
                .then(data => {
                    const post = data.content.find(p => p.id == id);
                    if(post) {
                        const dateStr = new Date(post.createdAt).toLocaleDateString('vi-VN');
                        const img = post.thumbnailUrl ? post.thumbnailUrl : 'static/logo.png';
                        document.title = post.title + " - HTX Lam Hồng";
                        
                        document.getElementById('detail-content').innerHTML = `
                            <h1 class="news-title">${post.title}</h1>
                            <div class="news-date">Đăng ngày: ${dateStr}</div>
                            <img src="${img}" class="news-thumb" alt="${post.title}">
                            <div class="news-content">
                                <p style="font-weight:bold">${post.summary}</p>
                                ${post.content ? post.content.replace(/\\n/g, '<br>') : 'Nội dung đang cập nhật...'}
                            </div>
                        `;
                    } else {
                        document.getElementById('detail-content').innerHTML = '<p style="color:red">Bài viết không tồn tại hoặc đã bị xóa.</p>';
                    }
                });
        });
    </script>
</body>
</html>
"""
with open(path, "w", encoding="utf-8") as f:
    f.write(html)
print("Created chi-tiet-tin-tuc.html")
