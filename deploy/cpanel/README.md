# cPanel deployment overlay

## Article URLs

News links use `/tin-tuc/{slug}` from the article's existing **Đường dẫn** field.
Deploy the backend with `GET /api/public/posts/slug/{slug}` before updating the
frontend. Upload the generated frontend together with its `.htaccess`; otherwise
opening or refreshing a slug URL will return 404 on cPanel. No database migration
is needed. Existing `chi-tiet-tin-tuc?id=...` links continue to load and the browser
address is updated to the article's current slug. Spring Boot serves a 301 redirect
for the extensionless legacy route; static cPanel hosting updates the URL in JavaScript.

Không upload riêng thư mục này lên cPanel. Đây chỉ là các file cấu hình ghi đè
lên frontend gốc của Spring Boot.

Từ thư mục gốc của dự án, chạy:

```powershell
python tools/package_cpanel.py
```

Script tạo file `dist/htxlamhong-public-html.zip`. Upload file ZIP này vào đúng
Document Root của tên miền rồi chọn **Extract**. Sau khi giải nén, `index.html`,
`.htaccess`, các trang HTML và các thư mục `css`, `js`, `assets` sẽ nằm trực tiếp
trong Document Root, không có thư mục trung gian.
