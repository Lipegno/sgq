package com.rodrigommfreitas.coreservice.config.seed.managementreview;

import com.rodrigommfreitas.coreservice.managementreview.ManagementReview;
import com.rodrigommfreitas.coreservice.managementreview.ManagementReviewRepository;
import com.rodrigommfreitas.coreservice.managementreview.ManagementReviewYear;
import com.rodrigommfreitas.coreservice.managementreview.ManagementReviewYearRepository;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ManagementReviewSeeder {

    private final ManagementReviewRepository repository;
    private final ManagementReviewYearRepository yearRepository;
    private final YearRepository yearRepo;

    public ManagementReviewSeeder(
            ManagementReviewRepository repository,
            ManagementReviewYearRepository yearRepository,
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

        ManagementReview mr = new ManagementReview();
        mr.setDescription("Atas e decisões da revisão pela gestão");
        repository.save(mr);

        List<Year> years = yearRepo.findAll();
        if (!years.isEmpty()) {
            Year firstYear = years.get(0);
            ManagementReviewYear mry = ManagementReviewYear.builder()
                    .managementReview(mr)
                    .year(firstYear)
                    .build();
            yearRepository.save(mry);
            mr.getYears().add(mry);
        }
    }
}
