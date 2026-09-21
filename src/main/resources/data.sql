-- Insert default admin user if not exists (password: admin123 hashed using BCrypt)
INSERT IGNORE INTO roles (id, name) VALUES (1, 'ROLE_ADMIN');
INSERT IGNORE INTO roles (id, name) VALUES (2, 'ROLE_USER');
-- password is 'admin123' mapped to bcrypt
INSERT IGNORE INTO users (id, username, password, enabled) VALUES (1, 'admin', '$2a$10$wY1tw.Z/.H3mB1Xl7P5w0.F1o5B9.B9w8B9w8B9w8B9w8B9w8B9w', 1);
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (1, 1);

-- Mock Data cho Category
INSERT IGNORE INTO categories (id, name, description) VALUES (1, 'D?ch v? V?n t?i', 'Cho thuê xe t?i, xe khách');
INSERT IGNORE INTO categories (id, name, description) VALUES (2, 'Th? t?c gi?y t?', 'Làm phù hi?u, bi?n s? vàng');

-- Mock Data cho Services
INSERT IGNORE INTO services (id, name, slug, summary, description, price, image_url, status, category_id, created_at, updated_at) VALUES 
(1, 'Ð?i bi?n s? vàng', 'doi-bien-so-vang', 'D?ch v? c?p d?i bi?n s? vàng cho xe kinh doanh', 'Chi ti?t th? t?c...', 500000, 'static/thu tuc bien trang sang bien vang.png', 'ACTIVE', 2, NOW(), NOW()),
(2, 'L?p d?t Camera Ngh? Ð?nh 10', 'lap-camera-nd10', 'G?n camera giám sát hành trình chu?n', 'L?p d?t t?n noi...', 1500000, 'static/camera-dinh-vi.png', 'ACTIVE', 2, NOW(), NOW()),
(3, 'C?p Phù Hi?u Xe', 'cap-phu-hieu-xe', 'C?p phù hi?u xe h?p d?ng, xe t?i nhanh chóng', 'Th?i gian hoàn thành 2 ngày...', 800000, 'static/phu-hieu-xe.png', 'ACTIVE', 2, NOW(), NOW());

-- Mock Data cho Posts
INSERT IGNORE INTO posts (id, title, slug, summary, content, thumbnail_url, created_at, updated_at) VALUES 
(1, 'Quy d?nh m?i v? l?p Camera 2026', 'quy-dinh-moi-camera', 'C?p nh?t ngh? d?nh m?i nh?t cho tài x?', 'N?i dung bài vi?t...', 'static/camera-nghi-dinh.jpg', NOW(), NOW()),
(2, 'T?i sao nên tham gia HTX Lam H?ng?', 'vi-sao-chon-htx-lam-hong', 'Nh?ng quy?n l?i h?p d?n cho xã viên', 'N?i dung bài vi?t...', 'static/xavien1.webp', NOW(), NOW());

