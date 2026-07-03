package com.rodrigommfreitas.coreservice.nonconformity;

import com.rodrigommfreitas.coreservice.document.Document;
import com.fasterxml.jackson.annotation.JsonIgnore;
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
public class CorrectiveAction {

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
    private CorrectiveActionStatus status;

    @Column(columnDefinition = "TEXT")
    private String progressDescription;

    @ManyToOne
    @JoinColumn(name = "non_conformity_id")
    private NonConformity nonConformity;

    @ManyToMany
    @JoinTable(
            name = "corrective_action_documents",
            joinColumns = @JoinColumn(name = "corrective_action_id"),
            inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    @Builder.Default
    private Set<Document> documents = new HashSet<>();
}