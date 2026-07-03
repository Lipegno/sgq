package com.rodrigommfreitas.coreservice.riskopportunity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.rodrigommfreitas.coreservice.user.User;
import jakarta.persistence.*;
import lombok.*;


@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsible;

    private String effectivenessEvaluationMethod;

    @Enumerated(EnumType.STRING)
    private ActionStatus status;

    @Column(length = 2000)
    private String notes;

    @ManyToOne
    @JoinColumn(name = "risk_opportunity_year_id")
    private RiskOpportunityYear riskOpportunityYear;

    // Monitoring
    private String monitoringQ1;
    private String monitoringQ2;
    private String monitoringQ3;
    private String monitoringQ4;
}
