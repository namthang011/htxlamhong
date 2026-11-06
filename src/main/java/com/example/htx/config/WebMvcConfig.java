package com.example.htx.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    private final com.example.htx.service.ImageStorageService images;
    public WebMvcConfig(com.example.htx.service.ImageStorageService images) { this.images = images; }

    @Override
    public void addResourceHandlers(org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(images.directory().toUri().toString())
                .setCachePeriod(31536000);
    }

    @Override
    public void addViewControllers(@NonNull ViewControllerRegistry registry) {
        registry.addViewController("/dich-vu").setViewName("forward:/dich-vu.html");
        registry.addViewController("/tin-tuc").setViewName("forward:/tin-tuc.html");
        registry.addViewController("/chi-tiet-dich-vu").setViewName("forward:/chi-tiet-dich-vu.html");
        registry.addViewController("/chi-tiet-tin-tuc").setViewName("forward:/chi-tiet-tin-tuc.html");
        registry.addViewController("/gioi-thieu").setViewName("forward:/gioi-thieu.html");
        registry.addViewController("/admin").setViewName("forward:/admin.html");
    }
}
