package com.rodrigommfreitas.coreservice.macroprocess;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;


public interface MacroProcessYearRepository extends JpaRepository<MacroProcessYear, Long> {
    List<MacroProcessYear> findByMacroProcessIdAndYearIdIn(Long macroProcessId, List<Long> yearIds);
    Long countByMacroProcessId(Long macroProcessId);

    List<MacroProcessYear> findByYearId(Long yearId);
    boolean existsByMacroProcessIdAndYearId(Long macroProcessId, Long yearId);
    MacroProcessYear findByMacroProcessIdAndYearId(Long macroProcessId, long yearId);

    @Modifying
    @Query("DELETE FROM MacroProcessYear mpy WHERE mpy.macroProcess.id = :macroProcessId")
    void deleteByMacroProcessId(@Param("macroProcessId") Long macroProcessId);
}