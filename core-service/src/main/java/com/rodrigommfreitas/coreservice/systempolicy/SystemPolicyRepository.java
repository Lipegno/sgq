package com.rodrigommfreitas.coreservice.systempolicy;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SystemPolicyRepository extends JpaRepository<SystemPolicy, Long> {

}
