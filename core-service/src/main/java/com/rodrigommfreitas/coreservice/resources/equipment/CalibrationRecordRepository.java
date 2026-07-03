package com.rodrigommfreitas.coreservice.resources.equipment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CalibrationRecordRepository extends JpaRepository<CalibrationRecord, Long> {
    List<CalibrationRecord> findAllByEquipmentId(Long equipmentId);
}