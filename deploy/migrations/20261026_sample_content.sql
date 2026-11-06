-- Optional editorial repair: only replace the exact, unchanged sample content.
-- Export the production posts table before running this in phpMyAdmin.
-- Rows with edited titles/content do not match and remain untouched.
SET NAMES utf8mb4;
SET SESSION sql_mode='NO_BACKSLASH_ESCAPES';
START TRANSACTION;
UPDATE posts SET title='Tại sao nên tham gia hợp tác xã?', summary='Tìm hiểu cách HTX Lam Hồng hỗ trợ tài xế, tư vấn thủ tục và kết nối xã viên.', content='<p>Tham gia hợp tác xã là một lựa chọn để tài xế tìm kiếm sự hỗ trợ trong quá trình hoạt động vận tải. Tại HTX Vận tải Lam Hồng, tài xế có thể trao đổi nhu cầu để được tư vấn các dịch vụ phù hợp.</p>
<h2>Được tư vấn theo nhu cầu thực tế</h2><p>Hợp tác xã hỗ trợ thông tin về phù hiệu xe, chuyển đổi biển số, đăng ký đối tác xe công nghệ, thiết bị định vị, camera và bảo hiểm xe. Mỗi loại phương tiện và hình thức hoạt động có yêu cầu khác nhau; hãy liên hệ để được hướng dẫn trước khi chuẩn bị hồ sơ.</p>
<h2>Trao đổi rõ ràng trước khi thực hiện</h2><p>Tài xế nên tìm hiểu phạm vi hỗ trợ, các khoản chi phí và trách nhiệm của các bên trước khi đăng ký dịch vụ hoặc tham gia hợp tác xã. Lam Hồng hướng đến việc tư vấn rõ ràng và đồng hành cùng xã viên.</p>
<h2>Kết nối với Lam Hồng</h2><p>Gọi <a href="tel:0833303777">0833 303 777</a> hoặc đến Thôn Ngọc Mỹ, Xã Hải Châu, Tỉnh Nghệ An. Giờ làm việc: 7:30 – 17:30, Thứ 2 – Thứ 7.</p>
', thumbnail_url='assets/images/G1.webp', updated_at=CURRENT_TIMESTAMP WHERE title='Tại sao nên tham gia hợp tác xã' AND content='Nội dung bài viết 123';

UPDATE posts SET title='Phù hiệu xe: thông tin cần chuẩn bị', summary='Những thông tin nên trao đổi khi cần tư vấn cấp mới hoặc gia hạn phù hiệu xe.', content='<p>Khi cần tư vấn về phù hiệu xe, tài xế và chủ xe nên chuẩn bị thông tin về phương tiện, chủ sở hữu và hình thức hoạt động vận tải dự kiến. Đây là cơ sở để hợp tác xã trao đổi hướng hỗ trợ phù hợp.</p>
<h2>Thông tin nên trao đổi</h2><ul><li>Loại xe, biển số và mục đích sử dụng.</li><li>Nhu cầu cấp mới hoặc gia hạn phù hiệu.</li><li>Các giấy tờ và thiết bị hiện có trên phương tiện.</li></ul>
<h2>Xác nhận yêu cầu trước khi nộp hồ sơ</h2><p>Thành phần hồ sơ, điều kiện và thời gian xử lý phụ thuộc trường hợp cụ thể và quy định áp dụng tại thời điểm thực hiện. Bạn nên xác nhận thông tin với đơn vị tiếp nhận trước khi nộp hồ sơ.</p>
<p>Liên hệ HTX Vận tải Lam Hồng qua <a href="tel:0833303777">0833 303 777</a> để trao đổi nhu cầu và phạm vi hỗ trợ.</p>
', updated_at=CURRENT_TIMESTAMP WHERE title='Quy định mới về phù hiệu xe hợp đồng' AND content='âcdjakwdjlkawjdawdawdawda';

UPDATE posts SET title='Chuyển biển trắng sang biển vàng: tư vấn thủ tục', summary='Thông tin cần trao đổi trước khi thực hiện chuyển đổi biển số phục vụ hoạt động vận tải.', content='<p>Nếu có nhu cầu chuyển đổi biển số để phục vụ hoạt động vận tải, chủ xe nên tìm hiểu yêu cầu áp dụng cho loại phương tiện và hình thức kinh doanh của mình trước khi thực hiện.</p>
<h2>Chuẩn bị thông tin phương tiện</h2><p>Khi liên hệ tư vấn, hãy cung cấp loại xe, thông tin chủ sở hữu, tình trạng đăng ký xe và mục đích sử dụng dự kiến. Hợp tác xã sẽ trao đổi nhu cầu và hướng dẫn bước chuẩn bị phù hợp.</p>
<h2>Xác nhận hồ sơ và chi phí</h2><p>Hồ sơ, lệ phí và thời gian giải quyết cần được xác nhận với cơ quan tiếp nhận theo quy định tại thời điểm thực hiện. Các khoản phí dịch vụ hỗ trợ, nếu có, nên được trao đổi rõ ràng trước khi đăng ký.</p>
<p>HTX Vận tải Lam Hồng: <a href="tel:0833303777">0833 303 777</a> · Thôn Ngọc Mỹ, Xã Hải Châu, Tỉnh Nghệ An.</p>
', updated_at=CURRENT_TIMESTAMP WHERE title='Thủ tục chuyển biển trắng sang biển vàng' AND content='Nội dung đang cập nhật...';

UPDATE posts SET title='Camera trên xe: tư vấn lựa chọn và lắp đặt', summary='Tìm hiểu nhu cầu sử dụng, khả năng lưu trữ và hỗ trợ kỹ thuật khi lựa chọn camera trên xe.', content='<p>Camera trên xe có thể hỗ trợ tài xế theo dõi hành trình và lưu lại hình ảnh trong quá trình sử dụng phương tiện. Việc lựa chọn thiết bị nên dựa trên nhu cầu thực tế và yêu cầu áp dụng cho từng loại xe.</p>
<h2>Những điểm nên trao đổi khi lựa chọn</h2><ul><li>Vị trí lắp đặt và phạm vi ghi hình cần thiết.</li><li>Chất lượng hình ảnh, khả năng lưu trữ và kết nối dữ liệu.</li><li>Chi phí thiết bị, lắp đặt, duy trì và hỗ trợ kỹ thuật.</li></ul>
<h2>Kiểm tra yêu cầu trước khi lắp đặt</h2><p>Với phương tiện hoạt động vận tải, bạn nên xác nhận yêu cầu kỹ thuật hiện hành với đơn vị cung cấp và cơ quan có thẩm quyền. Không phải mọi thiết bị camera đều phù hợp với mọi loại xe hoặc mục đích sử dụng.</p>
<p>Liên hệ <a href="tel:0833303777">0833 303 777</a> để được HTX Vận tải Lam Hồng tư vấn theo nhu cầu của bạn.</p>
', updated_at=CURRENT_TIMESTAMP WHERE title='Lắp camera theo nghị định mới nhất' AND content='Nội dung đang cập nhật...';

COMMIT;
