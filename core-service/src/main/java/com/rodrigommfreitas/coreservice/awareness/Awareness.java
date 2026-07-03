package com.rodrigommfreitas.coreservice.awareness;

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
public class Awareness {

    @Id
    private Long id = 1L;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @OneToMany(mappedBy = "awareness", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AwarenessYear> years = new ArrayList<>();
}