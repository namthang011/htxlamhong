import re
import os

def fix_header(filepath, active_tab):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # The ideal header template
    header_template = """    <header class="site-header">
        <div class="container header-inner">
            <a href="index.html" class="brand" aria-label="Lam Hồng home">
                <img src="static/logo.png" alt="Logo HTX Lam Hồng" class="brand-logo">
                <span class="brand-copy">HTX VẬN TẢI LAM HỒNG</span>
            </a>

            <nav class="main-nav" id="mainNav">
                <a href="index.html#trang-chu" class="{active_home}">Trang chủ</a>
                <a href="index.html#gioi-thieu">Giới thiệu</a>
                <a href="dich-vu.html" class="{active_dv}">Dịch vụ</a>
                <a href="tin-tuc.html" class="{active_tt}">Tin tức</a>
                <a href="index.html#xa-vien">Bảng giá</a>
                <a href="index.html#lien-he">Liên hệ</a>
            </nav>

            <a href="tel:0833303777" class="header-btn"><span class="header-btn-icon">📞</span> 0833 303 777</a>
            <button class="menu-toggle" id="menuToggle" aria-label="Mở menu">☰</button>
        </div>
    </header>"""

    header_template = header_template.replace("{active_home}", "active" if active_tab == "home" else "")
    header_template = header_template.replace("{active_dv}", "active" if active_tab == "dv" else "")
    header_template = header_template.replace("{active_tt}", "active" if active_tab == "tt" else "")

    # Replace existing header
    content = re.sub(r'<header class="site-header">.*?</header>', header_template, content, flags=re.DOTALL)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

base_dir = r"d:\Study\HTX\src\main\resources\static"
fix_header(os.path.join(base_dir, "dich-vu.html"), "dv")
fix_header(os.path.join(base_dir, "tin-tuc.html"), "tt")
fix_header(os.path.join(base_dir, "chi-tiet-tin-tuc.html"), "tt")
fix_header(os.path.join(base_dir, "index.html"), "home")

print("Headers fixed!")
