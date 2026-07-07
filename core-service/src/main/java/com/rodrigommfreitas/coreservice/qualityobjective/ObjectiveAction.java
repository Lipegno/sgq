package com.rodrigommfreitas.coreservice.qualityobjective;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Table(name = "objective_actions")
@Getter
@Setter
public class ObjectiveAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "action_text", nullable = false, columnDefinition = "TEXT")
    private String actionText;

    private String deadline;
    private String resources;

    @Column(name = "responsible_id")
    private Long responsibleId;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "q1_review")
    private String q1Review;

    @Column(name = "q2_review")
    private String q2Review;

    @Column(name = "q3_review")
    private String q3Review;

    @Column(name = "final_result")
    private String finalResult;

    @Column(name = "target_achieved")
    private boolean targetAchieved;

    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quality_objective_year_id", nullable = false)
    private QualityObjectiveYear qualityObjectiveYear;
}