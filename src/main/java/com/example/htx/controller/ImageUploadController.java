package com.example.htx.controller;

import com.example.htx.service.ImageStorageService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.Map;

@RestController
public class ImageUploadController {
    private final ImageStorageService storage;
    public ImageUploadController(ImageStorageService storage) { this.storage = storage; }

    @PostMapping("/api/admin/images")
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        return Map.of("url", storage.store(file.getBytes()));
    }
}
