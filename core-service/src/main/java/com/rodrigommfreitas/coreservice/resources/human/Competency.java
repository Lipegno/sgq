package com.rodrigommfreitas.coreservice.resources.human;

import com.rodrigommfreitas.coreservice.document.Document;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Competency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String details;

    // evidence
    @ManyToOne
    @JoinColumn(name = "document_id")
    private Document document;

    @ManyToOne
    @JoinColumn(name = "human_resource_year_id")
    private HumanResourceYear humanResourceYear;
}
