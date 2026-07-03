package com.rodrigommfreitas.coreservice.config.seed.systempolicy;

import com.rodrigommfreitas.coreservice.systempolicy.SystemPolicy;
import com.rodrigommfreitas.coreservice.systempolicy.SystemPolicyRepository;
import org.springframework.stereotype.Component;

@Component
public class SystemPolicySeeder {

    private final SystemPolicyRepository systemPolicyRepository;

    public SystemPolicySeeder(SystemPolicyRepository systemPolicyRepository) {
        this.systemPolicyRepository = systemPolicyRepository;
    }

    public void seed() {
        if (systemPolicyRepository.findById(1L).isPresent()) return;
        SystemPolicy policy = new SystemPolicy();
        policy.setDescription("initial description");
        systemPolicyRepository.save(policy);
    }
}