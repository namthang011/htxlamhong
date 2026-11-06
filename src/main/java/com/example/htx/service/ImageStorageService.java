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
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class ImageStorageService {
    private static final int MAX_BYTES = 5 * 1024 * 1024;
    private static final Pattern INLINE = Pattern.compile("data:image/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+", Pattern.CASE_INSENSITIVE);
    private final Path directory;
    private final String provider;
    private final URI endpoint;
    private final String token;
    private final String publicBase;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).followRedirects(HttpClient.Redirect.NEVER).build();

    public ImageStorageService(String directory) throws IOException { this(directory, "local", "", "", ""); }

    @Autowired
    public ImageStorageService(@Value("${app.upload.directory:./data/uploads}") String directory,
            @Value("${app.upload.provider:local}") String provider,
            @Value("${app.upload.cpanel.endpoint:}") String endpoint,
            @Value("${app.upload.cpanel.token:}") String token,
            @Value("${app.upload.cpanel.public-base:}") String publicBase) throws IOException {
        this.directory = Path.of(directory).toAbsolutePath().normalize();
        this.provider = provider;
        if (!provider.equals("local") && !provider.equals("cpanel")) throw new IllegalArgumentException("UPLOAD_PROVIDER must be local or cpanel");
        this.endpoint = endpoint.isBlank() ? null : URI.create(endpoint);
        this.token = token;
        this.publicBase = publicBase.replaceAll("/+$", "");
        if (provider.equals("cpanel") && (this.endpoint == null || !secure(this.endpoint) || !secure(URI.create(this.publicBase)) || !token.matches("[a-fA-F0-9]{64}"))) {
            throw new IllegalArgumentException("Configure HTTPS CPANEL_UPLOAD_URL, CPANEL_PUBLIC_BASE_URL and a 64-character hex CPANEL_UPLOAD_TOKEN");
        }
        Files.createDirectories(this.directory);
    }

    private boolean secure(URI uri) { return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null && uri.getQuery() == null && uri.getFragment() == null; }

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
            if (provider.equals("cpanel")) return sendToCpanel(bytes, name);
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

    private String sendToCpanel(byte[] bytes, String expectedName) {
        try {
            var request = HttpRequest.newBuilder(endpoint).timeout(Duration.ofSeconds(45))
                    .header("X-Upload-Token", token).header("Content-Type", "application/octet-stream")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(bytes)).build();
            var response = http.send(request, HttpResponse.BodyHandlers.ofString());
            // The receiver returns only the content hash filename. Never trust a remote URL.
            if (response.statusCode() != 200 || !response.body().trim().equals(expectedName)) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "cPanel chưa nhận được ảnh. Kiểm tra cấu hình tải ảnh trên hosting.");
            }
            return publicBase + "/" + expectedName;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Tải ảnh lên cPanel bị gián đoạn.", e);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Không kết nối được nơi lưu ảnh trên cPanel.", e);
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
