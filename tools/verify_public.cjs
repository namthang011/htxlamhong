/** Browser smoke tests against the local app. Requires Playwright and Edge. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.SITE_URL || 'http://localhost:8081';

(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const services = await (await page.request.get(base + '/api/public/services?size=1')).json();
    const posts = await (await page.request.get(base + '/api/public/posts?size=1')).json();
    const serviceId = services.content[0]?.id;
    const postId = posts.content[0]?.id;
    const routes = ['/', '/gioi-thieu', '/dich-vu', '/tin-tuc', '/chi-tiet-dich-vu' + (serviceId ? '?id=' + serviceId : ''), '/chi-tiet-tin-tuc' + (postId ? '?id=' + postId : ''), '/404.html', '/500.html', '/admin'];
    fs.mkdirSync('output/site-review', { recursive: true });
    for (const width of [1440, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        for (const route of routes) {
            const response = await page.goto(base + route, { waitUntil: 'networkidle' });
            assert.equal(response.status(), 200, route);
            await page.waitForFunction(() => !document.querySelector('.loading'));
            const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, headings: document.querySelectorAll('h1').length }));
            assert(layout.scroll <= layout.width + 1, route + ': horizontal overflow at ' + width);
            if (route !== '/admin' && !route.startsWith('/chi-tiet-')) assert.equal(layout.headings, 1, route + ': main heading');
            if (route === '/admin') { assert(await page.locator('#loginScreen').isVisible()); continue; }
            assert.equal(await page.locator('.brand').count(), 1, 'Brand classes intact');
            assert.equal(await page.locator('.site-footer a[href="tel:0833303777"]').count(), 1);
            assert.equal(await page.locator('.site-footer a[href="mailto:htxvtlamhong@gmail.com"]').count(), 1);
            assert.equal(await page.locator('.main-nav a').count(), 5);
            if (width <= 768) {
                await page.locator('#menuToggle').click();
                assert.equal(await page.locator('#menuToggle').getAttribute('aria-expanded'), 'true');
                assert(await page.locator('.main-nav').isVisible());
                await page.keyboard.press('Escape');
                assert.equal(await page.locator('#menuToggle').getAttribute('aria-expanded'), 'false');
            }
            // Scroll to load below-the-fold images before checking or capturing.
            await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } });
            await page.waitForFunction(() => [...document.images].every(image => image.complete));
            const broken = await page.evaluate(() => [...document.images].filter(image => !image.naturalWidth).map(image => image.src));
            assert.deepEqual(broken, [], route + ': broken images');
            await page.evaluate(() => scrollTo(0, 0));
            if ([1440, 390].includes(width) && ['/', '/dich-vu', '/gioi-thieu', '/tin-tuc'].includes(route)) {
                await page.screenshot({ path: 'output/site-review/' + (route === '/' ? 'home' : route.slice(1)) + '-' + width + '.png', fullPage: true });
            }
        }
    }
    assert.deepEqual(errors, [], 'No JavaScript errors across routes');
    if (postId) assert.equal((await page.request.get(base + '/api/public/posts/' + postId)).status(), 200);
    if (serviceId) assert.equal((await page.request.get(base + '/api/public/services/' + serviceId)).status(), 200);
    assert.equal((await page.request.get(base + '/api/public/posts/999999999')).status(), 404);
    assert([401, 403].includes((await page.request.put(base + '/api/admin/about', { data: { title: 'Unauthorized', content: 'test' } })).status()), 'Admin API protected');
    await page.setViewportSize({ width: 1440, height: 900 });
    // Real retry flow without changing the database.
    let fail = true;
    await page.route('**/api/public/services?*', route => fail ? route.fulfill({ status: 503, body: '' }) : route.continue());
    await page.goto(base + '/dich-vu');
    await page.getByRole('button', { name: 'Thử lại', exact: true }).waitFor();
    fail = false;
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click();
    await page.locator('.service-card').first().waitFor();
    await page.unroute('**/api/public/services?*');
    // Pagination, safe text rendering, and empty list states.
    await page.route('**/api/public/posts?*', route => {
        const second = new URL(route.request().url()).searchParams.get('page') === '1';
        route.fulfill({ json: { content: [{ id: second ? 2 : 1, title: second ? 'Bài tiếp theo' : '<img src=x onerror=alert(1)>', summary: 'Mô tả', createdAt: '2026-10-26' }], last: second } });
    });
    await page.goto(base + '/tin-tuc');
    await page.getByRole('button', { name: 'Xem thêm', exact: true }).click();
    await page.locator('.news-card').nth(1).waitFor();
    assert.equal(await page.locator('.card-title img').count(), 0);
    assert.equal(await page.locator('#loadMore').isHidden(), true);
    await page.unroute('**/api/public/posts?*');
    await page.route('**/api/public/posts?*', route => route.fulfill({ json: { content: [], last: true } }));
    await page.goto(base + '/tin-tuc');
    await page.getByText('Chưa có bài viết. Vui lòng quay lại sau.').waitFor();
    console.log('PASS: 9 routes × 4 widths; menus, contact consistency, images, detail APIs, admin protection, retry, pagination, text escaping, empty state.');
    await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
