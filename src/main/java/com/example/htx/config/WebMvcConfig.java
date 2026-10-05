package com.example.htx.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/dich-vu").setViewName("forward:/dich-vu.html");
        registry.addViewController("/tin-tuc").setViewName("forward:/tin-tuc.html");
        registry.addViewController("/chi-tiet-dich-vu").setViewName("forward:/chi-tiet-dich-vu.html");
        registry.addViewController("/chi-tiet-tin-tuc").setViewName("forward:/chi-tiet-tin-tuc.html");
        registry.addViewController("/admin").setViewName("forward:/admin.html");
    }
}
