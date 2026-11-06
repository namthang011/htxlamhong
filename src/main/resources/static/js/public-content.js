/* Shared public content rendering: keep admin text out of HTML templates. */
document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const page = document.body.dataset.page;
    function node(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }
    function link(text, href, className = 'text-link') {
        const element = node('a', className, text); element.href = href; return element;
    }
    function image(src, alt, className = '') {
        const element = node('img', className);
        element.src = RichContent.imageUrl(src || '') || '/assets/images/logo.webp';
        element.alt = alt || 'HTX Vận tải Lam Hồng'; element.loading = 'lazy';
        element.addEventListener('error', () => { element.src = '/assets/images/logo.webp'; }, { once: true });
        return element;
    }
    async function api(path) {
        const response = await fetch(API_BASE_URL + '/api/public/' + path);
        if (!response.ok) {
            const error = new Error(response.status === 404 ? 'Nội dung không tồn tại hoặc đã được gỡ.' : 'Chưa thể tải dữ liệu. Vui lòng thử lại.');
            error.status = response.status; throw error;
        }
        return response.json();
    }
    function status(container, text, retry) {
        const box = node('div', 'status-message'); box.setAttribute('role', 'status');
        box.append(node('p', '', text));
        if (retry) { const button = node('button', 'btn btn-outline', 'Thử lại'); button.type = 'button'; button.addEventListener('click', retry); box.append(button); }
        container.replaceChildren(box);
    }
    function price(value) { return value != null && Number(value) > 0 ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value) : 'Liên hệ tư vấn'; }
    function date(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('vi-VN'); }
    function card(item, service) {
        const article = node('article', service ? 'service-card' : 'news-card');
        const href = (service ? '/chi-tiet-dich-vu?id=' : '/chi-tiet-tin-tuc?id=') + encodeURIComponent(item.id);
        const title = service ? item.name : item.title;
        const media = link('', href, 'card-media'); media.setAttribute('aria-label', title);
        media.append(image(service ? item.imageUrl : item.thumbnailUrl, title));
        const body = node('div', 'card-body');
        if (!service && date(item.createdAt)) body.append(node('p', 'news-meta', 'Đăng ngày ' + date(item.createdAt)));
        const heading = node('h3', 'card-title'); heading.append(link(title, href, ''));
        body.append(heading, node('p', 'card-summary', RichContent.plainText(item.summary || 'Xem nội dung chi tiết từ HTX Vận tải Lam Hồng.')));
        if (service) body.append(node('p', 'card-price', price(item.price)));
        const actions = node('div', 'card-actions'); actions.append(link(service ? 'Xem dịch vụ →' : 'Đọc bài viết →', href, service ? 'btn btn-primary' : 'text-link'));
        if (service) actions.append(link('Tư vấn', 'tel:0833303777', 'btn btn-outline'));
        body.append(actions); article.append(media, body); return article;
    }
    async function loadHomeList(id, path, render, empty) {
        const container = $(id); if (!container) return;
        const load = async () => {
            try {
                const data = await api(path); const items = Array.isArray(data) ? data : data.content;
                const visible = path.startsWith('services') ? items.filter(item => item.status !== 'INACTIVE') : items;
                if (!visible.length) { status(container, empty); return; }
                container.replaceChildren(...visible.map(render));
            } catch { status(container, 'Chưa thể tải nội dung. Vui lòng thử lại.', load); }
        };
        await load();
    }
    function review(item) {
        const article = node('article', 'review-card');
        const rating = Math.max(1, Math.min(5, item.rating || 5));
        const stars = node('div', 'review-stars', '★'.repeat(rating)); stars.setAttribute('aria-label', rating + ' trên 5 sao');
        const author = node('div', 'review-author'); const identity = node('div');
        identity.append(node('strong', '', item.memberName), node('span', '', item.memberTitle || ''));
        author.append(image(item.imageUrl, item.memberName, 'avatar'), identity);
        article.append(stars, node('p', '', '“' + item.content + '”'), author); return article;
    }
    function gallery(item) {
        const figure = node('figure', 'gallery-item'); figure.append(image(item.imageUrl, item.title || 'Hoạt động HTX Lam Hồng'));
        if (item.title) figure.append(node('figcaption', '', item.title)); return figure;
    }
    async function loadListing(service) {
        const container = $(service ? 'service-container' : 'post-container');
        const more = $('loadMore'); let currentPage = 0;
        const load = async () => {
            more.disabled = true;
            try {
                const data = await api((service ? 'services' : 'posts') + '?size=12&page=' + currentPage + '&sort=createdAt,desc');
                const items = service ? data.content.filter(item => item.status !== 'INACTIVE') : data.content;
                if (currentPage === 0) container.replaceChildren();
                else container.querySelector('.status-message')?.remove();
                container.append(...items.map(item => card(item, service)));
                if (!container.children.length && data.last) status(container, service ? 'Dịch vụ đang được cập nhật. Gọi 0833 303 777 để được tư vấn.' : 'Chưa có bài viết. Vui lòng quay lại sau.');
                more.hidden = data.last !== false; currentPage++;
            } catch {
                const retryBox = node('div'); status(retryBox, 'Chưa thể tải danh sách. Vui lòng thử lại.', load);
                if (currentPage === 0) container.replaceChildren(...retryBox.childNodes);
                else { container.querySelector('.status-message')?.remove(); container.append(...retryBox.childNodes); }
                more.hidden = true;
            } finally { more.disabled = false; }
        };
        more.addEventListener('click', load); await load();
    }
    function contact() {
        const box = node('aside', 'contact-box');
        box.append(node('h2', '', 'Cần tư vấn thêm?'), node('p', '', 'Liên hệ HTX Vận tải Lam Hồng để được hướng dẫn thủ tục và chi phí. Giờ làm việc: 7:30 – 17:30, Thứ 2 – Thứ 7.'), link('Gọi 0833 303 777', 'tel:0833303777', 'btn btn-primary'));
        return box;
    }
    async function loadDetail(service, about = false) {
        const container = $('detail-content');
        const load = async () => {
            const id = new URLSearchParams(location.search).get('id');
            if (!about && (!id || !/^\d+$/.test(id))) { status(container, service ? 'Vui lòng chọn một dịch vụ từ danh sách.' : 'Vui lòng chọn một bài viết từ danh sách.'); return; }
            try {
                const item = await api(about ? 'about' : (service ? 'services/' : 'posts/') + id);
                if (service && item.status === 'INACTIVE') { status(container, 'Dịch vụ này hiện tạm ngưng. Vui lòng liên hệ để được tư vấn.'); return; }
                const title = service ? item.name : item.title;
                document.title = title + ' | HTX Vận tải Lam Hồng';
                container.replaceChildren(node('p', 'eyebrow', about ? 'Về hợp tác xã' : service ? 'Dịch vụ Lam Hồng' : 'Tin tức & chia sẻ'), node('h1', '', title));
                if (!about) {
                    container.append(node('p', service ? 'card-price' : 'news-meta', service ? price(item.price) : 'Đăng ngày ' + date(item.createdAt)));
                    if (item.summary) container.append(node('p', 'detail-summary', RichContent.plainText(item.summary)));
                    const src = service ? item.imageUrl : item.thumbnailUrl;
                    if (src) container.append(image(src, title, 'detail-image'));
                }
                const content = node('div', service ? 'service-desc' : 'news-content');
                const text = service ? item.description : item.content;
                content.innerHTML = RichContent.html(text || '');
                if (!content.textContent.trim() && !content.querySelector('img')) content.append(node('p', '', about ? 'Nội dung giới thiệu đang được hợp tác xã cập nhật. Bạn có thể liên hệ trực tiếp để tìm hiểu thêm.' : 'Liên hệ hợp tác xã để được tư vấn thêm về dịch vụ này.'));
                container.append(content, contact());
            } catch (error) { status(container, error.message, error.status === 404 ? null : load); }
        };
        await load();
    }
    if (page === 'index') {
        loadHomeList('home-service-grid', 'services?size=6&sort=createdAt,desc', item => card(item, true), 'Dịch vụ đang được cập nhật. Liên hệ để được tư vấn.');
        loadHomeList('home-news-grid', 'posts?size=3&sort=createdAt,desc', item => card(item, false), 'Tin tức đang được cập nhật.');
        loadHomeList('home-testimonials', 'testimonials', review, 'Chia sẻ từ xã viên đang được cập nhật.');
        loadHomeList('home-gallery', 'gallery', gallery, 'Hình ảnh hoạt động đang được cập nhật.');
    }
    if (page === 'dich-vu' || page === 'tin-tuc') loadListing(page === 'dich-vu');
    if (page === 'chi-tiet-dich-vu' || page === 'chi-tiet-tin-tuc' || page === 'gioi-thieu') loadDetail(page === 'chi-tiet-dich-vu', page === 'gioi-thieu');
});
