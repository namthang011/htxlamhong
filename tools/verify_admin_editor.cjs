/** Check actual admin forms against mocked APIs; never writes to the database. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
    const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.addInitScript(() => localStorage.setItem('htx_jwt', 'Bearer test-only-mocked-api'));
        const html = '<p>Nội dung trước ảnh</p><img src="/assets/images/logo.webp"><p>Nội dung sau ảnh</p>';
        const post = { id: 1, title: 'Bài viết thử nghiệm', slug: 'bai-viet-thu', summary: 'Mô tả', content: html };
        const service = { id: 2, name: 'Dịch vụ thử nghiệm', slug: 'dich-vu-thu', summary: 'Mô tả', description: html, status: 'ACTIVE' };
        let savedPost, savedService;
        await page.route('http://editor.test/**', async route => {
            const request = route.request(), url = new URL(request.url());
            if (url.pathname.startsWith('/api/')) {
                let data = [];
                if (request.method() === 'PUT' && url.pathname === '/api/admin/posts/1') { savedPost = request.postDataJSON(); Object.assign(post, savedPost); data = post; }
                else if (request.method() === 'PUT' && url.pathname === '/api/admin/services/2') { savedService = request.postDataJSON(); Object.assign(service, savedService); data = service; }
                else if (url.pathname === '/api/public/posts') data = { content: [post] };
                else if (url.pathname === '/api/public/services') data = { content: [service] };
                else if (url.pathname === '/api/public/about') data = { title: 'Giới thiệu', content: '<p>Giới thiệu</p>' };
                return route.fulfill({ json: data });
            }
            const name = url.pathname === '/admin' ? 'admin.html' : url.pathname.slice(1);
            const file = path.resolve('src/main/resources/static', name);
            const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp' };
            if (fs.existsSync(file) && fs.statSync(file).isFile()) return route.fulfill({ body: fs.readFileSync(file), contentType: types[path.extname(file)] || 'application/octet-stream' });
            return route.fulfill({ status: 404, body: '' });
        });
        await page.goto('http://editor.test/admin');
        await page.locator('[data-edit-post="1"]').click();
        await page.locator('#post-content img').click();
        const postControls = page.locator('#postModal .rich-image-controls');
        await postControls.getByLabel('Rộng (%)', { exact: false }).fill('42');
        await postControls.getByRole('button', { name: 'Ảnh trái', exact: true }).click();
        await page.locator('#savePostButton').click();
        await page.locator('#postModal').waitFor({ state: 'hidden' });
        assert(savedPost.content.includes('data-image-width="42"') && savedPost.content.includes('data-image-align="left"'), 'Post API receives image layout');
        await page.locator('[data-edit-post="1"]').click();
        assert.equal(await page.locator('#post-content img').getAttribute('data-image-width'), '42');
        await page.locator('#postModal .btn-close').click();
        await page.locator('#postModal').waitFor({ state: 'hidden' });
        await page.locator('[data-tab="services"]').click();
        await page.locator('[data-edit-service="2"]').click();
        await page.locator('#srv-description img').click();
        const serviceControls = page.locator('#serviceModal .rich-image-controls');
        await serviceControls.getByLabel('Rộng (%)', { exact: false }).fill('33');
        await serviceControls.getByRole('button', { name: 'Ảnh phải', exact: true }).click();
        fs.mkdirSync('output/site-review', { recursive: true });
        await page.screenshot({ path: 'output/site-review/service-editor-modal.png' });
        await page.locator('#saveServiceButton').click();
        await page.locator('#serviceModal').waitFor({ state: 'hidden' });
        assert(savedService.description.includes('data-image-width="33"') && savedService.description.includes('data-image-align="right"'), 'Service API receives rich content and image layout');
        await page.locator('[data-edit-service="2"]').click();
        assert.equal(await page.locator('#srv-description img').getAttribute('data-image-align'), 'right');
        assert.deepEqual(errors, []);
        console.log('PASS: actual news/service admin forms preserve image dimensions and alignment through API save and reopen; no database writes.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
