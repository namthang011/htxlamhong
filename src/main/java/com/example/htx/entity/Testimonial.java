package com.example.htx.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "testimonials")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Testimonial {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String memberName;
    private String memberTitle;
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;
    private Integer rating = 5;
    private Integer sortOrder = 0;
    private boolean active = true;
}
