package com.example.htx.config;

import com.example.htx.entity.Category;
import com.example.htx.entity.Post;
import com.example.htx.entity.ServiceEntity;
import com.example.htx.repository.CategoryRepository;
import com.example.htx.repository.PostRepository;
import com.example.htx.repository.ServiceEntityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.time.LocalDateTime;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private CategoryRepository categoryRepo;

    @Autowired
    private ServiceEntityRepository serviceRepo;

    @Autowired
    private PostRepository postRepo;

    @Override
    public void run(String... args) throws Exception {
        try {
            jdbcTemplate.execute("ALTER TABLE services MODIFY image_url LONGTEXT");
            jdbcTemplate.execute("ALTER TABLE posts MODIFY thumbnail_url LONGTEXT");
        } catch (Exception e) {
            System.out.println("Could not alter tables: " + e.getMessage());
        }

        System.out.println("Forcing re-seed to clean up old mojibake data...");
        forceSeed();
    }
    
    // In case user wants to force re-seed, we can just wipe and insert
    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public void forceSeed() {
        
        serviceRepo.deleteAll();
        postRepo.deleteAll();
        seedData();
    }

    private void seedData() {
        Category cat = new Category();
        cat.setName("Dịch Vụ Chính");
        cat.setDescription("Danh mục dịch vụ chính");
        cat = categoryRepo.save(cat);

        // Services
        ServiceEntity s1 = new ServiceEntity();
        s1.setName("Chuyển biển trắng qua biển vàng");
        s1.setSlug("chuyen-bien-trang-qua-bien-vang");
        s1.setSummary("Hỗ trợ trọn gói thủ tục chuyển đổi biển số kinh doanh vận tải nhanh chóng, đúng quy định.");
        s1.setImageUrl("static/bien-trang-sang-bien-vang.png");
        s1.setCategory(cat);
        s1.setStatus("ACTIVE");

        ServiceEntity s2 = new ServiceEntity();
        s2.setName("Cấp mới & gia hạn phù hiệu");
        s2.setSlug("cap-moi-gia-han-phu-hieu");
        s2.setSummary("Xử lý hồ sơ cấp mới, gia hạn phù hiệu xe hợp đồng, xe công nghệ, xe tải đúng quy trình.");
        s2.setImageUrl("static/phu-hieu-xe.png");
        s2.setCategory(cat);
        s2.setStatus("ACTIVE");

        ServiceEntity s3 = new ServiceEntity();
        s3.setName("Đăng ký miễn phí Grab - Be");
        s3.setSlug("dang-ky-mien-phi-grab-be");
        s3.setSummary("Nhận tư vấn, mở tài khoản đối tác chạy xe công nghệ miễn phí, nhanh chóng và hiệu quả.");
        s3.setImageUrl("static/grab-brand.jpg");
        s3.setCategory(cat);
        s3.setStatus("ACTIVE");

        ServiceEntity s4 = new ServiceEntity();
        s4.setName("Lắp đặt định vị hợp chuẩn");
        s4.setSlug("lap-dat-dinh-vi-hop-chuan");
        s4.setSummary("Cung cấp thiết bị giám sát hành trình đúng tiêu chuẩn, truyền dữ liệu ổn định và chính xác.");
        s4.setImageUrl("static/dinh-vi-oto.jpg");
        s4.setCategory(cat);
        s4.setStatus("ACTIVE");

        ServiceEntity s5 = new ServiceEntity();
        s5.setName("Lắp đặt camera theo nghị định");
        s5.setSlug("lap-dat-camera-theo-nghi-dinh");
        s5.setSummary("Lắp đặt camera an ninh, đáp ứng tiêu chuẩn quy định theo Nghị định mới nhất.");
        s5.setImageUrl("static/camera-dinh-vi.png");
        s5.setCategory(cat);
        s5.setStatus("ACTIVE");

        ServiceEntity s6 = new ServiceEntity();
        s6.setName("Bán bảo hiểm các loại");
        s6.setSlug("ban-bao-hiem-cac-loai");
        s6.setSummary("Với gói bảo hiểm phù hợp, minh bạch và đầy đủ quyền lợi cho tài xế, chủ xe.");
        s6.setImageUrl("static/bao-hiem-xe.png");
        s6.setCategory(cat);
        s6.setStatus("ACTIVE");

        serviceRepo.saveAll(Arrays.asList(s1, s2, s3, s4, s5, s6));

        // Posts
        Post p1 = new Post();
        p1.setTitle("Quy định mới về phù hiệu xe hợp đồng");
        p1.setSlug("quy-dinh-moi-ve-phu-hieu-xe-hop-dong");
        p1.setSummary("Cập nhật những quy định mới nhất về phù hiệu xe hợp đồng, xe công nghệ và các thủ tục cần lưu ý.");
        p1.setContent("Nội dung đang cập nhật...");
        p1.setThumbnailUrl("static/tintuc1.webp");
        p1.setCreatedAt(LocalDateTime.now());

        Post p2 = new Post();
        p2.setTitle("Thủ tục chuyển biển trắng sang biển vàng");
        p2.setSlug("thu-tuc-chuyen-bien-trang-sang-bien-vang");
        p2.setSummary("Hướng dẫn chi tiết quy trình, hồ sơ và chi phí chuyển đổi biển số kinh doanh vận tải mới nhất.");
        p2.setContent("Nội dung đang cập nhật...");
        p2.setThumbnailUrl("static/thu tuc bien trang sang bien vang.png");
        p2.setCreatedAt(LocalDateTime.now());

        Post p3 = new Post();
        p3.setTitle("Lắp camera theo nghị định mới nhất");
        p3.setSlug("lap-camera-theo-nghi-dinh-moi-nhat");
        p3.setSummary("Hướng dẫn lắp đặt camera theo đúng tiêu chuẩn, bảo đảm an toàn và tối ưu hiệu quả giám sát.");
        p3.setContent("Nội dung đang cập nhật...");
        p3.setThumbnailUrl("static/tin tức lắp camera theo nghị định.jpg");
        p3.setCreatedAt(LocalDateTime.now());

        postRepo.saveAll(Arrays.asList(p1, p2, p3));
        
        System.out.println("SEED DATA SUCCESSFULLY IMPORTED FROM OLD WEBSITE!");
    }
}
