package com.rodrigommfreitas.coreservice.config.seed.documentedinformation;

import com.rodrigommfreitas.coreservice.documentedinformation.DocumentedInformation;
import com.rodrigommfreitas.coreservice.documentedinformation.DocumentedInformationRepository;
import org.springframework.stereotype.Component;

@Component
public class DocumentedInformationSeeder {

    private final DocumentedInformationRepository repository;

    public DocumentedInformationSeeder(DocumentedInformationRepository repository) {
        this.repository = repository;
    }

    public void seed() {
        if (repository.findById(1L).isPresent()) return;
        repository.save(new DocumentedInformation());
    }
}
