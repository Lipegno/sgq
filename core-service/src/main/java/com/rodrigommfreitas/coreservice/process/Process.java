package com.rodrigommfreitas.coreservice.process;

import com.rodrigommfreitas.coreservice.department.Department;
import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "processes")
public class Process {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String objective;

    @ManyToMany
    @JoinTable(
            name = "process_entradas_documents",
            joinColumns = @JoinColumn(name = "process_id"),
            inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    @Builder.Default
    private List<Document> entradasDocumentos = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "process_saidas_documents",
            joinColumns = @JoinColumn(name = "process_id"),
            inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    @Builder.Default
    private List<Document> saidasDocumentos = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "process_responsibles",
            joinColumns = @JoinColumn(name = "process_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @Builder.Default
    private Set<User> responsibles = new HashSet<>();

    @ManyToMany
    @JoinTable(
            name = "process_departments",
            joinColumns = @JoinColumn(name = "process_id"),
            inverseJoinColumns = @JoinColumn(name = "department_id")
    )
    @Builder.Default
    private Set<Department> departments = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ficha_documento_id")
    private Document fichaDocumento;

    @ManyToMany
    @JoinTable(
            name = "process_documents",
            joinColumns = @JoinColumn(name = "process_id"),
            inverseJoinColumns = @JoinColumn(name = "document_id")
    )
    @Builder.Default
    private List<Document> documents = new ArrayList<>();

    @OneToMany(mappedBy = "process")
    @Builder.Default
    private Set<ProcessYear> processYears = new HashSet<>();
}
