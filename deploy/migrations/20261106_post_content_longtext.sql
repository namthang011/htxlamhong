-- Existing databases can retain TEXT even with Hibernate ddl-auto=update and
-- Post.content mapped as LONGTEXT. Inline image data exceeds TEXT's 64 KiB limit.
-- Run against the application database. Existing content and nullability remain.
ALTER TABLE posts MODIFY COLUMN content LONGTEXT NULL;
