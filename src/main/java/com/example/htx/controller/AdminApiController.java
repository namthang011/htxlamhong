package com.example.htx.controller;
import com.example.htx.entity.Post;
import com.example.htx.entity.ServiceEntity;
import com.example.htx.repository.PostRepository;
import com.example.htx.repository.ServiceEntityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class AdminApiController {
    
    @Autowired
    private ServiceEntityRepository serviceRepository;
    
    @Autowired
    private PostRepository postRepository;
    
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
            service.setDescription(serviceDetails.getDescription());
            service.setPrice(serviceDetails.getPrice());
            service.setImageUrl(serviceDetails.getImageUrl());
            service.setStatus(serviceDetails.getStatus());
            service.setCategory(serviceDetails.getCategory());
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
}
