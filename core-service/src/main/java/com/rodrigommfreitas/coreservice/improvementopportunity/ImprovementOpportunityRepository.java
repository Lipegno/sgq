package com.rodrigommfreitas.coreservice.improvementopportunity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImprovementOpportunityRepository extends JpaRepository<ImprovementOpportunity, Long> {
}