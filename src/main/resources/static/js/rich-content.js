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
                const textAlign = node.style.textAlign;
                const imageWidth = node.getAttribute('data-image-width') || (node.style.width.endsWith('%') ? node.style.width.slice(0, -1) : '');
                const imageAlign = node.getAttribute('data-image-align');
                for (const attr of [...node.attributes]) node.removeAttribute(attr.name);
                if (['P','DIV','H2','H3','LI','BLOCKQUOTE'].includes(node.tagName) && ['left','center','right','justify'].includes(textAlign)) node.style.textAlign = textAlign;
                if (node.tagName === 'IMG') {
                    if (!imageUrl(src)) { node.remove(); continue; }
                    node.setAttribute('src', imageUrl(src)); node.setAttribute('alt', alt);
                    if (/^\d{1,3}(?:\.\d{1,2})?$/.test(imageWidth) && Number(imageWidth) >= 1 && Number(imageWidth) <= 100) {
                        node.dataset.imageWidth = imageWidth; node.style.width = imageWidth + '%';
                    }
                    if (['left','center','right'].includes(imageAlign)) {
                        node.dataset.imageAlign = imageAlign;
                        node.style.marginLeft = imageAlign === 'left' ? '0px' : 'auto';
                        node.style.marginRight = imageAlign === 'right' ? '0px' : 'auto';
                    }
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
        let savedRange, selectedImage;
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
        for (const [label, command, value] of [['Đậm','bold'],['Nghiêng','italic'],['Tiêu đề','formatBlock','h2'],['Đoạn văn','formatBlock','p'],['Danh sách','insertUnorderedList'],['Đánh số','insertOrderedList'],['Căn trái','justifyLeft'],['Căn giữa','justifyCenter'],['Căn phải','justifyRight'],['Căn đều','justifyFull']]) {
            const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
            button.addEventListener('mousedown', event => event.preventDefault());
            button.addEventListener('click', () => { restore(); document.execCommand(command, false, value); changed(); }); toolbar.append(button);
        }
        const imageBar = document.createElement('div'); imageBar.className = 'rich-image-controls'; imageBar.hidden = true;
        imageBar.setAttribute('role', 'group'); imageBar.setAttribute('aria-label', 'Chỉnh ảnh đã chọn');
        const shell = document.createElement('div'); shell.className = 'rich-editor-shell';
        const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'rich-image-handle'; handle.hidden = true;
        handle.textContent = '↔'; handle.setAttribute('aria-label', 'Kéo để đổi kích thước ảnh; hoặc dùng ô chiều rộng');
        const hint = document.createElement('p'); hint.className = 'rich-editor-hint'; hint.textContent = 'Bấm vào ảnh để chỉnh kích thước, căn lề hoặc kéo nút ↔ ở góc ảnh.';
        function availableWidth() { const style = getComputedStyle(element); return Math.max(1, element.clientWidth - parseFloat(style.paddingLeft || 0) - parseFloat(style.paddingRight || 0)); }
        function activeImage() { return selectedImage && element.contains(selectedImage); }
        function positionHandle() {
            if (!activeImage()) { handle.hidden = true; return; }
            const imageRect = selectedImage.getBoundingClientRect(), rootRect = shell.getBoundingClientRect(), editorRect = element.getBoundingClientRect();
            const rightAligned = selectedImage.dataset.imageAlign === 'right';
            const x = rightAligned ? imageRect.left : imageRect.right;
            handle.hidden = imageRect.bottom > editorRect.bottom || imageRect.bottom < editorRect.top || x < editorRect.left || x > editorRect.right;
            handle.style.left = (x - rootRect.left) + 'px'; handle.style.top = (imageRect.bottom - rootRect.top) + 'px';
        }
        function widthValue() { return Math.max(1, Math.min(100, Math.round(selectedImage.getBoundingClientRect().width / availableWidth() * 100))); }
        const widthLabel = document.createElement('label'); widthLabel.textContent = 'Rộng (%) ';
        const widthInput = document.createElement('input'); widthInput.type = 'number'; widthInput.min = '1'; widthInput.max = '100'; widthInput.step = '1';
        widthLabel.append(widthInput);
        const sliderLabel = document.createElement('label'); sliderLabel.className = 'rich-width-slider'; sliderLabel.textContent = 'Kích thước ảnh';
        const slider = document.createElement('input'); slider.type = 'range'; slider.min = '1'; slider.max = '100'; sliderLabel.append(slider);
        function resize(value) {
            if (!activeImage() || !Number.isFinite(value) || value < 1 || value > 100) return;
            value = Math.round(value); selectedImage.dataset.imageWidth = String(value); selectedImage.style.width = value + '%';
            widthInput.value = slider.value = String(value); positionHandle(); changed();
        }
        widthInput.addEventListener('input', () => resize(widthInput.valueAsNumber));
        widthInput.addEventListener('change', () => { if (activeImage()) widthInput.value = String(widthValue()); });
        slider.addEventListener('input', () => resize(Number(slider.value)));
        imageBar.append(widthLabel, sliderLabel);
        const alignButtons = [];
        for (const [label, alignment] of [['Ảnh trái','left'],['Ảnh giữa','center'],['Ảnh phải','right']]) {
            const control = document.createElement('button'); control.type = 'button'; control.textContent = label; control.dataset.align = alignment;
            control.addEventListener('click', () => {
                if (!activeImage()) return;
                selectedImage.dataset.imageAlign = alignment;
                selectedImage.style.marginLeft = alignment === 'left' ? '0px' : 'auto';
                selectedImage.style.marginRight = alignment === 'right' ? '0px' : 'auto';
                alignButtons.forEach(button => button.setAttribute('aria-pressed', String(button === control)));
                positionHandle(); changed();
            });
            alignButtons.push(control); imageBar.append(control);
        }
        const altLabel = document.createElement('label'); altLabel.textContent = 'Mô tả ảnh ';
        const altInput = document.createElement('input'); altInput.type = 'text'; altInput.maxLength = 300; altInput.placeholder = 'Nội dung ảnh'; altLabel.append(altInput); imageBar.append(altLabel);
        altInput.addEventListener('input', () => { if (activeImage()) { selectedImage.alt = altInput.value; changed(); } });
        const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Xóa ảnh'; imageBar.append(remove);
        function selectImage(image) {
            if (selectedImage) selectedImage.removeAttribute('data-editor-selected');
            selectedImage = image;
            imageBar.hidden = !image; handle.hidden = !image;
            if (!image) return;
            image.setAttribute('data-editor-selected', 'true');
            widthInput.value = slider.value = String(widthValue()); altInput.value = image.alt;
            alignButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.align === (image.dataset.imageAlign || 'center'))));
            positionHandle();
        }
        remove.addEventListener('click', () => { if (activeImage()) { selectedImage.remove(); selectImage(null); changed(); } });
        function prepareImages() {
            element.querySelectorAll('img').forEach(image => {
                image.tabIndex = 0; image.setAttribute('role', 'button');
                image.setAttribute('aria-label', 'Chỉnh ảnh: ' + (image.alt || 'Ảnh trong nội dung'));
            });
        }
        element.addEventListener('click', event => selectImage(event.target.tagName === 'IMG' ? event.target : null));
        element.addEventListener('keydown', event => {
            if (event.target.tagName === 'IMG' && ['Enter',' '].includes(event.key)) { event.preventDefault(); selectImage(event.target); widthInput.focus(); }
        });
        element.addEventListener('input', () => { prepareImages(); if (!activeImage()) selectImage(null); else positionHandle(); });
        element.addEventListener('scroll', positionHandle);
        element.addEventListener('load', positionHandle, true);
        new ResizeObserver(positionHandle).observe(element);
        shell.addEventListener('keydown', event => { if (event.key === 'Escape') selectImage(null); });
        let drag;
        handle.addEventListener('pointerdown', event => {
            if (!activeImage()) return;
            event.preventDefault();
            drag = { x: event.clientX, width: widthValue(), available: availableWidth(), align: selectedImage.dataset.imageAlign || 'center' };
            handle.setPointerCapture(event.pointerId);
        });
        handle.addEventListener('pointermove', event => {
            if (!drag) return;
            const factor = drag.align === 'right' ? -1 : drag.align === 'center' ? 2 : 1;
            resize(Math.max(1, Math.min(100, drag.width + (event.clientX - drag.x) * factor / drag.available * 100)));
        });
        handle.addEventListener('pointerup', () => { drag = null; });
        handle.addEventListener('pointercancel', () => { drag = null; });
        handle.addEventListener('lostpointercapture', () => { drag = null; });
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
                    const node = document.createElement('img'); node.src = image.src; node.alt = image.alt; node.dataset.imageAlign = 'center'; node.style.marginInline = 'auto';
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
        toolbar.append(button, picker); element.before(toolbar, hint, imageBar, shell); shell.append(element, handle);
        return { set(value) { selectImage(null); element.innerHTML = html(value); prepareImages(); savedRange = null; }, get() {
            // Also handle Markdown typed directly into an otherwise plain editor.
            const rich = element.querySelector('h2,h3,strong,b,em,i,ul,ol,img,a,blockquote,pre,code,[style*="text-align"]');
            return html(rich ? element.innerHTML : element.innerText);
        }, hasContent() { return Boolean(element.textContent.trim() || element.querySelector('img')); } };
    }
    return { html, plainText, imageUrl, editor };
})();
