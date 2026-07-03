package com.rodrigommfreitas.coreservice.interestedparty;

import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.indicator.IndicatorYear;
import com.rodrigommfreitas.coreservice.indicator.IndicatorYearRepository;
import com.rodrigommfreitas.coreservice.interestedparty.dto.AssociateProcessesRequest;
import com.rodrigommfreitas.coreservice.interestedparty.dto.InterestedPartyResponse;
import com.rodrigommfreitas.coreservice.interestedparty.dto.UpdateInterestedPartyRequest;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.process.ProcessYear;
import com.rodrigommfreitas.coreservice.process.ProcessYearRepository;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.user.Role;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import com.rodrigommfreitas.coreservice.year.dto.AssociateYearsRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class InterestedPartyYearService {
    private final InterestedPartyYearRepository interestedPartyYearRepository;
    private final InterestedPartyRepository interestedPartyRepository;
    private final YearRepository yearRepository;
    private final ProcessYearRepository processYearRepository;
    private final IndicatorYearRepository indicatorYearRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    private String partyName(InterestedParty party) {
        return party.getName() != null ? party.getName() : "Parte Interessada";
    }

    @Transactional
    public void attachDocument(Long interestedPartyId, Long documentId) {
        InterestedPartyYear party = interestedPartyYearRepository.findById(interestedPartyId).orElseThrow(() -> new EntityNotFoundException("InterestedPartyYear not found"));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        party.getEvidences().add(document);

        String entityName = partyName(party.getInterestedParty()) + " — " + party.getYear().getYear();
        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.INTERESTED_PARTY,
                party.getInterestedParty().getId(),
                party.getId(),
                party.getYear().getId(),
                entityName,
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("document", document.getId().toString(), "associated")
        ));
    }

    @Transactional
    public void updateInterestedPartyYear(Long interestedPartyYearId,
                                          UpdateInterestedPartyRequest request) {

        InterestedPartyYear partyYear = interestedPartyYearRepository.findById(interestedPartyYearId)
                .orElseThrow(() -> new RuntimeException("InterestedPartyYear not found"));

        InterestedParty party = partyYear.getInterestedParty();

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("name", party.getName() != null ? party.getName() : "");
        oldFields.put("type", party.getType() != null ? party.getType().name() : "");
        oldFields.put("category", party.getCategory() != null ? party.getCategory() : "");
        oldFields.put("contactInfo", party.getContactInfo() != null ? party.getContactInfo() : "");
        oldFields.put("needs", partyYear.getNeeds() != null ? partyYear.getNeeds() : "");
        oldFields.put("communicationAndMonitoringPlan", partyYear.getCommunicationAndMonitoringPlan() != null ? partyYear.getCommunicationAndMonitoringPlan() : "");

        if (request.name() != null) party.setName(request.name());
        if (request.type() != null) party.setType(request.type());
        if (request.category() != null) party.setCategory(request.category());
        if (request.contactInfo() != null) party.setContactInfo(request.contactInfo());
        if (request.needs() != null) partyYear.setNeeds(request.needs());
        if (request.communicationAndMonitoringPlan() != null) partyYear.setCommunicationAndMonitoringPlan(request.communicationAndMonitoringPlan());

        interestedPartyRepository.save(party);
        interestedPartyYearRepository.save(partyYear);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("name", party.getName() != null ? party.getName() : "");
        newFields.put("type", party.getType() != null ? party.getType().name() : "");
        newFields.put("category", party.getCategory() != null ? party.getCategory() : "");
        newFields.put("contactInfo", party.getContactInfo() != null ? party.getContactInfo() : "");
        newFields.put("needs", partyYear.getNeeds() != null ? partyYear.getNeeds() : "");
        newFields.put("communicationAndMonitoringPlan", partyYear.getCommunicationAndMonitoringPlan() != null ? partyYear.getCommunicationAndMonitoringPlan() : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.INTERESTED_PARTY,
                    party.getId(),
                    partyYear.getId(),
                    partyYear.getYear().getId(),
                    partyName(party) + " — " + partyYear.getYear().getYear(),
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }
    }

    @Transactional
    public void deleteInterestedPartyYear(Long interestedPartyYearId) {

        InterestedPartyYear partyYear = interestedPartyYearRepository.findById(interestedPartyYearId)
                .orElseThrow(() -> new RuntimeException("InterestedPartyYear not found"));

        InterestedParty party = partyYear.getInterestedParty();
        String yearValue = partyYear.getYear() != null ? String.valueOf(partyYear.getYear().getYear()) : String.valueOf(interestedPartyYearId);

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.INTERESTED_PARTY,
                party.getId(),
                null,
                partyYear.getYear() != null ? partyYear.getYear().getId() : null,
                partyName(party) + " — " + yearValue,
                ActionType.DISASSOCIATED,
                logDetailsBuilder.buildAssociation("year", yearValue, "disassociated")
        ));

        if (partyYear.getProcesses() != null) {
            for (ProcessYear processYear : partyYear.getProcesses()) {
                processYear.getInterestedParties().remove(partyYear);
            }
            partyYear.getProcesses().clear();
        }

        if (party.getYears() != null) {
            party.getYears().remove(partyYear);
        }

        interestedPartyYearRepository.delete(partyYear);

        if (party.getYears() == null || party.getYears().isEmpty()) {
            Map<String, Object> fields = Map.of("name", party.getName() != null ? party.getName() : "");
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.INTERESTED_PARTY,
                    party.getId(),
                    null,
                    null,
                    partyName(party),
                    ActionType.DELETED,
                    logDetailsBuilder.buildDeleted(fields)
            ));
            interestedPartyRepository.delete(party);
        }
    }

    @Transactional
    public void deleteInterestedParty(Long interestedPartyId) {

        InterestedParty party = interestedPartyRepository.findById(interestedPartyId)
                .orElseThrow(() -> new RuntimeException("InterestedParty not found"));

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = Map.of("name", party.getName() != null ? party.getName() : "");
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.INTERESTED_PARTY,
                party.getId(),
                null,
                null,
                partyName(party),
                ActionType.DELETED,
                logDetailsBuilder.buildDeleted(fields)
        ));

        if (party.getYears() != null) {
            for (InterestedPartyYear partyYear : party.getYears()) {
                if (partyYear.getProcesses() != null) {
                    for (ProcessYear processYear : partyYear.getProcesses()) {
                        processYear.getInterestedParties().remove(partyYear);
                    }
                    partyYear.getProcesses().clear();
                }
            }
        }

        interestedPartyYearRepository.deleteAll(party.getYears());
        interestedPartyRepository.delete(party);
    }

    @Transactional
    public void associateProcesses(Long interestedPartyYearId, AssociateProcessesRequest request) {

        InterestedPartyYear interestedPartyYear = interestedPartyYearRepository.findById(interestedPartyYearId)
                .orElseThrow(() -> new RuntimeException("InterestedPartyYear not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        String entityName = partyName(interestedPartyYear.getInterestedParty()) + " — " + interestedPartyYear.getYear().getYear();

        for (Long processYearId : request.processesIds()) {
            ProcessYear processYear = processYearRepository.findById(processYearId)
                    .orElseThrow(() -> new RuntimeException("ProcessYear not found"));

            if (!processYear.getYear().getId().equals(interestedPartyYear.getYear().getId())) {
                throw new RuntimeException("ProcessYear must belong to the same year as InterestedPartyYear");
            }

            boolean isResponsible = processYear.getProcess().getResponsibles().stream()
                    .anyMatch(r -> r.getId().equals(currentUserId));
            if (!isResponsible && !isSuperAdmin) {
                throw new RuntimeException("Apenas os responsáveis do processo podem editar associações");
            }

            if (!interestedPartyYear.getProcesses().contains(processYear)) {
                interestedPartyYear.getProcesses().add(processYear);
                processYear.getInterestedParties().add(interestedPartyYear);
            }

            logService.createLog(new CreateLogRequest(
                    currentUserId,
                    EntityType.INTERESTED_PARTY,
                    interestedPartyYear.getInterestedParty().getId(),
                    interestedPartyYear.getId(),
                    interestedPartyYear.getYear().getId(),
                    entityName,
                    ActionType.UPDATED,
                    logDetailsBuilder.buildAssociation("process", processYear.getProcess().getName(), "ASSOCIATED")
            ));
        }
        interestedPartyYearRepository.save(interestedPartyYear);
    }

    @Transactional
    public void disassociateProcesses(Long interestedPartyYearId, AssociateProcessesRequest request) {

        InterestedPartyYear interestedPartyYear = interestedPartyYearRepository.findById(interestedPartyYearId)
                .orElseThrow(() -> new RuntimeException("InterestedPartyYear not found"));

        Long currentUserId = UserContextHolder.getUserId();
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isSuperAdmin = currentUser.getRoles().contains(Role.ROLE_SUPERADMIN);
        String entityName = partyName(interestedPartyYear.getInterestedParty()) + " — " + interestedPartyYear.getYear().getYear();

        for (Long processYearId : request.processesIds()) {

            ProcessYear processYear = processYearRepository.findById(processYearId)
                    .orElseThrow(() -> new RuntimeException("ProcessYear not found: " + processYearId));

            boolean isResponsible = processYear.getProcess().getResponsibles().stream()
                    .anyMatch(r -> r.getId().equals(currentUserId));
            if (!isResponsible && !isSuperAdmin) {
                throw new RuntimeException("Apenas os responsáveis do processo podem editar associações");
            }

            if (interestedPartyYear.getProcesses().contains(processYear)) {
                interestedPartyYear.getProcesses().remove(processYear);
                processYear.getInterestedParties().remove(interestedPartyYear);
            }

            logService.createLog(new CreateLogRequest(
                    currentUserId,
                    EntityType.INTERESTED_PARTY,
                    interestedPartyYear.getInterestedParty().getId(),
                    interestedPartyYear.getId(),
                    interestedPartyYear.getYear().getId(),
                    entityName,
                    ActionType.UPDATED,
                    logDetailsBuilder.buildAssociation("process", processYear.getProcess().getName(), "DISASSOCIATED")
            ));
        }

        interestedPartyYearRepository.save(interestedPartyYear);
    }

    @Transactional
    public void disassociateYears(Long interestedPartyId, AssociateYearsRequest request) {

        InterestedParty party = interestedPartyRepository.findById(interestedPartyId)
                .orElseThrow(() -> new RuntimeException("InterestedParty not found"));
        String entityName = partyName(party);

        long totalYears = interestedPartyYearRepository.countByInterestedPartyId(interestedPartyId);

        if (totalYears - request.yearIds().size() < 1) {
            throw new IllegalArgumentException("An interested party must be associated with at least one year.");
        }

        for (Long yearId : request.yearIds()) {

            InterestedPartyYear partyYear =
                    interestedPartyYearRepository
                            .findByInterestedPartyIdAndYearId(interestedPartyId, yearId);

            if (partyYear == null) {
                throw new IllegalArgumentException("InterestedPartyYear not found for yearId: " + yearId);
            }

            String yearValue = partyYear.getYear() != null ? String.valueOf(partyYear.getYear().getYear()) : String.valueOf(yearId);

            partyYear.getProcesses().clear();

            interestedPartyYearRepository.delete(partyYear);

            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.INTERESTED_PARTY,
                    interestedPartyId,
                    null,
                    yearId,
                    entityName + " — " + yearValue,
                    ActionType.DISASSOCIATED,
                    logDetailsBuilder.buildAssociation("year", yearValue, "disassociated")
            ));
        }
    }

    @Transactional
    public void associateYears(Long interestedPartyId, List<Long> yearIds) {

        var party = interestedPartyRepository.findById(interestedPartyId)
                .orElseThrow(() -> new RuntimeException("InterestedParty not found"));
        String entityName = partyName(party);
        Long userId = UserContextHolder.getUserId();

        for (Long yearId : yearIds) {

            Year year = yearRepository.findById(yearId)
                    .orElseThrow(() -> new RuntimeException("Year not found"));

            boolean exists = interestedPartyYearRepository
                    .existsByInterestedPartyIdAndYearId(interestedPartyId, yearId);

            if (exists) continue;

            InterestedPartyYear partyYear = InterestedPartyYear.builder()
                    .interestedParty(party)
                    .year(year)
                    .build();

            interestedPartyYearRepository.save(partyYear);

            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.INTERESTED_PARTY,
                    interestedPartyId,
                    partyYear.getId(),
                    yearId,
                    entityName + " — " + year.getYear(),
                    ActionType.ASSOCIATED,
                    logDetailsBuilder.buildAssociation("year", String.valueOf(year.getYear()), "associated")
            ));
        }
    }

    @Transactional
    public void associateYearsWithChildren(Long interestedPartyId, List<Long> yearIds) {

        var party = interestedPartyRepository.findById(interestedPartyId)
                .orElseThrow(() -> new RuntimeException("InterestedParty not found"));
        String entityName = partyName(party);
        Long userId = UserContextHolder.getUserId();

        var existingYears = party.getYears();

        if (existingYears.isEmpty()) {
            throw new RuntimeException("InterestedParty has no existing years to copy from");
        }

        InterestedPartyYear source = existingYears.iterator().next();

        for (Long yearId : yearIds) {

            Year year = yearRepository.findById(yearId)
                    .orElseThrow(() -> new RuntimeException("Year not found"));

            boolean exists = interestedPartyYearRepository
                    .existsByInterestedPartyIdAndYearId(interestedPartyId, yearId);

            if (exists) continue;

            InterestedPartyYear newYear = InterestedPartyYear.builder()
                    .interestedParty(party)
                    .year(year)
                    .needs(source.getNeeds())
                    .communicationAndMonitoringPlan(source.getCommunicationAndMonitoringPlan())
                    .build();

            interestedPartyYearRepository.save(newYear);

            if (source.getProcesses() != null) {
                for (ProcessYear sourceProcessYear : source.getProcesses()) {
                    ProcessYear targetProcessYear = processYearRepository
                            .findByProcessIdAndYearId(
                                    sourceProcessYear.getProcess().getId(),
                                    year.getId()
                            )
                            .orElseGet(() -> {
                                ProcessYear newProcessYear = ProcessYear.builder()
                                        .process(sourceProcessYear.getProcess())
                                        .year(year)
                                        .interestedParties(new ArrayList<>())
                                        .indicators(new HashSet<>())
                                        .build();
                                return processYearRepository.save(newProcessYear);
                            });

                    targetProcessYear.getInterestedParties().add(newYear);
                    newYear.getProcesses().add(targetProcessYear);

                    if (sourceProcessYear.getIndicators() != null) {
                        for (IndicatorYear sourceIndicatorYear : sourceProcessYear.getIndicators()) {
                            IndicatorYear targetIndicatorYear = indicatorYearRepository
                                    .findByIndicatorIdAndYearId(
                                            sourceIndicatorYear.getIndicator().getId(),
                                            year.getId()
                                    )
                                    .orElseGet(() -> {
                                        IndicatorYear newIndicatorYear = IndicatorYear.builder()
                                                .indicator(sourceIndicatorYear.getIndicator())
                                                .year(year)
                                                .goal(sourceIndicatorYear.getGoal())
                                                .processes(new HashSet<>())
                                                .build();
                                        return indicatorYearRepository.save(newIndicatorYear);
                                    });

                            if (!targetIndicatorYear.getProcesses().contains(targetProcessYear)) {
                                targetIndicatorYear.getProcesses().add(targetProcessYear);
                            }
                            if (!targetProcessYear.getIndicators().contains(targetIndicatorYear)) {
                                targetProcessYear.getIndicators().add(targetIndicatorYear);
                            }
                        }
                    }
                }
            }

            if (source.getEvidences() != null) {
                for (Document sourceDoc : source.getEvidences()) {
                    newYear.getEvidences().add(sourceDoc);
                }
            }

            interestedPartyYearRepository.save(newYear);

            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.INTERESTED_PARTY,
                    interestedPartyId,
                    newYear.getId(),
                    yearId,
                    entityName + " — " + year.getYear(),
                    ActionType.ASSOCIATED,
                    logDetailsBuilder.buildAssociation("year", String.valueOf(year.getYear()), "associated")
            ));
        }
    }
}