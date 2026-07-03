package com.rodrigommfreitas.coreservice.indicator;

import com.rodrigommfreitas.coreservice.measurement.Measurement;
import com.rodrigommfreitas.coreservice.process.Process;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.rodrigommfreitas.coreservice.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "indicators")
public class Indicator {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;
    private String formula;

    @Enumerated(EnumType.STRING)
    private IndicatorFrequency frequency;

    @Column(length = 2000)
    private String notes;

    @Enumerated(EnumType.STRING)
    private IndicatorValueType valueType;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsible;

    @Builder.Default
    @OneToMany(mappedBy = "indicator")
    private Set<IndicatorYear> indicatorYears = new HashSet<>();

}