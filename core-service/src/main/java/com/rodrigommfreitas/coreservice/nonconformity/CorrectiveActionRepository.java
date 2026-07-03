package com.rodrigommfreitas.coreservice.nonconformity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CorrectiveActionRepository extends JpaRepository<CorrectiveAction, Long> {
}