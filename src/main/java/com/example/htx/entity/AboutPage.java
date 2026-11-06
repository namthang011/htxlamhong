package com.example.htx.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name="about_page") @Data @NoArgsConstructor
public class AboutPage {
 @Id private Long id = 1L;
 private String title = "Giới thiệu HTX Vận tải Lam Hồng";
 @Column(columnDefinition="LONGTEXT") private String content = """
     <p>HTX Vận tải Lam Hồng đồng hành cùng tài xế và xã viên với các dịch vụ hỗ trợ vận tải tại Nghệ An.</p>
     <h2>Dịch vụ hỗ trợ tài xế</h2>
     <p>Hợp tác xã hỗ trợ tư vấn phù hiệu xe, chuyển đổi biển số, đăng ký Grab – Be, lắp đặt thiết bị định vị, camera và bảo hiểm xe. Thông tin từng dịch vụ được cập nhật tại mục Dịch vụ trên website.</p>
     <h2>Rõ ràng trong từng bước</h2>
     <p>Liên hệ hợp tác xã để được hướng dẫn hồ sơ, quy trình thực hiện và chi phí phù hợp với nhu cầu. Chúng tôi hướng đến sự minh bạch và hỗ trợ tận tâm trong quá trình đồng hành cùng xã viên.</p>
     <h2>Kết nối với Lam Hồng</h2>
     <p>Địa chỉ: Thôn Ngọc Mỹ, Xã Hải Châu, Tỉnh Nghệ An.</p>
     <p>Hotline: <a href="tel:0833303777">0833 303 777</a>. Email: <a href="mailto:htxvtlamhong@gmail.com">htxvtlamhong@gmail.com</a>.</p>
     <p>Giờ làm việc: 7:30 – 17:30, Thứ 2 – Thứ 7.</p>
     """;
}
