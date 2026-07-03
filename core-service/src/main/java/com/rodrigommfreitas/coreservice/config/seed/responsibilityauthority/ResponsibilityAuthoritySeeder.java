package com.rodrigommfreitas.coreservice.config.seed.responsibilityauthority;

import com.rodrigommfreitas.coreservice.responsibilityauthority.ResponsibilityAuthority;
import com.rodrigommfreitas.coreservice.responsibilityauthority.ResponsibilityAuthorityRepository;
import org.springframework.stereotype.Component;

@Component
public class ResponsibilityAuthoritySeeder {

    private final ResponsibilityAuthorityRepository responsibilityAuthorityRepository;

    public ResponsibilityAuthoritySeeder(ResponsibilityAuthorityRepository responsibilityAuthorityRepository) {
        this.responsibilityAuthorityRepository = responsibilityAuthorityRepository;
    }

    public void seed() {
        ResponsibilityAuthority responsibilityAuthority = new ResponsibilityAuthority();
        responsibilityAuthority.setDescription("initial description");
        responsibilityAuthorityRepository.save(responsibilityAuthority);
    }
}