package com.rodrigommfreitas.coreservice.customersatisfaction;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerSatisfactionYearRepository extends JpaRepository<CustomerSatisfactionYear, Long> {
    boolean existsByCustomerSatisfactionIdAndYearId(Long customerSatisfactionId, Long yearId);
    List<CustomerSatisfactionYear> findAllByYearId(Long yearId);
    Optional<CustomerSatisfactionYear> findByCustomerSatisfactionIdAndYearId(Long customerSatisfactionId, Long yearId);
}
