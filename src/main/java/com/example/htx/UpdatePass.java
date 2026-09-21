
package com.example.htx;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.example.htx.repository.UserRepository;
import com.example.htx.entity.User;
import org.springframework.beans.factory.annotation.Autowired;

@Component
public class UpdatePass implements CommandLineRunner {
    @Autowired UserRepository repo;
    @Autowired PasswordEncoder encoder;
    @Override
    public void run(String... args) {
        User u = repo.findById(1L).orElse(null);
        if(u != null) {
            u.setPassword(encoder.encode("admin123"));
            repo.save(u);
            System.out.println("PASSWORD UPDATED SUCCESSFULLY!");
        }
    }
}

