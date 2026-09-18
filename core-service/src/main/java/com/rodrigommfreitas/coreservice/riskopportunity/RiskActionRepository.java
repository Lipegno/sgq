package com.rodrigommfreitas.coreservice.riskopportunity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RiskActionRepository extends JpaRepository<RiskAction, Long> {
}
