package com.rodrigommfreitas.coreservice.interestedparty;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

public interface InterestedPartyRepository extends JpaRepository<InterestedParty, Long> {

}
