package com.example.htx.repository;

import com.example.htx.entity.GalleryImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GalleryImageRepository extends JpaRepository<GalleryImage, Long> {
    List<GalleryImage> findByActiveTrueOrderBySortOrderAscIdAsc();
    List<GalleryImage> findAllByOrderBySortOrderAscIdAsc();
}
