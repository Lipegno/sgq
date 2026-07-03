package com.rodrigommfreitas.coreservice.responsibilityauthority;

import com.rodrigommfreitas.coreservice.document.Document;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
public class ResponsibilityAuthority {
    @Id
    private Long id = 1L;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToOne
    private Document document;

}