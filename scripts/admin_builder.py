import os

admin_path = r"d:\Study\HTX\src\main\resources\static\admin.html"

admin_html = """<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quản trị HTX Lam Hồng</title>
    <!-- CSS Bootstrap -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #f4f6f9; }
        .sidebar { min-height: 100vh; background: #343a40; color: white; padding-top: 20px;}
        .sidebar a { color: #c2c7d0; text-decoration: none; display: block; padding: 10px 20px; font-size: 1.1rem;}
        .sidebar a:hover, .sidebar a.active { background: #007bff; color: white; }
        .content { padding: 20px; }
        .hidden { display: none !important; }
        .auth-container { max-width: 400px; margin: 100px auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    </style>
</head>
<body>

    <!-- Màn hình Đăng nhập -->
    <div id="loginScreen" class="container">
        <div class="auth-container">
            <h3 class="text-center mb-4">Đăng nhập Admin</h3>
            <div class="mb-3">
                <label>Tài khoản</label>
                <input type="text" id="username" class="form-control" value="admin">
            </div>
            <div class="mb-3">
                <label>Mật khẩu</label>
                <input type="password" id="password" class="form-control" value="admin123">
            </div>
            <button class="btn btn-primary w-100" onclick="login()">Đăng nhập</button>
            <div id="loginError" class="text-danger mt-2 hidden">Sai tài khoản hoặc mật khẩu!</div>
        </div>
    </div>

    <!-- Màn hình Dashboard -->
    <div id="dashboardScreen" class="container-fluid hidden">
        <div class="row">
            <!-- Sidebar -->
            <div class="col-md-2 sidebar">
                <h4 class="text-center mb-4">Admin HTX</h4>
                <a href="#" class="active" id="nav-services" onclick="showTab('services')">📦 Quản lý Dịch vụ</a>
                <a href="#" id="nav-posts" onclick="showTab('posts')">📰 Quản lý Tin tức</a>
                <a href="#" class="text-danger mt-5" onclick="logout()">🚪 Đăng xuất</a>
            </div>

            <!-- Content -->
            <div class="col-md-10 content">
                
                <!-- Tab Dịch Vụ -->
                <div id="tab-services">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h2>Quản lý Dịch vụ</h2>
                        <button class="btn btn-success" onclick="openServiceModal()">+ Thêm Dịch Vụ Mới</button>
                    </div>
                    <table class="table table-bordered table-hover bg-white">
                        <thead class="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Ảnh</th>
                                <th>Tên dịch vụ</th>
                                <th>Giá</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody id="serviceTableBody">
                            <!-- Dữ liệu sẽ đổ vào đây -->
                        </tbody>
                    </table>
                </div>

                <!-- Tab Tin Tức -->
                <div id="tab-posts" class="hidden">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h2>Quản lý Tin tức</h2>
                        <button class="btn btn-success" onclick="openPostModal()">+ Viết Bài Mới</button>
                    </div>
                    <table class="table table-bordered table-hover bg-white">
                        <thead class="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Ảnh</th>
                                <th>Tiêu đề</th>
                                <th>Ngày đăng</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody id="postTableBody">
                            <!-- Dữ liệu sẽ đổ vào đây -->
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    </div>

    <!-- Modal Thêm/Sửa Dịch Vụ -->
    <div class="modal fade" id="serviceModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Thông tin Dịch vụ</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="srv-id">
                    <div class="mb-3">
                        <label>Tên dịch vụ</label>
                        <input type="text" id="srv-name" class="form-control" onkeyup="generateSlug(this.value, 'srv-slug')">
                    </div>
                    <div class="mb-3">
                        <label>Đường dẫn (Slug)</label>
                        <input type="text" id="srv-slug" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label>Mô tả ngắn</label>
                        <input type="text" id="srv-summary" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label>Giá (VNĐ) - Bỏ trống nếu là Giá Liên Hệ</label>
                        <input type="number" id="srv-price" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label>Đường dẫn hình ảnh (Vd: static/logo.png)</label>
                        <input type="text" id="srv-img" class="form-control" value="static/logo.png">
                    </div>
                    <div class="mb-3">
                        <label>Trạng thái</label>
                        <select id="srv-status" class="form-control">
                            <option value="ACTIVE">Hoạt động</option>
                            <option value="INACTIVE">Ẩn</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="saveService()">Lưu Dịch Vụ</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Thêm/Sửa Tin Tức -->
    <div class="modal fade" id="postModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Thông tin Bài Viết</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="post-id">
                    <div class="mb-3">
                        <label>Tiêu đề</label>
                        <input type="text" id="post-title" class="form-control" onkeyup="generateSlug(this.value, 'post-slug')">
                    </div>
                    <div class="mb-3">
                        <label>Đường dẫn (Slug)</label>
                        <input type="text" id="post-slug" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label>Mô tả ngắn</label>
                        <input type="text" id="post-summary" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label>Nội dung chi tiết</label>
                        <textarea id="post-content" class="form-control" rows="5"></textarea>
                    </div>
                    <div class="mb-3">
                        <label>Ảnh thu nhỏ (Vd: static/tintuc1.webp)</label>
                        <input type="text" id="post-img" class="form-control" value="static/tintuc1.webp">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="savePost()">Lưu Bài Viết</button>
                </div>
            </div>
        </div>
    </div>


    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        let basicAuthHeader = '';

        // Hàm tạo slug tự động từ tiếng Việt
        function generateSlug(text, targetId) {
            let slug = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            slug = slug.replace(/đ/g, 'd').replace(/[^a-z0-9 ]/g, '').trim().replace(/\s+/g, '-');
            document.getElementById(targetId).value = slug;
        }

        function login() {
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            basicAuthHeader = 'Basic ' + btoa(user + ':' + pass);
            
            // Call một API admin bất kỳ để test auth
            fetch('/api/admin/services', {
                headers: { 'Authorization': basicAuthHeader }
            })
            .then(res => {
                if (res.ok) {
                    localStorage.setItem('htx_auth', basicAuthHeader);
                    document.getElementById('loginScreen').classList.add('hidden');
                    document.getElementById('dashboardScreen').classList.remove('hidden');
                    loadServices();
                } else {
                    document.getElementById('loginError').classList.remove('hidden');
                }
            });
        }

        function logout() {
            localStorage.removeItem('htx_auth');
            location.reload();
        }

        // Tự động đăng nhập nếu đã có session
        window.onload = function() {
            const auth = localStorage.getItem('htx_auth');
            if (auth) {
                basicAuthHeader = auth;
                document.getElementById('loginScreen').classList.add('hidden');
                document.getElementById('dashboardScreen').classList.remove('hidden');
                loadServices();
                loadPosts();
            }
        }

        function showTab(tabName) {
            document.getElementById('tab-services').classList.add('hidden');
            document.getElementById('tab-posts').classList.add('hidden');
            document.getElementById('nav-services').classList.remove('active');
            document.getElementById('nav-posts').classList.remove('active');

            document.getElementById('tab-' + tabName).classList.remove('hidden');
            document.getElementById('nav-' + tabName).classList.add('active');
        }

        // --- QUẢN LÝ DỊCH VỤ ---
        const serviceModal = new bootstrap.Modal(document.getElementById('serviceModal'));

        function loadServices() {
            fetch('/api/public/services')
                .then(res => res.json())
                .then(data => {
                    let html = '';
                    if(data.content) {
                        data.content.forEach(s => {
                            html += `<tr>
                                <td>${s.id}</td>
                                <td><img src="${s.imageUrl}" height="40"></td>
                                <td>${s.name}</td>
                                <td>${s.price || 'Liên hệ'}</td>
                                <td><span class="badge bg-${s.status=='ACTIVE'?'success':'secondary'}">${s.status}</span></td>
                                <td>
                                    <button class="btn btn-sm btn-danger" onclick="deleteService(${s.id})">Xóa</button>
                                </td>
                            </tr>`;
                        });
                    }
                    document.getElementById('serviceTableBody').innerHTML = html;
                });
        }

        function openServiceModal() {
            document.getElementById('srv-id').value = '';
            document.getElementById('srv-name').value = '';
            document.getElementById('srv-slug').value = '';
            document.getElementById('srv-summary').value = '';
            document.getElementById('srv-price').value = '';
            serviceModal.show();
        }

        function saveService() {
            const data = {
                name: document.getElementById('srv-name').value,
                slug: document.getElementById('srv-slug').value,
                summary: document.getElementById('srv-summary').value,
                price: document.getElementById('srv-price').value || null,
                imageUrl: document.getElementById('srv-img').value,
                status: document.getElementById('srv-status').value
            };

            fetch('/api/admin/services', {
                method: 'POST',
                headers: { 
                    'Authorization': basicAuthHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(res => {
                if(res.ok) {
                    serviceModal.hide();
                    loadServices();
                } else { alert("Lỗi khi lưu!"); }
            });
        }

        function deleteService(id) {
            if(confirm("Bạn có chắc muốn xóa dịch vụ này?")) {
                fetch('/api/admin/services/' + id, {
                    method: 'DELETE',
                    headers: { 'Authorization': basicAuthHeader }
                }).then(() => loadServices());
            }
        }


        // --- QUẢN LÝ TIN TỨC ---
        const postModal = new bootstrap.Modal(document.getElementById('postModal'));

        function loadPosts() {
            fetch('/api/public/posts')
                .then(res => res.json())
                .then(data => {
                    let html = '';
                    if(data.content) {
                        data.content.forEach(p => {
                            const d = new Date(p.createdAt).toLocaleDateString();
                            html += `<tr>
                                <td>${p.id}</td>
                                <td><img src="${p.thumbnailUrl}" height="40"></td>
                                <td>${p.title}</td>
                                <td>${d}</td>
                                <td>
                                    <button class="btn btn-sm btn-danger" onclick="deletePost(${p.id})">Xóa</button>
                                </td>
                            </tr>`;
                        });
                    }
                    document.getElementById('postTableBody').innerHTML = html;
                });
        }

        function openPostModal() {
            document.getElementById('post-id').value = '';
            document.getElementById('post-title').value = '';
            document.getElementById('post-slug').value = '';
            document.getElementById('post-summary').value = '';
            document.getElementById('post-content').value = '';
            postModal.show();
        }

        function savePost() {
            const data = {
                title: document.getElementById('post-title').value,
                slug: document.getElementById('post-slug').value,
                summary: document.getElementById('post-summary').value,
                content: document.getElementById('post-content').value,
                thumbnailUrl: document.getElementById('post-img').value
            };

            fetch('/api/admin/posts', {
                method: 'POST',
                headers: { 
                    'Authorization': basicAuthHeader,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }).then(res => {
                if(res.ok) {
                    postModal.hide();
                    loadPosts();
                } else { alert("Lỗi khi lưu!"); }
            });
        }

        function deletePost(id) {
            if(confirm("Bạn có chắc muốn xóa tin tức này?")) {
                fetch('/api/admin/posts/' + id, {
                    method: 'DELETE',
                    headers: { 'Authorization': basicAuthHeader }
                }).then(() => loadPosts());
            }
        }
    </script>
</body>
</html>
"""

with open(admin_path, "w", encoding="utf-8") as f:
    f.write(admin_html)

print("Created admin.html")
