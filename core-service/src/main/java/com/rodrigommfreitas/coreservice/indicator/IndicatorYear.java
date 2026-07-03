package com.rodrigommfreitas.coreservice.indicator;

import com.rodrigommfreitas.coreservice.measurement.Measurement;
import com.rodrigommfreitas.coreservice.process.ProcessYear;
import com.rodrigommfreitas.coreservice.qualityobjective.QualityObjectiveYear;
import com.rodrigommfreitas.coreservice.year.Year;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"indicator_id", "year_id"})
})
public class IndicatorYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "indicator_id", nullable = false)
    private Indicator indicator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "year_id", nullable = false)
    private Year year;

    private BigDecimal goal;

    @ManyToMany
    @JoinTable(
            name = "process_year_indicators",
            joinColumns = @JoinColumn(name = "indicator_year_id"),
            inverseJoinColumns = @JoinColumn(name = "process_year_id")
    )
    @Builder.Default
    private Set<ProcessYear> processes = new HashSet<>();

    @OneToMany(mappedBy = "indicatorYear", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<Measurement> measurements = new HashSet<>();

    @ManyToMany(mappedBy = "indicators")
    @Builder.Default
    private Set<QualityObjectiveYear> qualityObjectives = new HashSet<>();

}
