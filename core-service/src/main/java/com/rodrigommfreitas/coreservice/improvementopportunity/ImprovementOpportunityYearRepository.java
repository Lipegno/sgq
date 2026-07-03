package com.rodrigommfreitas.coreservice.improvementopportunity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ImprovementOpportunityYearRepository extends JpaRepository<ImprovementOpportunityYear, Long> {
    List<ImprovementOpportunityYear> findAllByYearId(Long yearId);
    Optional<ImprovementOpportunityYear> findByImprovementOpportunityIdAndYearId(Long improvementOpportunityId, Long yearId);

    @Modifying(clearAutomatically = true)
    @Query("""
        UPDATE ImprovementOpportunityYear ioy
        SET ioy.status = :status,
            ioy.evaluation = :evaluation,
            ioy.evaluationDescription = :evaluationDescription
        WHERE ioy.id = :id
        """)
    int updateYearFieldsById(
            @Param("id") Long id,
            @Param("status") ImprovementOpportunityStatus status,
            @Param("evaluation") String evaluation,
            @Param("evaluationDescription") String evaluationDescription
    );
}