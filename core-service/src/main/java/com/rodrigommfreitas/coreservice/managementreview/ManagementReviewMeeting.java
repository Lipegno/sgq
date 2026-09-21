package com.rodrigommfreitas.coreservice.managementreview;

import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.year.Year;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/** Uma reunião de revisão pela gestão (ISO 9.3). Um ano pode ter várias. */
@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagementReviewMeeting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "year_id")
    private Year year;

    private LocalDate meetingDate;

    @Column(columnDefinition = "TEXT")
    private String participants;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String decisions;

    /** 9.3.3 a) oportunidades de melhoria */
    @Column(columnDefinition = "TEXT")
    private String improvementOutputs;

    /** 9.3.3 b) necessidade de alterações ao sistema */
    @Column(columnDefinition = "TEXT")
    private String changeNeeds;

    /** 9.3.3 c) necessidades de recursos */
    @Column(columnDefinition = "TEXT")
    private String resourceNeeds;

    @ManyToMany
    @JoinTable(
            name = "management_review_meeting_documents",
            joinColumns = @JoinColumn(name = "meeting_id"),
            inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    @Builder.Default
    private Set<Document> documents = new HashSet<>();
}
