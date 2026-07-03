package com.rodrigommfreitas.coreservice.resources.infrastructure;

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
public class Infrastructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String type;
    private String location;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_id")
    private User responsible;
    private String maintenance;

    @OneToMany(mappedBy = "infrastructure", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InfrastructureYear> years = new ArrayList<>();
}