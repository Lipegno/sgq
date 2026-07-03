package com.rodrigommfreitas.coreservice.process;

import com.rodrigommfreitas.coreservice.indicator.IndicatorYear;
import com.rodrigommfreitas.coreservice.interestedparty.InterestedPartyYear;
import com.rodrigommfreitas.coreservice.macroprocess.MacroProcessYear;
import com.rodrigommfreitas.coreservice.qualityobjective.QualityObjectiveYear;
import com.rodrigommfreitas.coreservice.riskopportunity.RiskOpportunityYear;
import com.rodrigommfreitas.coreservice.year.Year;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"process_id", "year_id"})
})
public class ProcessYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_id", nullable = false)
    private Process process;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "year_id", nullable = false)
    private Year year;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "macro_process_year_id")
    private MacroProcessYear macroProcessYear;

    @ManyToMany(mappedBy = "processes")
    @Builder.Default
    private Set<IndicatorYear> indicators = new HashSet<>();

    @ManyToMany(mappedBy = "processes")
    @Builder.Default
    private List<InterestedPartyYear> interestedParties = new ArrayList<>();

    @ManyToMany(mappedBy = "processes")
    @Builder.Default
    private List<RiskOpportunityYear> risks = new ArrayList<>();

    @ManyToMany(mappedBy = "processes")
    @Builder.Default
    private Set<QualityObjectiveYear> qualityObjectives = new HashSet<>();
}
