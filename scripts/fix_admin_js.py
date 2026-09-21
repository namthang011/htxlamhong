
import re
path = r"d:\Study\HTX\src\main\resources\static\admin.html"
with open(path, "r", encoding="utf-8") as f: html = f.read()
js_code = """
        let jwtToken = "";

        function generateSlug(text, targetId) {
            let slug = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            slug = slug.replace(/d/g, "d").replace(/[^a-z0-9 ]/g, "").trim().replace(/\s+/g, "-");
            document.getElementById(targetId).value = slug;
        }

        function login() {
            const user = document.getElementById("username").value;
            const pass = document.getElementById("password").value;
            fetch("/api/public/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({username: user, password: pass})
            }).then(res => {
                if(res.ok) return res.json();
                throw new Error();
            }).then(data => {
                jwtToken = "Bearer " + data.token;
                localStorage.setItem("htx_jwt", jwtToken);
                document.getElementById("loginScreen").classList.add("hidden");
                document.getElementById("dashboardScreen").classList.remove("hidden");
                loadServices();
            }).catch(e => {
                document.getElementById("loginError").classList.remove("hidden");
            });
        }

        function logout() { localStorage.removeItem("htx_jwt"); location.reload(); }

        window.onload = function() {
            const token = localStorage.getItem("htx_jwt");
            if (token) {
                jwtToken = token;
                document.getElementById("loginScreen").classList.add("hidden");
                document.getElementById("dashboardScreen").classList.remove("hidden");
                loadServices();
                loadPosts();
            }
        }
        
        function authHeaders() { return { "Authorization": jwtToken, "Content-Type": "application/json" }; }
        function authHeadersDelete() { return { "Authorization": jwtToken }; }

        function showTab(tabName) {
            document.getElementById("tab-services").classList.add("hidden");
            document.getElementById("tab-posts").classList.add("hidden");
            document.getElementById("nav-services").classList.remove("active");
            document.getElementById("nav-posts").classList.remove("active");
            document.getElementById("tab-" + tabName).classList.remove("hidden");
            document.getElementById("nav-" + tabName).classList.add("active");
        }
        
        const serviceModal = new bootstrap.Modal(document.getElementById("serviceModal"));
        function loadServices() {
            fetch("/api/public/services").then(res => res.json()).then(data => {
                let h = "";
                if(data.content) {
                    data.content.forEach(s => {
                        h += `<tr><td>${s.id}</td><td><img src="${s.imageUrl}" height="40"></td><td>${s.name}</td><td>${s.price || "Liên h?"}</td><td><span class="badge bg-${s.status=="ACTIVE"?"success":"secondary"}">${s.status}</span></td><td><button class="btn btn-sm btn-danger" onclick="deleteService(${s.id})">Xóa</button></td></tr>`;
                    });
                }
                document.getElementById("serviceTableBody").innerHTML = h;
            });
        }
        function openServiceModal() { document.getElementById("srv-id").value = ""; document.getElementById("srv-name").value = ""; document.getElementById("srv-slug").value = ""; document.getElementById("srv-summary").value = ""; document.getElementById("srv-price").value = ""; serviceModal.show(); }
        function saveService() {
            const data = {
                name: document.getElementById("srv-name").value, slug: document.getElementById("srv-slug").value,
                summary: document.getElementById("srv-summary").value, price: document.getElementById("srv-price").value || null,
                imageUrl: document.getElementById("srv-img").value, status: document.getElementById("srv-status").value
            };
            fetch("/api/admin/services", { method: "POST", headers: authHeaders(), body: JSON.stringify(data) })
            .then(res => { if(res.ok) { serviceModal.hide(); loadServices(); } else alert("L?i khi luu!"); });
        }
        function deleteService(id) {
            if(confirm("Xóa d?ch v? này?")) fetch("/api/admin/services/" + id, { method: "DELETE", headers: authHeadersDelete() }).then(() => loadServices());
        }

        const postModal = new bootstrap.Modal(document.getElementById("postModal"));
        function loadPosts() {
            fetch("/api/public/posts").then(res => res.json()).then(data => {
                let h = "";
                if(data.content) {
                    data.content.forEach(p => {
                        h += `<tr><td>${p.id}</td><td><img src="${p.thumbnailUrl}" height="40"></td><td>${p.title}</td><td>${new Date(p.createdAt).toLocaleDateString()}</td><td><button class="btn btn-sm btn-danger" onclick="deletePost(${p.id})">Xóa</button></td></tr>`;
                    });
                }
                document.getElementById("postTableBody").innerHTML = h;
            });
        }
        function openPostModal() { document.getElementById("post-id").value = ""; document.getElementById("post-title").value = ""; document.getElementById("post-slug").value = ""; document.getElementById("post-summary").value = ""; document.getElementById("post-content").value = ""; postModal.show(); }
        function savePost() {
            const data = {
                title: document.getElementById("post-title").value, slug: document.getElementById("post-slug").value,
                summary: document.getElementById("post-summary").value, content: document.getElementById("post-content").value,
                thumbnailUrl: document.getElementById("post-img").value
            };
            fetch("/api/admin/posts", { method: "POST", headers: authHeaders(), body: JSON.stringify(data) })
            .then(res => { if(res.ok) { postModal.hide(); loadPosts(); } else alert("L?i khi luu!"); });
        }
        function deletePost(id) {
            if(confirm("Xóa bài vi?t này?")) fetch("/api/admin/posts/" + id, { method: "DELETE", headers: authHeadersDelete() }).then(() => loadPosts());
        }
"""
html = re.sub(r"<script>\s*let basicAuthHeader =.*?</script>", f"<script>{js_code}</script>", html, flags=re.DOTALL)
html = re.sub(r"<script>\s*let jwtToken =.*?</script>", f"<script>{js_code}</script>", html, flags=re.DOTALL) # in case it was already replaced
with open(path, "w", encoding="utf-8") as f: f.write(html)
print("admin.html updated successfully!")

