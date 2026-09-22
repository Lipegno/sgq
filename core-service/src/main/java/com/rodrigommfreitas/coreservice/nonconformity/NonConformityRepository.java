package com.rodrigommfreitas.coreservice.nonconformity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NonConformityRepository extends JpaRepository<NonConformity, Long> {
    List<NonConformity> findByAuditId(Long auditId);
}