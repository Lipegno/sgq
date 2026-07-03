package com.rodrigommfreitas.coreservice.macroprocess;

import com.rodrigommfreitas.coreservice.process.Process;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "macro_processes")
public class MacroProcess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @OneToMany(mappedBy = "macroProcess")
    private Set<MacroProcessYear> macroProcessYears = new HashSet<>();

}