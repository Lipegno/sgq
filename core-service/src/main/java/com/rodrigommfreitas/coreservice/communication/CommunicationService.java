package com.rodrigommfreitas.coreservice.communication;

import com.fasterxml.jackson.databind.JsonNode;
import com.rodrigommfreitas.coreservice.communication.dto.*;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import com.rodrigommfreitas.coreservice.year.dto.YearOption;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CommunicationService {

    private final CommunicationRepository repository;
    private final CommunicationItemRepository itemRepository;
    private final CommunicationItemYearRepository itemYearRepository;
    private final YearRepository yearRepo;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    private Communication getSingleton() {
        return repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("Communication not found"));
    }

    @Transactional(readOnly = true)
    public CommunicationResponse getByYear(Long yearId) {
        Communication communication = getSingleton();
        List<CommunicationItemYear> itemYears = itemYearRepository.findAllByYearId(yearId);

        List<CommunicationItemResponse> internalItems = itemYears.stream()
                .map(CommunicationItemYear::getCommunicationItem)
                .filter(item -> item.getType() == CommunicationType.INTERNAL)
                .map(this::mapToItemResponse)
                .toList();

        List<CommunicationItemResponse> externalItems = itemYears.stream()
                .map(CommunicationItemYear::getCommunicationItem)
                .filter(item -> item.getType() == CommunicationType.EXTERNAL)
                .map(this::mapToItemResponse)
                .toList();

        return new CommunicationResponse(
                communication.getId(),
                communication.getObjective(),
                communication.getScope(),
                communication.getPlan(),
                internalItems,
                externalItems
        );
    }

    @Transactional
    public void update(UpdateCommunicationRequest request) {
        Communication communication = getSingleton();

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("objective", communication.getObjective() != null ? communication.getObjective() : "");
        oldFields.put("scope", communication.getScope() != null ? communication.getScope() : "");
        oldFields.put("plan", communication.getPlan() != null ? communication.getPlan() : "");

        if (request.objective() != null) communication.setObjective(request.objective());
        if (request.scope() != null) communication.setScope(request.scope());
        if (request.plan() != null) communication.setPlan(request.plan());

        repository.save(communication);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("objective", communication.getObjective() != null ? communication.getObjective() : "");
        newFields.put("scope", communication.getScope() != null ? communication.getScope() : "");
        newFields.put("plan", communication.getPlan() != null ? communication.getPlan() : "");

        boolean hasChanges = !oldFields.equals(newFields);
        if (hasChanges) {
            Long userId = UserContextHolder.getUserId();
            JsonNode detailsNode = logDetailsBuilder.buildUpdated(oldFields, newFields);
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.COMMUNICATION,
                    communication.getId(),
                    null,
                    null,
                    "Comunicação",
                    ActionType.UPDATED,
                    detailsNode
            ));
        }
    }

    @Transactional
    public void addItem(CreateCommunicationItemRequest request) {
        CommunicationItem item = CommunicationItem.builder()
                .what(request.what())
                .who(request.who())
                .toWho(request.toWho())
                .when(request.when())
                .where(request.where())
                .how(request.how())
                .type(request.type())
                .build();

        itemRepository.save(item);

        if (request.yearIds() != null) {
            for (Long yearId : request.yearIds()) {
                Year year = yearRepo.findById(yearId)
                        .orElseThrow(() -> new RuntimeException("Year not found: " + yearId));
                CommunicationItemYear iy = CommunicationItemYear.builder()
                        .communicationItem(item)
                        .year(year)
                        .build();
                itemYearRepository.save(iy);

                Long userId = UserContextHolder.getUserId();
                logService.createLog(new CreateLogRequest(
                        userId,
                        EntityType.COMMUNICATION_ITEM,
                        item.getId(),
                        iy.getId(),
                        yearId,
                        (item.getWhat() != null ? item.getWhat() : "Item") + " — " + String.valueOf(year.getYear()),
                        ActionType.ASSOCIATED,
                        logDetailsBuilder.buildAssociation("year", String.valueOf(year.getYear()), "associated")
                ));
            }
        }

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("what", item.getWhat() != null ? item.getWhat() : "");
        fields.put("who", item.getWho() != null ? item.getWho() : "");
        fields.put("toWho", item.getToWho() != null ? item.getToWho() : "");
        fields.put("when", item.getWhen() != null ? item.getWhen() : "");
        fields.put("where", item.getWhere() != null ? item.getWhere() : "");
        fields.put("how", item.getHow() != null ? item.getHow() : "");
        fields.put("type", item.getType() != null ? item.getType().name() : "");
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.COMMUNICATION_ITEM,
                item.getId(),
                null,
                null,
                item.getWhat() != null ? item.getWhat() : "Item",
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));
    }

    @Transactional
    public void updateItem(Long itemId, UpdateCommunicationItemRequest request) {
        CommunicationItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Communication item not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("what", item.getWhat() != null ? item.getWhat() : "");
        oldFields.put("who", item.getWho() != null ? item.getWho() : "");
        oldFields.put("toWho", item.getToWho() != null ? item.getToWho() : "");
        oldFields.put("when", item.getWhen() != null ? item.getWhen() : "");
        oldFields.put("where", item.getWhere() != null ? item.getWhere() : "");
        oldFields.put("how", item.getHow() != null ? item.getHow() : "");
        oldFields.put("type", item.getType() != null ? item.getType().name() : "");

        if (request.what() != null) item.setWhat(request.what());
        if (request.who() != null) item.setWho(request.who());
        if (request.toWho() != null) item.setToWho(request.toWho());
        if (request.when() != null) item.setWhen(request.when());
        if (request.where() != null) item.setWhere(request.where());
        if (request.how() != null) item.setHow(request.how());
        if (request.type() != null) item.setType(CommunicationType.valueOf(request.type()));

        itemRepository.save(item);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("what", item.getWhat() != null ? item.getWhat() : "");
        newFields.put("who", item.getWho() != null ? item.getWho() : "");
        newFields.put("toWho", item.getToWho() != null ? item.getToWho() : "");
        newFields.put("when", item.getWhen() != null ? item.getWhen() : "");
        newFields.put("where", item.getWhere() != null ? item.getWhere() : "");
        newFields.put("how", item.getHow() != null ? item.getHow() : "");
        newFields.put("type", item.getType() != null ? item.getType().name() : "");

        boolean hasChanges = !oldFields.equals(newFields);
        if (hasChanges) {
            Long userId = UserContextHolder.getUserId();
            JsonNode detailsNode = logDetailsBuilder.buildUpdated(oldFields, newFields);
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.COMMUNICATION_ITEM,
                    item.getId(),
                    null,
                    null,
                    item.getWhat() != null ? item.getWhat() : "Item",
                    ActionType.UPDATED,
                    detailsNode
            ));
        }
    }

    @Transactional
    public void deleteItem(Long itemId) {
        CommunicationItem item = itemRepository.findById(itemId).orElse(null);
        if (item != null) {
            Long userId = UserContextHolder.getUserId();
            Map<String, Object> fields = Map.of("what", item.getWhat() != null ? item.getWhat() : "");
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.COMMUNICATION_ITEM,
                    itemId,
                    null,
                    null,
                    item.getWhat() != null ? item.getWhat() : "Item",
                    ActionType.DELETED,
                    logDetailsBuilder.buildDeleted(fields)
            ));
        }
        itemRepository.findById(itemId).ifPresent(i -> {
            i.getYears().clear();
            itemRepository.delete(i);
        });
    }

    @Transactional
    public void associateYear(Long itemId, Long yearId) {
        if (itemYearRepository.existsByCommunicationItemIdAndYearId(itemId, yearId)) return;
        CommunicationItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Communication item not found"));
        Year year = yearRepo.findById(yearId)
                .orElseThrow(() -> new RuntimeException("Year not found"));
        CommunicationItemYear iy = CommunicationItemYear.builder()
                .communicationItem(item)
                .year(year)
                .build();
        itemYearRepository.save(iy);

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.COMMUNICATION_ITEM,
                itemId,
                iy.getId(),
                yearId,
                (item.getWhat() != null ? item.getWhat() : "Item") + " — " + String.valueOf(year.getYear()),
                ActionType.ASSOCIATED,
                logDetailsBuilder.buildAssociation("year", String.valueOf(year.getYear()), "associated")
        ));
    }

    @Transactional
    public void disassociateYear(Long itemId, Long yearId) {
        String yearValue = yearRepo.findById(yearId)
                .map(y -> String.valueOf(y.getYear()))
                .orElse(String.valueOf(yearId));
        itemYearRepository.deleteByCommunicationItemIdAndYearId(itemId, yearId);

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.COMMUNICATION_ITEM,
                itemId,
                null,
                yearId,
                "Item — " + yearValue,
                ActionType.DISASSOCIATED,
                logDetailsBuilder.buildAssociation("year", yearValue, "disassociated")
        ));
    }

    private CommunicationItemResponse mapToItemResponse(CommunicationItem item) {
        List<YearOption> years = item.getYears() != null
                ? item.getYears().stream()
                .map(iy -> new YearOption(
                        iy.getYear().getId(),
                        iy.getYear().getYear(),
                        false
                ))
                .toList()
                : List.of();

        return new CommunicationItemResponse(
                item.getId(),
                item.getWhat(),
                item.getWho(),
                item.getToWho(),
                item.getWhen(),
                item.getWhere(),
                item.getHow(),
                item.getType(),
                years
        );
    }
}