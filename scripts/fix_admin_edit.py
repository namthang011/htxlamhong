
import re
path = r"d:\Study\HTX\src\main\resources\static\admin.html"
with open(path, "r", encoding="utf-8") as f: content = f.read()
split_point = "<script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js\"></script>"
parts = content.split(split_point)
new_script = """<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        let jwtToken = "";
        let currentServices = [];
        let currentPosts = [];

        function generateSlug(text, targetId) {
            let slug = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            slug = slug.replace(/d/g, "d").replace(/[^a-z0-9 ]/g, "").trim().replace(/\s+/g, "-");
            document.getElementById(targetId).value = slug;
        }

        function login() {
            const user = document.getElementById("username").value;
            const pass = document.getElementById("password").value;
            fetch("/api/public/login", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({username: user, password: pass})
            }).then(res => {
                if (res.ok) { return res.json(); }
                throw new Error("Login failed");
            }).then(data => {
                jwtToken = "Bearer " + data.token;
                localStorage.setItem("htx_jwt", jwtToken);
                document.getElementById("loginScreen").classList.add("hidden");
                document.getElementById("dashboardScreen").classList.remove("hidden");
                loadServices();
                loadPosts();
            }).catch(error => { document.getElementById("loginError").classList.remove("hidden"); });
        }

        function logout() { localStorage.removeItem("htx_jwt"); location.reload(); }

        window.onload = function() {
            const auth = localStorage.getItem("htx_jwt");
            if (auth) {
                jwtToken = auth;
                document.getElementById("loginScreen").classList.add("hidden");
                document.getElementById("dashboardScreen").classList.remove("hidden");
                loadServices();
                loadPosts();
            }
        }

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
            fetch("/api/public/services?size=100").then(res => res.json()).then(data => {
                let html = "";
                if(data.content) {
                    currentServices = data.content;
                    data.content.forEach(s => {
                        html += `<tr><td>${s.id}</td><td><img src="${s.imageUrl}" height="40"></td><td>${s.name}</td><td>${s.price || "Liên h?"}</td><td><span class="badge bg-${s.status=="ACTIVE"?"success":"secondary"}">${s.status}</span></td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editService(${s.id})">S?a</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteService(${s.id})">Xóa</button>
                        </td></tr>`;
                    });
                }
                document.getElementById("serviceTableBody").innerHTML = html;
            });
        }
        function openServiceModal() { 
            document.getElementById("srv-id").value = ""; 
            document.getElementById("srv-name").value = ""; 
            document.getElementById("srv-slug").value = ""; 
            document.getElementById("srv-summary").value = ""; 
            document.getElementById("srv-price").value = ""; 
            document.getElementById("srv-img").value = "static/logo.png";
            document.getElementById("srv-status").value = "ACTIVE";
            serviceModal.show(); 
        }
        function editService(id) {
            const s = currentServices.find(x => x.id === id);
            if(s) {
                document.getElementById("srv-id").value = s.id; 
                document.getElementById("srv-name").value = s.name; 
                document.getElementById("srv-slug").value = s.slug; 
                document.getElementById("srv-summary").value = s.summary; 
                document.getElementById("srv-price").value = s.price || ""; 
                document.getElementById("srv-img").value = s.imageUrl || "";
                document.getElementById("srv-status").value = s.status || "ACTIVE";
                serviceModal.show(); 
            }
        }
        function saveService() {
            const id = document.getElementById("srv-id").value;
            const data = { name: document.getElementById("srv-name").value, slug: document.getElementById("srv-slug").value, summary: document.getElementById("srv-summary").value, price: document.getElementById("srv-price").value || null, imageUrl: document.getElementById("srv-img").value, status: document.getElementById("srv-status").value };
            let url = "/api/admin/services";
            let method = "POST";
            if(id) { url += "/" + id; method = "PUT"; }
            
            fetch(url, { method: method, headers: { "Authorization": jwtToken, "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(res => { if(res.ok) { serviceModal.hide(); loadServices(); } else alert("L?i khi luu!"); });
        }
        function deleteService(id) { if(confirm("Xóa d?ch v? này?")) fetch("/api/admin/services/" + id, { method: "DELETE", headers: { "Authorization": jwtToken } }).then(() => loadServices()); }

        const postModal = new bootstrap.Modal(document.getElementById("postModal"));
        function loadPosts() {
            fetch("/api/public/posts?size=100").then(res => res.json()).then(data => {
                let html = "";
                if(data.content) {
                    currentPosts = data.content;
                    data.content.forEach(p => {
                        html += `<tr><td>${p.id}</td><td><img src="${p.thumbnailUrl}" height="40"></td><td>${p.title}</td><td>${new Date(p.createdAt).toLocaleDateString()}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="editPost(${p.id})">S?a</button>
                            <button class="btn btn-sm btn-danger" onclick="deletePost(${p.id})">Xóa</button>
                        </td></tr>`;
                    });
                }
                document.getElementById("postTableBody").innerHTML = html;
            });
        }
        function openPostModal() { 
            document.getElementById("post-id").value = ""; 
            document.getElementById("post-title").value = ""; 
            document.getElementById("post-slug").value = ""; 
            document.getElementById("post-summary").value = ""; 
            document.getElementById("post-content").value = ""; 
            document.getElementById("post-img").value = "static/logo.png";
            postModal.show(); 
        }
        function editPost(id) {
            const p = currentPosts.find(x => x.id === id);
            if(p) {
                document.getElementById("post-id").value = p.id; 
                document.getElementById("post-title").value = p.title; 
                document.getElementById("post-slug").value = p.slug; 
                document.getElementById("post-summary").value = p.summary || ""; 
                document.getElementById("post-content").value = p.content || ""; 
                document.getElementById("post-img").value = p.thumbnailUrl || "";
                postModal.show(); 
            }
        }
        function savePost() {
            const id = document.getElementById("post-id").value;
            const data = { title: document.getElementById("post-title").value, slug: document.getElementById("post-slug").value, summary: document.getElementById("post-summary").value, content: document.getElementById("post-content").value, thumbnailUrl: document.getElementById("post-img").value };
            let url = "/api/admin/posts";
            let method = "POST";
            if(id) { url += "/" + id; method = "PUT"; }
            
            fetch(url, { method: method, headers: { "Authorization": jwtToken, "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(res => { if(res.ok) { postModal.hide(); loadPosts(); } else alert("L?i khi luu!"); });
        }
        function deletePost(id) { if(confirm("Xóa tin t?c này?")) fetch("/api/admin/posts/" + id, { method: "DELETE", headers: { "Authorization": jwtToken } }).then(() => loadPosts()); }
    </script>
</body>
</html>
"""
with open(path, "w", encoding="utf-8") as f: f.write(parts[0] + new_script)

