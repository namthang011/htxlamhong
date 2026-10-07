# cPanel deployment overlay

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
