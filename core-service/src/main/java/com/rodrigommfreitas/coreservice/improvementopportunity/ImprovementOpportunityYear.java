package com.rodrigommfreitas.coreservice.improvementopportunity;

import com.rodrigommfreitas.coreservice.year.Year;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "improvement_opportunity_years", uniqueConstraints = @UniqueConstraint(columnNames = {"improvement_opportunity_id", "year_id"}))
public class ImprovementOpportunityYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "improvement_opportunity_id")
    private ImprovementOpportunity improvementOpportunity;

    @ManyToOne
    @JoinColumn(name = "year_id")
    private Year year;

    @Enumerated(EnumType.STRING)
    private ImprovementOpportunityStatus status;

    @Column(columnDefinition = "TEXT")
    private String evaluation;

    @Column(columnDefinition = "TEXT")
    private String evaluationDescription;
}