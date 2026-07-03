package com.rodrigommfreitas.coreservice.riskopportunity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiskOpportunityYearRepository extends JpaRepository<RiskOpportunityYear, Long> {

    List<RiskOpportunityYear> findByYearId(Long yearId);

    boolean existsByRiskOpportunityIdAndYearId(Long id, Long yearId);

    long countByRiskOpportunityId(Long id);

    Optional<RiskOpportunityYear> findByRiskOpportunityIdAndYearId(Long id, Long yearId);

    Optional<RiskOpportunityYear> findById(Long id);

    List<RiskOpportunityYear> findByRiskOpportunityId(Long id);
}