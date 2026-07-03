package com.rodrigommfreitas.coreservice.riskopportunity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RiskOpportunityRepository extends JpaRepository<RiskOpportunity, Long> {

}