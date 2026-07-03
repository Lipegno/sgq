package com.rodrigommfreitas.coreservice.leadershipcommitment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeadershipCommitmentYearRepository extends JpaRepository<LeadershipCommitmentYear, Long> {
    boolean existsByLeadershipCommitmentIdAndYearId(Long leadershipCommitmentId, Long yearId);
    List<LeadershipCommitmentYear> findAllByYearId(Long yearId);
    Optional<LeadershipCommitmentYear> findByLeadershipCommitmentIdAndYearId(Long leadershipCommitmentId, Long yearId);
}