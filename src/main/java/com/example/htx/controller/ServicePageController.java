package com.example.htx.controller;

import com.example.htx.repository.ServiceEntityRepository;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.HtmlUtils;

@RestController
public class ServicePageController {
    private final ServiceEntityRepository services;

    public ServicePageController(ServiceEntityRepository services) { this.services = services; }

    @GetMapping(value = {"/chi-tiet-dich-vu", "/chi-tiet-dich-vu.html"}, produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> detail(@RequestParam(required = false) Long id) throws IOException {
        String html = new ClassPathResource("static/chi-tiet-dich-vu.html")
                .getContentAsString(StandardCharsets.UTF_8);
        if (id == null) return ResponseEntity.ok(html);
        var found = services.findById(id);
        if (found.isEmpty() || "INACTIVE".equals(found.get().getStatus())) {
            return ResponseEntity.status(404).body(html);
        }
        var service = found.get();
        String title = HtmlUtils.htmlEscape(service.getName(), "UTF-8");
        String summary = service.getSummary();
        if (summary == null || summary.isBlank()) summary = service.getDescription();
        String description = summary == null ? "" : summary.replaceAll("<[^>]*>", " ")
                .replaceAll("\\s+", " ").trim();
        description = HtmlUtils.htmlEscape(HtmlUtils.htmlUnescape(description), "UTF-8");
        html = html.replaceFirst("(?s)<title>.*?</title>", Matcher.quoteReplacement("<title>" + title + "</title>"));
        html = html.replaceFirst("<meta name=\"description\"[^>]*>", Matcher.quoteReplacement(
                "<meta name=\"description\" content=\"" + description + "\">"));
        String image = service.getImageUrl();
        if (image == null || image.isBlank()) image = "/assets/images/logo.webp";
        if (image.startsWith("/")) image = "https://htxlamhong.vn" + image;
        if (!image.matches("(?i)^https?://.*")) image = "https://htxlamhong.vn/assets/images/logo.webp";
        String url = "https://htxlamhong.vn/chi-tiet-dich-vu?id=" + id;
        String metadata = "<link rel=\"canonical\" href=\"" + url + "\">\n"
                + "<meta property=\"og:type\" content=\"website\">\n"
                + "<meta property=\"og:title\" content=\"" + title + "\">\n"
                + "<meta property=\"og:description\" content=\"" + description + "\">\n"
                + "<meta property=\"og:url\" content=\"" + url + "\">\n"
                + "<meta property=\"og:image\" content=\"" + HtmlUtils.htmlEscape(image, "UTF-8") + "\">\n"
                + "<meta name=\"twitter:card\" content=\"summary_large_image\">\n"
                + "<meta name=\"twitter:title\" content=\"" + title + "\">\n";
        return ResponseEntity.ok(html.replace("</head>", metadata + "</head>"));
    }
}
