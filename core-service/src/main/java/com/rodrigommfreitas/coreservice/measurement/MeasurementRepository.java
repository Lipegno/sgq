package com.rodrigommfreitas.coreservice.measurement;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface MeasurementRepository extends JpaRepository<Measurement, Long> {
  /*  List<Measurement> findByIndicatorId(Long indicatorId);
    List<Measurement> findByIndicatorName(String indicatorName);
   */
}
