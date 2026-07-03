package com.rodrigommfreitas.coreservice.resources.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InfrastructureRepository extends JpaRepository<Infrastructure, Long> {}