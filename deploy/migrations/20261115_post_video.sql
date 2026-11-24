-- Run against existing MySQL databases when Hibernate schema updates are disabled.
-- Safe to re-run; preserves all existing posts.
SET @video_column_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'posts' AND COLUMN_NAME = 'video_url');
SET @video_ddl = IF(@video_column_exists = 0,
    'ALTER TABLE posts ADD COLUMN video_url VARCHAR(2048) NULL', 'SELECT 1');
PREPARE video_migration FROM @video_ddl;
EXECUTE video_migration;
DEALLOCATE PREPARE video_migration;
