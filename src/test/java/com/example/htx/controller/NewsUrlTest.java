package com.example.htx.controller;

import com.example.htx.config.JwtUtil;
import com.example.htx.entity.Post;
import com.example.htx.repository.*;
import com.example.htx.service.CustomUserDetailsService;
import com.example.htx.service.ImageStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Optional;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {PublicApiController.class, NewsPageController.class},
        properties = {"app.upload.directory=./target/news-url-test-uploads", "app.upload.provider=local"})
@Import({ImageStorageService.class, com.example.htx.config.SecurityConfig.class,
        com.example.htx.config.WebMvcConfig.class, com.example.htx.config.JwtAuthenticationFilter.class})
class NewsUrlTest {
    @Autowired MockMvc mvc;
    @MockBean PostRepository posts;
    @MockBean ServiceEntityRepository services;
    @MockBean TestimonialRepository testimonials;
    @MockBean GalleryImageRepository gallery;
    @MockBean JwtUtil jwt;
    @MockBean CustomUserDetailsService users;

    private Post post() {
        Post post = new Post(); post.setId(416L); post.setSlug("huong-dan-phu-hieu-xe");
        post.setTitle("Hướng dẫn phù hiệu xe"); post.setContent("<p>Nội dung</p>"); return post;
    }

    @Test void publicSlugApiLoadsTheStoredArticleAndKeepsIdApi() throws Exception {
        when(posts.findBySlug("huong-dan-phu-hieu-xe")).thenReturn(Optional.of(post()));
        when(posts.findById(416L)).thenReturn(Optional.of(post()));
        mvc.perform(get("/api/public/posts/slug/huong-dan-phu-hieu-xe"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(416));
        mvc.perform(get("/api/public/posts/416"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.slug").value(post().getSlug()));
        mvc.perform(get("/api/public/posts/slug/missing")) .andExpect(status().isNotFound());
    }

    @Test void articleAndListingRoutesArePublic() throws Exception {
        mvc.perform(get("/tin-tuc/huong-dan-phu-hieu-xe"))
                .andExpect(status().isOk()).andExpect(forwardedUrl("/chi-tiet-tin-tuc.html"));
        mvc.perform(get("/tin-tuc"))
                .andExpect(status().isOk()).andExpect(forwardedUrl("/tin-tuc.html"));
        mvc.perform(get("/api/admin/posts")).andExpect(status().isForbidden());
    }

    @Test void legacyIdLinkPermanentlyRedirectsToCurrentSlug() throws Exception {
        when(posts.findById(416L)).thenReturn(Optional.of(post()));
        mvc.perform(get("/chi-tiet-tin-tuc").param("id", "416"))
                .andExpect(status().isMovedPermanently())
                .andExpect(redirectedUrl("/tin-tuc/huong-dan-phu-hieu-xe"));
        mvc.perform(get("/chi-tiet-tin-tuc").param("id", "999"))
                .andExpect(forwardedUrl("/chi-tiet-tin-tuc.html"));
    }
}
