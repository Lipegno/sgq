package com.rodrigommfreitas.coreservice.managementreview;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ManagementReviewRepository extends JpaRepository<ManagementReview, Long> {
}
