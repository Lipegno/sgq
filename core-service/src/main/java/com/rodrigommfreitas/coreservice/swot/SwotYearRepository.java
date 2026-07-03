package com.rodrigommfreitas.coreservice.swot;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SwotYearRepository extends JpaRepository<SwotYear, Long> {
    Optional<SwotYear> findByYearId(Long yearId);
}