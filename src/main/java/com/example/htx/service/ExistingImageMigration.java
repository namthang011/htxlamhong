package com.example.htx.service;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.LoggerFactory;

@Component
@ConditionalOnProperty(name = "app.upload.migrate-existing", havingValue = "true")
public class ExistingImageMigration implements ApplicationRunner {
    private final JdbcTemplate jdbc;
    private final ImageStorageService images;
    public ExistingImageMigration(JdbcTemplate jdbc, ImageStorageService images) { this.jdbc = jdbc; this.images = images; }

    @Override @Transactional
    public void run(ApplicationArguments arguments) {
        int changed = 0;
        // Identifiers are fixed application schema names, never request input.
        for (String[] pair : new String[][] {
                {"posts", "content"}, {"posts", "thumbnail_url"},
                {"services", "description"}, {"services", "image_url"},
                {"about_page", "content"}, {"testimonials", "image_url"}, {"gallery_images", "image_url"}}) {
            String table = pair[0], column = pair[1];
            var rows = jdbc.queryForList("SELECT id, " + column + " FROM " + table + " WHERE " + column + " LIKE '%data:image/%;base64,%' FOR UPDATE");
            for (var row : rows) {
                String old = (String) row.get(column);
                String updated = images.externalize(old);
                if (!old.equals(updated)) {
                    jdbc.update("UPDATE " + table + " SET " + column + "=? WHERE id=?", updated, row.get("id"));
                    changed++;
                }
            }
        }
        LoggerFactory.getLogger(getClass()).info("Moved images out of {} database fields into {}", changed, images.directory());
    }
}
