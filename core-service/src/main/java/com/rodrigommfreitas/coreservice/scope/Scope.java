package com.rodrigommfreitas.coreservice.scope;

import com.rodrigommfreitas.coreservice.document.Document;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
public class Scope {
    @Id
    private Long id = 1L;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToOne
    private Document document;

}