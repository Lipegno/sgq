package com.rodrigommfreitas.coreservice.customersatisfaction;

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
public class CustomerSatisfaction {

    @Id
    private Long id = 1L;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    @OneToMany(mappedBy = "customerSatisfaction", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CustomerSatisfactionYear> years = new ArrayList<>();
}
