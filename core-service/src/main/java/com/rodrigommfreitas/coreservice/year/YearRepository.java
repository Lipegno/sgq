package com.rodrigommfreitas.coreservice.year;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface YearRepository extends JpaRepository<Year, Long> {
    boolean existsByYear(Integer year);
    Optional<Year> findByYear(Integer year);

}