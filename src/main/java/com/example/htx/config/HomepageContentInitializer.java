package com.example.htx.config;

import com.example.htx.entity.GalleryImage;
import com.example.htx.entity.Testimonial;
import com.example.htx.repository.GalleryImageRepository;
import com.example.htx.repository.TestimonialRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
public class HomepageContentInitializer implements CommandLineRunner {
    private final TestimonialRepository testimonialRepository;
    private final GalleryImageRepository galleryImageRepository;

    public HomepageContentInitializer(TestimonialRepository testimonialRepository, GalleryImageRepository galleryImageRepository) {
        this.testimonialRepository = testimonialRepository;
        this.galleryImageRepository = galleryImageRepository;
    }

    @Override
    public void run(String... args) {
        if (testimonialRepository.count() == 0) {
            testimonialRepository.save(testimonial(
                    "Anh Nguyễn Văn Nam", "Xã viên - TP Vinh",
                    "Gia nhập HTX Lam Hồng giúp tôi tiết kiệm thời gian và chi phí. Thủ tục nhanh gọn, rõ ràng.",
                    "assets/images/xavien1.webp", 1));
            testimonialRepository.save(testimonial(
                    "Anh Trần Minh Tuấn", "Xã viên - Diễn Châu",
                    "Tôi rất hài lòng về dịch vụ lắp đặt định vị và camera. Thiết bị tốt, hỗ trợ nhiệt tình.",
                    "assets/images/xavien2.jpg", 2));
            testimonialRepository.save(testimonial(
                    "Anh Lê Văn Hải", "Xã viên - Cửa Lò",
                    "Đăng ký Grab được hỗ trợ miễn phí, nhân viên tư vấn nhiệt tình và đúng quy trình.",
                    "assets/images/xavien3.jpg", 3));
        }
        if (galleryImageRepository.count() == 0) {
            ArrayList<GalleryImage> images = new ArrayList<>();
            for (int index = 1; index <= 6; index++) {
                GalleryImage image = new GalleryImage();
                image.setTitle("Hoạt động HTX " + index);
                image.setImageUrl("assets/images/" + (index == 1 ? "G1.webp" : "g" + index + ".webp"));
                image.setSortOrder(index);
                images.add(image);
            }
            for (GalleryImage image : images) {
                galleryImageRepository.save(image);
            }
        }
    }

    private Testimonial testimonial(String name, String title, String content, String imageUrl, int order) {
        Testimonial item = new Testimonial();
        item.setMemberName(name);
        item.setMemberTitle(title);
        item.setContent(content);
        item.setImageUrl(imageUrl);
        item.setRating(5);
        item.setSortOrder(order);
        return item;
    }
}
