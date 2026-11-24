/** Offline checks for table editing, safe clipboard HTML and public rendering. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
    const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
    try {
        const page = await browser.newPage();
        await page.setContent('<div id="editor" contenteditable="true"></div><div class="news-content" id="output"></div>');
        await page.addScriptTag({ path: path.resolve('src/main/resources/static/js/rich-content.js') });
        await page.addStyleTag({ path: path.resolve('src/main/resources/static/css/admin-content.css') });
        await page.addStyleTag({ path: path.resolve('src/main/resources/static/css/style.css') });
        await page.evaluate(() => { window.editor = RichContent.editor(document.querySelector('#editor'), async () => '', error => { throw error; }); });
        await page.getByRole('button', { name: '+ Chèn bảng', exact: true }).click();
        await page.getByRole('button', { name: 'Tạo bảng', exact: true }).click();
        assert.equal(await page.locator('#editor tr').count(), 3);
        assert.equal(await page.locator('#editor th').count(), 3);
        await page.locator('#editor td').first().click();
        await page.getByRole('button', { name: 'Thêm hàng', exact: true }).click();
        assert.equal(await page.locator('#editor tr').count(), 4);
        await page.getByRole('button', { name: 'Thêm cột', exact: true }).click();
        assert.equal(await page.locator('#editor th').count(), 4);
        await page.getByRole('button', { name: 'Xóa cột', exact: true }).click();
        assert.equal(await page.locator('#editor th').count(), 3);
        await page.getByRole('button', { name: 'Xóa hàng', exact: true }).click();
        assert.equal(await page.locator('#editor tr').count(), 3);
        const result = await page.evaluate(() => {
            const saved = editor.get(); editor.set(saved);
            const roundTrip = editor.get() === saved;
            const safe = RichContent.html('<table onclick="alert(1)"><caption>Giá</caption><tbody><tr><th scope="col" colspan="2" style="text-align:center;color:red">Tên</th></tr><tr><td rowspan="2" onmouseover="x()">A</td><td>B<script>x()</script></td></tr></tbody></table>');
            editor.set(''); const element = document.querySelector('#editor'); element.focus();
            const clipboard = new DataTransfer(); clipboard.setData('text/html', safe);
            element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: clipboard, bubbles: true, cancelable: true }));
            const paste = editor.get();
            editor.set(''); element.focus();
            const tsv = new DataTransfer(); tsv.setData('text/plain', 'Tên\tGiá\nA\t100\n');
            element.dispatchEvent(new ClipboardEvent('paste', { clipboardData: tsv, bubbles: true, cancelable: true }));
            const cells = element.querySelectorAll('td').length;
            document.querySelector('#output').innerHTML = RichContent.html(paste);
            return { roundTrip, safe, paste, cells };
        });
        assert(result.roundTrip, 'Table survives save and reopen');
        assert(result.safe.includes('colspan="2"') && result.safe.includes('rowspan="2"') && result.safe.includes('scope="col"'));
        assert(!/onclick|onmouseover|<script|color:/.test(result.safe), 'Unsafe attributes removed');
        assert(result.paste.includes('<table') && result.paste.includes('colspan="2"'), 'Word/Excel HTML preserves merged cells');
        assert.equal(result.cells, 4, 'Plain spreadsheet clipboard becomes table');
        await page.setViewportSize({ width: 375, height: 812 });
        const fits = await page.locator('#output table').evaluate(table => table.getBoundingClientRect().width <= 375 && getComputedStyle(table).overflowX === 'auto');
        assert(fits, 'Public table scrolls within mobile width');
        await page.locator('#editor td').first().click();
        await page.getByRole('button', { name: 'Xóa bảng', exact: true }).click();
        assert.equal(await page.locator('#editor table').count(), 0);
        console.log('PASS: create/edit/delete tables, safe paste, merged cells, round trip and mobile rendering');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
