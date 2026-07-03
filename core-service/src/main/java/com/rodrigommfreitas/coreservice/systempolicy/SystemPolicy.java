package com.rodrigommfreitas.coreservice.systempolicy;

import com.rodrigommfreitas.coreservice.document.Document;
import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
public class SystemPolicy {
    @Id
    private Long id = 1L;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToOne
    private Document document;

}