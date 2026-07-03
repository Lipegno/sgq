package com.rodrigommfreitas.coreservice.config.seed.swot;

import com.rodrigommfreitas.coreservice.swot.SwotAnalysis;
import com.rodrigommfreitas.coreservice.swot.SwotAnalysisRepository;
import com.rodrigommfreitas.coreservice.swot.SwotYear;
import com.rodrigommfreitas.coreservice.swot.SwotYearRepository;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SwotAnalysisSeeder {

    private final SwotAnalysisRepository repository;
    private final SwotYearRepository swotYearRepository;
    private final YearRepository yearRepo;

    public SwotAnalysisSeeder(
            SwotAnalysisRepository repository,
            SwotYearRepository swotYearRepository,
            YearRepository yearRepo
    ) {
        this.repository = repository;
        this.swotYearRepository = swotYearRepository;
        this.yearRepo = yearRepo;
    }

    public void seed() {
        if (repository.findById(1L).isPresent()) {
            return;
        }

        SwotAnalysis analysis = new SwotAnalysis();
        analysis.setDescription("Análise de Contexto");
        repository.save(analysis);

        // Associate with the first available year
        List<Year> years = yearRepo.findAll();
        if (!years.isEmpty()) {
            Year firstYear = years.get(0);
            SwotYear swotYear = SwotYear.builder()
                    .swotAnalysis(analysis)
                    .year(firstYear)
                    .build();
            swotYearRepository.save(swotYear);
            analysis.getYears().add(swotYear);
        }
    }
}