package com.rodrigommfreitas.coreservice.qualityobjective;

import com.rodrigommfreitas.coreservice.indicator.IndicatorYear;
import com.rodrigommfreitas.coreservice.process.ProcessYear;
import com.rodrigommfreitas.coreservice.year.Year;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QualityObjectiveYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "quality_objective_id")
    private QualityObjective qualityObjective;

    @ManyToOne
    @JoinColumn(name = "year_id")
    private Year year;

    @Enumerated(EnumType.STRING)
    private QualityObjectiveStatus status;

    @ManyToMany
    @JoinTable(
            name = "quality_objective_year_processes",
            joinColumns = @JoinColumn(name = "quality_objective_year_id"),
            inverseJoinColumns = @JoinColumn(name = "process_year_id")
    )
    @Builder.Default
    private Set<ProcessYear> processes = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "quality_objective_year_indicators",
            joinColumns = @JoinColumn(name = "quality_objective_year_id"),
            inverseJoinColumns = @JoinColumn(name = "indicator_year_id")
    )
    @Builder.Default
    private Set<IndicatorYear> indicators = new HashSet<>();
}