# Lưu ảnh trên cPanel, backend Render Free

Trình duyệt đăng nhập quản trị → Render `/api/admin/images` → cPanel
`image-upload.php` → thư mục `uploads`. Render chỉ lưu URL HTTPS ảnh trong MySQL.
Không cần Persistent Disk hay Cloudinary. Chế độ local vẫn dùng `data/uploads`.

## 1. Sao lưu và chuẩn bị

Sao lưu MySQL và các ảnh hiện có trước khi thay đổi. Hosting cần PHP 8.1 trở lên,
Apache/LiteSpeed hỗ trợ `.htaccess`, HTTPS và quyền ghi thư mục `uploads`.
Ảnh ở đây là ảnh công khai của website, không dùng cho giấy tờ cá nhân.

## 2. Cập nhật cPanel trước

Chạy `python tools/package_cpanel.py`, tải `dist/htxlamhong-public-html.zip` lên
Document Root và giải nén ghi đè. Gói này chứa `image-upload.php` và
`uploads/.htaccess` nhưng không chứa khóa bí mật, không chứa ảnh tải lên.
Không xóa thư mục uploads đang có khi cập nhật.

Ví dụ Document Root là `/home/USERNAME/public_html`:

```text
/home/USERNAME/
  htx-upload-config.php       ← tệp bí mật, bên ngoài public_html
  public_html/
    image-upload.php
    config.js
    uploads/
      .htaccess
      <sha256>.webp
```

Tạo khóa ngẫu nhiên 64 ký tự hex, ví dụ chạy trên máy của bạn:

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

Chép `deploy/cpanel-private/htx-upload-config.example.php` thành
`htx-upload-config.php` trong thư mục cha của Document Root. Thay giá trị mẫu
bằng khóa vừa tạo. Giữ khóa riêng; không gửi vào chat, Git hay config.js.

```php
<?php
return ['token' => 'DAN_KHOA_64_KY_TU_HEX_VAO_DAY'];
```

Đầu nhận mặc định tìm `dirname(__DIR__) . '/htx-upload-config.php'`. Nếu dùng
addon domain có Document Root lồng trong public_html, hãy đặt tệp bí mật ở thư
mục không công khai và sửa `$configPath` trong image-upload.php thành đường dẫn
tuyệt đối đó. Đảm bảo PHP có quyền đọc tệp. Thư mục uploads thường dùng quyền
0755, tệp ảnh 0644; không đặt 0777. Kiểm tra post_max_size tối thiểu 8M.

## 3. Cấu hình Render

Trong Environment của backend, giữ nguyên DB_URL, DB_USERNAME, DB_PASSWORD,
JWT_SECRET và các cấu hình đang dùng. Thêm các biến dưới đây; thay tên miền
theo đúng tên miền website, dùng URL HTTPS cuối cùng không chuyển hướng:

```text
UPLOAD_PROVIDER=cpanel
CPANEL_UPLOAD_URL=https://htxlamhong.vn/image-upload.php
CPANEL_PUBLIC_BASE_URL=https://htxlamhong.vn/uploads
CPANEL_UPLOAD_TOKEN=<cùng khóa trong htx-upload-config.php>
MIGRATE_EXISTING_IMAGES=false
SEED_DATA=false
```

Không cần UPLOAD_DIR trên Render cho ảnh mới. Không tạo Disk.
Deploy phiên bản backend mới sau khi cPanel đã sẵn sàng. Khóa sai hoặc hosting
không kết nối được thì tải ảnh thất bại; hệ thống không âm thầm lưu ảnh lên ổ tạm.

## 4. Giữ ảnh cũ

- Ảnh có sẵn trong assets/images không cần chuyển.
- Ảnh còn dạng Base64 trong MySQL: sau khi sao lưu, bật
  MIGRATE_EXISTING_IMAGES=true cho một lần khởi động. Backend gửi các ảnh này
  lên cPanel và cập nhật URL trong một giao dịch. Nếu lỗi thì dữ liệu DB được
  hoàn tác; các tệp đã gửi có thể còn lại và được tái sử dụng khi thử lại.
  Chuyển xong đặt lại false.
- Ảnh đã chuyển thành tệp: chép các tệp từ thư mục uploads cũ sang uploads trên
  cPanel, giữ nguyên tên. Đừng đợi deploy/restart nếu chúng đang ở ổ tạm Render.
- Ảnh local có thể đóng gói bằng `python tools/package_existing_uploads.py`;
  giải nén ZIP được tạo vào Document Root. Chỉ gồm ảnh có sẵn trên máy này,
  không thay thế việc sao lưu/chuyển ảnh đang nằm trên Render.
- Tham chiếu tương đối `/uploads/<hash>.*` được config.js của gói cPanel trỏ
  sang hosting. Nếu DB có URL tuyệt đối cũ như localhost hoặc tên miền backend,
  cần chuyển tệp tương ứng và thay riêng tiền tố URL đó bằng tên miền cPanel;
  không thay toàn bộ URL khác trong bài. Việc này không được tự động thực hiện.

## 5. Kiểm tra

1. Mở image-upload.php trực tiếp: trả 405 là đúng vì chỉ cho phép POST.
2. POST không có khóa phải trả 403; thiếu cấu hình riêng có thể trả 503.
3. Đăng nhập admin, chọn ảnh đại diện và chèn ảnh giữa nội dung, sau đó lưu bài.
4. URL mới phải bắt đầu bằng https://htxlamhong.vn/uploads/ (theo cấu hình).
5. Restart Render và kiểm tra ảnh vẫn hiện. Ảnh nằm trên cPanel nên không mất.

Nếu 502 khi tải ảnh: kiểm tra khóa hai bên, URL có chuyển hướng không,
ModSecurity của hosting có chặn request hay header X-Upload-Token không,
và quyền ghi uploads. Không tắt ModSecurity toàn website; nhờ hosting xử lý
đúng endpoint nếu cần. Sao lưu đồng thời MySQL và uploads.

Ảnh trùng nội dung dùng chung tệp. Xóa bài không tự xóa ảnh để tránh ảnh đang
được bài khác dùng. Ảnh tải lên nhưng không dùng cũng được giữ lại.
