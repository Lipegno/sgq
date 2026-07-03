package com.rodrigommfreitas.coreservice.communication;

import com.rodrigommfreitas.coreservice.year.Year;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunicationItemYear {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "communication_item_id")
    private CommunicationItem communicationItem;

    @ManyToOne
    @JoinColumn(name = "year_id")
    private Year year;
}
