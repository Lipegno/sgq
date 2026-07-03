package com.rodrigommfreitas.coreservice.resources.equipment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EquipmentYearRepository extends JpaRepository<EquipmentYear, Long> {

    boolean existsByEquipmentIdAndYearId(Long equipmentId, Long yearId);
    List<EquipmentYear> findAllByYearId(Long yearId);
    Optional<EquipmentYear> findByEquipmentIdAndYearId(Long equipmentId, Long yearId);
}