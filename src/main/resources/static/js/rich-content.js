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
    function videoUrl(value = '') {
        if (!value) return '';
        if (/^\/uploads\/[a-f0-9]{64}\.(mp4|webm)$/.test(value)) {
            const base = typeof API_BASE_URL === 'string' ? API_BASE_URL : '';
            return base.replace(/\/$/, '') + value;
        }
        return /^https?:\/\/[^\s]+\/[a-f0-9]{64}\.(mp4|webm)$/.test(value) ? value : '';
    }
    function html(value = '') {
        const source = document.createElement('template');
        source.innerHTML = /<\/?[a-z][^>]*>/i.test(value) ? value : markdown(value);
        const allowed = new Set(['P','DIV','BR','B','STRONG','I','EM','U','H2','H3','UL','OL','LI','BLOCKQUOTE','IMG','VIDEO','A','CODE','PRE','TABLE','CAPTION','THEAD','TBODY','TFOOT','TR','TH','TD']);
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
                const spans = ['colspan', 'rowspan'].map(name => [name, node.getAttribute(name)]);
                const scope = node.getAttribute('scope');
                const imageWidth = node.getAttribute('data-image-width') || (node.style.width.endsWith('%') ? node.style.width.slice(0, -1) : '');
                const imageAlign = node.getAttribute('data-image-align');
                for (const attr of [...node.attributes]) node.removeAttribute(attr.name);
                if (['TH','TD'].includes(node.tagName)) {
                    for (const [name, value] of spans) {
                        if (/^[1-9]\d{0,2}$/.test(value || '') && Number(value) <= 100) node.setAttribute(name, value);
                    }
                    if (node.tagName === 'TH' && ['col','row','colgroup','rowgroup'].includes(scope)) node.setAttribute('scope', scope);
                    if (['left','center','right','justify'].includes(textAlign)) node.style.textAlign = textAlign;
                }
                if (node.tagName === 'VIDEO') {
                    const url = videoUrl(src);
                    if (!url) { node.remove(); continue; }
                    node.replaceChildren();
                    node.setAttribute('src', url);
                    node.controls = true; node.preload = 'metadata'; node.playsInline = true;
                }
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
        if (!source.content.querySelector('h2,h3,strong,b,em,i,ul,ol,img,video,a,blockquote,pre,code,table') && /(?:\*\*|__|(?:^|\s)#{1,6}\s)/.test(source.content.textContent)) {
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
    function editor(element, convertImage, onError, convertVideo) {
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
        const icons = {
            bold: '<path d="M7 4h6a4 4 0 0 1 0 8H7m0-8v16h7a4 4 0 0 0 0-8H7"/>',
            italic: '<path d="M11 4h8M5 20h8M15 4 9 20"/>',
            underline: '<path d="M6 3v7a6 6 0 0 0 12 0V3M4 21h16"/>',
            insertUnorderedList: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
            insertOrderedList: '<path d="M10 6h11M10 12h11M10 18h11M3 3h1v5M2 8h4M2 12c0-2 4-2 4 0 0 1-4 3-4 5h4M2 20h4"/>',
            justifyLeft: '<path d="M3 5h18M3 10h12M3 15h18M3 20h12"/>',
            justifyCenter: '<path d="M3 5h18M6 10h12M3 15h18M6 20h12"/>',
            justifyRight: '<path d="M3 5h18M9 10h12M3 15h18M9 20h12"/>',
            justifyFull: '<path d="M3 5h18M3 10h18M3 15h18M3 20h18"/>',
            table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
            image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-6 5 7"/>',
            video: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m10 8 6 4-6 4Z"/>'
        };
        function iconButton(button, label, icon, shortcut = '') {
            button.classList.add('rich-icon-button'); button.setAttribute('aria-label', label);
            button.title = label.replace(/^\+\s*/, '') + (shortcut ? ' (' + shortcut + ')' : '');
            button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + icons[icon] + '</svg>';
            return button;
        }
        function group(label) { const part = document.createElement('div'); part.className = 'rich-toolbar-group'; part.setAttribute('role', 'group'); part.setAttribute('aria-label', label); toolbar.append(part); return part; }
        const styleGroup = group('Kiểu đoạn văn');
        const blockStyle = document.createElement('select'); blockStyle.className = 'rich-block-style'; blockStyle.setAttribute('aria-label', 'Kiểu đoạn văn'); blockStyle.title = 'Kiểu đoạn văn';
        for (const [value, label] of [['p','Văn bản thường'],['h2','Tiêu đề 1'],['h3','Tiêu đề 2']]) { const option = document.createElement('option'); option.value = value; option.textContent = label; blockStyle.append(option); }
        blockStyle.addEventListener('change', () => { const value = blockStyle.value; restore(); document.execCommand('formatBlock', false, value); changed(); syncFormatting(); });
        styleGroup.append(blockStyle);
        const textGroup = group('Định dạng chữ'), listGroup = group('Danh sách'), alignGroup = group('Căn đoạn văn');
        const formatButtons = [];
        for (const [label, command, part, shortcut] of [['Đậm','bold',textGroup,'Ctrl+B'],['Nghiêng','italic',textGroup,'Ctrl+I'],['Gạch chân','underline',textGroup,'Ctrl+U'],['Danh sách','insertUnorderedList',listGroup],['Đánh số','insertOrderedList',listGroup],['Căn trái','justifyLeft',alignGroup],['Căn giữa','justifyCenter',alignGroup],['Căn phải','justifyRight',alignGroup],['Căn đều','justifyFull',alignGroup]]) {
            const button = iconButton(document.createElement('button'), label, command, shortcut); button.type = 'button'; button.dataset.command = command; button.setAttribute('aria-pressed', 'false');
            button.addEventListener('mousedown', event => event.preventDefault());
            button.addEventListener('click', () => { restore(); document.execCommand(command, false); changed(); syncFormatting(); }); part.append(button); formatButtons.push(button);
        }
        const insertGroup = group('Chèn nội dung');
        function syncFormatting() {
            const selection = getSelection();
            if (!selection.rangeCount || !element.contains(selection.anchorNode)) return;
            formatButtons.forEach(button => button.setAttribute('aria-pressed', String(document.queryCommandState(button.dataset.command))));
            const block = document.queryCommandValue('formatBlock').toLowerCase(); blockStyle.value = ['h2','h3'].includes(block) ? block : 'p';
        }
        document.addEventListener('selectionchange', syncFormatting);
        toolbar.addEventListener('keydown', event => {
            if (event.target.tagName === 'SELECT' || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
            const controls = [...toolbar.querySelectorAll('button:not(:disabled),select')];
            const index = controls.indexOf(document.activeElement); if (index < 0) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + controls.length) % controls.length;
            controls[next].focus();
        });
        // Table tools share the editor selection, so toolbar clicks keep the active cell.
        function tableButton(label, action) {
            const control = document.createElement('button'); control.type = 'button'; control.textContent = label;
            control.addEventListener('mousedown', event => { remember(); event.preventDefault(); });
            control.addEventListener('click', action); return control;
        }
        const tablePanel = document.createElement('div'); tablePanel.className = 'rich-image-controls'; tablePanel.hidden = true;
        const dimensions = [];
        for (const [label, value, max] of [['Số hàng', 3, 50], ['Số cột', 3, 20]]) {
            const wrapper = document.createElement('label'); wrapper.textContent = label + ' ';
            const input = document.createElement('input'); input.type = 'number'; input.min = '1'; input.max = String(max); input.value = String(value);
            wrapper.append(input); dimensions.push(input); tablePanel.append(wrapper);
        }
        const insertTable = iconButton(tableButton('+ Chèn bảng', () => { tablePanel.hidden = !tablePanel.hidden; insertTable.setAttribute('aria-expanded', String(!tablePanel.hidden)); }), '+ Chèn bảng', 'table');
        insertTable.setAttribute('aria-expanded', 'false'); insertGroup.append(insertTable);
        tablePanel.append(tableButton('Tạo bảng', () => {
            const [rows, columns] = dimensions.map(input => input.valueAsNumber);
            if (!Number.isInteger(rows) || rows < 1 || rows > 50 || !Number.isInteger(columns) || columns < 1 || columns > 20) {
                onError(new Error('Nhập từ 1–50 hàng và 1–20 cột.')); return;
            }
            const table = document.createElement('table'); const head = table.createTHead().insertRow();
            for (let column = 0; column < columns; column++) {
                const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = 'Tiêu đề ' + (column + 1); head.append(cell);
            }
            const body = table.createTBody();
            for (let row = 1; row < rows; row++) {
                const tr = body.insertRow(); for (let column = 0; column < columns; column++) tr.insertCell().append(document.createElement('br'));
            }
            restore(); const range = getSelection().getRangeAt(0); range.deleteContents();
            const after = document.createElement('p'); after.append(document.createElement('br'));
            const fragment = document.createDocumentFragment(); fragment.append(table, after); range.insertNode(fragment);
            range.selectNodeContents(head.cells[0]); getSelection().removeAllRanges(); getSelection().addRange(range);
            tablePanel.hidden = true; insertTable.setAttribute('aria-expanded', 'false'); changed();
        }));
        const tableTools = document.createElement('div'); tableTools.className = 'rich-image-controls'; tableTools.hidden = true;
        function currentCell() {
            const start = savedRange?.startContainer;
            const cell = (start?.nodeType === 1 ? start : start?.parentElement)?.closest('td,th');
            return cell && element.contains(cell) ? cell : null;
        }
        document.addEventListener('selectionchange', () => { tableTools.hidden = !currentCell(); });
        function tableAction(label, action) {
            tableTools.append(tableButton(label, () => {
                restore(); const cell = currentCell(); if (!cell) return;
                const table = cell.closest('table');
                // Structural edits on merged tables need a grid model; preserve pasted merges.
                if (label !== 'Xóa bảng' && table.querySelector('[colspan]:not([colspan="1"]),[rowspan]:not([rowspan="1"])')) {
                    onError(new Error('Bảng có ô gộp: bạn có thể sửa nội dung ô hoặc dán lại bảng đã chỉnh trong Word/Excel.')); return;
                }
                const rowIndex = cell.parentElement.rowIndex, columnIndex = cell.cellIndex;
                action(cell, table);
                if (element.contains(table) && !element.contains(cell)) {
                    const row = table.rows[Math.min(rowIndex, table.rows.length - 1)];
                    const next = row?.cells[Math.min(columnIndex, row.cells.length - 1)];
                    if (next) { const range = document.createRange(); range.selectNodeContents(next); range.collapse(true); getSelection().removeAllRanges(); getSelection().addRange(range); }
                }
                changed(); tableTools.hidden = !currentCell();
            }));
        }
        tableAction('Thêm hàng', (cell, table) => {
            const row = cell.parentElement; const next = document.createElement('tr');
            for (let i = 0; i < row.cells.length; i++) next.insertCell().append(document.createElement('br'));
            if (row.parentElement.tagName === 'THEAD') (table.tBodies[0] || table.createTBody()).prepend(next);
            else row.after(next);
        });
        tableAction('Thêm cột', (cell, table) => {
            const index = cell.cellIndex + 1;
            for (const row of table.rows) {
                const next = document.createElement(row.parentElement.tagName === 'THEAD' ? 'th' : 'td'); next.append(document.createElement('br'));
                if (next.tagName === 'TH') next.scope = 'col';
                row.insertBefore(next, row.cells[index] || null);
            }
        });
        function removeTable(table) { const after = document.createElement('p'); after.append(document.createElement('br')); table.replaceWith(after); const range = document.createRange(); range.selectNodeContents(after); range.collapse(true); getSelection().removeAllRanges(); getSelection().addRange(range); }
        tableAction('Xóa hàng', (cell, table) => { if (table.rows.length === 1) removeTable(table); else cell.parentElement.remove(); });
        tableAction('Xóa cột', (cell, table) => { const index = cell.cellIndex; if (cell.parentElement.cells.length === 1) removeTable(table); else [...table.rows].forEach(row => row.cells[index]?.remove()); });
        tableAction('Xóa bảng', (cell, table) => removeTable(table));
        const imageBar = document.createElement('div'); imageBar.className = 'rich-image-controls'; imageBar.hidden = true;
        let selectedVideo;
        const videoBar = document.createElement('div'); videoBar.className = 'rich-image-controls'; videoBar.hidden = true;
        const removeVideo = document.createElement('button'); removeVideo.type = 'button'; removeVideo.textContent = 'Xóa video đã chọn';
        videoBar.append(removeVideo);
        function selectVideo(video) {
            if (selectedVideo) selectedVideo.removeAttribute('data-editor-selected');
            selectedVideo = video; videoBar.hidden = !video;
            if (video) video.setAttribute('data-editor-selected', 'true');
        }
        removeVideo.addEventListener('click', () => {
            if (selectedVideo && element.contains(selectedVideo)) { selectedVideo.pause(); selectedVideo.remove(); }
            selectVideo(null); changed();
        });
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
            element.querySelectorAll('video').forEach(video => {
                video.contentEditable = 'false'; video.tabIndex = 0;
                video.setAttribute('aria-label', 'Video trong bài viết');
            });
            element.querySelectorAll('img').forEach(image => {
                image.tabIndex = 0; image.setAttribute('role', 'button');
                image.setAttribute('aria-label', 'Chỉnh ảnh: ' + (image.alt || 'Ảnh trong nội dung'));
            });
        }
        element.addEventListener('click', event => selectImage(event.target.tagName === 'IMG' ? event.target : null));
        element.addEventListener('click', event => selectVideo(event.target.tagName === 'VIDEO' ? event.target : null));
        element.addEventListener('focusin', event => { if (event.target.tagName === 'VIDEO') selectVideo(event.target); });
        element.addEventListener('input', () => { if (selectedVideo && !element.contains(selectedVideo)) selectVideo(null); });
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
        const button = document.createElement('button'); button.type = 'button'; iconButton(button, '+ Chèn ảnh', 'image');
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
        if (convertVideo) {
            const videoPicker = document.createElement('input');
            videoPicker.type = 'file'; videoPicker.accept = 'video/mp4,video/webm,.mp4,.webm'; videoPicker.multiple = true; videoPicker.hidden = true;
            const videoButton = document.createElement('button'); videoButton.type = 'button'; iconButton(videoButton, '+ Chèn video', 'video');
            let insertionRange;
            videoButton.addEventListener('mousedown', event => { remember(); event.preventDefault(); });
            videoButton.addEventListener('click', () => { insertionRange = savedRange?.cloneRange(); videoPicker.click(); });
            const videoStatus = document.createElement('span'); videoStatus.setAttribute('role', 'status'); videoStatus.setAttribute('aria-live', 'polite');
            videoPicker.addEventListener('change', async () => {
                videoButton.disabled = true;
                try {
                    for (const file of videoPicker.files) {
                        videoStatus.textContent = 'Đang tải video…';
                        const src = videoUrl(await convertVideo(file));
                        if (!src) throw new Error('Đường dẫn video không hợp lệ.');
                        savedRange = insertionRange; restore();
                        const video = document.createElement('video'); video.src = src;
                        video.controls = true; video.preload = 'metadata'; video.playsInline = true;
                        video.contentEditable = 'false';
                        const range = getSelection().getRangeAt(0); range.deleteContents();
                        const fragment = document.createDocumentFragment(); const after = document.createElement('br');
                        fragment.append(video, after); range.insertNode(fragment); range.setStartAfter(after); range.collapse(true);
                        getSelection().removeAllRanges(); getSelection().addRange(range);
                        insertionRange = range.cloneRange(); changed();
                    }
                    videoStatus.textContent = 'Đã chèn video. Lưu bài để cập nhật.';
                } catch (error) { videoStatus.textContent = 'Chưa tải được video.'; onError(error); }
                finally { videoButton.disabled = false; videoPicker.value = ''; }
            });
            insertGroup.append(videoButton); toolbar.append(videoPicker, videoStatus);
        }
        // Keep rich clipboard formatting, but strip unsafe tags and attributes first.
        element.addEventListener('paste', event => {
            event.preventDefault();
            const clipboard = event.clipboardData;
            const rich = clipboard.getData('text/html');
            const text = clipboard.getData('text/plain');
            let content = rich || text;
            if (!rich && text.includes('\t')) {
                const rows = text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n');
                content = '<table><tbody>' + rows.map(row => '<tr>' + row.split('\t').map(value => '<td>' + escape(value) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
            }
            document.execCommand('insertHTML', false, html(content));
            changed();
        });
        element.addEventListener('drop', event => event.preventDefault());
        insertGroup.append(button); toolbar.append(picker); element.before(toolbar, tablePanel, tableTools, hint, imageBar, videoBar, shell); shell.append(element, handle);
        return { set(value) { selectImage(null); selectVideo(null); element.innerHTML = html(value); prepareImages(); savedRange = null; }, get() {
            // Also handle Markdown typed directly into an otherwise plain editor.
            const rich = element.querySelector('h2,h3,strong,b,em,i,ul,ol,img,video,a,blockquote,pre,code,table,[style*="text-align"]');
            return html(rich ? element.innerHTML : element.innerText);
        }, hasContent() { return Boolean(element.textContent.trim() || element.querySelector('img,video')); } };
    }
    return { html, plainText, imageUrl, videoUrl, editor };
})();
