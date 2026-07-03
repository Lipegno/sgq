package com.rodrigommfreitas.coreservice.measurement;

import com.rodrigommfreitas.coreservice.indicator.IndicatorYear;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "measurements")
public class Measurement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal measurementValue;

    @Column(nullable = false)
    private LocalDate measurementDate;

    @Column(length = 1000)
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "indicator_year_id", nullable = false)
    private IndicatorYear indicatorYear;

    // getters & setters
}