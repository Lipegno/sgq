package com.rodrigommfreitas.coreservice.communication;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunicationItemYearRepository extends JpaRepository<CommunicationItemYear, Long> {
    List<CommunicationItemYear> findAllByYearId(Long yearId);
    List<CommunicationItemYear> findAllByCommunicationItemId(Long itemId);
    boolean existsByCommunicationItemIdAndYearId(Long itemId, Long yearId);
    void deleteByCommunicationItemIdAndYearId(Long itemId, Long yearId);
}
