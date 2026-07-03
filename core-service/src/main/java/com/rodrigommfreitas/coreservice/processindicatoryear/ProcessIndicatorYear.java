package com.rodrigommfreitas.coreservice.processindicatoryear;

import com.rodrigommfreitas.coreservice.indicator.IndicatorYear;
import com.rodrigommfreitas.coreservice.process.ProcessYear;
import jakarta.persistence.*;

@Entity
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"process_year_id", "indicator_year_id"})
})
public class ProcessIndicatorYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_year_id", nullable = false)
    private ProcessYear processYear;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "indicator_year_id", nullable = false)
    private IndicatorYear indicatorYear;

}
