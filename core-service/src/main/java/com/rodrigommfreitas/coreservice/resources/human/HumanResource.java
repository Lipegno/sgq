package com.rodrigommfreitas.coreservice.resources.human;

import com.rodrigommfreitas.coreservice.department.Department;
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
public class HumanResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String function;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @OneToMany(mappedBy = "humanResource", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<HumanResourceYear> years = new ArrayList<>();
}