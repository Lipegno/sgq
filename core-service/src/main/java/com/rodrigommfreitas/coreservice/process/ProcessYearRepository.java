package com.rodrigommfreitas.coreservice.process;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProcessYearRepository extends JpaRepository<ProcessYear, Long> {
    Optional<ProcessYear> findByProcessIdAndYearId(Long processId, Long yearId);
    List<ProcessYear> findByYearIdAndMacroProcessYearIsNull(Long yearId);
    boolean existsByProcessIdAndYearId(Long processId, Long aLong);
    List<ProcessYear> findByYearId(Long yearId);

    @Modifying
    @Query("UPDATE ProcessYear py SET py.macroProcessYear = NULL WHERE py.macroProcessYear.macroProcess.id = :macroProcessId")
    void nullifyMacroProcessYearByMacroProcessId(@Param("macroProcessId") Long macroProcessId);
}