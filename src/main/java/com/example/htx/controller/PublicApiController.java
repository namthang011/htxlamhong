package com.example.htx.controller;
import com.example.htx.dto.AuthRequest;
import com.example.htx.dto.AuthResponse;
import com.example.htx.config.JwtUtil;
import com.example.htx.entity.Post;
import com.example.htx.entity.ServiceEntity;
import com.example.htx.repository.PostRepository;
import com.example.htx.repository.ServiceEntityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class PublicApiController {
    
    @Autowired private ServiceEntityRepository serviceRepository;
    @Autowired private PostRepository postRepository;
    
    @Autowired private AuthenticationManager authenticationManager;
    @Autowired private JwtUtil jwtTokenUtil;
    @Autowired private UserDetailsService userDetailsService;
    
    @GetMapping("/services")
    public Page<ServiceEntity> getServices(Pageable pageable) { return serviceRepository.findAll(pageable); }
    
    @GetMapping("/posts")
    public Page<Post> getPosts(Pageable pageable) { return postRepository.findAll(pageable); }
    
    @PostMapping("/login")
    public ResponseEntity<?> createAuthenticationToken(@RequestBody AuthRequest authRequest) throws Exception {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.username, authRequest.password)
            );
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Tài khoản hoặc mật khẩu không đúng!");
        }
        final UserDetails userDetails = userDetailsService.loadUserByUsername(authRequest.username);
        final String jwt = jwtTokenUtil.generateToken(userDetails);
        return ResponseEntity.ok(new AuthResponse(jwt));
    }
}
