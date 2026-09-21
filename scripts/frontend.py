import os

static_dir = r"d:\Study\HTX\src\main\resources\static"
dich_vu_path = os.path.join(static_dir, "dich-vu.html")
tin_tuc_path = os.path.join(static_dir, "tin-tuc.html")

common_head = """<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
    <style>
        .page-content {{
            padding: 50px 0;
            background: #f8f9fa;
        }}
        .grid-container {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-top: 30px;
        }}
        .card {{
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }}
        .card:hover {{
            transform: translateY(-5px);
        }}
        .card-img {{
            width: 100%;
            height: 200px;
            object-fit: cover;
        }}
        .card-body {{
            padding: 20px;
        }}
        .card-title {{
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 10px;
            color: #333;
        }}
        .card-summary {{
            color: #666;
            margin-bottom: 15px;
            line-height: 1.5;
        }}
        .card-price {{
            font-weight: bold;
            color: #e74c3c;
            font-size: 1.2rem;
            margin-bottom: 15px;
        }}
        .btn-detail {{
            display: inline-block;
            padding: 8px 16px;
            background: #0056b3;
            color: white;
            text-decoration: none;
            border-radius: 4px;
        }}
        .btn-detail:hover {{
            background: #004494;
        }}
        .loading {{
            text-align: center;
            padding: 50px;
            font-size: 1.2rem;
        }}
    </style>
</head>
<body>
    <div class="topbar">
        <div class="container topbar-inner">
            <div class="topbar-item">
                <span>📍 Thôn Ngọc Minh, Xã Hải Châu, Tỉnh Nghệ An</span>
            </div>
            <div class="topbar-item topbar-right">
                <span>📞 Hotline: 0833 303 777</span>
                <span>⏰ Giờ làm việc: 7:30 - 17:30 (T2 - T7)</span>
            </div>
        </div>
    </div>

    <header class="site-header">
        <div class="container header-inner">
            <a href="index.html" class="brand">
                <img src="static/logo.png" alt="Logo HTX Lam Hồng" class="brand-logo">
                <span class="brand-copy">HTX VẬN TẢI LAM HỒNG</span>
            </a>
            <nav class="main-nav">
                <a href="index.html">Trang chủ</a>
                <a href="dich-vu.html" class="{active_dv}">Dịch vụ</a>
                <a href="tin-tuc.html" class="{active_tt}">Tin tức</a>
                <a href="index.html#lien-he">Liên hệ</a>
            </nav>
        </div>
    </header>
"""

common_footer = """
    <footer class="site-footer" id="lien-he">
        <div class="container footer-inner">
            <div class="footer-brand">
                <div class="footer-brand-header">
                    <img src="static/logo.png" alt="Logo HTX Lam Hồng" class="brand-contact-logo">
                    <h3>HỢP TÁC XÃ VẬN TẢI LAM HỒNG</h3>
                </div>
                <div class="footer-brand-contacts">
                    <p><span class="footer-icon">📍</span> Thôn Ngọc Minh, Xã Hải Châu, Tỉnh Nghệ An</p>
                    <p><span class="footer-icon">📞</span> 0833 303 777</p>
                    <p><span class="footer-icon">📧</span> htxvtlamhong@gmail.com</p>
                </div>
            </div>
        </div>
    </footer>
</body>
</html>
"""

# DICH VU HTML
dich_vu_html = common_head.format(title="Danh sách Dịch vụ - HTX Lam Hồng", active_dv="active", active_tt="") + """
    <section class="page-content">
        <div class="container">
            <h2 style="text-align: center; color: #0056b3; font-size: 2rem;">DANH SÁCH DỊCH VỤ</h2>
            <div id="service-container" class="grid-container">
                <div class="loading">Đang tải dữ liệu dịch vụ...</div>
            </div>
        </div>
    </section>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            fetch('/api/public/services')
                .then(response => response.json())
                .then(data => {
                    const container = document.getElementById('service-container');
                    container.innerHTML = ''; // Clear loading
                    
                    if(data.content && data.content.length > 0) {
                        data.content.forEach(item => {
                            const priceText = item.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price) : 'Liên hệ';
                            const imgUrl = item.imageUrl ? item.imageUrl : 'static/logo.png';
                            
                            const card = `
                                <div class="card">
                                    <img src="${imgUrl}" class="card-img" alt="${item.name}">
                                    <div class="card-body">
                                        <h3 class="card-title">${item.name}</h3>
                                        <p class="card-summary">${item.summary || 'Chưa có mô tả'}</p>
                                        <div class="card-price">${priceText}</div>
                                        <a href="#" class="btn-detail" onclick="alert('Đang phát triển trang chi tiết!')">Xem chi tiết</a>
                                        <a href="index.html#lien-he" class="btn-detail" style="background: #28a745;">Liên hệ</a>
                                    </div>
                                </div>
                            `;
                            container.innerHTML += card;
                        });
                    } else {
                        container.innerHTML = '<p>Hiện tại chưa có dịch vụ nào.</p>';
                    }
                })
                .catch(error => {
                    console.error('Error fetching services:', error);
                    document.getElementById('service-container').innerHTML = '<p style="color:red;">Lỗi tải dữ liệu. Vui lòng thử lại sau.</p>';
                });
        });
    </script>
""" + common_footer

with open(dich_vu_path, "w", encoding="utf-8") as f:
    f.write(dich_vu_html)

# TIN TUC HTML
tin_tuc_html = common_head.format(title="Tin Tức - HTX Lam Hồng", active_dv="", active_tt="active") + """
    <section class="page-content">
        <div class="container">
            <h2 style="text-align: center; color: #0056b3; font-size: 2rem;">TIN TỨC CẬP NHẬT</h2>
            <div id="post-container" class="grid-container">
                <div class="loading">Đang tải tin tức...</div>
            </div>
        </div>
    </section>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            fetch('/api/public/posts')
                .then(response => response.json())
                .then(data => {
                    const container = document.getElementById('post-container');
                    container.innerHTML = ''; // Clear loading
                    
                    if(data.content && data.content.length > 0) {
                        data.content.forEach(item => {
                            const imgUrl = item.thumbnailUrl ? item.thumbnailUrl : 'static/logo.png';
                            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Mới cập nhật';
                            
                            const card = `
                                <div class="card">
                                    <img src="${imgUrl}" class="card-img" alt="${item.title}">
                                    <div class="card-body">
                                        <div style="color: #888; font-size: 0.9rem; margin-bottom: 10px;">🕒 ${dateStr}</div>
                                        <h3 class="card-title">${item.title}</h3>
                                        <p class="card-summary">${item.summary || 'Đang cập nhật nội dung...'}</p>
                                        <a href="#" class="btn-detail">Đọc tiếp</a>
                                    </div>
                                </div>
                            `;
                            container.innerHTML += card;
                        });
                    } else {
                        container.innerHTML = '<p>Chưa có bài viết nào.</p>';
                    }
                })
                .catch(error => {
                    console.error('Error fetching posts:', error);
                    document.getElementById('post-container').innerHTML = '<p style="color:red;">Lỗi tải dữ liệu. Vui lòng thử lại sau.</p>';
                });
        });
    </script>
""" + common_footer

with open(tin_tuc_path, "w", encoding="utf-8") as f:
    f.write(tin_tuc_html)

print("Created dich-vu.html and tin-tuc.html")
