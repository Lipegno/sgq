package com.rodrigommfreitas.coreservice.swot;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SwotItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String text;

    @Enumerated(EnumType.STRING)
    private SwotItemType type;

    @ManyToMany
    @JoinTable(
            name = "swot_item_years",
            joinColumns = @JoinColumn(name = "swot_item_id"),
            inverseJoinColumns = @JoinColumn(name = "swot_year_id")
    )
    @Builder.Default
    private Set<SwotYear> swotYears = new HashSet<>();
}