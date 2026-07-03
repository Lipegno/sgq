package com.rodrigommfreitas.coreservice.process;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProcessRepository extends JpaRepository<Process, Long> {
    Optional<Process> findByName(String name);
    boolean existsByName(String name);
}