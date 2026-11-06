# Lưu ảnh ngoài cơ sở dữ liệu

**Render Free + cPanel:** dùng [hướng dẫn lưu ảnh trên cPanel](cpanel-image-storage.md).
Các hướng dẫn thư mục backend bên dưới chỉ dành cho chế độ local hoặc máy chủ có ổ bền vững.

Ảnh mới được nén trong trình duyệt, tải lên `POST /api/admin/images` bằng phiên
quản trị, rồi lưu thành JPG, PNG hoặc WebP trong thư mục của backend. API trả về
`/uploads/<sha256>.<đuôi ảnh>`; cơ sở dữ liệu chỉ lưu đường dẫn. Tên tệp gốc không
được dùng. Ảnh có cùng nội dung dùng chung một tệp. Giới hạn mỗi ảnh là 5 MB.

## Triển khai

- Đặt `UPLOAD_DIR` thành đường dẫn tuyệt đối trên ổ lưu trữ bền vững, ví dụ
  `/var/lib/htx/uploads` hoặc `D:/HTX-data/uploads`. Mặc định là `./data/uploads`
  tính từ thư mục khởi chạy backend; không đặt thư mục này trong `target` hay
  thư mục gói frontend bị ghi đè mỗi lần triển khai.
- Cấp quyền đọc/ghi thư mục cho tài khoản chạy backend. Backend phục vụ ảnh tại
  `/uploads/**` công khai, còn tải ảnh lên yêu cầu quyền quản trị. Chỉ dùng chức
  năng này cho ảnh công khai trên website, không dùng để lưu giấy tờ khách hàng.
- Nếu dùng Docker, gắn volume vào `/app/data/uploads` hoặc vào đường dẫn đã đặt
  trong `UPLOAD_DIR`. Thư mục trong container không gắn volume sẽ mất khi thay container.
- Frontend cPanel dùng `API_BASE_URL` để truy cập cả API và ảnh trên backend;
  không cần chép ảnh vào gói ZIP frontend. Backend và frontend phải được cập nhật cùng nhau.
- Sao lưu cơ sở dữ liệu **và** thư mục ảnh. Khi phục hồi hoặc chuyển máy chủ,
  khôi phục cả hai. Không xóa thư mục ảnh khi cập nhật mã nguồn.

## Chuyển ảnh cũ

Sao lưu trước, sau đó chạy backend một lần với `MIGRATE_EXISTING_IMAGES=true`.
Lần khởi động này chuyển ảnh Base64 trong bài viết, dịch vụ, giới thiệu, đánh giá
và ảnh hoạt động ra thư mục, rồi cập nhật đường dẫn trong một giao dịch cơ sở dữ
liệu. Nếu chuyển đổi lỗi, các thay đổi cơ sở dữ liệu được hoàn tác; tệp đã tạo
có thể còn lại và được dùng lại khi chạy lần sau. Có thể chạy lại mà không tạo
bản sao ảnh. Sau khi thành công, bỏ biến này hoặc đặt về `false`.

Trình soạn thảo hoặc bản nháp cũ còn chứa Base64 vẫn được chuyển ảnh khi lưu.
Ảnh trong `assets/images` và đường dẫn ngoài đang có được giữ nguyên.

Tệp ảnh chưa dùng (ví dụ chọn ảnh rồi bỏ bản nháp) hiện được giữ lại. Hệ thống
không tự xóa ảnh khi xóa bài vì ảnh có thể đang được bài khác sử dụng.
