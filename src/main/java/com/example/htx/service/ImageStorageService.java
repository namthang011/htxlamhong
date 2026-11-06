package com.example.htx.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.io.IOException;
import java.nio.file.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HexFormat;
import java.util.regex.Pattern;

@Service
public class ImageStorageService {
    private static final int MAX_BYTES = 5 * 1024 * 1024;
    private static final Pattern INLINE = Pattern.compile("data:image/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+", Pattern.CASE_INSENSITIVE);
    private final Path directory;

    public ImageStorageService(@Value("${app.upload.directory:./data/uploads}") String directory) throws IOException {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
        Files.createDirectories(this.directory);
    }

    public Path directory() { return directory; }

    public String store(byte[] bytes) {
        if (bytes.length == 0 || bytes.length > MAX_BYTES) throw badImage();
        String extension;
        if (bytes.length >= 8 && bytes[0] == (byte) 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G'
                && bytes[4] == 13 && bytes[5] == 10 && bytes[6] == 26 && bytes[7] == 10) extension = "png";
        else if (bytes.length >= 3 && bytes[0] == (byte) 0xff && bytes[1] == (byte) 0xd8 && bytes[2] == (byte) 0xff) extension = "jpg";
        else if (bytes.length >= 12 && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') extension = "webp";
        else throw badImage();
        try {
            String name = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)) + "." + extension;
            Path destination = directory.resolve(name);
            if (!Files.exists(destination)) {
                Path temporary = Files.createTempFile(directory, ".upload-", ".tmp");
                try {
                    Files.write(temporary, bytes);
                    try { Files.move(temporary, destination, StandardCopyOption.ATOMIC_MOVE); }
                    catch (AtomicMoveNotSupportedException e) { Files.move(temporary, destination, StandardCopyOption.REPLACE_EXISTING); }
                    catch (FileAlreadyExistsException e) { /* Another upload stored the same content hash. */ }
                } finally { Files.deleteIfExists(temporary); }
            }
            return "/uploads/" + name;
        } catch (IOException | NoSuchAlgorithmException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể lưu ảnh trên máy chủ.", e);
        }
    }

    // Supports older open editors and existing drafts containing Base64 images.
    public String externalize(String value) {
        if (value == null) return null;
        return INLINE.matcher(value).replaceAll(match -> {
            String encoded = match.group();
            String payload = encoded.substring(encoded.indexOf(',') + 1);
            if (payload.length() > (MAX_BYTES + 2L) / 3 * 4) throw badImage();
            try { return store(Base64.getDecoder().decode(payload)); }
            catch (IllegalArgumentException e) { throw badImage(); }
        });
    }

    private ResponseStatusException badImage() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh phải là JPG, PNG hoặc WebP và không quá 5 MB.");
    }
}
