package com.rodrigommfreitas.coreservice.nonconformity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.rodrigommfreitas.coreservice.department.Department;
import com.rodrigommfreitas.coreservice.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NonConformity {

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
    private NonConformityOrigin origin;


    // ==========================================
    // 1. MATRIZ 5W2H (PLANO DE AÇÃO)
    // ==========================================
    @Column(columnDefinition = "TEXT")
    private String whatWillBeDone;

    @Column(columnDefinition = "TEXT")
    private String why;

    private String who;

    // "where" é uma palavra reservada no SQL (Postgres).
    // Usamos aspas escapadas para o Hibernate conseguir criar a coluna sem dar erro de sintaxe.
    @Column(name = "\"where\"", columnDefinition = "TEXT")
    private String where;

    // java.time.LocalDate lida perfeitamente com o formato de data "AAAA-MM-DD" que o React envia
    private java.time.LocalDate startDate;

    private java.time.LocalDate expectedEndDate;

    @Column(columnDefinition = "TEXT")
    private String how;

    private String howMuch;


    // ==========================================
    // 2. VERIFICAÇÃO DE EFICÁCIA
    // ==========================================
    @Column(columnDefinition = "TEXT")
    private String effectivenessVerification;

    private java.time.LocalDate verificationDate;

    private String verificationResponsible;

    @OneToMany(mappedBy = "nonConformity", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<NonConformityYear> years = new ArrayList<>();

    @OneToMany(mappedBy = "nonConformity", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CorrectiveAction> correctiveActions = new ArrayList<>();
}