package com.rodrigommfreitas.coreservice.awareness;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AwarenessYearRepository extends JpaRepository<AwarenessYear, Long> {
    boolean existsByAwarenessIdAndYearId(Long awarenessId, Long yearId);
    List<AwarenessYear> findAllByYearId(Long yearId);
    Optional<AwarenessYear> findByAwarenessIdAndYearId(Long awarenessId, Long yearId);
}