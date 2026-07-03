package com.rodrigommfreitas.coreservice.resources.human;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HumanResourceYearRepository extends JpaRepository<HumanResourceYear, Long> {
    List<HumanResourceYear> findByYearId(Long yearId);

    boolean existsByHumanResourceIdAndYearId(Long hrId, Long yearId);
    List<HumanResourceYear> findAllByYearId(Long yearId);
    Optional<HumanResourceYear> findByHumanResourceIdAndYearId(Long hrId, Long yearId);
}