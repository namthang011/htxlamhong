// Offline behavior check: simulated API/storage and modal library, actual application scripts.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
    const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.addInitScript(() => {
            localStorage.setItem('htx_jwt', 'Bearer simulated-test');
            window.bootstrap = {
                Modal: class {
                    constructor(element) { this.element = element; }
                    show() { this.element.style.display = 'block'; this.element.setAttribute('aria-hidden', 'false'); }
                    hide() { const event = new Event('hide.bs.modal', { cancelable: true }); if (!this.element.dispatchEvent(event)) return; this.element.style.display = 'none'; this.element.setAttribute('aria-hidden', 'true'); }
                }, Toast: class { show() {} }
            };
        });
        const url = '/uploads/' + 'a'.repeat(64) + '.mp4';
        let saved;
        const post = { id: 1, title: 'Video test', slug: 'video-test', summary: 'Summary', content: '<p>Content</p>', videoUrl: url };
        await page.route('**/*', async route => {
            const request = route.request(), parsed = new URL(request.url());
            if (parsed.hostname !== 'video.test') return route.fulfill({ body: '', contentType: parsed.pathname.endsWith('.js') ? 'text/javascript' : 'text/css' });
            if (parsed.pathname.startsWith('/api/')) {
                let result = [];
                if (parsed.pathname === '/api/public/posts') result = { content: [post] };
                else if (parsed.pathname === '/api/public/services') result = { content: [] };
                else if (parsed.pathname === '/api/public/about') result = { title: 'About', content: 'About' };
                else if (parsed.pathname === '/api/public/posts/1') result = post;
                else if (parsed.pathname === '/api/admin/videos') result = { url };
                else if (parsed.pathname === '/api/admin/posts/1') { saved = request.postDataJSON(); Object.assign(post, saved); result = post; }
                return route.fulfill({ json: result });
            }
            const file = path.resolve('src/main/resources/static', parsed.pathname === '/admin' ? 'admin.html' : parsed.pathname.slice(1));
            if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return route.fulfill({ status: 404, body: '' });
            const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css' };
            return route.fulfill({ body: fs.readFileSync(file), contentType: types[path.extname(file)] || 'application/octet-stream' });
        });
        await page.goto('http://video.test/admin');
        await page.locator('[data-edit-post="1"]').click();
        assert.equal(await page.locator('#post-content video').getAttribute('src'), url);
        await page.locator('#savePostButton').click();
        await page.waitForFunction(() => document.querySelector('#postModal').style.display === 'none');
        assert.equal(saved.videoUrl, null);
        assert(saved.content.includes('<video'), 'Legacy video migrates into content when saved');
        await page.locator('[data-edit-post="1"]').click();
        await page.locator('#post-content video').focus();
        await page.getByRole('button', { name: 'Xóa video đã chọn', exact: true }).click();
        assert.equal(await page.locator('#post-content video').count(), 0);
        await page.evaluate(() => {
            const editor = document.querySelector('#post-content');
            editor.innerHTML = '<p>Before</p><p>After</p>';
            editor.focus();
            const range = document.createRange(); range.setStartAfter(editor.firstChild); range.collapse(true);
            getSelection().removeAllRanges(); getSelection().addRange(range);
            document.dispatchEvent(new Event('selectionchange'));
        });
        const chooserPromise = page.waitForEvent('filechooser');
        await page.getByRole('button', { name: '+ Chèn video', exact: true }).click();
        const chooser = await chooserPromise;
        // Focus changes while the picker/upload is open must not move insertion to the end.
        await page.evaluate(() => {
            const editor = document.querySelector('#post-content');
            const range = document.createRange(); range.selectNodeContents(editor.lastChild); range.collapse(false);
            getSelection().removeAllRanges(); getSelection().addRange(range);
        });
        await chooser.setFiles([
            { name: 'clip.mp4', mimeType: 'video/mp4', buffer: Buffer.from('simulated video one') },
            { name: 'other.mp4', mimeType: 'video/mp4', buffer: Buffer.from('simulated video two') }
        ]);
        await page.waitForFunction(() => document.querySelectorAll('#post-content video').length === 2);
        await page.getByRole('button', { name: '+ Chèn video', exact: true }).waitFor();
        await page.waitForFunction(() => ![...document.querySelectorAll('#postModal button')].find(b => b.getAttribute('aria-label') === '+ Chèn video').disabled);
        await page.locator('#savePostButton').click();
        await page.waitForFunction(() => document.querySelector('#postModal').style.display === 'none');
        assert.equal(saved.videoUrl, null);
        assert.equal((saved.content.match(/<video/g) || []).length, 2);
        assert(saved.content.indexOf('Before') < saved.content.indexOf('<video'));
        assert(saved.content.lastIndexOf('</video>') < saved.content.indexOf('After'), 'Videos preserve captured insertion point');
        await page.locator('[data-edit-post="1"]').click();
        assert.equal(await page.locator('#post-content video').count(), 2, 'Videos survive save and reopen');
        const safe = await page.evaluate(() => RichContent.html('<video src="javascript:alert(1)" onerror="bad()"></video><video src="/uploads/' + 'a'.repeat(64) + '.mp4" autoplay loop onplay="bad()"><source src="https://bad.test/a"></video>'));
        assert(!safe.includes('javascript:') && !safe.includes('onplay') && !safe.includes('autoplay') && !safe.includes('<source'));
        assert(safe.includes('controls'));
        await page.goto('http://video.test/chi-tiet-tin-tuc.html?id=1');
        await page.locator('.news-content video').first().waitFor();
        assert.equal(await page.locator('.news-content video').count(), 2);
        assert.equal(await page.locator('.news-content video').first().getAttribute('src'), url);
        assert.equal(await page.locator('.news-content video').first().getAttribute('controls'), '');
        assert.deepEqual(errors, []);
        console.log('PASS: legacy migration, removal, multiple inline uploads at captured cursor position, save/reopen, HTML sanitization and public playback controls with simulated APIs.');
    } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
