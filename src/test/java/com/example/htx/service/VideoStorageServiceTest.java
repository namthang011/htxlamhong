package com.example.htx.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;
import java.nio.file.Files;
import java.nio.file.Path;
import static org.junit.jupiter.api.Assertions.*;

class VideoStorageServiceTest {
    @TempDir Path directory;

    static byte[] mp4() {
        return new byte[] {0, 0, 0, 24, 'f', 't', 'y', 'p', 'i', 's', 'o', 'm', 0, 0, 0, 0, 'i', 's', 'o', 'm', 'm', 'p', '4', '2'};
    }

    @Test void storesVideosByContentAndValidatesDatabaseUrls() throws Exception {
        var storage = new ImageStorageService(directory.toString());
        var file = new MockMultipartFile("file", "../../clip.mp4", "video/mp4", mp4());
        String url = storage.storeVideo(file);
        assertTrue(url.matches("/uploads/[a-f0-9]{64}\\.mp4"));
        assertArrayEquals(mp4(), Files.readAllBytes(directory.resolve(url.substring(9))));
        assertEquals(url, storage.storeVideo(file));
        assertEquals(url, storage.validateVideoUrl(url));
        assertNull(storage.validateVideoUrl(""));
        assertThrows(ResponseStatusException.class, () -> storage.validateVideoUrl("javascript:alert(1)"));
        assertThrows(ResponseStatusException.class, () -> storage.validateVideoUrl("/uploads/../../config.mp4"));
        try (var files = Files.list(directory)) { assertEquals(1, files.count()); }
    }

    @Test void rejectsFakeAndEmptyVideosAndCleansTemporaryFiles() throws Exception {
        var storage = new ImageStorageService(directory.toString());
        assertThrows(ResponseStatusException.class, () -> storage.storeVideo(new MockMultipartFile("file", "fake.mp4", "video/mp4", "<script>bad</script>".getBytes())));
        assertThrows(ResponseStatusException.class, () -> storage.storeVideo(new MockMultipartFile("file", new byte[0])));
        var large = org.mockito.Mockito.mock(org.springframework.web.multipart.MultipartFile.class);
        org.mockito.Mockito.when(large.getSize()).thenReturn(100L * 1024 * 1024 + 1);
        assertEquals(413, assertThrows(ResponseStatusException.class, () -> storage.storeVideo(large)).getStatusCode().value());
        try (var files = Files.list(directory)) { assertEquals(0, files.count()); }
    }

    @Test void recognizesWebmButRejectsMatroskaAndImageContainers() throws Exception {
        var storage = new ImageStorageService(directory.toString());
        byte[] webm = new byte[] {0x1a, 0x45, (byte) 0xdf, (byte) 0xa3, 0, 0, 0, 0, 'w', 'e', 'b', 'm', 0, 0, 0, 0};
        assertTrue(storage.storeVideo(new MockMultipartFile("file", "clip.webm", "video/webm", webm)).endsWith(".webm"));
        byte[] avif = mp4(); System.arraycopy(new byte[] {'a','v','i','f'}, 0, avif, 8, 4);
        System.arraycopy(new byte[] {'a','v','i','f'}, 0, avif, 16, 4);
        System.arraycopy(new byte[] {'a','v','i','f'}, 0, avif, 20, 4);
        assertThrows(ResponseStatusException.class, () -> storage.storeVideo(new MockMultipartFile("file", "fake.mp4", "video/mp4", avif)));
    }
}
