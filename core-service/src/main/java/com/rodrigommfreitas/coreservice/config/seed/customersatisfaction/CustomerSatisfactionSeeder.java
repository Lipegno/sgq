package com.rodrigommfreitas.coreservice.config.seed.customersatisfaction;

import com.rodrigommfreitas.coreservice.customersatisfaction.CustomerSatisfaction;
import com.rodrigommfreitas.coreservice.customersatisfaction.CustomerSatisfactionRepository;
import com.rodrigommfreitas.coreservice.customersatisfaction.CustomerSatisfactionYear;
import com.rodrigommfreitas.coreservice.customersatisfaction.CustomerSatisfactionYearRepository;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CustomerSatisfactionSeeder {

    private final CustomerSatisfactionRepository repository;
    private final CustomerSatisfactionYearRepository yearRepository;
    private final YearRepository yearRepo;

    public CustomerSatisfactionSeeder(
            CustomerSatisfactionRepository repository,
            CustomerSatisfactionYearRepository yearRepository,
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

        CustomerSatisfaction cs = new CustomerSatisfaction();
        cs.setDescription("Resultados de Satisfação dos Estudantes");
        repository.save(cs);

        List<Year> years = yearRepo.findAll();
        if (!years.isEmpty()) {
            Year firstYear = years.get(0);
            CustomerSatisfactionYear csy = CustomerSatisfactionYear.builder()
                    .customerSatisfaction(cs)
                    .year(firstYear)
                    .build();
            yearRepository.save(csy);
            cs.getYears().add(csy);
        }
    }
}
