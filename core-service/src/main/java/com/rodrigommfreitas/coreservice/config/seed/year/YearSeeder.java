package com.rodrigommfreitas.coreservice.config.seed.year;

import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class YearSeeder {

    private final YearRepository yearRepository;

    public YearSeeder(YearRepository yearRepository) {
        this.yearRepository = yearRepository;
    }

    public void seed() {

        List<SeedYear> years = List.of(
                new SeedYear(2024),
                new SeedYear(2025),
                new SeedYear(2026)
        );

        for (SeedYear seedYear : years) {

            boolean exists = yearRepository.existsByYear(seedYear.year());

            if (!exists) {
                Year year = new Year();
                year.setYear(seedYear.year());
                yearRepository.save(year);
            }
        }
    }
}