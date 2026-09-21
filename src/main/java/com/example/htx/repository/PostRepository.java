package com.example.htx.repository;
import com.example.htx.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
}
