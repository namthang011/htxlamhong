package com.example.htx.config;

import com.example.htx.entity.Post;
import com.example.htx.entity.ServiceEntity;
import com.example.htx.repository.PostRepository;
import com.example.htx.repository.ServiceEntityRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class AssetUrlMigration implements CommandLineRunner {
    private static final Map<String, String> LEGACY_URLS = Map.ofEntries(
            Map.entry("static/bien-trang-sang-bien-vang.png", "assets/images/bien-trang-sang-bien-vang.webp"),
            Map.entry("static/phu-hieu-xe.png", "assets/images/phu-hieu-xe.webp"),
            Map.entry("static/grab-brand.jpg", "assets/images/grab-brand.jpg"),
            Map.entry("static/dinh-vi-oto.jpg", "assets/images/dinh-vi-oto.jpg"),
            Map.entry("static/camera-dinh-vi.png", "assets/images/camera-dinh-vi.webp"),
            Map.entry("static/bao-hiem-xe.png", "assets/images/bao-hiem-xe.webp"),
            Map.entry("static/tintuc1.webp", "assets/images/tintuc1.webp"),
            Map.entry("static/thu tuc bien trang sang bien vang.png", "assets/images/bien-trang-sang-bien-vang1.webp"),
            Map.entry("static/tin tức lắp camera theo nghị định.jpg", "assets/images/camera-nghi-dinh.jpg")
    );

    private final ServiceEntityRepository serviceRepository;
    private final PostRepository postRepository;

    public AssetUrlMigration(
            ServiceEntityRepository serviceRepository,
            PostRepository postRepository) {
        this.serviceRepository = serviceRepository;
        this.postRepository = postRepository;
    }

    @Override
    public void run(String... args) {
        var services = serviceRepository.findAll();
        boolean servicesChanged = false;
        for (ServiceEntity service : services) {
            servicesChanged |= migrateServiceUrl(service);
        }
        if (servicesChanged) {
            serviceRepository.saveAll(services);
        }

        var posts = postRepository.findAll();
        boolean postsChanged = false;
        for (Post post : posts) {
            postsChanged |= migratePostUrl(post);
        }
        if (postsChanged) {
            postRepository.saveAll(posts);
        }
    }

    private boolean migrateServiceUrl(ServiceEntity service) {
        String migrated = LEGACY_URLS.get(service.getImageUrl());
        if (migrated == null) {
            return false;
        }
        service.setImageUrl(migrated);
        return true;
    }

    private boolean migratePostUrl(Post post) {
        String migrated = LEGACY_URLS.get(post.getThumbnailUrl());
        if (migrated == null) {
            return false;
        }
        post.setThumbnailUrl(migrated);
        return true;
    }
}
