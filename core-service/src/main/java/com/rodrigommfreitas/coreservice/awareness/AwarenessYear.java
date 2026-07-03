package com.rodrigommfreitas.coreservice.awareness;

import com.rodrigommfreitas.coreservice.document.Document;
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
public class AwarenessYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "awareness_id")
    private Awareness awareness;

    @OneToOne
    @JoinColumn(name = "year_id", unique = true)
    private Year year;

    @ManyToMany
    @JoinTable(
            name = "awareness_year_documents",
            joinColumns = @JoinColumn(name = "awareness_year_id"),
            inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    @Builder.Default
    private Set<Document> documents = new HashSet<>();
}