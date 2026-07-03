package com.rodrigommfreitas.coreservice.leadershipcommitment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LeadershipCommitmentRepository extends JpaRepository<LeadershipCommitment, Long> {
}