package com.rodrigommfreitas.coreservice.nonconformity;

import com.rodrigommfreitas.coreservice.year.Year;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"non_conformity_id", "year_id"}))
public class NonConformityYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "non_conformity_id")
    private NonConformity nonConformity;

    @ManyToOne
    @JoinColumn(name = "year_id")
    private Year year;

    @Enumerated(EnumType.STRING)
    private NonConformityStatus status;

    @Column(columnDefinition = "TEXT")
    private String evaluation;

    @Column(columnDefinition = "TEXT")
    private String evaluationDescription;
}