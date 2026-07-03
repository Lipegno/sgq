package com.rodrigommfreitas.coreservice.riskopportunity;

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
public class RiskOpportunity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String origin;

    private String description;

    private String category;

    @Enumerated(EnumType.STRING)
    private RiskOpportunityType type;

    @OneToMany(mappedBy = "riskOpportunity", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RiskOpportunityYear> years = new ArrayList<>();
}