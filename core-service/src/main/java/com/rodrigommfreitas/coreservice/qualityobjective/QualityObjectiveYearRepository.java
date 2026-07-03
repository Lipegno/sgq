package com.rodrigommfreitas.coreservice.qualityobjective;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QualityObjectiveYearRepository extends JpaRepository<QualityObjectiveYear, Long> {
    boolean existsByQualityObjectiveIdAndYearId(Long qualityObjectiveId, Long yearId);
    List<QualityObjectiveYear> findAllByYearId(Long yearId);
    Optional<QualityObjectiveYear> findByQualityObjectiveIdAndYearId(Long qualityObjectiveId, Long yearId);
}