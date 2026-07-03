package com.rodrigommfreitas.coreservice.improvementopportunity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.rodrigommfreitas.coreservice.department.Department;
import com.rodrigommfreitas.coreservice.user.User;
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
@Table(name = "improvement_opportunities")
public class ImprovementOpportunity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String cause;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsible;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Enumerated(EnumType.STRING)
    private ImprovementOpportunityOrigin origin;

    // ==========================================
    // 1. MATRIZ 5W2H (PLANO DE AÇÃO)
    // ==========================================
    @Column(columnDefinition = "TEXT")
    private String whatWillBeDone;

    @Column(columnDefinition = "TEXT")
    private String why;

    private String who;

    // "where" é uma palavra reservada no PostgreSQL.
    // Usamos o name com aspas escapadas para evitar erros de sintaxe no banco de dados.
    @Column(name = "\"where\"", columnDefinition = "TEXT")
    private String where;

    private LocalDate startDate;

    private LocalDate expectedEndDate;

    @Column(columnDefinition = "TEXT")
    private String how;

    private String howMuch;

    // ==========================================
    // 2. VERIFICAÇÃO DE EFICÁCIA
    // ==========================================
    @Column(columnDefinition = "TEXT")
    private String effectivenessVerification;

    private LocalDate verificationDate;

    private String verificationResponsible;

    @OneToMany(mappedBy = "improvementOpportunity", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ImprovementOpportunityYear> years = new ArrayList<>();

    @OneToMany(mappedBy = "improvementOpportunity", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ImprovementAction> improvementActions = new ArrayList<>();
}