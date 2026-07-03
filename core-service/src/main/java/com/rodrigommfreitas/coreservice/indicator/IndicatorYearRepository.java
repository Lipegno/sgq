package com.rodrigommfreitas.coreservice.indicator;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IndicatorYearRepository extends JpaRepository<IndicatorYear, Long> {
    List<IndicatorYear> findByProcessesId(Long processYearId);
    List<IndicatorYear> findByYearId(Long yearId);

    Optional<IndicatorYear> findByIndicatorIdAndYearId(Long id, Long yearId);

    List<IndicatorYear> findByIndicatorId(Long indicatorId);
}
