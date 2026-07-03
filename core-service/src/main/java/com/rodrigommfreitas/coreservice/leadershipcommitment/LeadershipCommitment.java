package com.rodrigommfreitas.coreservice.leadershipcommitment;

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
public class LeadershipCommitment {

    @Id
    private Long id = 1L;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @OneToMany(mappedBy = "leadershipCommitment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LeadershipCommitmentYear> years = new ArrayList<>();
}