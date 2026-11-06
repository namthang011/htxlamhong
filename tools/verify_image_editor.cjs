/** Browser regression checks for image resizing, alignment and saved HTML. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
    const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
    try {
        const page = await browser.newPage({ viewport: { width: 1024, height: 1000 } });
        const data = 'data:image/webp;base64,' + fs.readFileSync('src/main/resources/static/assets/images/logo.webp').toString('base64');
        await page.setContent('<main style="max-width:680px;margin:16px auto;padding:16px"><h1>Soạn nội dung</h1><div id="news" class="content-editor" contenteditable="true" style="padding:12px;border:1px solid #ccc"></div><div id="service" class="content-editor" contenteditable="true" style="padding:12px;border:1px solid #ccc"></div><div class="news-content" id="public"></div></main>');
        for (const file of ['css/style.css', 'css/admin.css', 'css/admin-content.css']) await page.addStyleTag({ path: path.resolve('src/main/resources/static', file) });
        await page.addScriptTag({ path: path.resolve('src/main/resources/static/js/rich-content.js') });
        await page.evaluate(data => {
            window.editors = {};
            for (const id of ['news', 'service']) {
                editors[id] = RichContent.editor(document.getElementById(id), async () => data, error => { throw error; });
                editors[id].set('<p>Trước ảnh</p><img src="' + data + '"><p>Sau ảnh</p>');
            }
        }, data);
        for (const id of ['news', 'service']) {
            const shell = page.locator('.rich-editor-shell').filter({ has: page.locator('#' + id) });
            const bar = shell.locator('xpath=preceding-sibling::*[1]');
            await page.locator('#' + id + ' img').click();
            await bar.getByLabel('Rộng (%)', { exact: false }).fill('40');
            await bar.getByRole('button', { name: 'Ảnh phải', exact: true }).click();
            await bar.getByLabel('Mô tả ảnh', { exact: false }).fill('Hướng dẫn hồ sơ');
            const saved = await page.evaluate(id => editors[id].get(), id);
            assert(saved.includes('data-image-width="40"') && saved.includes('data-image-align="right"'), 'Saved image settings in ' + id);
            assert(!saved.includes('data-editor-selected'), 'Selection state stays out of saved content');
            await page.evaluate(({ id, saved }) => { editors[id].set(saved); document.getElementById('public').innerHTML = RichContent.html(saved); }, { id, saved });
            const publicStyle = await page.locator('#public img').evaluate(img => ({ width: img.style.width, left: getComputedStyle(img).marginLeft, right: getComputedStyle(img).marginRight, alt: img.alt }));
            assert.equal(publicStyle.width, '40%'); assert.equal(publicStyle.right, '0px'); assert.equal(publicStyle.alt, 'Hướng dẫn hồ sơ');
            await page.locator('#' + id + ' img').click();
            await bar.getByRole('button', { name: 'Ảnh trái', exact: true }).click();
            const handle = shell.getByRole('button', { name: /Kéo để đổi kích thước/ });
            await handle.scrollIntoViewIfNeeded();
            const rect = await handle.boundingBox();
            await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
            await page.mouse.down(); await page.mouse.move(rect.x + rect.width / 2 + 70, rect.y + rect.height / 2); await page.mouse.up();
            assert(Number(await bar.getByLabel('Rộng (%)', { exact: false }).inputValue()) > 40, 'Pointer drag resizes image');
            await bar.getByRole('button', { name: 'Ảnh giữa', exact: true }).click();
            const persisted = await page.evaluate(id => editors[id].get(), id);
            assert(persisted.includes('data-image-align="center"'), 'Center alignment persists');
            await bar.getByRole('button', { name: 'Xóa ảnh', exact: true }).click();
            assert.equal(await page.locator('#' + id + ' img').count(), 0);
            assert((await page.locator('#' + id).innerText()).includes('Sau ảnh'), 'Removing image preserves neighboring text');
            await page.evaluate(id => editors[id].set('<p>Chèn ảnh ở đây</p>'), id);
            await page.locator('#' + id).click();
            const toolbar = shell.locator('xpath=preceding-sibling::*[3]');
            await toolbar.locator('input[type=file]').setInputFiles({ name: 'test.webp', mimeType: 'image/webp', buffer: Buffer.from(data.split(',')[1], 'base64') });
            await page.locator('#' + id + ' img').waitFor();
        }
        const safe = await page.evaluate(data => RichContent.html('<p style="text-align:center;background:url(javascript:alert(1))" onclick="alert(1)">Giữa</p><img src="' + data + '" data-image-width="500" data-image-align="evil" style="position:fixed;width:500%;height:9000px" onerror="alert(1)">'), data);
        assert(safe.includes('text-align: center')); assert(!/onclick|onerror|javascript:|position:|500%|9000px|data-image-width|data-image-align/.test(safe), 'Only whitelisted layout styles survive');
        await page.evaluate(() => {
            editors.news.set('<p>Nội dung căn giữa</p>');
            const range = document.createRange(); range.selectNodeContents(document.querySelector('#news p'));
            getSelection().removeAllRanges(); getSelection().addRange(range);
        });
        await page.locator('.rich-toolbar').first().getByRole('button', { name: 'Căn giữa', exact: true }).click();
        assert((await page.evaluate(() => editors.news.get())).includes('text-align: center'), 'Text alignment survives saving');
        await page.locator('#service img').focus();
        await page.keyboard.press('Enter');
        assert(await page.locator('.rich-image-controls').nth(1).getByLabel('Rộng (%)', { exact: false }).evaluate(input => input === document.activeElement), 'Keyboard users can select and resize images');
        for (const width of [768, 390, 320]) {
            await page.setViewportSize({ width, height: 900 });
            await page.locator('#service img').click();
            assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Editor controls fit viewport ' + width);
        }
        await page.setViewportSize({ width: 1024, height: 1000 });
        await page.locator('#service img').click();
        fs.mkdirSync('output/site-review', { recursive: true });
        await page.screenshot({ path: 'output/site-review/image-editor.png', fullPage: true });
        console.log('PASS: news and service image width/alignment/alt, pointer resize, insert/delete, save/reopen/public rendering, text alignment, safe styles and mobile controls.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
