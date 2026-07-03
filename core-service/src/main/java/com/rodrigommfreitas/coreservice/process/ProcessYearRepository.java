package com.rodrigommfreitas.coreservice.process;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProcessYearRepository extends JpaRepository<ProcessYear, Long> {
    Optional<ProcessYear> findByProcessIdAndYearId(Long processId, Long yearId);
    List<ProcessYear> findByYearIdAndMacroProcessYearIsNull(Long yearId);
    boolean existsByProcessIdAndYearId(Long processId, Long aLong);
    List<ProcessYear> findByYearId(Long yearId);
}