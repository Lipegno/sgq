package com.rodrigommfreitas.coreservice.qualityobjective;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QualityObjectiveRepository extends JpaRepository<QualityObjective, Long> {
    List<QualityObjective> findAll();
}