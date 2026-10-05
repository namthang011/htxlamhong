import os
import shutil

scratch_dir = r"C:\Users\Thang\.gemini\antigravity\brain\d9fda1af-1eaa-4301-8510-807a03f12d58\scratch\frontend"
target_dir = r"d:\Study\HTX"
static_dir = r"d:\Study\HTX\src\main\resources\static"

full_footer = """
    <footer class="site-footer" id="lien-he">
        <div class="container footer-inner">
            <div class="footer-brand">
                <div class="footer-brand-header">
                    <img src="static/logo.png" alt="Logo HTX Lam H?ng" class="brand-contact-logo">
                    <h3>H?P TÁC XÃ VẬN TẢI LAM HỒNG</h3>
                </div>
                <div class="footer-brand-contacts">
                    <p><a href="https://maps.app.goo.gl/GebDgFPNYTgze2nBA" target="_blank" style="color: inherit; text-decoration: none;" rel="noopener noreferrer"><span class="footer-icon">📍</span> Thôn Ngọc Mỹ, Xã Hải Châu, Tỉnh Nghệ An</a></p>
                    <p><span class="footer-icon">📞</span> 0833 303 777</p>
                    <p><span class="footer-icon">✉️</span> htxvtlamhong@gmail.com</p>
                </div>
            </div>
            <div class="footer-info">
                <h3>Thông tin pháp lý</h3>
                <p><strong>Mã số thuế:</strong> 2902286417</p>
                <p><strong>Giấy phép kinh doanh:</strong> Số 2902286417</p>
                <p><strong>Cấp ngày:</strong> 20/08/2026</p>
                <p><strong>Nơi cấp:</strong> Ủy ban nhân dân xã Hải Châu</p>
            </div>
            <div class="footer-map" style="display:flex; flex-direction:column; gap:8px;">
                <h3 style="margin: 0; color: var(--green-900); font-size: 1.08rem; letter-spacing: -0.02em; line-height: 1.25;">Bản đồ</h3>
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3780.1!2d105.6927875!3d18.6856681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31377b2108eeb7a5%3A0x8a10186a4ce23920!2zSOG7o3AgVjDDoWMgWMOjIFbhuq1uIFThuqNpIExhbSBI4buTbmc!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s" width="100%" height="180" style="border:0; border-radius: 8px; flex-grow:1; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);" allowfullscreen="" loading="lazy"></iframe>
            </div>
        </div>
    </footer>
"""

favicon_tag = '    <link rel="icon" type="image/png" href="/static/logo.png">'

# 1. Restore pristine files
for f in os.listdir(scratch_dir):
    if f.endswith('.html') or f == 'config.js':
        shutil.copy2(os.path.join(scratch_dir, f), os.path.join(target_dir, f))

# 2. Modify files
for f in os.listdir(target_dir):
    if not f.endswith('.html'):
        continue
    filepath = os.path.join(target_dir, f)
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # URLs
    content = content.replace('href="index.html#trang-chu"', 'href="/"')
    content = content.replace('href="index.html"', 'href="/"')
    content = content.replace('href="dich-vu.html"', 'href="/dich-vu"')
    content = content.replace('href="tin-tuc.html"', 'href="/tin-tuc"')
    content = content.replace('href="chi-tiet-dich-vu.html', 'href="/chi-tiet-dich-vu')
    content = content.replace('href="chi-tiet-tin-tuc.html', 'href="/chi-tiet-tin-tuc')
    content = content.replace('href="admin.html"', 'href="/admin"')
    
    # Favicon
    if '<link rel="icon"' not in content:
        content = content.replace('</head>', f"{favicon_tag}\n</head>")
    
    # Footer
    if f != 'admin.html':
        import re
        if re.search(r'(?s)<footer.*?</footer>', content):
            content = re.sub(r'(?s)<footer.*?</footer>', full_footer, content)
        else:
            content = re.sub(r'(?s)(<script[^>]*>[\s\S]*</body>\s*</html>)', lambda m: f"\n{full_footer}\n{m.group(1)}", content)
            
    with open(filepath, 'w', encoding='utf-8') as file:
        file.write(content)
        
# 3. Copy to static
for f in os.listdir(target_dir):
    if f.endswith('.html') or f == 'config.js':
        shutil.copy2(os.path.join(target_dir, f), os.path.join(static_dir, f))
        
print("Python repair script completed successfully!")
