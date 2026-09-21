import os

base_dir = "d:/Study/HTX"
java_dir = os.path.join(base_dir, "src/main/java/com/example/htx")

# 1. Write JwtUtil.java
jwt_util = """package com.example.htx.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {
    // Secret key for HS256 (256-bit at least)
    private static final Key SECRET_KEY = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 10; // 10 hours

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(SECRET_KEY).build().parseClaimsJws(token).getBody();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, userDetails.getUsername());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(SECRET_KEY)
                .compact();
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}
"""
with open(os.path.join(java_dir, "config/JwtUtil.java"), "w", encoding="utf-8") as f: f.write(jwt_util)

# 2. Write JwtAuthenticationFilter.java
jwt_filter = """package com.example.htx.config;

import com.example.htx.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        final String authorizationHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                // Token invalid
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            if (jwtUtil.validateToken(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                usernamePasswordAuthenticationToken
                        .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
            }
        }
        filterChain.doFilter(request, response);
    }
}
"""
with open(os.path.join(java_dir, "config/JwtAuthenticationFilter.java"), "w", encoding="utf-8") as f: f.write(jwt_filter)

# 3. Write AuthRequest / AuthResponse DTOs
os.makedirs(os.path.join(java_dir, "dto"), exist_ok=True)
with open(os.path.join(java_dir, "dto/AuthRequest.java"), "w", encoding="utf-8") as f:
    f.write("package com.example.htx.dto;\\npublic class AuthRequest { public String username; public String password; }")
with open(os.path.join(java_dir, "dto/AuthResponse.java"), "w", encoding="utf-8") as f:
    f.write("package com.example.htx.dto;\\npublic class AuthResponse { public String token; public AuthResponse(String t) {this.token = t;} }")

# 4. Modify SecurityConfig.java
sec_config = """package com.example.htx.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Autowired
    private JwtAuthenticationFilter jwtRequestFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/public/**", "/**").permitAll()
                .anyRequest().authenticated()
            );
            // httpBasic is completely disabled to avoid browser popup
        
        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
"""
with open(os.path.join(java_dir, "config/SecurityConfig.java"), "w", encoding="utf-8") as f: f.write(sec_config)

# 5. Add Login Endpoint in PublicApiController
public_ctrl = """package com.example.htx.controller;
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
"""
with open(os.path.join(java_dir, "controller/PublicApiController.java"), "w", encoding="utf-8") as f: f.write(public_ctrl)

# 6. Update admin.html to use JWT
admin_html_path = os.path.join(base_dir, "src/main/resources/static/admin.html")
with open(admin_html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Replace JS logic
import re
new_js = """
        let jwtToken = '';

        // Hàm tạo slug tự động
        function generateSlug(text, targetId) {
            let slug = text.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
            slug = slug.replace(/\\đ/g, 'd').replace(/[^a-z0-9 ]/g, '').trim().replace(/\\s+/g, '-');
            document.getElementById(targetId).value = slug;
        }

        function login() {
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            
            fetch('/api/public/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({username: user, password: pass})
            })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("Lỗi login");
            })
            .then(data => {
                jwtToken = 'Bearer ' + data.token;
                localStorage.setItem('htx_jwt', jwtToken);
                document.getElementById('loginScreen').classList.add('hidden');
                document.getElementById('dashboardScreen').classList.remove('hidden');
                loadServices();
            })
            .catch(err => {
                document.getElementById('loginError').classList.remove('hidden');
            });
        }

        function logout() {
            localStorage.removeItem('htx_jwt');
            location.reload();
        }

        window.onload = function() {
            const token = localStorage.getItem('htx_jwt');
            if (token) {
                jwtToken = token;
                document.getElementById('loginScreen').classList.add('hidden');
                document.getElementById('dashboardScreen').classList.remove('hidden');
                loadServices();
                loadPosts();
            }
        }

        // Dùng jwtToken thay cho basicAuthHeader trong các request
        function authHeaders() {
            return { 'Authorization': jwtToken, 'Content-Type': 'application/json' };
        }
"""
# We will do a simple string replace for the script portion, to keep it simple.
# The original JS had `basicAuthHeader = 'Basic ' + btoa(user + ':' + pass);`
html = html.replace("basicAuthHeader = 'Basic ' + btoa(user + ':' + pass);", "/* Replaced by JWT */")
html = html.replace("'Authorization': basicAuthHeader", "'Authorization': jwtToken")

# Write custom JS file or replace
with open(admin_html_path, "w", encoding="utf-8") as f: f.write(html)

print("JWT Setup Complete!")
