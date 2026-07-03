package com.rodrigommfreitas.coreservice.communication;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommunicationItemRepository extends JpaRepository<CommunicationItem, Long> {
}
