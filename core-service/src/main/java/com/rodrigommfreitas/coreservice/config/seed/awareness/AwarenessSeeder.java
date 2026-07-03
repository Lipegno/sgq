package com.rodrigommfreitas.coreservice.config.seed.awareness;

import com.rodrigommfreitas.coreservice.awareness.Awareness;
import com.rodrigommfreitas.coreservice.awareness.AwarenessRepository;
import com.rodrigommfreitas.coreservice.awareness.AwarenessYear;
import com.rodrigommfreitas.coreservice.awareness.AwarenessYearRepository;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class AwarenessSeeder {

    private final AwarenessRepository repository;
    private final AwarenessYearRepository yearRepository;
    private final YearRepository yearRepo;

    public AwarenessSeeder(
            AwarenessRepository repository,
            AwarenessYearRepository yearRepository,
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

        Awareness awareness = new Awareness();
        awareness.setDescription("Ações de Consciencialização");
        repository.save(awareness);

        // Associate with the first available year
        List<Year> years = yearRepo.findAll();
        if (!years.isEmpty()) {
            Year firstYear = years.get(0);
            AwarenessYear ay = AwarenessYear.builder()
                    .awareness(awareness)
                    .year(firstYear)
                    .build();
            yearRepository.save(ay);
            awareness.getYears().add(ay);
        }
    }
}