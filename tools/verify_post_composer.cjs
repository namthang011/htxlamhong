/** Actual composer UI against simulated APIs, with no production writes.
 * Optional BOOTSTRAP_CSS_PATH supplies a local Bootstrap 5 stylesheet for offline checks.
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
    const browser = await chromium.launch({ headless:true, ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH } : {}) });
    try {
        const page = await browser.newPage({ viewport:{ width:1440,height:1000 } });
        const errors=[]; page.on('pageerror', e=>errors.push(e.message));
        await page.addInitScript(() => {
            localStorage.setItem('htx_jwt','Bearer test');
            window.bootstrap = {
                Modal:class {
                    constructor(element) { this.element=element; }
                    show() { this.element.style.display='block'; this.element.classList.add('show'); this.element.removeAttribute('aria-hidden'); document.body.classList.add('modal-open'); }
                    hide() { if(!this.element.dispatchEvent(new Event('hide.bs.modal',{cancelable:true}))) return; this.element.style.display='none'; this.element.classList.remove('show'); document.body.classList.remove('modal-open'); }
                }, Toast:class { show(){} }
            };
        });
        const post={id:416,title:'Hướng dẫn đăng ký phù hiệu xe vận tải',slug:'huong-dan-phu-hieu-xe',summary:'Các bước chuẩn bị hồ sơ và những điều tài xế cần biết trước khi đăng ký.',content:'<h2>Chuẩn bị hồ sơ</h2><p>Hợp tác xã hướng dẫn xã viên chuẩn bị đầy đủ giấy tờ trước khi đăng ký.</p><table><tbody><tr><th>Giấy tờ</th><th>Số lượng</th></tr><tr><td>Đăng ký xe</td><td>01 bản</td></tr></tbody></table>',thumbnailUrl:'/assets/images/phu-hieu-xe.webp'};
        let saved, creates=0;
        await page.route('**/*',async route=>{
            const request=route.request(),url=new URL(request.url());
            if(url.hostname!=='composer.test') {
                if(url.pathname.endsWith('bootstrap.min.css') && process.env.BOOTSTRAP_CSS_PATH) return route.fulfill({body:fs.readFileSync(process.env.BOOTSTRAP_CSS_PATH),contentType:'text/css'});
                return route.fulfill({body:'',contentType:url.pathname.endsWith('.js')?'text/javascript':'text/css'});
            }
            if(url.pathname.startsWith('/api/')) {
                let data=[];
                if(url.pathname==='/api/public/posts') data={content:[post]};
                else if(url.pathname==='/api/public/services') data={content:[]};
                else if(url.pathname==='/api/public/about') data={title:'Giới thiệu',content:'<p>Giới thiệu</p>'};
                else if(url.pathname==='/api/admin/images') data={url:'/assets/images/logo.webp'};
                else if(request.method()==='PUT' && url.pathname==='/api/admin/posts/416') { saved=request.postDataJSON(); Object.assign(post,saved); data=post; }
                else if(request.method()==='POST' && url.pathname==='/api/admin/posts') { creates++; saved=request.postDataJSON(); data={...saved,id:417}; }
                return route.fulfill({json:data});
            }
            const file=path.resolve('src/main/resources/static',url.pathname==='/admin'?'admin.html':url.pathname.slice(1));
            const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.webp':'image/webp'};
            return fs.existsSync(file)&&fs.statSync(file).isFile()?route.fulfill({body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'}):route.fulfill({status:404,body:''});
        });
        await page.goto('http://composer.test/admin');
        await page.locator('[data-edit-post="416"]').click();
        assert.equal(await page.locator('#readingTime').count(),0,'Reading time was removed');
        assert(await page.locator('#postComposeView').isVisible());
        assert(await page.locator('#coverImagePreview').isVisible());
        assert.equal(await page.locator('.composer-checklist .is-complete').count(),3);
        assert.equal(await page.locator('#postLinkPreview').getAttribute('href'),'/tin-tuc/'+post.slug);
        fs.mkdirSync('target/composer-check',{recursive:true});
        for(const width of [1440,1024,768,390,320]) {
            await page.setViewportSize({width,height:900});
            assert(await page.locator('#savePostButton').isVisible());
            const fits=await page.locator('#postModal .modal-dialog').evaluate(el=>el.getBoundingClientRect().right<=innerWidth+1 && el.scrollWidth<=innerWidth+1);
            assert(fits,'Composer fits viewport '+width);
            await page.screenshot({path:`target/composer-check/write-${width}.png`});
            await page.locator('#previewModeButton').click();
            assert(await page.locator('#postPreviewView').isVisible());
            assert.equal(await page.locator('#previewContent table').count(),1);
            assert(await page.locator('#previewModeButton').getAttribute('aria-pressed')==='true');
            await page.screenshot({path:`target/composer-check/preview-${width}.png`});
            await page.locator('#composeModeButton').click();
        }
        await page.setViewportSize({width:1440,height:1000});
        await page.locator('#removeCoverButton').click();
        assert(await page.locator('#coverEmptyState').isVisible());
        await page.locator('#post-img-file').setInputFiles('src/main/resources/static/assets/images/logo.webp');
        await page.waitForFunction(()=>document.querySelector('#coverUploadStatus').textContent.includes('Đã tải'));
        assert(await page.locator('#coverImagePreview').isVisible());
        await page.locator('#post-title').fill('Bài viết đã cập nhật');
        await page.keyboard.press('Control+s');
        await page.waitForFunction(()=>document.querySelector('#postModal').style.display==='none');
        assert.equal(saved.title,'Bài viết đã cập nhật');
        assert(saved.content.includes('<table'));
        assert.equal(saved.thumbnailUrl,'/assets/images/logo.webp');
        await page.locator('#newPostButton').click();
        await page.locator('#post-title').fill('Bài viết mới');
        await page.locator('#post-summary').fill('Tóm tắt bài viết mới');
        await page.locator('#post-content').fill('Nội dung mới để kiểm tra bản nháp.');
        await page.keyboard.press('Control+s');
        assert.equal(creates,0,'Shortcut saves new articles as local drafts');
        await page.waitForFunction(()=>JSON.parse(localStorage.getItem('htx_admin_post_draft'))?.title==='Bài viết mới');
        assert.equal(await page.locator('#post-slug').inputValue(),'bai-viet-moi');
        await page.reload();
        await page.locator('#newPostButton').click();
        assert.equal(await page.locator('#post-title').inputValue(),'Bài viết mới');
        await page.locator('#previewModeButton').click();
        await page.locator('#savePostButton').click();
        await page.waitForFunction(()=>document.querySelector('#postModal').style.display==='none');
        assert.equal(creates,1);
        assert.equal(await page.evaluate(()=>localStorage.getItem('htx_admin_post_draft')),null,'Publishing does not recreate local draft');
        await page.locator('#newPostButton').click();
        await page.locator('#previewModeButton').click();
        await page.locator('#savePostButton').click();
        assert(await page.locator('#postComposeView').isVisible(),'Invalid hidden fields return to compose');
        assert.equal(creates,1,'Invalid form does not publish');
        await page.locator('#post-title').fill('Bài thiếu nội dung');
        await page.locator('#post-summary').fill('Mô tả ngắn');
        await page.locator('#previewModeButton').click();
        await page.locator('#savePostButton').click();
        assert(await page.locator('#postComposeView').isVisible(),'Missing content returns to compose');
        assert(await page.locator('#post-content').evaluate(el=>el===document.activeElement));
        assert.equal(creates,1);
        assert.deepEqual(errors,[]);
        console.log('PASS: responsive composer, preview, cover upload/removal, checklist, shortcut save, draft restore, publish and validation');
    } finally { await browser.close(); }
})().catch(error=>{ console.error(error);process.exitCode=1; });
