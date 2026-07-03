package com.rodrigommfreitas.coreservice.riskopportunity;

import com.rodrigommfreitas.coreservice.process.ProcessYear;
import com.rodrigommfreitas.coreservice.year.Year;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;


@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"risk_opportunity_id", "year_id"}))
public class RiskOpportunityYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "risk_opportunity_id", nullable = false)
    private RiskOpportunity riskOpportunity;

    @ManyToOne
    @JoinColumn(name = "year_id", nullable = false)
    private Year year;

    // 🔹 Risk calculation
    private Integer impact;        // 1–5
    private Integer probability;   // 1–5
    private Integer riskLevel;     // impact * probability

    @Enumerated(EnumType.STRING)
    private RiskDecision decision;

    // 🔹 Processes
    @ManyToMany
    @JoinTable(
            name = "risk_opportunity_year_processes",
            joinColumns = @JoinColumn(name = "risk_opportunity_year_id"),
            inverseJoinColumns = @JoinColumn(name = "process_year_id")
    )
    @Builder.Default
    private List<ProcessYear> processes = new ArrayList<>();

    // 🔹 Actions
    @OneToMany(mappedBy = "riskOpportunityYear", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RiskAction> actions = new ArrayList<>();
}
