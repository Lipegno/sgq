package com.rodrigommfreitas.coreservice.config.seed.scope;


import com.rodrigommfreitas.coreservice.config.seed.year.SeedYear;
import com.rodrigommfreitas.coreservice.scope.Scope;
import com.rodrigommfreitas.coreservice.scope.ScopeRepository;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ScopeSeeder {

    private final ScopeRepository scopeRepository;

    public ScopeSeeder(ScopeRepository scopeRepository) {
        this.scopeRepository = scopeRepository;
    }

    public void seed() {
        if (scopeRepository.findById(1L).isPresent()) return;
        Scope scope = new Scope();
        scope.setDescription("initial description");
        scopeRepository.save(scope);
    }
}