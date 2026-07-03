package com.rodrigommfreitas.coreservice.responsibilityauthority;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ResponsibilityAuthorityRepository extends JpaRepository<ResponsibilityAuthority, Long> {

}