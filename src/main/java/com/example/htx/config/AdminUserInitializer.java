package com.example.htx.config;

import com.example.htx.entity.Role;
import com.example.htx.entity.User;
import com.example.htx.repository.RoleRepository;
import com.example.htx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@ConditionalOnProperty(name = "app.admin.initial-password", matchIfMissing = false)
public class AdminUserInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String initialPassword;

    public AdminUserInitializer(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.admin.username}") String username,
            @Value("${app.admin.initial-password}") String initialPassword) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.initialPassword = initialPassword;
    }

    @Override
    public void run(String... args) {
        if (initialPassword.isBlank() || userRepository.findByUsername(username).isPresent()) {
            return;
        }

        Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElseGet(() -> {
            Role role = new Role();
            role.setName("ROLE_ADMIN");
            return roleRepository.save(role);
        });

        User admin = new User();
        admin.setUsername(username);
        admin.setPassword(passwordEncoder.encode(initialPassword));
        admin.setEnabled(true);
        admin.setRoles(Set.of(adminRole));
        userRepository.save(admin);
    }
}
