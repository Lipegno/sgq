package com.rodrigommfreitas.coreservice.qualityobjective.dto;

import java.time.LocalDate;
import lombok.Data;

@Data
public class ObjectiveActionDto {
    private Long id;
    private String actionText;
    private String deadline;
    private String resources;
    private Long responsibleId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String q1Review;
    private String q2Review;
    private String q3Review;
    private String finalResult;
    private boolean targetAchieved;
    private String observations;
}
