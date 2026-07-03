package com.rodrigommfreitas.coreservice.improvementopportunity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.user.User;
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
@Table(name = "improvement_actions")
public class ImprovementAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsible;

    @Enumerated(EnumType.STRING)
    private ImprovementActionStatus status;

    @Column(columnDefinition = "TEXT")
    private String progressDescription;

    @ManyToOne
    @JoinColumn(name = "improvement_opportunity_id")
    private ImprovementOpportunity improvementOpportunity;

    @ManyToMany
    @JoinTable(
            name = "improvement_action_documents",
            joinColumns = @JoinColumn(name = "improvement_action_id"),
            inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    @Builder.Default
    private Set<Document> documents = new HashSet<>();
}