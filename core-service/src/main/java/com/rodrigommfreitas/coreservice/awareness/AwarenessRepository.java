package com.rodrigommfreitas.coreservice.awareness;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AwarenessRepository extends JpaRepository<Awareness, Long> {
}