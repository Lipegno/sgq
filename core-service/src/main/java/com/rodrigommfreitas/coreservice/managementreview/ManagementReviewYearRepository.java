package com.rodrigommfreitas.coreservice.managementreview;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ManagementReviewYearRepository extends JpaRepository<ManagementReviewYear, Long> {
    boolean existsByManagementReviewIdAndYearId(Long managementReviewId, Long yearId);
    List<ManagementReviewYear> findAllByYearId(Long yearId);
    Optional<ManagementReviewYear> findByManagementReviewIdAndYearId(Long managementReviewId, Long yearId);
}
