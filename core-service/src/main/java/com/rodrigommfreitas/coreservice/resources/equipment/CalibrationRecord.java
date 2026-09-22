package com.rodrigommfreitas.coreservice.resources.equipment;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalibrationRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "equipment_id")
    private Equipment equipment;

    private LocalDate date;

    /** Próxima data prevista (calibração/manutenção seguinte). Opcional. */
    private LocalDate nextDueDate;
    private String performedBy;
    private String result;
    private String description;
}