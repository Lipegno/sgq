package com.rodrigommfreitas.coreservice.config.seed.leadershipcommitment;

import com.rodrigommfreitas.coreservice.leadershipcommitment.LeadershipCommitment;
import com.rodrigommfreitas.coreservice.leadershipcommitment.LeadershipCommitmentRepository;
import com.rodrigommfreitas.coreservice.leadershipcommitment.LeadershipCommitmentYear;
import com.rodrigommfreitas.coreservice.leadershipcommitment.LeadershipCommitmentYearRepository;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LeadershipCommitmentSeeder {

    private final LeadershipCommitmentRepository repository;
    private final LeadershipCommitmentYearRepository yearRepository;
    private final YearRepository yearRepo;

    public LeadershipCommitmentSeeder(
            LeadershipCommitmentRepository repository,
            LeadershipCommitmentYearRepository yearRepository,
            YearRepository yearRepo
    ) {
        this.repository = repository;
        this.yearRepository = yearRepository;
        this.yearRepo = yearRepo;
    }

    public void seed() {
        if (repository.findById(1L).isPresent()) {
            return;
        }

        LeadershipCommitment lc = new LeadershipCommitment();
        lc.setDescription("Evidências de Compromisso da Gestão");
        repository.save(lc);

        // Associate with the first available year
        List<Year> years = yearRepo.findAll();
        if (!years.isEmpty()) {
            Year firstYear = years.get(0);
            LeadershipCommitmentYear lcy = LeadershipCommitmentYear.builder()
                    .leadershipCommitment(lc)
                    .year(firstYear)
                    .build();
            yearRepository.save(lcy);
            lc.getYears().add(lcy);
        }
    }
}