package com.rodrigommfreitas.coreservice.interestedparty;

import jakarta.persistence.*;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
public class InterestedParty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    private String name;

    @Enumerated(EnumType.STRING)
    private InterestedPartyType type;

    private String category;

    private String contactInfo;

    @OneToMany(mappedBy = "interestedParty", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InterestedPartyYear> years = new ArrayList<>();
}
