package com.rodrigommfreitas.coreservice.macroprocess;

import com.rodrigommfreitas.coreservice.process.ProcessYear;
import com.rodrigommfreitas.coreservice.year.Year;
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
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"macro_process_id", "year_id"})
})
public class MacroProcessYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "macro_process_id", nullable = false)
    private MacroProcess macroProcess;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "year_id", nullable = false)
    private Year year;

    @OneToMany(mappedBy = "macroProcessYear", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<ProcessYear> processes = new HashSet<>();

}
