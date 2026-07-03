package com.rodrigommfreitas.coreservice.improvementopportunity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImprovementActionRepository extends JpaRepository<ImprovementAction, Long> {
}