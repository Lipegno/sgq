package com.rodrigommfreitas.coreservice.communication;

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
public class CommunicationItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String what;
    private String who;
    private String toWho;

    @Column(name = "\"when\"")
    private String when;

    @Column(name = "\"where\"")
    private String where;
    private String how;

    @Enumerated(EnumType.STRING)
    private CommunicationType type;

    @OneToMany(mappedBy = "communicationItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CommunicationItemYear> years = new ArrayList<>();
}
