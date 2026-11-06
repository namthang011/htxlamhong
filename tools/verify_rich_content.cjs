/** Focused offline browser checks. Run with Playwright available on NODE_PATH. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');

(async () => {
    const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
    try {
        const page = await browser.newPage();
        await page.setContent('<main><div id="editor" contenteditable="true"></div><div class="news-content" id="output"></div></main>');
        await page.addScriptTag({ path: path.resolve('src/main/resources/static/js/rich-content.js') });
        await page.addStyleTag({ path: path.resolve('src/main/resources/static/css/style.css') });
        const result = await page.evaluate(() => {
            const output = document.querySelector('#output');
            const sample = 'Hướng dẫn nạp tiền\n\n### BƯỚC 1\nKiểm tra **Mã ID**\n\n- Kiểm tra email\n- Ghi nhớ mã\n\n### BƯỚC 2\n1. Chuyển khoản\n2. Kiểm tra lại';
            output.innerHTML = RichContent.html(sample);
            const formatted = output.querySelectorAll('h3').length === 2 && output.querySelectorAll('ul li').length === 2 && output.querySelectorAll('ol li').length === 2 && output.querySelector('strong').textContent === 'Mã ID';
            const legacy = RichContent.html('<p>### Tiêu đề</p><p>**Nội dung**</p>');
            const safe = RichContent.html('<script>alert(1)</script><img src="javascript:alert(1)" onerror="alert(1)"><a href="javascript:alert(1)">x</a><p style="color:red" onclick="alert(1)">OK</p>');
            const safeMarkdown = RichContent.html('![x](javascript:alert)\n\n[x](javascript:alert)');
            const editor = RichContent.editor(document.querySelector('#editor'), async () => '', error => { throw error; });
            const uploadPath = '/uploads/' + 'a'.repeat(64) + '.webp';
            window.API_BASE_URL = 'https://backend.example';
            const uploadedImage = RichContent.html('<p>Ảnh</p><img src="' + uploadPath + '">');
            const resolvedUpload = RichContent.imageUrl(uploadPath);
            window.IMAGE_BASE_URL = 'https://cpanel.example';
            const cpanelLegacy = RichContent.imageUrl(uploadPath);
            delete window.IMAGE_BASE_URL;
            delete window.API_BASE_URL;
            editor.set(''); document.querySelector('#editor').focus();
            const clipboard = new DataTransfer(); clipboard.setData('text/plain', sample);
            document.querySelector('#editor').dispatchEvent(new ClipboardEvent('paste', { clipboardData: clipboard, bubbles: true, cancelable: true }));
            const saved = editor.get(); editor.set(saved);
            const roundTrip = editor.get() === saved && saved.includes('<h3>') && saved.includes('<strong>');
            editor.set(''); document.querySelector('#editor').focus();
            const richClipboard = new DataTransfer(); richClipboard.setData('text/html', '<h2>Tiêu đề</h2><p><b>Đậm</b><img src="/assets/images/logo.webp" onerror="alert(1)"></p>');
            document.querySelector('#editor').dispatchEvent(new ClipboardEvent('paste', { clipboardData: richClipboard, bubbles: true, cancelable: true }));
            const richPaste = editor.get();
            output.innerHTML = saved + '<img class="detail-image" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22900%22/%3E">';
            return { formatted, legacy, safe, safeMarkdown, roundTrip, richPaste, uploadedImage, resolvedUpload, cpanelLegacy, summary: RichContent.plainText('Để nạp **Ví Trên Grab**') };
        });
        assert(result.formatted, 'Markdown headings, emphasis, ordered and unordered lists');
        assert(result.legacy.includes('<h3>') && result.legacy.includes('<strong>'), 'Legacy paragraph wrappers');
        assert(!/script|onerror|onclick|style=/.test(result.safe), 'Unsafe HTML stripped');
        assert(!/javascript:|<img/.test(result.safeMarkdown), 'Unsafe Markdown URLs stripped');
        assert(result.roundTrip, 'Paste → save → reopen preserves formatting');
        assert(result.richPaste.includes('<h2>') && result.richPaste.includes('<b>') && result.richPaste.includes('<img') && !result.richPaste.includes('onerror'), 'Safe rich clipboard paste');
        assert.equal(result.summary, 'Để nạp Ví Trên Grab');
        assert(result.uploadedImage.includes('https://backend.example/uploads/'), 'Inline uploaded images resolve to the backend on split hosting');
        assert(result.resolvedUpload.startsWith('https://backend.example/uploads/'), 'Cover image resolves to the backend');
        assert(result.cpanelLegacy.startsWith('https://cpanel.example/uploads/'), 'Legacy relative images resolve to cPanel when configured');
        await page.locator('.detail-image').evaluate(img => img.decode());
        for (const width of [1008, 390, 320]) {
            await page.setViewportSize({ width, height: 900 });
            const size = await page.locator('.detail-image').evaluate(img => ({ width: img.clientWidth, height: img.clientHeight, scroll: document.documentElement.scrollWidth, viewport: innerWidth }));
            assert(Math.abs(size.height / size.width - 1.5) < .02, 'Image preserves full aspect ratio at ' + width);
            assert(size.scroll <= size.viewport, 'No horizontal overflow at ' + width);
        }
        console.log('PASS: Markdown, legacy content, safe HTML, clipboard formatting, save/reopen, summaries and responsive image aspect ratio.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
