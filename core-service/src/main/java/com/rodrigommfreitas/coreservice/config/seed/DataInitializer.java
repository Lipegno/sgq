package com.rodrigommfreitas.coreservice.config.seed;

import com.rodrigommfreitas.coreservice.config.seed.awareness.AwarenessSeeder;
import com.rodrigommfreitas.coreservice.config.seed.communication.CommunicationSeeder;
import com.rodrigommfreitas.coreservice.config.seed.customersatisfaction.CustomerSatisfactionSeeder;
import com.rodrigommfreitas.coreservice.config.seed.leadershipcommitment.LeadershipCommitmentSeeder;
import com.rodrigommfreitas.coreservice.config.seed.managementreview.ManagementReviewSeeder;
import com.rodrigommfreitas.coreservice.config.seed.responsibilityauthority.ResponsibilityAuthoritySeeder;
import com.rodrigommfreitas.coreservice.config.seed.scope.ScopeSeeder;
import com.rodrigommfreitas.coreservice.config.seed.systempolicy.SystemPolicySeeder;
import com.rodrigommfreitas.coreservice.config.seed.swot.SwotAnalysisSeeder;
import com.rodrigommfreitas.coreservice.config.seed.year.YearSeeder;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer implements CommandLineRunner {

    private final UserSeeder userSeeder;
    private final YearSeeder yearSeeder;
    private final ScopeSeeder scopeSeeder;
    private final ResponsibilityAuthoritySeeder responsibilityAuthoritySeeder;
    private final LeadershipCommitmentSeeder leadershipCommitmentSeeder;
    private final AwarenessSeeder awarenessSeeder;
    private final SwotAnalysisSeeder swotAnalysisSeeder;
    private final SystemPolicySeeder systemPolicySeeder;
    private final CommunicationSeeder communicationSeeder;
    private final CustomerSatisfactionSeeder customerSatisfactionSeeder;
    private final ManagementReviewSeeder managementReviewSeeder;

    public DataInitializer(UserSeeder userSeeder, YearSeeder yearSeeder, ScopeSeeder scopeSeeder,
                           ResponsibilityAuthoritySeeder responsibilityAuthoritySeeder,
                           LeadershipCommitmentSeeder leadershipCommitmentSeeder,
                           AwarenessSeeder awarenessSeeder, SwotAnalysisSeeder swotAnalysisSeeder,
                           SystemPolicySeeder systemPolicySeeder,
                            CommunicationSeeder communicationSeeder,
                            CustomerSatisfactionSeeder customerSatisfactionSeeder,
                            ManagementReviewSeeder managementReviewSeeder) {
        this.userSeeder = userSeeder;
        this.yearSeeder = yearSeeder;
        this.scopeSeeder = scopeSeeder;
        this.responsibilityAuthoritySeeder = responsibilityAuthoritySeeder;
        this.leadershipCommitmentSeeder = leadershipCommitmentSeeder;
        this.awarenessSeeder = awarenessSeeder;
        this.swotAnalysisSeeder = swotAnalysisSeeder;
        this.systemPolicySeeder = systemPolicySeeder;
        this.communicationSeeder = communicationSeeder;
        this.customerSatisfactionSeeder = customerSatisfactionSeeder;
        this.managementReviewSeeder = managementReviewSeeder;
    }

    @Override
    public void run(String... args) {
        yearSeeder.seed();
        userSeeder.seed();
        scopeSeeder.seed();
        responsibilityAuthoritySeeder.seed();
        leadershipCommitmentSeeder.seed();
        awarenessSeeder.seed();
        swotAnalysisSeeder.seed();
        systemPolicySeeder.seed();
        communicationSeeder.seed();
        customerSatisfactionSeeder.seed();
        managementReviewSeeder.seed();
    }
}