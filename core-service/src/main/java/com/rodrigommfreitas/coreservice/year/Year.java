package com.rodrigommfreitas.coreservice.year;

import com.rodrigommfreitas.coreservice.document.Document;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "years")
public class Year {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="year_value", nullable = false, unique = true)
    private Integer year;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "macro_process_diagram_document_id")
    private Document macroProcessDiagram;
}
