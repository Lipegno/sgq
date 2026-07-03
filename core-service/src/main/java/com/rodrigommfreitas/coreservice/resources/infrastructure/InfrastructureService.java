package com.rodrigommfreitas.coreservice.resources.infrastructure;

import com.fasterxml.jackson.databind.JsonNode;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.resources.infrastructure.dto.*;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserReferenceService;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import com.rodrigommfreitas.coreservice.year.dto.YearOption;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class InfrastructureService {

    private final InfrastructureRepository repository;
    private final InfrastructureYearRepository yearRepository;
    private final YearRepository yearRepo;
    private final UserRepository userRepository;
    private final UserReferenceService userRefService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;


    @Transactional
    public void create(CreateInfrastructureRequest request) {

        Infrastructure infra = Infrastructure.builder()
                .name(request.name())
                .type(request.type())
                .location(request.location())
                .responsible(request.responsibleId() != null
                        ? userRepository.findById(request.responsibleId()).orElse(null)
                        : null)
                .maintenance(request.maintenance())
                .build();

        repository.save(infra);

        for (Long yearId : request.yearIds()) {

            Year year = yearRepo.findById(yearId)
                    .orElseThrow(() -> new RuntimeException("Year not found"));

            InfrastructureYear iy = InfrastructureYear.builder()
                    .infrastructure(infra)
                    .year(year)
                    .isActive(request.isActive())
                    .build();

            yearRepository.save(iy);
            infra.getYears().add(iy);
        }

        Long userId = UserContextHolder.getUserId();
        for (InfrastructureYear iy : infra.getYears()) {
            Map<String, Object> fields = Map.of(
                    "name", infra.getName(),
                    "type", infra.getType() != null ? infra.getType() : "",
                    "location", infra.getLocation() != null ? infra.getLocation() : "",
                    "year", iy.getYear().getYear()
            );
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.INFRASTRUCTURE,
                    infra.getId(),
                    iy.getId(),
                    iy.getYear().getId(),
                    infra.getName(),
                    ActionType.CREATED,
                    logDetailsBuilder.buildCreated(fields)
            ));
        }
    }

    @Transactional
    public void update(Long id, UpdateInfrastructureRequest request) {

        Infrastructure infra = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Infrastructure not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("name", infra.getName());
        oldFields.put("type", infra.getType() != null ? infra.getType() : "");
        oldFields.put("location", infra.getLocation() != null ? infra.getLocation() : "");

        if (request.name() != null) infra.setName(request.name());
        if (request.type() != null) infra.setType(request.type());
        if (request.location() != null) infra.setLocation(request.location());
        if (request.responsibleId() != null) infra.setResponsible(
                userRepository.findById(request.responsibleId()).orElse(null));
        if (request.maintenance() != null) infra.setMaintenance(request.maintenance());

        if (request.yearId() != null) {

            InfrastructureYear iy = yearRepository
                    .findByInfrastructureIdAndYearId(id, request.yearId())
                    .orElseThrow(() -> new RuntimeException("Year relation not found"));
            if (iy.isActive() != request.isActive()) {
                oldFields.put("isActive", iy.isActive());
                iy.setActive(request.isActive());
            }
            yearRepository.save(iy);
        }

        repository.save(infra);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("name", infra.getName());
        newFields.put("type", infra.getType() != null ? infra.getType() : "");
        newFields.put("location", infra.getLocation() != null ? infra.getLocation() : "");

        boolean hasChanges = !oldFields.equals(newFields);
        if (hasChanges) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.INFRASTRUCTURE,
                    infra.getId(),
                    null,
                    request.yearId(),
                    infra.getName(),
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }
    }

    @Transactional
    public void deleteAll(Long id) {
        Infrastructure infra = repository.findById(id).orElse(null);
        if (infra != null) {
            Long userId = UserContextHolder.getUserId();
            Map<String, Object> fields = Map.of("name", infra.getName());
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.INFRASTRUCTURE,
                    id,
                    null,
                    null,
                    infra.getName(),
                    ActionType.DELETED,
                    logDetailsBuilder.buildDeleted(fields)
            ));
        }
        repository.deleteById(id);
    }

    @Transactional
    public void deleteFromYear(Long id, Long yearId) {

        InfrastructureYear iy = yearRepository
                .findByInfrastructureIdAndYearId(id, yearId)
                .orElseThrow(() -> new RuntimeException("Relation not found"));

        Infrastructure infra = iy.getInfrastructure();

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.INFRASTRUCTURE,
                id,
                iy.getId(),
                yearId,
infra.getName() + " — " + String.valueOf(iy.getYear().getYear()),
                        ActionType.DISASSOCIATED,
                logDetailsBuilder.buildAssociation("year", String.valueOf(iy.getYear().getYear()), "disassociated")
        ));

        infra.getYears().remove(iy);
        yearRepository.delete(iy);

        if (infra.getYears().isEmpty()) {
            repository.delete(infra);
        }
    }

    @Transactional
    public void associateYears(Long id, Set<Long> yearIds, boolean isActive) {

        Infrastructure infra = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Infrastructure not found"));

        for (Long yearId : yearIds) {

            boolean exists = yearRepository
                    .existsByInfrastructureIdAndYearId(id, yearId);

            if (exists) continue;

            Year year = yearRepo.findById(yearId)
                    .orElseThrow(() -> new RuntimeException("Year not found"));

            InfrastructureYear iy = InfrastructureYear.builder()
                    .infrastructure(infra)
                    .year(year)
                    .isActive(isActive)
                    .build();

            yearRepository.save(iy);
            infra.getYears().add(iy);

            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.INFRASTRUCTURE,
                    infra.getId(),
                    iy.getId(),
                    yearId,
infra.getName() + " — " + String.valueOf(year.getYear()),
                        ActionType.ASSOCIATED,
                    logDetailsBuilder.buildAssociation("year", String.valueOf(year.getYear()), "associated")
            ));
        }
    }

    @Transactional(readOnly = true)
    public List<InfrastructureResponse> getByYear(Long yearId) {

        List<InfrastructureYear> list =
                yearRepository.findAllByYearId(yearId);

        return list.stream()
                .map(this::mapToResponse)
                .toList();
    }

    private InfrastructureResponse mapToResponse(InfrastructureYear iy) {

        Infrastructure infra = iy.getInfrastructure();

        List<YearOption> years = infra.getYears() != null
                ? infra.getYears().stream()
                .map(y -> new YearOption(
                        y.getYear().getId(),
                        y.getYear().getYear(),
                        y.getYear().getId().equals(iy.getYear().getId())
                ))
                .toList()
                : List.of();

        return new InfrastructureResponse(
                infra.getId(),
                infra.getName(),
                infra.getType(),
                infra.getLocation(),
                userRefService.fromEntity(infra.getResponsible()),
                infra.getMaintenance(),
                iy.getYear().getId(),
                iy.getYear().getYear(),
                iy.isActive(),
                years
        );
    }


}