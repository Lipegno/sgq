package com.rodrigommfreitas.coreservice.indicator;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IndicatorRepository extends JpaRepository<Indicator, Long> {

    Optional<Indicator> findByName(String name);

    boolean existsByName(String name);

}
