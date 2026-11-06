window.RichContent = (() => {
    function escape(value) {
        const node = document.createElement('div'); node.textContent = value; return node.innerHTML;
    }
    // Convert the Markdown used by imported posts before applying the HTML allowlist.
    function markdown(value) {
        function inline(text) {
            const tokens = [];
            const token = html => `\u0000${tokens.push(html) - 1}\u0000`;
            text = text.replace(/`([^`]+)`/g, (_, code) => token('<code>' + escape(code) + '</code>'));
            text = text.replace(/!\[([^\]]*)\]\(([^\s)]+)\)/g, (_, alt, src) => token('<img src="' + escape(src).replace(/"/g, '&quot;') + '" alt="' + escape(alt).replace(/"/g, '&quot;') + '">'));
            text = text.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (_, label, href) => token('<a href="' + escape(href).replace(/"/g, '&quot;') + '">' + escape(label) + '</a>'));
            text = escape(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/__(.+?)__/g, '<strong>$1</strong>')
                .replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s.,!?:;)])/g, '$1<em>$2</em>');
            return text.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[index]);
        }
        const lines = value.replace(/\r\n?/g, '\n').replace(/\\n/g, '\n')
            .replace(/([^\s#])[^\S\n]*(#{2,3})\s+(?=\S)/g, '$1\n\n$2 ').split('\n');
        const blocks = []; let paragraph = [], list = [], listTag = '';
        function flushParagraph() { if (paragraph.length) blocks.push('<p>' + paragraph.map(inline).join('<br>') + '</p>'); paragraph = []; }
        function flushList() { if (list.length) blocks.push('<' + listTag + '>' + list.join('') + '</' + listTag + '>'); list = []; listTag = ''; }
        for (const line of lines) {
            const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*$/);
            const item = line.match(/^\s*(?:([-+*])\s+|\d+[.)]\s+)(.+)$/);
            if (!line.trim()) { flushParagraph(); flushList(); }
            else if (heading) { flushParagraph(); flushList(); const tag = heading[1].length <= 2 ? 'h2' : 'h3'; blocks.push('<' + tag + '>' + inline(heading[2]) + '</' + tag + '>'); }
            else if (item) { flushParagraph(); const tag = item[1] ? 'ul' : 'ol'; if (listTag && listTag !== tag) flushList(); listTag = tag; list.push('<li>' + inline(item[2]) + '</li>'); }
            else if (/^\s*>\s?/.test(line)) { flushParagraph(); flushList(); blocks.push('<blockquote>' + inline(line.replace(/^\s*>\s?/, '')) + '</blockquote>'); }
            else { flushList(); paragraph.push(line); }
        }
        flushParagraph(); flushList(); return blocks.join('\n');
    }
    function imageUrl(value = '') {
        if (/^\/uploads\/[a-f0-9]{64}\.(png|jpg|webp)$/i.test(value)) {
            const base = typeof IMAGE_BASE_URL === 'string' ? IMAGE_BASE_URL : typeof API_BASE_URL === 'string' ? API_BASE_URL : '';
            return base.replace(/\/$/, '') + value;
        }
        return /^(https?:\/\/|\/?assets\/|data:image\/(png|jpeg|webp);base64,)/i.test(value) ? value : '';
    }
    function html(value = '') {
        const source = document.createElement('template');
        source.innerHTML = /<\/?[a-z][^>]*>/i.test(value) ? value : markdown(value);
        const allowed = new Set(['P','DIV','BR','B','STRONG','I','EM','U','H2','H3','UL','OL','LI','BLOCKQUOTE','IMG','A','CODE','PRE']);
        function clean(parent) {
            for (const node of [...parent.childNodes]) {
                if (node.nodeType === 3) continue;
                if (node.nodeType !== 1 || ['SCRIPT','STYLE','IFRAME','OBJECT','SVG','MATH','TEMPLATE'].includes(node.tagName)) { node.remove(); continue; }
                clean(node);
                if (!allowed.has(node.tagName)) { node.replaceWith(...node.childNodes); continue; }
                const src = node.getAttribute('src') || '';
                const alt = node.getAttribute('alt') || '';
                const href = node.getAttribute('href') || '';
                for (const attr of [...node.attributes]) node.removeAttribute(attr.name);
                if (node.tagName === 'IMG') {
                    if (!imageUrl(src)) { node.remove(); continue; }
                    node.setAttribute('src', imageUrl(src)); node.setAttribute('alt', alt);
                }
                if (node.tagName === 'A' && /^(https?:\/\/|mailto:|tel:)/i.test(href)) { node.setAttribute('href', href); node.setAttribute('rel', 'noopener noreferrer'); }
            }
        }
        clean(source.content);
        // Older editors sometimes stored Markdown inside plain paragraph/div wrappers.
        if (!source.content.querySelector('h2,h3,strong,b,em,i,ul,ol,img,a,blockquote,pre,code') && /(?:\*\*|__|(?:^|\s)#{1,6}\s)/.test(source.content.textContent)) {
            const clone = source.content.cloneNode(true);
            clone.querySelectorAll('br').forEach(node => node.replaceWith('\n'));
            clone.querySelectorAll('p,div').forEach(node => node.append('\n\n'));
            source.innerHTML = markdown(clone.textContent);
            clean(source.content);
        }
        return source.innerHTML;
    }
    function plainText(value = '') {
        const template = document.createElement('template'); template.innerHTML = html(value);
        return template.content.textContent.trim();
    }
    function editor(element, convertImage, onError) {
        const toolbar = document.createElement('div'); toolbar.className = 'rich-toolbar'; toolbar.setAttribute('role', 'toolbar'); toolbar.setAttribute('aria-label', 'Định dạng nội dung');
        let savedRange;
        function remember() {
            const selection = getSelection();
            if (selection.rangeCount && element.contains(selection.anchorNode) && element.contains(selection.focusNode)) savedRange = selection.getRangeAt(0).cloneRange();
        }
        function restore() {
            element.focus(); const selection = getSelection(); selection.removeAllRanges();
            if (savedRange && element.contains(savedRange.startContainer)) selection.addRange(savedRange);
            else { const range = document.createRange(); range.selectNodeContents(element); range.collapse(false); selection.addRange(range); }
        }
        function changed() { remember(); element.dispatchEvent(new Event('input', { bubbles: true })); }
        document.addEventListener('selectionchange', remember);
        for (const [label, command, value] of [['Đậm','bold'],['Nghiêng','italic'],['Tiêu đề','formatBlock','h2'],['Đoạn văn','formatBlock','p'],['Danh sách','insertUnorderedList']]) {
            const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
            button.addEventListener('mousedown', event => event.preventDefault());
            button.addEventListener('click', () => { restore(); document.execCommand(command, false, value); changed(); }); toolbar.append(button);
        }
        const picker = document.createElement('input'); picker.type = 'file'; picker.accept = 'image/jpeg,image/png,image/webp'; picker.multiple = true; picker.hidden = true;
        const button = document.createElement('button'); button.type = 'button'; button.textContent = '＋ Chèn ảnh';
        button.addEventListener('mousedown', event => { remember(); event.preventDefault(); });
        button.addEventListener('click', () => picker.click());
        picker.addEventListener('change', async () => {
            button.disabled = true;
            try {
                const images = [];
                for (const file of picker.files) {
                    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Chỉ hỗ trợ JPG, PNG hoặc WebP.');
                    images.push({ src: await convertImage(file), alt: file.name });
                }
                restore();
                for (const image of images) {
                    const node = document.createElement('img'); node.src = image.src; node.alt = image.alt;
                    const range = getSelection().getRangeAt(0); range.deleteContents();
                    const fragment = document.createDocumentFragment(); fragment.append(node, document.createElement('br'));
                    const end = fragment.lastChild; range.insertNode(fragment); range.setStartAfter(end); range.collapse(true);
                    getSelection().removeAllRanges(); getSelection().addRange(range);
                }
                changed();
            } catch (error) { onError(error); } finally { picker.value = ''; button.disabled = false; }
        });
        // Keep rich clipboard formatting, but strip unsafe tags and attributes first.
        element.addEventListener('paste', event => {
            event.preventDefault();
            const clipboard = event.clipboardData;
            document.execCommand('insertHTML', false, html(clipboard.getData('text/html') || clipboard.getData('text/plain')));
            changed();
        });
        element.addEventListener('drop', event => event.preventDefault());
        toolbar.append(button, picker); element.before(toolbar);
        return { set(value) { element.innerHTML = html(value); savedRange = null; }, get() {
            // Also handle Markdown typed directly into an otherwise plain editor.
            const rich = element.querySelector('h2,h3,strong,b,em,i,ul,ol,img,a,blockquote,pre,code');
            return html(rich ? element.innerHTML : element.innerText);
        }, hasContent() { return Boolean(element.textContent.trim() || element.querySelector('img')); } };
    }
    return { html, plainText, imageUrl, editor };
})();
