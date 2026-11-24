/** Offline browser checks for slug links and legacy compatibility, without DB writes. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
    const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
    try {
        const page = await browser.newPage();
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        const item = { id: 416, slug: 'huong-dan-phu-hieu-xe', title: 'Hướng dẫn phù hiệu xe', content: '<p>Nội dung bài viết</p>' };
        const requests = [];
        await page.route('http://news.test/**', async route => {
            const url = new URL(route.request().url());
            if (url.pathname.startsWith('/api/public/')) {
                requests.push(url.pathname);
                const missing = url.pathname.endsWith('/missing');
                const data = url.pathname === '/api/public/posts' ? { content: [item], last: true } : item;
                return route.fulfill({ status: missing ? 404 : 200, contentType: 'application/json', body: JSON.stringify(data) });
            }
            const listing = url.pathname === '/tin-tuc';
            return route.fulfill({ contentType: 'text/html', body: `<html><head></head><body data-page="${listing ? 'tin-tuc' : 'chi-tiet-tin-tuc'}">${listing ? '<div id="post-container"></div><button id="loadMore"></button>' : '<div id="detail-content"></div>'}</body></html>` });
        });
        async function open(url) {
            await page.goto('http://news.test' + url);
            await page.evaluate(() => window.API_BASE_URL = '');
            for (const file of ['rich-content.js', 'public-content.js']) await page.addScriptTag({ path: path.resolve('src/main/resources/static/js', file) });
            await page.evaluate(() => document.dispatchEvent(new Event('DOMContentLoaded')));
        }
        await open('/tin-tuc');
        await page.locator('.news-card').waitFor();
        assert.equal(await page.locator('.card-title a').getAttribute('href'), '/tin-tuc/' + item.slug);
        await open('/tin-tuc/' + item.slug + '?utm_source=test');
        await page.locator('#detail-content h1').waitFor();
        assert(requests.includes('/api/public/posts/slug/' + item.slug));
        assert.equal(await page.locator('h1').textContent(), item.title);
        assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), 'http://news.test/tin-tuc/' + item.slug);
        // Old cPanel URLs still fetch by ID and update the address without a reload.
        await open('/chi-tiet-tin-tuc?id=416#noi-dung');
        await page.locator('#detail-content h1').waitFor();
        assert(requests.includes('/api/public/posts/416'));
        assert.equal(page.url(), 'http://news.test/tin-tuc/' + item.slug + '#noi-dung');
        await page.reload();
        await page.evaluate(() => window.API_BASE_URL = '');
        for (const file of ['rich-content.js', 'public-content.js']) await page.addScriptTag({ path: path.resolve('src/main/resources/static/js', file) });
        await page.evaluate(() => document.dispatchEvent(new Event('DOMContentLoaded')));
        await page.locator('#detail-content h1').waitFor();
        await open('/tin-tuc/missing');
        await page.locator('.status-message').waitFor();
        assert.equal(await page.locator('h1').count(), 0);
        assert.equal(await page.locator('link[rel=canonical]').count(), 0);
        assert.deepEqual(errors, []);
        const rules = fs.readFileSync('deploy/cpanel/.htaccess', 'utf8');
        assert(rules.includes('RewriteRule ^tin-tuc/([^/]+)/?$ chi-tiet-tin-tuc.html [L]'));
        console.log('PASS: listing slug links, slug API rendering, legacy ID upgrade, canonical URL, reload and missing article');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
