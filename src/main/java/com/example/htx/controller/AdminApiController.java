package com.example.htx.controller;
import com.example.htx.entity.Post;
import com.example.htx.entity.ServiceEntity;
import com.example.htx.repository.PostRepository;
import com.example.htx.repository.ServiceEntityRepository;
import com.example.htx.entity.Testimonial;
import com.example.htx.entity.GalleryImage;
import com.example.htx.repository.TestimonialRepository;
import com.example.htx.repository.GalleryImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@SuppressWarnings("null")
public class AdminApiController {
    
    @Autowired
    private ServiceEntityRepository serviceRepository;
    
    @Autowired
    private PostRepository postRepository;
    @Autowired private TestimonialRepository testimonialRepository;
    @Autowired private GalleryImageRepository galleryImageRepository;
    
    // CRUD for Services
    @PostMapping("/services")
    public ServiceEntity createService(@RequestBody ServiceEntity service) {
        return serviceRepository.save(service);
    }
    
    @PutMapping("/services/{id}")
    public ResponseEntity<ServiceEntity> updateService(@PathVariable Long id, @RequestBody ServiceEntity serviceDetails) {
        return serviceRepository.findById(id).map(service -> {
            service.setName(serviceDetails.getName());
            service.setSlug(serviceDetails.getSlug());
            service.setSummary(serviceDetails.getSummary());
            if (serviceDetails.getDescription() != null) {
                service.setDescription(serviceDetails.getDescription());
            }
            service.setPrice(serviceDetails.getPrice());
            service.setImageUrl(serviceDetails.getImageUrl());
            service.setStatus(serviceDetails.getStatus());
            if (serviceDetails.getCategory() != null) {
                service.setCategory(serviceDetails.getCategory());
            }
            return ResponseEntity.ok(serviceRepository.save(service));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/services/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        if(serviceRepository.existsById(id)) {
            serviceRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    // CRUD for Posts
    @PostMapping("/posts")
    public Post createPost(@RequestBody Post post) {
        return postRepository.save(post);
    }
    
    @PutMapping("/posts/{id}")
    public ResponseEntity<Post> updatePost(@PathVariable Long id, @RequestBody Post postDetails) {
        return postRepository.findById(id).map(post -> {
            post.setTitle(postDetails.getTitle());
            post.setSlug(postDetails.getSlug());
            post.setSummary(postDetails.getSummary());
            post.setContent(postDetails.getContent());
            post.setThumbnailUrl(postDetails.getThumbnailUrl());
            return ResponseEntity.ok(postRepository.save(post));
        }).orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/posts/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        if(postRepository.existsById(id)) {
            postRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/testimonials")
    public Object getTestimonials() { return testimonialRepository.findAllByOrderBySortOrderAscIdAsc(); }

    @PostMapping("/testimonials")
    public Testimonial createTestimonial(@RequestBody Testimonial item) { return testimonialRepository.save(item); }

    @PutMapping("/testimonials/{id}")
    public ResponseEntity<Testimonial> updateTestimonial(@PathVariable Long id, @RequestBody Testimonial details) {
        return testimonialRepository.findById(id).map(item -> {
            item.setMemberName(details.getMemberName()); item.setMemberTitle(details.getMemberTitle());
            item.setContent(details.getContent()); item.setImageUrl(details.getImageUrl());
            item.setRating(details.getRating()); item.setSortOrder(details.getSortOrder()); item.setActive(details.isActive());
            return ResponseEntity.ok(testimonialRepository.save(item));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/testimonials/{id}")
    public ResponseEntity<Void> deleteTestimonial(@PathVariable Long id) {
        if (!testimonialRepository.existsById(id)) return ResponseEntity.notFound().build();
        testimonialRepository.deleteById(id); return ResponseEntity.ok().build();
    }

    @GetMapping("/gallery")
    public Object getGallery() { return galleryImageRepository.findAllByOrderBySortOrderAscIdAsc(); }

    @PostMapping("/gallery")
    public GalleryImage createGalleryImage(@RequestBody GalleryImage item) { return galleryImageRepository.save(item); }

    @PutMapping("/gallery/{id}")
    public ResponseEntity<GalleryImage> updateGalleryImage(@PathVariable Long id, @RequestBody GalleryImage details) {
        return galleryImageRepository.findById(id).map(item -> {
            item.setTitle(details.getTitle()); item.setImageUrl(details.getImageUrl());
            item.setSortOrder(details.getSortOrder()); item.setActive(details.isActive());
            return ResponseEntity.ok(galleryImageRepository.save(item));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/gallery/{id}")
    public ResponseEntity<Void> deleteGalleryImage(@PathVariable Long id) {
        if (!galleryImageRepository.existsById(id)) return ResponseEntity.notFound().build();
        galleryImageRepository.deleteById(id); return ResponseEntity.ok().build();
    }
}
