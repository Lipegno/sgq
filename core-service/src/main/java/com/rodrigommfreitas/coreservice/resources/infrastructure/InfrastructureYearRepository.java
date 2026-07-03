package com.rodrigommfreitas.coreservice.resources.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InfrastructureYearRepository extends JpaRepository<InfrastructureYear, Long> {

    boolean existsByInfrastructureIdAndYearId(Long infraId, Long yearId);
    List<InfrastructureYear> findAllByYearId(Long yearId);
    Optional<InfrastructureYear> findByInfrastructureIdAndYearId(Long infraId, Long yearId);
}