package com.rodrigommfreitas.coreservice.config.seed.communication;

import com.rodrigommfreitas.coreservice.communication.Communication;
import com.rodrigommfreitas.coreservice.communication.CommunicationRepository;
import org.springframework.stereotype.Component;

@Component
public class CommunicationSeeder {

    private final CommunicationRepository repository;

    public CommunicationSeeder(CommunicationRepository repository) {
        this.repository = repository;
    }

    public void seed() {
        if (repository.findById(1L).isPresent()) {
            return;
        }

        Communication communication = new Communication();
        communication.setObjective("Definir o objetivo da comunicação...");
        communication.setScope("Definir o âmbito e limites...");
        communication.setPlan("Definir a estratégia e abordagem...");
        repository.save(communication);
    }
}
