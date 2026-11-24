package com.example.htx.controller;

import com.example.htx.entity.Post;
import com.example.htx.repository.PostRepository;
import com.example.htx.service.ImageStorageService;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"app.upload.directory=./target/video-test-uploads", "app.upload.provider=local"})
@AutoConfigureMockMvc
@ActiveProfiles("local")
@Transactional
@EnabledIfEnvironmentVariable(named = "HTX_DB_TEST", matches = "true")
class PostVideoDatabaseTest {
    @Autowired AdminApiController controller;
    @Autowired PostRepository posts;
    @Autowired EntityManager entityManager;
    @Autowired MockMvc mvc;
    @Autowired ImageUploadController uploads;
    @Autowired ImageStorageService storage;

    @Test void preservesMultipleVideoPositionsAcrossSaveAndUpdate() {
        String first = "/uploads/" + "a".repeat(64) + ".mp4";
        String second = "/uploads/" + "b".repeat(64) + ".webm";
        String content = "<p>Before</p><video src=\"" + first + "\" controls></video><p>Middle</p>"
                + "<video src=\"" + second + "\" controls></video><p>After</p>";
        Post post = new Post(); post.setTitle("Inline video test");
        post.setSlug("inline-video-" + System.nanoTime()); post.setContent(content);
        Long id = controller.createPost(post).getId();
        entityManager.flush(); entityManager.clear();
        assertEquals(content, posts.findById(id).orElseThrow().getContent());
        post.setContent("<p>Moved</p><video src=\"" + second + "\" controls></video>");
        controller.updatePost(id, post);
        entityManager.flush(); entityManager.clear();
        assertEquals(post.getContent(), posts.findById(id).orElseThrow().getContent());
    }

    @Test void uploadedVideoSupportsPublicPlaybackAndSeeking() throws Exception {
        byte[] bytes = new byte[] {0, 0, 0, 24, 'f', 't', 'y', 'p', 'i', 's', 'o', 'm', 0, 0, 0, 0, 'i', 's', 'o', 'm', 'm', 'p', '4', '2'};
        String url = uploads.uploadVideo(new org.springframework.mock.web.MockMultipartFile("file", "clip.mp4", "video/mp4", bytes)).get("url");
        try {
            mvc.perform(get(url).header("Range", "bytes=0-7"))
                    .andExpect(status().isPartialContent())
                    .andExpect(header().string("Content-Type", "video/mp4"))
                    .andExpect(header().string("Content-Range", "bytes 0-7/24"))
                    .andExpect(content().bytes(java.util.Arrays.copyOf(bytes, 8)));
        } finally { java.nio.file.Files.deleteIfExists(storage.directory().resolve(url.substring(9))); }
    }

    @Test void createsUpdatesAndRemovesVideoInActualMysqlWithoutLeavingTestPosts() throws Exception {
        String first = "/uploads/" + "a".repeat(64) + ".mp4";
        String second = "/uploads/" + "b".repeat(64) + ".webm";
        Post post = new Post();
        post.setTitle("Video integration test"); post.setSlug("video-integration-" + System.nanoTime());
        post.setContent("<p>Video test</p>"); post.setVideoUrl(first);
        Long id = controller.createPost(post).getId();
        entityManager.flush(); entityManager.clear();
        assertEquals(first, posts.findById(id).orElseThrow().getVideoUrl());
        mvc.perform(get("/api/public/posts/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.videoUrl").value(first));
        post.setVideoUrl(second); controller.updatePost(id, post);
        entityManager.flush(); entityManager.clear();
        assertEquals(second, posts.findById(id).orElseThrow().getVideoUrl());
        post.setVideoUrl(null); controller.updatePost(id, post);
        entityManager.flush(); entityManager.clear();
        assertNull(posts.findById(id).orElseThrow().getVideoUrl());
        mvc.perform(multipart("/api/admin/videos").file("file", new byte[] {1, 2})).andExpect(status().isForbidden());
    }
}
