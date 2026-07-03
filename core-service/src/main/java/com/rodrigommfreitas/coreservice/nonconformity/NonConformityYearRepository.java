package com.rodrigommfreitas.coreservice.nonconformity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NonConformityYearRepository extends JpaRepository<NonConformityYear, Long> {
    List<NonConformityYear> findAllByYearId(Long yearId);
    Optional<NonConformityYear> findByNonConformityIdAndYearId(Long nonConformityId, Long yearId);

    @Modifying(clearAutomatically = true)
    @Query("""
        UPDATE NonConformityYear ncy
        SET ncy.status = :status,
            ncy.evaluation = :evaluation,
            ncy.evaluationDescription = :evaluationDescription
        WHERE ncy.id = :id
        """)
    int updateYearFieldsById(
            @Param("id") Long id,
            @Param("status") NonConformityStatus status,
            @Param("evaluation") String evaluation,
            @Param("evaluationDescription") String evaluationDescription
    );
}