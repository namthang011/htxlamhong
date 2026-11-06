package com.example.htx.controller;
import com.example.htx.entity.AboutPage;
import com.example.htx.repository.AboutPageRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
@RestController
public class AboutPageController {
 private final AboutPageRepository repository;
 private final com.example.htx.service.ImageStorageService images;
 public AboutPageController(AboutPageRepository repository, com.example.htx.service.ImageStorageService images) { this.repository = repository; this.images = images; }
 @GetMapping("/api/public/about") public AboutPage read() { return repository.findById(1L).orElseGet(AboutPage::new); }
 @PutMapping("/api/admin/about") public ResponseEntity<AboutPage> update(@RequestBody AboutPage page) {
  if (page.getTitle() == null || page.getTitle().isBlank() || page.getTitle().length() > 180 || page.getContent() == null || page.getContent().isBlank()) return ResponseEntity.badRequest().build();
  page.setContent(images.externalize(page.getContent()));
  page.setId(1L); return ResponseEntity.ok(repository.save(page));
 }
}
