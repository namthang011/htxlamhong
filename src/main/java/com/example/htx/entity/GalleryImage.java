package com.example.htx.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "gallery_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GalleryImage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String imageUrl;
    private Integer sortOrder = 0;
    private boolean active = true;
}
