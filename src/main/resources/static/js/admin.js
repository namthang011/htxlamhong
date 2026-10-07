(() => {
    "use strict";

    const state = { token: localStorage.getItem("htx_jwt") || "", posts: [], services: [], testimonials: [], gallery: [], slugEdited: false };
    const $ = id => document.getElementById(id);
    const postModal = new bootstrap.Modal($("postModal"));
    const serviceModal = new bootstrap.Modal($("serviceModal"));
    const testimonialModal = new bootstrap.Modal($("testimonialModal"));
    const galleryModal = new bootstrap.Modal($("galleryModal"));
    const appToast = new bootstrap.Toast($("appToast"), { delay: 3200 });
    const draftKey = "htx_admin_post_draft";

    function escapeHtml(value = "") {
        return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
    }

    function slugify(value = "") {
        return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
            .replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s-]+/g, "-");
    }

    function notify(message, type = "success", title = type === "success" ? "Thành công" : "Có lỗi xảy ra") {
        $("toastTitle").textContent = title;
        $("toastBody").textContent = message;
        $("appToast").classList.remove("success", "error");
        $("appToast").classList.add(type);
        appToast.show();
    }

    function setBusy(button, busy, busyText = "Đang lưu…") {
        if (!button.dataset.label) button.dataset.label = button.textContent;
        button.disabled = busy;
        button.textContent = busy ? busyText : button.dataset.label;
    }

    async function api(path, options = {}, authenticated = false) {
        const headers = { ...(options.headers || {}) };
        if (authenticated) headers.Authorization = state.token;
        const response = await fetch(API_BASE_URL + path, { ...options, headers });
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("htx_jwt");
            state.token = "";
            showLogin("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
            throw new Error("Phiên đăng nhập hết hạn");
        }
        if (!response.ok) {
            const detail = await response.text();
            throw new Error(detail || `Yêu cầu thất bại (${response.status})`);
        }
        const body = await response.text();
        return body ? JSON.parse(body) : null;
    }

    function showLogin(message = "") {
        $("dashboardScreen").classList.add("d-none");
        $("loginScreen").classList.remove("d-none");
        $("loginError").textContent = message;
        $("loginError").classList.toggle("d-none", !message);
    }

    function showDashboard() {
        $("loginScreen").classList.add("d-none");
        $("dashboardScreen").classList.remove("d-none");
        loadAll();
    }

    async function loadAll() {
        $("connectionStatus").textContent = "Đang đồng bộ…";
        $("connectionStatus").classList.remove("online");
        try {
            const [posts, services, testimonials, gallery] = await Promise.all([
                api("/api/public/posts?size=100&sort=updatedAt,desc"),
                api("/api/public/services?size=100&sort=updatedAt,desc"),
                api("/api/admin/testimonials", {}, true),
                api("/api/admin/gallery", {}, true)
            ]);
            state.posts = posts.content || [];
            state.services = services.content || [];
            state.testimonials = testimonials || [];
            state.gallery = gallery || [];
            renderPosts();
            renderServices();
            renderTestimonials();
            renderGallery();
            updateStats();
            $("connectionStatus").textContent = "Đã đồng bộ";
            $("connectionStatus").classList.add("online");
        } catch (error) {
            $("connectionStatus").textContent = "Mất kết nối";
            notify(error.message, "error");
        }
    }

    function updateStats() {
        $("postCount").textContent = state.posts.length;
        $("serviceCount").textContent = state.services.length;
        const dates = [...state.posts, ...state.services].map(item => item.updatedAt || item.createdAt).filter(Boolean).map(Date.parse);
        $("lastUpdated").textContent = dates.length ? new Date(Math.max(...dates)).toLocaleDateString("vi-VN") : "—";
    }

    function renderPosts() {
        const query = $("postSearch").value.trim().toLowerCase();
        const items = state.posts.filter(post => `${post.title} ${post.summary || ""}`.toLowerCase().includes(query));
        $("postTableBody").innerHTML = items.map(post => `<tr>
            <td><div class="item-title"><img class="thumb" src="${escapeHtml(post.thumbnailUrl || "assets/images/logo.webp")}" alt=""><div><strong>${escapeHtml(post.title)}</strong><small>${escapeHtml(post.summary || "Chưa có mô tả")}</small></div></div></td>
            <td><code>${escapeHtml(post.slug)}</code></td>
            <td>${formatDate(post.updatedAt || post.createdAt)}</td>
            <td><div class="row-actions"><a class="btn btn-sm btn-light" href="/chi-tiet-tin-tuc?id=${post.id}" target="_blank">Xem</a><button class="btn btn-sm btn-outline-primary" data-edit-post="${post.id}">Sửa</button><button class="btn btn-sm btn-outline-danger" data-delete-post="${post.id}">Xóa</button></div></td>
        </tr>`).join("");
        $("postEmpty").classList.toggle("d-none", items.length > 0);
    }

    function renderServices() {
        const query = $("serviceSearch").value.trim().toLowerCase();
        const items = state.services.filter(service => `${service.name} ${service.summary || ""}`.toLowerCase().includes(query));
        $("serviceTableBody").innerHTML = items.map(service => `<tr>
            <td><div class="item-title"><img class="thumb" src="${escapeHtml(service.imageUrl || "assets/images/logo.webp")}" alt=""><div><strong>${escapeHtml(service.name)}</strong><small>${escapeHtml(service.summary || "Chưa có mô tả")}</small></div></div></td>
            <td>${service.price ? Number(service.price).toLocaleString("vi-VN") + " ₫" : "Liên hệ"}</td>
            <td><span class="badge ${service.status === "ACTIVE" ? "text-bg-success" : "text-bg-secondary"}">${service.status === "ACTIVE" ? "Hoạt động" : "Tạm ngưng"}</span></td>
            <td><div class="row-actions"><button class="btn btn-sm btn-outline-primary" data-edit-service="${service.id}">Sửa</button><button class="btn btn-sm btn-outline-danger" data-delete-service="${service.id}">Xóa</button></div></td>
        </tr>`).join("");
        $("serviceEmpty").classList.toggle("d-none", items.length > 0);
    }

    function renderTestimonials() {
        $("testimonialTableBody").innerHTML = state.testimonials.map(item => `<tr>
            <td><div class="item-title"><img class="thumb" src="${escapeHtml(item.imageUrl || "assets/images/logo.webp")}" alt=""><div><strong>${escapeHtml(item.memberName)}</strong><small>${escapeHtml(item.memberTitle || "")}</small></div></div></td>
            <td><span class="text-warning">${"★".repeat(Math.max(1, Math.min(5, item.rating || 5)))}</span><small class="d-block text-secondary">${escapeHtml(item.content)}</small></td>
            <td>${Number(item.sortOrder || 0)}</td><td><span class="badge ${item.active ? "text-bg-success" : "text-bg-secondary"}">${item.active ? "Hiển thị" : "Đang ẩn"}</span></td>
            <td><div class="row-actions"><button class="btn btn-sm btn-outline-primary" data-edit-testimonial="${item.id}">Sửa</button><button class="btn btn-sm btn-outline-danger" data-delete-testimonial="${item.id}">Xóa</button></div></td></tr>`).join("");
        $("testimonialEmpty").classList.toggle("d-none", state.testimonials.length > 0);
    }

    function renderGallery() {
        $("galleryAdminGrid").innerHTML = state.gallery.map(item => `<article class="gallery-admin-card"><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title || "Ảnh hoạt động")}"><div class="gallery-admin-info"><div><strong>${escapeHtml(item.title || "Ảnh hoạt động")}</strong><small>Thứ tự ${Number(item.sortOrder || 0)} · ${item.active ? "Đang hiện" : "Đang ẩn"}</small></div><div class="row-actions"><button class="btn btn-sm btn-outline-primary" data-edit-gallery="${item.id}">Sửa</button><button class="btn btn-sm btn-outline-danger" data-delete-gallery="${item.id}">Xóa</button></div></div></article>`).join("");
        $("galleryEmpty").classList.toggle("d-none", state.gallery.length > 0);
    }

    function formatDate(value) {
        return value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
    }

    async function imageToDataUrl(file) {
        if (!file) return "";
        if (file.size > 5 * 1024 * 1024) throw new Error("Ảnh phải nhỏ hơn 5 MB.");
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        return canvas.toDataURL("image/webp", .82);
    }

    function updatePostPreview() {
        const title = $("post-title").value.trim();
        const summary = $("post-summary").value.trim();
        const content = $("post-content").value.trim();
        $("previewTitle").textContent = title || "Tiêu đề bài viết";
        $("previewSummary").textContent = summary || "Mô tả ngắn sẽ xuất hiện tại đây.";
        $("previewContent").textContent = content || "Nội dung bài viết sẽ xuất hiện tại đây.";
        $("summaryCount").textContent = $("post-summary").value.length;
        $("contentCount").textContent = $("post-content").value.length;
    }

    function saveDraft() {
        if ($("post-id").value) return;
        localStorage.setItem(draftKey, JSON.stringify({ title: $("post-title").value, slug: $("post-slug").value, summary: $("post-summary").value, content: $("post-content").value, image: $("post-img").value, savedAt: Date.now() }));
        $("draftStatus").textContent = "Đã tự lưu bản nháp lúc " + new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }

    function openPost(post = null) {
        const draft = !post ? JSON.parse(localStorage.getItem(draftKey) || "null") : null;
        const source = post || draft || {};
        $("post-id").value = post?.id || "";
        $("post-title").value = source.title || "";
        $("post-slug").value = source.slug || "";
        $("post-summary").value = source.summary || "";
        $("post-content").value = source.content || "";
        $("post-img").value = source.thumbnailUrl || source.image || "";
        $("postModalTitle").textContent = post ? "Chỉnh sửa bài viết" : "Viết bài mới";
        $("savePostButton").textContent = post ? "Lưu thay đổi" : "Đăng bài";
        $("savePostButton").dataset.label = $("savePostButton").textContent;
        state.slugEdited = Boolean(post || draft?.slug);
        const image = $("post-img").value;
        $("post-img-preview").src = image;
        $("post-img-preview").style.display = image ? "block" : "none";
        updatePostPreview();
        postModal.show();
    }

    function openService(service = null) {
        $("srv-id").value = service?.id || "";
        $("srv-name").value = service?.name || "";
        $("srv-slug").value = service?.slug || "";
        $("srv-summary").value = service?.summary || "";
        $("srv-price").value = service?.price || "";
        $("srv-status").value = service?.status || "ACTIVE";
        $("srv-img").value = service?.imageUrl || "";
        $("serviceModalTitle").textContent = service ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ";
        const image = $("srv-img").value;
        $("srv-img-preview").src = image;
        $("srv-img-preview").style.display = image ? "block" : "none";
        serviceModal.show();
    }

    function openTestimonial(item = null) {
        $("testimonial-id").value = item?.id || "";
        $("testimonial-name").value = item?.memberName || "";
        $("testimonial-title").value = item?.memberTitle || "";
        $("testimonial-content").value = item?.content || "";
        $("testimonial-rating").value = item?.rating || 5;
        $("testimonial-order").value = item?.sortOrder || 0;
        $("testimonial-active").value = String(item?.active ?? true);
        $("testimonial-image").value = item?.imageUrl || "";
        $("testimonialModalTitle").textContent = item ? "Chỉnh sửa đánh giá" : "Thêm đánh giá";
        $("testimonial-image-preview").src = item?.imageUrl || "";
        $("testimonial-image-preview").style.display = item?.imageUrl ? "block" : "none";
        testimonialModal.show();
    }

    function openGallery(item = null) {
        $("gallery-id").value = item?.id || "";
        $("gallery-title").value = item?.title || "";
        $("gallery-order").value = item?.sortOrder || 0;
        $("gallery-active").value = String(item?.active ?? true);
        $("gallery-image").value = item?.imageUrl || "";
        $("galleryModalTitle").textContent = item ? "Chỉnh sửa hình ảnh" : "Thêm hình ảnh";
        $("gallery-image-preview").src = item?.imageUrl || "";
        $("gallery-image-preview").style.display = item?.imageUrl ? "block" : "none";
        galleryModal.show();
    }

    async function savePost(event) {
        event.preventDefault();
        const button = $("savePostButton");
        setBusy(button, true);
        const id = $("post-id").value;
        try {
            await api(`/api/admin/posts${id ? "/" + id : ""}`, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: $("post-title").value.trim(), slug: slugify($("post-slug").value), summary: $("post-summary").value.trim(), content: $("post-content").value.trim(), thumbnailUrl: $("post-img").value }) }, true);
            localStorage.removeItem(draftKey);
            postModal.hide();
            await loadAll();
            notify(id ? "Đã cập nhật bài viết." : "Bài viết đã được đăng.");
        } catch (error) { notify(error.message.includes("constraint") ? "Tiêu đề hoặc đường dẫn đã tồn tại." : error.message, "error"); }
        finally { setBusy(button, false); }
    }

    async function saveService(event) {
        event.preventDefault();
        const button = $("saveServiceButton");
        setBusy(button, true);
        const id = $("srv-id").value;
        try {
            await api(`/api/admin/services${id ? "/" + id : ""}`, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: $("srv-name").value.trim(), slug: slugify($("srv-slug").value), summary: $("srv-summary").value.trim(), price: $("srv-price").value || null, imageUrl: $("srv-img").value, status: $("srv-status").value }) }, true);
            serviceModal.hide();
            await loadAll();
            notify(id ? "Đã cập nhật dịch vụ." : "Đã thêm dịch vụ mới.");
        } catch (error) { notify(error.message, "error"); }
        finally { setBusy(button, false); }
    }

    async function saveTestimonial(event) {
        event.preventDefault();
        const button = $("saveTestimonialButton"); setBusy(button, true);
        const id = $("testimonial-id").value;
        try {
            await api(`/api/admin/testimonials${id ? "/" + id : ""}`, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberName: $("testimonial-name").value.trim(), memberTitle: $("testimonial-title").value.trim(), content: $("testimonial-content").value.trim(), rating: Number($("testimonial-rating").value), sortOrder: Number($("testimonial-order").value), active: $("testimonial-active").value === "true", imageUrl: $("testimonial-image").value }) }, true);
            testimonialModal.hide(); await loadAll(); notify(id ? "Đã cập nhật đánh giá." : "Đã thêm đánh giá.");
        } catch (error) { notify(error.message, "error"); } finally { setBusy(button, false); }
    }

    async function saveGallery(event) {
        event.preventDefault();
        if (!$("gallery-image").value) { notify("Vui lòng chọn hình ảnh.", "error"); return; }
        const button = $("saveGalleryButton"); setBusy(button, true);
        const id = $("gallery-id").value;
        try {
            await api(`/api/admin/gallery${id ? "/" + id : ""}`, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: $("gallery-title").value.trim(), sortOrder: Number($("gallery-order").value), active: $("gallery-active").value === "true", imageUrl: $("gallery-image").value }) }, true);
            galleryModal.hide(); await loadAll(); notify(id ? "Đã cập nhật hình ảnh." : "Đã thêm hình ảnh.");
        } catch (error) { notify(error.message, "error"); } finally { setBusy(button, false); }
    }

    async function removeItem(type, id) {
        const label = { posts: "bài viết", services: "dịch vụ", testimonials: "đánh giá", gallery: "hình ảnh" }[type];
        if (!confirm(`Bạn chắc chắn muốn xóa ${label} này? Thao tác không thể hoàn tác.`)) return;
        try { await api(`/api/admin/${type}/${id}`, { method: "DELETE" }, true); await loadAll(); notify(`Đã xóa ${label}.`); }
        catch (error) { notify(error.message, "error"); }
    }

    $("loginForm").addEventListener("submit", async event => {
        event.preventDefault();
        const button = $("loginButton"); setBusy(button, true, "Đang đăng nhập…");
        try {
            const data = await api("/api/public/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: $("username").value.trim(), password: $("password").value }) });
            state.token = "Bearer " + data.token; localStorage.setItem("htx_jwt", state.token); showDashboard();
        } catch (_) { $("loginError").textContent = "Tài khoản hoặc mật khẩu không đúng."; $("loginError").classList.remove("d-none"); }
        finally { setBusy(button, false); }
    });
    $("togglePassword").addEventListener("click", () => { const input = $("password"); input.type = input.type === "password" ? "text" : "password"; $("togglePassword").textContent = input.type === "password" ? "Hiện" : "Ẩn"; });
    $("logoutButton").addEventListener("click", () => { localStorage.removeItem("htx_jwt"); location.reload(); });
    $("menuButton").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
    document.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => { const titles = { posts: "Quản lý tin tức", services: "Quản lý dịch vụ", testimonials: "Đánh giá xã viên", gallery: "Hình ảnh hoạt động" }; document.querySelectorAll("[data-tab]").forEach(item => item.classList.toggle("active", item === button)); Object.keys(titles).forEach(tab => $("tab-" + tab).classList.toggle("d-none", tab !== button.dataset.tab)); $("pageTitle").textContent = titles[button.dataset.tab]; document.querySelector(".sidebar").classList.remove("open"); }));
    $("postSearch").addEventListener("input", renderPosts); $("serviceSearch").addEventListener("input", renderServices);
    $("newPostButton").addEventListener("click", () => openPost()); $("newServiceButton").addEventListener("click", () => openService());
    $("newTestimonialButton").addEventListener("click", () => openTestimonial()); $("newGalleryButton").addEventListener("click", () => openGallery());
    $("postTableBody").addEventListener("click", event => { const edit = event.target.closest("[data-edit-post]"); const remove = event.target.closest("[data-delete-post]"); if (edit) openPost(state.posts.find(item => item.id === Number(edit.dataset.editPost))); if (remove) removeItem("posts", remove.dataset.deletePost); });
    $("serviceTableBody").addEventListener("click", event => { const edit = event.target.closest("[data-edit-service]"); const remove = event.target.closest("[data-delete-service]"); if (edit) openService(state.services.find(item => item.id === Number(edit.dataset.editService))); if (remove) removeItem("services", remove.dataset.deleteService); });
    $("testimonialTableBody").addEventListener("click", event => { const edit = event.target.closest("[data-edit-testimonial]"); const remove = event.target.closest("[data-delete-testimonial]"); if (edit) openTestimonial(state.testimonials.find(item => item.id === Number(edit.dataset.editTestimonial))); if (remove) removeItem("testimonials", remove.dataset.deleteTestimonial); });
    $("galleryAdminGrid").addEventListener("click", event => { const edit = event.target.closest("[data-edit-gallery]"); const remove = event.target.closest("[data-delete-gallery]"); if (edit) openGallery(state.gallery.find(item => item.id === Number(edit.dataset.editGallery))); if (remove) removeItem("gallery", remove.dataset.deleteGallery); });
    $("post-title").addEventListener("input", () => { if (!state.slugEdited) $("post-slug").value = slugify($("post-title").value); updatePostPreview(); saveDraft(); });
    $("post-slug").addEventListener("input", () => { state.slugEdited = true; saveDraft(); });
    $("regenerateSlug").addEventListener("click", () => { $("post-slug").value = slugify($("post-title").value); state.slugEdited = false; saveDraft(); });
    ["post-summary", "post-content"].forEach(id => $(id).addEventListener("input", () => { updatePostPreview(); saveDraft(); }));
    $("post-img-file").addEventListener("change", async event => { try { const image = await imageToDataUrl(event.target.files[0]); $("post-img").value = image; $("post-img-preview").src = image; $("post-img-preview").style.display = "block"; saveDraft(); } catch (error) { notify(error.message, "error"); } });
    $("srv-name").addEventListener("input", () => { if (!$("srv-id").value) $("srv-slug").value = slugify($("srv-name").value); });
    $("srv-img-file").addEventListener("change", async event => { try { const image = await imageToDataUrl(event.target.files[0]); $("srv-img").value = image; $("srv-img-preview").src = image; $("srv-img-preview").style.display = "block"; } catch (error) { notify(error.message, "error"); } });
    $("testimonial-image-file").addEventListener("change", async event => { try { const image = await imageToDataUrl(event.target.files[0]); $("testimonial-image").value = image; $("testimonial-image-preview").src = image; $("testimonial-image-preview").style.display = "block"; } catch (error) { notify(error.message, "error"); } });
    $("gallery-image-file").addEventListener("change", async event => { try { const image = await imageToDataUrl(event.target.files[0]); $("gallery-image").value = image; $("gallery-image-preview").src = image; $("gallery-image-preview").style.display = "block"; } catch (error) { notify(error.message, "error"); } });
    $("clearDraftButton").addEventListener("click", () => { localStorage.removeItem(draftKey); if (!$("post-id").value) openPost(); $("draftStatus").textContent = "Đã xóa bản nháp."; });
    $("postForm").addEventListener("submit", savePost); $("serviceForm").addEventListener("submit", saveService); $("testimonialForm").addEventListener("submit", saveTestimonial); $("galleryForm").addEventListener("submit", saveGallery);

    state.token ? showDashboard() : showLogin();
})();
