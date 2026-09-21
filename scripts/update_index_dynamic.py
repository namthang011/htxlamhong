import re

path = r"d:\Study\HTX\src\main\resources\static\index.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace service grid
service_grid_regex = re.compile(r'<div class="service-grid">.*?</div>\s*</div>\s*</section>', re.DOTALL)
new_service_section = """<div class="service-grid" id="home-service-grid">
                    <!-- Dữ liệu dịch vụ sẽ được load bằng JS -->
                </div>
            </div>
        </section>"""
content = service_grid_regex.sub(new_service_section, content)

# Replace news grid
news_grid_regex = re.compile(r'<div class="news-grid">.*?</div>\s*</div>\s*</section>', re.DOTALL)
new_news_section = """<div class="news-grid" id="home-news-grid">
                    <!-- Dữ liệu tin tức sẽ được load bằng JS -->
                </div>
            </div>
        </section>"""
content = news_grid_regex.sub(new_news_section, content)

# Inject JS before </body>
js_code = """
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Kéo 6 dịch vụ mới nhất
    fetch('/api/public/services?size=6')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('home-service-grid');
            if (!container) return;
            let html = '';
            if (data.content && data.content.length > 0) {
                const colors = ['yellow', 'mint', 'blue', 'yellow', 'mint', 'blue'];
                data.content.forEach((item, index) => {
                    const colorClass = colors[index % colors.length];
                    const summary = item.summary ? item.summary : 'Nhấn xem chi tiết để biết thêm.';
                    const img = item.imageUrl ? item.imageUrl : 'static/logo.png';
                    html += `
                    <article class="service-card service-card--${colorClass}">
                        <div class="service-media service-media--plain" style="text-align:center;">
                            <img src="${img}" alt="${item.name}" style="max-height:120px; object-fit:contain; margin-top:20px;">
                        </div>
                        <h3>${item.name}</h3>
                        <p>${summary}</p>
                        <a href="dich-vu.html">Xem chi tiết <span>→</span></a>
                    </article>`;
                });
            } else {
                html = '<p>Chưa có dịch vụ nào.</p>';
            }
            container.innerHTML = html;
        });

    // Kéo 3 tin tức mới nhất
    fetch('/api/public/posts?size=3')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('home-news-grid');
            if (!container) return;
            let html = '';
            if (data.content && data.content.length > 0) {
                data.content.forEach(item => {
                    const img = item.thumbnailUrl ? item.thumbnailUrl : 'static/logo.png';
                    const dateStr = new Date(item.createdAt).toLocaleDateString('vi-VN');
                    html += `
                    <article class="news-card">
                        <div class="news-thumb" style="background-image: url('${img}'); background-size: cover; background-position: center; height:200px;"></div>
                        <div class="news-body">
                            <h3>${item.title}</h3>
                            <p class="news-meta">${dateStr}</p>
                            <p>${item.summary ? item.summary : 'Đang cập nhật...'}</p>
                            <a href="tin-tuc.html">Xem thêm →</a>
                        </div>
                    </article>`;
                });
            } else {
                html = '<p>Chưa có tin tức nào.</p>';
            }
            container.innerHTML = html;
        });
});
</script>
</body>
"""

content = content.replace("</body>", js_code)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated index.html to fetch from API!")
