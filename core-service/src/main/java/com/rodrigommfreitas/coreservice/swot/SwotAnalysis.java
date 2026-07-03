package com.rodrigommfreitas.coreservice.swot;

import com.rodrigommfreitas.coreservice.document.Document;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwotAnalysis {

    @Id
    private Long id = 1L;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToMany
    @JoinTable(
            name = "swot_analysis_documents",
            joinColumns = @JoinColumn(name = "swot_analysis_id"),
            inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    @Builder.Default
    private Set<Document> documents = new HashSet<>();

    @OneToMany(mappedBy = "swotAnalysis", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SwotYear> years = new ArrayList<>();
}