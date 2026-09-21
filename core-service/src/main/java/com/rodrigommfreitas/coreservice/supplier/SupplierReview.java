package com.rodrigommfreitas.coreservice.supplier;

import com.rodrigommfreitas.coreservice.document.Document;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    private Integer evaluationYear;

    private Integer semester;

    private LocalDate reviewDate;

    private LocalDate criteriaSentDate;

    private Integer conformityScore;

    private Integer deadlineScore;

    private Integer qualityScore;

    private Integer documentationScore;

    @Column(columnDefinition = "TEXT")
    private String classification;

    @Column(columnDefinition = "TEXT")
    private String measures;

    @Column(columnDefinition = "TEXT")
    private String justification;

    @Column(columnDefinition = "TEXT")
    private String text;

    @ManyToMany
    @JoinTable(
            name = "supplier_review_documents",
            joinColumns = @JoinColumn(name = "supplier_review_id"),
            inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    @Builder.Default
    private Set<Document> documents = new HashSet<>();
}
