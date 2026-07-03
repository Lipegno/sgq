package com.rodrigommfreitas.coreservice.qualityobjective;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
public class QualityObjective {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String objectiveTitle;
    private String description;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsible;

    @Builder.Default
    @OneToMany(mappedBy = "qualityObjective", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<QualityObjectiveYear> years = new ArrayList<>();
}