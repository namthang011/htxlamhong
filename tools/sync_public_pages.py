"""Regenerate public pages from shared header/footer and home templates."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATES = ROOT / 'tools' / 'site'
STATIC = ROOT / 'src' / 'main' / 'resources' / 'static'


def render(name, title, description, body, active=''):
    header = (TEMPLATES / 'header.html').read_text(encoding='utf-8')
    if active:
        before, nav = header.split('<nav', 1)
        header = before + '<nav' + nav.replace(f'href="{active}"', f'href="{active}" class="active" aria-current="page"', 1)
    footer = (TEMPLATES / 'footer.html').read_text(encoding='utf-8')
    page = f'''<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | HTX Vận tải Lam Hồng</title>
<meta name="description" content="{description}">
<link rel="icon" type="image/webp" href="/assets/images/logo.webp">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css?v=20261106-type2">
<script src="/config.js" defer></script><script src="/js/rich-content.js?v=20261106-cpanel" defer></script><script src="/js/main.js?v=20261026" defer></script><script src="/js/public-content.js?v=20261106" defer></script>
</head>
<body data-page="{name}"><a href="#main-content" class="skip-link">Chuyển đến nội dung</a>
{header}
{body}
{footer}
<a class="mobile-call-bar" href="tel:0833303777" aria-label="Gọi tư vấn 0833 303 777">☎ Tư vấn: 0833 303 777</a>
</body></html>
'''
    (STATIC / f'{name}.html').write_text(page, encoding='utf-8')


def heading(title, label, description):
    return f'''<section class="page-hero"><div class="container"><p class="eyebrow">{label}</p><h1>{title}</h1><p>{description}</p></div></section>'''


def main():
    home = (TEMPLATES / 'home.html').read_text(encoding='utf-8').replace('<main>', '<main id="main-content">')
    render('index', 'Đồng hành cùng tài xế', 'HTX Vận tải Lam Hồng tại Nghệ An. Dịch vụ hỗ trợ vận tải, thủ tục rõ ràng, chi phí minh bạch. Hotline 0833 303 777.', home, '/')
    for name, title, label, description, target in [
        ('dich-vu', 'Dịch vụ của Lam Hồng', 'Giải pháp cho tài xế', 'Tìm hiểu các dịch vụ hỗ trợ vận tải. Liên hệ để được tư vấn thủ tục và chi phí phù hợp với nhu cầu của bạn.', 'service-container'),
        ('tin-tuc', 'Tin tức & chia sẻ', 'Cập nhật từ hợp tác xã', 'Thông tin hoạt động và những chia sẻ hữu ích dành cho tài xế, xã viên HTX Vận tải Lam Hồng.', 'post-container')
    ]:
        body = '<main id="main-content">' + heading(title, label, description) + f'''<section class="page-content"><div class="container"><div id="{target}" class="grid-container" aria-live="polite"><p class="loading" role="status">Đang tải nội dung…</p></div><div class="pagination"><button id="loadMore" class="btn btn-outline" hidden>Xem thêm</button></div></div></section></main>'''
        render(name, title, description, body, '/' + name)
    for name, title, active, backlink, label in [
        ('chi-tiet-dich-vu', 'Chi tiết dịch vụ', '/dich-vu', '/dich-vu', 'Tất cả dịch vụ'),
        ('chi-tiet-tin-tuc', 'Chi tiết tin tức', '/tin-tuc', '/tin-tuc', 'Tất cả tin tức'),
        ('gioi-thieu', 'Giới thiệu', '/gioi-thieu', '/', 'Trang chủ')
    ]:
        body = f'''<main id="main-content" class="detail-page"><div class="container"><a class="back-link" href="{backlink}">← {label}</a><article id="detail-content" class="detail-article" aria-live="polite"><p class="loading" role="status">Đang tải nội dung…</p></article></div></main>'''
        render(name, title, 'Tìm hiểu HTX Vận tải Lam Hồng và các dịch vụ hỗ trợ vận tải tại Nghệ An. Liên hệ 0833 303 777.', body, active)
    for code, title, text in [('404', 'Không tìm thấy trang', 'Đường dẫn có thể đã thay đổi hoặc nội dung không còn tồn tại.'), ('500', 'Chưa thể tải trang', 'Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau hoặc liên hệ để được hỗ trợ.')]:
        body = f'''<main id="main-content" class="error-page"><div class="container"><p class="eyebrow">HTX Vận tải Lam Hồng</p><span class="error-code">{code}</span><h1>{title}</h1><p>{text}</p><div class="hero-actions"><a href="/" class="btn btn-primary">Về trang chủ</a><a href="tel:0833303777" class="btn btn-outline">Gọi tư vấn</a></div></div></main>'''
        render(code, title, text, body)
        (STATIC / 'error' / f'{code}.html').write_text((STATIC / f'{code}.html').read_text(encoding='utf-8'), encoding='utf-8')


if __name__ == '__main__':
    main()
