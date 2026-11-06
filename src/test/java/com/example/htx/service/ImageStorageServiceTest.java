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

    @Test void remoteStorageUsesAuthenticatedRequestAndReturnsCpanelUrl() throws Exception {
        var remote = new ImageStorageService(directory.toString(), "cpanel", "https://site.example/image-upload.php", "a".repeat(64), "https://site.example/uploads");
        var http = org.mockito.Mockito.mock(java.net.http.HttpClient.class);
        org.springframework.test.util.ReflectionTestUtils.setField(remote, "http", http);
        @SuppressWarnings("unchecked")
        java.net.http.HttpResponse<String> response = org.mockito.Mockito.mock(java.net.http.HttpResponse.class);
        String filename = java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(image())) + ".webp";
        org.mockito.Mockito.when(response.statusCode()).thenReturn(200);
        org.mockito.Mockito.when(response.body()).thenReturn(filename);
        org.mockito.Mockito.when(http.send(org.mockito.ArgumentMatchers.any(java.net.http.HttpRequest.class), org.mockito.ArgumentMatchers.<java.net.http.HttpResponse.BodyHandler<String>>any())).thenAnswer(call -> {
            java.net.http.HttpRequest request = call.getArgument(0);
            assertEquals("POST", request.method());
            assertEquals("a".repeat(64), request.headers().firstValue("X-Upload-Token").orElseThrow());
            assertEquals(image().length, request.bodyPublisher().orElseThrow().contentLength());
            return response;
        });
        assertEquals("https://site.example/uploads/" + filename, remote.store(image()));
        try (var files = Files.list(directory)) { assertEquals(0, files.count()); }
        org.mockito.Mockito.when(response.statusCode()).thenReturn(403);
        assertEquals(502, assertThrows(ResponseStatusException.class, () -> remote.store(image())).getStatusCode().value());
        org.mockito.Mockito.when(response.statusCode()).thenReturn(200);
        org.mockito.Mockito.when(response.body()).thenReturn("<html>hosting error</html>");
        assertThrows(ResponseStatusException.class, () -> remote.store(image()));
        org.mockito.Mockito.when(http.send(org.mockito.ArgumentMatchers.any(java.net.http.HttpRequest.class), org.mockito.ArgumentMatchers.<java.net.http.HttpResponse.BodyHandler<String>>any())).thenThrow(new java.io.IOException("offline"));
        assertThrows(ResponseStatusException.class, () -> remote.store(image()));
    }

    @Test void remoteConfigurationFailsClosedWithoutHttpsOrSecret() {
        assertThrows(IllegalArgumentException.class, () -> new ImageStorageService(directory.toString(), "cpanel", "http://site.example/image-upload.php", "a".repeat(64), "https://site.example/uploads"));
        assertThrows(IllegalArgumentException.class, () -> new ImageStorageService(directory.toString(), "cpanel", "https://site.example/image-upload.php", "", "https://site.example/uploads"));
        assertThrows(IllegalArgumentException.class, () -> new ImageStorageService(directory.toString(), "unknown", "", "", ""));
    }

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
