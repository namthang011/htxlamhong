package com.example.htx.repository;
import com.example.htx.entity.ServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
@Repository
public interface ServiceEntityRepository extends JpaRepository<ServiceEntity, Long> {
}
