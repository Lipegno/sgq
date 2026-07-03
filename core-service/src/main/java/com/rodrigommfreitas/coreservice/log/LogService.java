package com.rodrigommfreitas.coreservice.log;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.dto.LogResponse;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserReferenceService;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import com.rodrigommfreitas.coreservice.user.dto.UserSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LogService {

    private final LogRepository logRepository;
    private final UserRepository userRepository;
    private final UserReferenceService userRefService;

    @Transactional
    public void createLog(CreateLogRequest request) {
        User user = request.userId() != null
                ? userRepository.findById(request.userId()).orElse(null)
                : null;

        Log log = Log.builder()
                .user(user)
                .entityType(request.entityType())
                .baseEntityId(request.baseEntityId())
                .entityYearId(request.entityYearId())
                .yearId(request.yearId())
                .entityName(request.entityName())
                .action(request.action())
                .details(request.details())
                .build();
        logRepository.save(log);
    }

    public Page<LogResponse> getLogs(
            EntityType entityType,
            List<EntityType> entityTypes,
            Long baseEntityId,
            Long entityYearId,
            Long yearId,
            ActionType action,
            LocalDateTime startDate,
            LocalDateTime endDate,
            int page,
            int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());

        Page<Log> logs;

        // Most specific queries first
        if (entityYearId != null && baseEntityId != null && entityType != null) {
            logs = logRepository.findByEntityTypeAndBaseEntityIdAndEntityYearId(entityType, baseEntityId, entityYearId, pageable);
        } else if (baseEntityId != null && entityType != null) {
            logs = logRepository.findByEntityTypeAndBaseEntityId(entityType, baseEntityId, pageable);
        } else if (baseEntityId != null && entityTypes != null && !entityTypes.isEmpty()) {
            if (yearId != null) {
                logs = logRepository.findByEntityTypeInAndBaseEntityIdAndYearIdInIncludingNull(entityTypes, baseEntityId, List.of(yearId), pageable);
            } else {
                logs = logRepository.findByEntityTypeInAndBaseEntityId(entityTypes, baseEntityId, pageable);
            }
        } else if (baseEntityId != null) {
            if (yearId != null) {
                logs = logRepository.findByBaseEntityIdAndYearIdInIncludingNull(baseEntityId, List.of(yearId), pageable);
            } else {
                logs = logRepository.findByBaseEntityId(baseEntityId, pageable);
            }
        } else if (entityTypes != null && !entityTypes.isEmpty() && yearId != null) {
            logs = logRepository.findByEntityTypeInAndYearIdInIncludingNull(entityTypes, List.of(yearId), pageable);
        } else if (entityTypes != null && !entityTypes.isEmpty()) {
            logs = logRepository.findByEntityTypeIn(entityTypes, pageable);
        } else if (entityType != null && action != null && startDate != null && endDate != null) {
            logs = logRepository.findByEntityTypeAndTimestampBetween(entityType, startDate, endDate, pageable);
        } else if (entityType != null && action != null) {
            logs = logRepository.findByEntityTypeAndAction(entityType, action, pageable);
        } else if (entityType != null && yearId != null) {
            logs = logRepository.findByEntityTypeInAndYearIdInIncludingNull(List.of(entityType), List.of(yearId), pageable);
        } else if (entityType != null && startDate != null && endDate != null) {
            logs = logRepository.findByEntityTypeAndTimestampBetween(entityType, startDate, endDate, pageable);
        } else if (entityType != null) {
            logs = logRepository.findByEntityType(entityType, pageable);
        } else if (action != null) {
            logs = logRepository.findByAction(action, pageable);
        } else if (startDate != null && endDate != null) {
            logs = logRepository.findByTimestampBetween(startDate, endDate, pageable);
        } else if (yearId != null) {
            logs = logRepository.findByYearId(yearId, pageable);
        } else {
            logs = logRepository.findAll(pageable);
        }

        return logs.map(this::mapToResponse);
    }

    private LogResponse mapToResponse(Log log) {
        Object finalDetails = log.getDetails();

        try {
            if (log.getDetails() instanceof com.fasterxml.jackson.databind.JsonNode node) {
                ObjectMapper mapper = new ObjectMapper();
                finalDetails = mapper.convertValue(node, Object.class);
            }
        } catch (Exception e) {
            finalDetails = log.getDetails();
        }

        UserSummary userSummary = userRefService.fromEntity(log.getUser());

        return new LogResponse(
                log.getId(),
                userSummary,
                log.getTimestamp(),
                log.getEntityType(),
                log.getBaseEntityId(),
                log.getEntityYearId(),
                log.getYearId(),
                log.getEntityName(),
                log.getAction(),
                finalDetails
        );
    }
}