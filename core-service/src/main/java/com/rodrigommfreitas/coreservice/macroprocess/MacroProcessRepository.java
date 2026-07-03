package com.rodrigommfreitas.coreservice.macroprocess;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MacroProcessRepository extends JpaRepository<MacroProcess, Long> {

    Optional<MacroProcess> findByName(String name);
    boolean existsByName(String name);

}