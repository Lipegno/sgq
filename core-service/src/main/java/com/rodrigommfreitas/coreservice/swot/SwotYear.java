package com.rodrigommfreitas.coreservice.swot;

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
public class SwotYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "swot_analysis_id")
    private SwotAnalysis swotAnalysis;

    @OneToOne
    @JoinColumn(name = "year_id", unique = true)
    private Year year;

    @ManyToMany(mappedBy = "swotYears")
    @Builder.Default
    private Set<SwotItem> items = new HashSet<>();
}