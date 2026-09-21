import os

base_dir = "d:/Study/HTX"
java_dir = os.path.join(base_dir, "src/main/java/com/example/htx")
resources_dir = os.path.join(base_dir, "src/main/resources")

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

pom_xml = """<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>3.2.4</version>
		<relativePath/> <!-- lookup parent from repository -->
	</parent>
	<groupId>com.example</groupId>
	<artifactId>htx</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<name>htx</name>
	<description>HTX Spring Boot REST API</description>
	<properties>
		<java.version>17</java.version>
	</properties>
	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-jpa</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-security</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
		<dependency>
			<groupId>com.mysql</groupId>
			<artifactId>mysql-connector-j</artifactId>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>org.projectlombok</groupId>
			<artifactId>lombok</artifactId>
			<optional>true</optional>
		</dependency>
	</dependencies>
	<build>
		<plugins>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
				<configuration>
					<excludes>
						<exclude>
							<groupId>org.projectlombok</groupId>
							<artifactId>lombok</artifactId>
						</exclude>
					</excludes>
				</configuration>
			</plugin>
		</plugins>
	</build>
</project>"""
create_file(os.path.join(base_dir, "pom.xml"), pom_xml)

app_props = """spring.application.name=htx
server.port=8080

# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/htx_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.open-in-view=false

# SQL Init Script
spring.sql.init.mode=always
spring.sql.init.data-locations=classpath:data.sql"""
create_file(os.path.join(resources_dir, "application.properties"), app_props)

data_sql = """-- Insert default admin user if not exists (password: admin123 hashed using BCrypt)
INSERT IGNORE INTO roles (id, name) VALUES (1, 'ROLE_ADMIN');
INSERT IGNORE INTO roles (id, name) VALUES (2, 'ROLE_USER');
-- password is 'admin123' mapped to bcrypt
INSERT IGNORE INTO users (id, username, password, enabled) VALUES (1, 'admin', '$2a$10$wY1tw.Z/.H3mB1Xl7P5w0.F1o5B9.B9w8B9w8B9w8B9w8B9w8B9w', 1);
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (1, 1);
"""
create_file(os.path.join(resources_dir, "data.sql"), data_sql)

app_java = """package com.example.htx;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class HtxApplication {
	public static void main(String[] args) {
		SpringApplication.run(HtxApplication.class, args);
	}
}"""
create_file(os.path.join(java_dir, "HtxApplication.java"), app_java)

# Entities
role_java = """package com.example.htx.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name = "roles")
@Data @NoArgsConstructor @AllArgsConstructor
public class Role {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String name;
}"""
create_file(os.path.join(java_dir, "entity/Role.java"), role_java)

user_java = """package com.example.htx.entity;
import jakarta.persistence.*;
import lombok.*;
import java.util.HashSet;
import java.util.Set;
@Entity @Table(name = "users")
@Data @NoArgsConstructor @AllArgsConstructor
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(unique = true, nullable = false)
    private String username;
    @Column(nullable = false)
    private String password;
    private boolean enabled = true;
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"), inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();
}"""
create_file(os.path.join(java_dir, "entity/User.java"), user_java)

category_java = """package com.example.htx.entity;
import jakarta.persistence.*;
import lombok.*;
@Entity @Table(name = "categories")
@Data @NoArgsConstructor @AllArgsConstructor
public class Category {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    private String description;
}"""
create_file(os.path.join(java_dir, "entity/Category.java"), category_java)

service_java = """package com.example.htx.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity @Table(name = "services")
@Data @NoArgsConstructor @AllArgsConstructor
public class ServiceEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    @Column(unique = true, nullable = false)
    private String slug;
    private String summary;
    @Column(columnDefinition = "TEXT")
    private String description;
    private BigDecimal price;
    private String imageUrl;
    private String status; // ACTIVE / INACTIVE
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;
    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}"""
create_file(os.path.join(java_dir, "entity/ServiceEntity.java"), service_java)

post_java = """package com.example.htx.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name = "posts")
@Data @NoArgsConstructor @AllArgsConstructor
public class Post {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String title;
    @Column(unique = true, nullable = false)
    private String slug;
    private String summary;
    @Column(columnDefinition = "TEXT")
    private String content;
    private String thumbnailUrl;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;
    @Column(updatable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}"""
create_file(os.path.join(java_dir, "entity/Post.java"), post_java)

# Repositories
for entity_name, entity_type in [("User", "Long"), ("Role", "Long"), ("Category", "Long"), ("ServiceEntity", "Long"), ("Post", "Long")]:
    repo_content = f"""package com.example.htx.repository;
import com.example.htx.entity.{entity_name};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface {entity_name}Repository extends JpaRepository<{entity_name}, {entity_type}> {{
}}"""
    create_file(os.path.join(java_dir, f"repository/{entity_name}Repository.java"), repo_content)

# Optional: Add findByUsername in UserRepository
user_repo_content = """package com.example.htx.repository;
import com.example.htx.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}"""
create_file(os.path.join(java_dir, "repository/UserRepository.java"), user_repo_content)

# Security Config
security_config = """package com.example.htx.config;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disabled for simplicity in REST APIs
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/public/**", "/**").permitAll()
                .anyRequest().authenticated()
            )
            .httpBasic(withDefaults()); // Use basic auth or JWT later
        return http.build();
    }
}"""
create_file(os.path.join(java_dir, "config/SecurityConfig.java"), security_config)

# Controllers
public_controller = """package com.example.htx.controller;
import com.example.htx.entity.Post;
import com.example.htx.entity.ServiceEntity;
import com.example.htx.repository.PostRepository;
import com.example.htx.repository.ServiceEntityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*") // Allow CORS for frontend integration
public class PublicApiController {
    
    @Autowired
    private ServiceEntityRepository serviceRepository;
    
    @Autowired
    private PostRepository postRepository;
    
    @GetMapping("/services")
    public Page<ServiceEntity> getServices(Pageable pageable) {
        return serviceRepository.findAll(pageable);
    }
    
    @GetMapping("/posts")
    public Page<Post> getPosts(Pageable pageable) {
        return postRepository.findAll(pageable);
    }
}"""
create_file(os.path.join(java_dir, "controller/PublicApiController.java"), public_controller)

admin_controller = """package com.example.htx.controller;
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
}"""
create_file(os.path.join(java_dir, "controller/AdminApiController.java"), admin_controller)

# Make CustomUserDetailsService for Security
user_details_service = """package com.example.htx.service;
import com.example.htx.entity.User;
import com.example.htx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.stream.Collectors;

@Service
public class CustomUserDetailsService implements UserDetailsService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
                
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                user.isEnabled(),
                true, true, true,
                user.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority(role.getName()))
                        .collect(Collectors.toList())
        );
    }
}"""
create_file(os.path.join(java_dir, "service/CustomUserDetailsService.java"), user_details_service)

print("Scaffolding complete!")
