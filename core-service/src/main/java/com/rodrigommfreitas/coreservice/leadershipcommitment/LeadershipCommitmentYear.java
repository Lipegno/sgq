package com.rodrigommfreitas.coreservice.leadershipcommitment;

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
public class LeadershipCommitmentYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "leadership_commitment_id")
    private LeadershipCommitment leadershipCommitment;

    @OneToOne
    @JoinColumn(name = "year_id", unique = true)
    private Year year;

    @ManyToMany
    @JoinTable(
            name = "leadership_commitment_year_documents",
            joinColumns = @JoinColumn(name = "leadership_commitment_year_id"),
            inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    @Builder.Default
    private Set<Document> documents = new HashSet<>();
}