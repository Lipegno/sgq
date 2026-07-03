package com.rodrigommfreitas.coreservice.change;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ChangeRepository extends JpaRepository<Change, Long> {
    List<Change> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
