package com.rodrigommfreitas.coreservice.change;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.rodrigommfreitas.coreservice.user.User;
import jakarta.persistence.*;

import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "changes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Change {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(length = 2000)
    private String description;
    private String origin;
    @Column(length = 2000)
    private String whatWillBeDone;
    @Column(length = 2000)
    private String why;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    private String startDate;
    private String expectedEndDate;
    private String realEndDate;

    private Integer timeLimitInDays;

    @Column(name = "\"where\"")
    private String where;
    @Column(length = 2000)
    private String how;
    @Column(length = 2000)
    private String howMuch;

    @Enumerated(EnumType.STRING)
    private ChangeStatus status;

    @Column(length = 2000)
    private String notes;

    private LocalDateTime createdAt;
}