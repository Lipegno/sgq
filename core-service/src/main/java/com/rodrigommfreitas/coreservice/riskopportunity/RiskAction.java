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

    @Column(columnDefinition = "TEXT")
    private String title;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsible;

    @Column(columnDefinition = "TEXT")
    private String effectivenessEvaluationMethod;

    @Enumerated(EnumType.STRING)
    private ActionStatus status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne
    @JoinColumn(name = "risk_opportunity_year_id")
    private RiskOpportunityYear riskOpportunityYear;

    // Monitoring
    @Column(columnDefinition = "TEXT")
    private String monitoringQ1;
    @Column(columnDefinition = "TEXT")
    private String monitoringQ2;
    @Column(columnDefinition = "TEXT")
    private String monitoringQ3;
    @Column(columnDefinition = "TEXT")
    private String monitoringQ4;
}
