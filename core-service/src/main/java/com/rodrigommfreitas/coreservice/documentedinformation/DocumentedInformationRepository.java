package com.rodrigommfreitas.coreservice.documentedinformation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentedInformationRepository extends JpaRepository<DocumentedInformation, Long> {
}
