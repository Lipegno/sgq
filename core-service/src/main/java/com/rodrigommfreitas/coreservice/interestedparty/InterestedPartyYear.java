package com.rodrigommfreitas.coreservice.interestedparty;

import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.process.ProcessYear;
import com.rodrigommfreitas.coreservice.year.Year;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
public class InterestedPartyYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "year_id", nullable = false)
    private Year year;

    @Column(columnDefinition = "TEXT")
    private String needs;

    @Column(columnDefinition = "TEXT")
    private String communicationAndMonitoringPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interested_party_id", nullable = false)
    private InterestedParty interestedParty;

    @ManyToMany
    @JoinTable(
            name = "interested_party_year_process_year",
            joinColumns = @JoinColumn(name = "interested_party_year_id"),
            inverseJoinColumns = @JoinColumn(name = "process_year_id")
    )
    @Builder.Default
    private List<ProcessYear> processes = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "interested_party_year_documents",
            joinColumns = @JoinColumn(name = "interested_party_year_id"),
            inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    @Builder.Default
    private List<Document> evidences = new ArrayList<>();
}