package com.rodrigommfreitas.coreservice.interestedparty;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterestedPartyYearRepository extends JpaRepository<InterestedPartyYear, Long> {

    List<InterestedPartyYear> findByYearId(Long yearId);
    List<InterestedPartyYear> findByInterestedPartyId(Long interestedPartyId);
    long countByInterestedPartyId(Long interestedPartyId);
    boolean existsByInterestedPartyIdAndYearId(Long interestedPartyId, Long yearId);
    InterestedPartyYear findByInterestedPartyIdAndYearId(Long interestedPartyId, Long yearId);
}
