package com.example.htx.controller;

import com.example.htx.entity.Post;
import com.example.htx.repository.PostRepository;
import com.example.htx.service.ImageStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminImagePersistenceTest {
    @TempDir Path directory;

    @Test void oldEditorCanCreateAndUpdateWithoutSavingBase64ToDatabase() throws Exception {
        var controller = new AdminApiController();
        var repository = mock(PostRepository.class);
        ReflectionTestUtils.setField(controller, "postRepository", repository);
        ReflectionTestUtils.setField(controller, "images", new ImageStorageService(directory.toString()));
        when(repository.save(any(Post.class))).thenAnswer(call -> {
            Post saved = call.getArgument(0);
            assertFalse(saved.getContent().contains("data:image"));
            assertTrue(saved.getContent().contains("/uploads/"));
            assertTrue(saved.getThumbnailUrl().startsWith("/uploads/"));
            return saved;
        });
        String data = "data:image/webp;base64," + Base64.getEncoder().encodeToString(Files.readAllBytes(Path.of("src/main/resources/static/assets/images/logo.webp")));
        Post submitted = new Post();
        submitted.setTitle("Bài có ảnh"); submitted.setSlug("bai-co-anh");
        submitted.setContent("<p>Trước</p><img src=\"" + data + "\"><p>Sau</p>");
        submitted.setThumbnailUrl(data);
        Post created = controller.createPost(submitted);
        assertTrue(created.getContent().endsWith("<p>Sau</p>"));
        Post existing = new Post(); existing.setId(42L);
        when(repository.findById(42L)).thenReturn(Optional.of(existing));
        submitted.setContent("<h2>Mới</h2><img src=\"" + data + "\">"); submitted.setThumbnailUrl(data);
        assertEquals(200, controller.updatePost(42L, submitted).getStatusCode().value());
        verify(repository, times(2)).save(any(Post.class));
        try (var files = Files.list(directory)) { assertEquals(1, files.count()); }
    }
}
