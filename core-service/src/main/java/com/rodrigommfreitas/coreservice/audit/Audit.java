package com.rodrigommfreitas.coreservice.audit;

import com.rodrigommfreitas.coreservice.department.Department;
import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.year.Year;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "audits")
public class Audit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Enumerated(EnumType.STRING)
    private AuditType type;

    @Column(columnDefinition = "TEXT")
    private String team;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsible;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "year_id", nullable = false)
    private Year year;

    @Enumerated(EnumType.STRING)
    private AuditStatus status;

    private LocalDate plannedDate;

    @ManyToMany
    @JoinTable(
            name = "audit_documents",
            joinColumns = @JoinColumn(name = "audit_id"),
            inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    @Builder.Default
    private List<Document> documents = new ArrayList<>();
}