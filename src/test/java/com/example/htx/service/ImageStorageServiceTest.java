package com.example.htx.service;

import com.example.htx.controller.ImageUploadController;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ImageStorageServiceTest {
    @TempDir Path directory;
    private byte[] image() throws Exception { return Files.readAllBytes(Path.of("src/main/resources/static/assets/images/logo.webp")); }
    private ImageStorageService storage() throws Exception { return new ImageStorageService(directory.toString()); }

    @Test void storesIdenticalImagesOnceAndPreservesBytesAcrossRestarts() throws Exception {
        var storage = storage();
        String url = storage.store(image());
        assertTrue(url.matches("/uploads/[a-f0-9]{64}\\.webp"));
        assertEquals(url, storage.store(image()));
        assertEquals(url, storage().store(image()));
        assertArrayEquals(image(), Files.readAllBytes(directory.resolve(url.substring("/uploads/".length()))));
        try (var files = Files.list(directory)) { assertEquals(1, files.count()); }
    }

    @Test void convertsInlineAndCoverImagesWithoutChangingSurroundingContent() throws Exception {
        var storage = storage();
        String data = "data:image/webp;base64," + Base64.getEncoder().encodeToString(image());
        String url = storage.externalize(data);
        String content = "<h2>Hướng dẫn</h2><p>Trước</p><img src=\"" + data + "\"><p>Sau</p>";
        String result = storage.externalize(content);
        assertEquals(content.replace(data, url), result);
        assertEquals(result, storage.externalize(result));
        assertNull(storage.externalize(null));
        assertEquals("/assets/images/logo.webp", storage.externalize("/assets/images/logo.webp"));
    }

    @Test void rejectsEmptyOversizedAndActiveContent() throws Exception {
        var storage = storage();
        for (byte[] bytes : new byte[][] {new byte[0], new byte[5 * 1024 * 1024 + 1], "<svg onload='alert(1)'/>".getBytes()}) {
            assertEquals(400, assertThrows(ResponseStatusException.class, () -> storage.store(bytes)).getStatusCode().value());
        }
        assertThrows(ResponseStatusException.class, () -> storage.externalize("data:image/png;base64,AAAAA"));
        try (var files = Files.list(directory)) { assertEquals(0, files.count()); }
    }

    @Test void uploadIgnoresOriginalFilenameAndDoesNotTrustContentType() throws Exception {
        var mvc = MockMvcBuilders.standaloneSetup(new ImageUploadController(storage())).build();
        mvc.perform(multipart("/api/admin/images").file(new MockMultipartFile("file", "../../evil.html", "text/html", image())))
                .andExpect(status().isOk()).andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.matchesPattern("/uploads/[a-f0-9]{64}\\.webp")));
        mvc.perform(multipart("/api/admin/images").file(new MockMultipartFile("file", "fake.png", "image/png", "<script>alert(1)</script>".getBytes())))
                .andExpect(status().isBadRequest());
    }
}
