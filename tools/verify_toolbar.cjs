/** Browser checks for document toolbar selection, active states and saved formatting. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
    const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH}:{})});
    try{
        const page=await browser.newPage();
        await page.setContent('<div id="editor" contenteditable="true"></div>');
        await page.addScriptTag({path:path.resolve('src/main/resources/static/js/rich-content.js')});
        await page.evaluate(()=>{window.editor=RichContent.editor(document.querySelector('#editor'),async()=>'',error=>{throw error;},async()=>'');editor.set('<p>Văn bản thử nghiệm</p>');});
        const toolbar=page.getByRole('toolbar');
        assert.equal(await toolbar.locator('button:not([aria-label])').count(),0);
        assert.equal(await toolbar.locator('button:not([title])').count(),0);
        assert.equal(await toolbar.locator('button:not(:has(svg))').count(),0);
        async function selectText(){await page.evaluate(()=>{const element=document.querySelector('#editor');element.focus();const range=document.createRange();range.selectNodeContents(element.firstChild);getSelection().removeAllRanges();getSelection().addRange(range);document.dispatchEvent(new Event('selectionchange'));});}
        await selectText();
        await toolbar.getByRole('button',{name:'Đậm',exact:true}).click();
        assert.equal(await toolbar.getByRole('button',{name:'Đậm',exact:true}).getAttribute('aria-pressed'),'true');
        assert(await page.evaluate(()=>/\<(b|strong)[ >]/.test(editor.get())));
        await toolbar.getByRole('button',{name:'Gạch chân',exact:true}).click();
        assert((await page.evaluate(()=>editor.get())).includes('<u>'));
        await toolbar.getByRole('combobox',{name:'Kiểu đoạn văn'}).selectOption('h2');
        assert.equal(await page.locator('#editor h2').count(),1);
        await toolbar.getByRole('button',{name:'Căn giữa',exact:true}).click();
        assert((await page.evaluate(()=>editor.get())).includes('text-align: center'));
        await toolbar.getByRole('button',{name:'Căn giữa',exact:true}).press('End');
        assert(await toolbar.getByRole('button',{name:'+ Chèn ảnh',exact:true}).evaluate(el=>el===document.activeElement));
        const saved=await page.evaluate(()=>editor.get());
        await page.evaluate(saved=>editor.set(saved),saved);
        assert.equal(await page.evaluate(()=>editor.get()),saved);
        assert(!saved.includes('<svg'),'Toolbar icons do not enter article content');
        console.log('PASS: icon labels/tooltips, selection-preserving commands, active states, heading styles, keyboard access and saved formatting');
    }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
