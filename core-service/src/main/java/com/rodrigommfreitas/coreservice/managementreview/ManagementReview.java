package com.rodrigommfreitas.coreservice.managementreview;

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
public class ManagementReview {

    @Id
    private Long id = 1L;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @OneToMany(mappedBy = "managementReview", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ManagementReviewYear> years = new ArrayList<>();
}
