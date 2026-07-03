package com.rodrigommfreitas.coreservice.resources.human;

import com.rodrigommfreitas.coreservice.year.Year;
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
public class HumanResourceYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(mappedBy = "humanResourceYear", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Competency> competencies = new ArrayList<>();


    @ManyToOne
    @JoinColumn(name = "human_resource_id")
    private HumanResource humanResource;

    @ManyToOne
    @JoinColumn(name = "year_id")
    private Year year;

    private boolean isActive;

}