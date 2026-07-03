package com.rodrigommfreitas.coreservice.resources.infrastructure;

import com.rodrigommfreitas.coreservice.year.Year;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InfrastructureYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "infrastructure_id")
    private Infrastructure infrastructure;

    @ManyToOne
    @JoinColumn(name = "year_id")
    private Year year;

    private boolean isActive;
}