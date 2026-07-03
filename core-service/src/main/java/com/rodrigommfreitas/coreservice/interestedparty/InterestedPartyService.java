package com.rodrigommfreitas.coreservice.interestedparty;

import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
import com.rodrigommfreitas.coreservice.interestedparty.dto.CreateInterestedPartyRequest;
import com.rodrigommfreitas.coreservice.interestedparty.dto.InterestedPartyResponse;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.process.ProcessYear;
import com.rodrigommfreitas.coreservice.process.ProcessYearRepository;
import com.rodrigommfreitas.coreservice.process.dto.ProcessOptionResponse;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InterestedPartyService {

    private final InterestedPartyRepository interestedPartyRepository;
    private final InterestedPartyYearRepository interestedPartyYearRepository;
    private final ProcessYearRepository processYearRepository;
    private final YearRepository yearRepository;
    private final DocumentService documentService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    @Transactional
    public InterestedPartyResponse create(CreateInterestedPartyRequest request) {

        InterestedParty party = InterestedParty.builder()
                .name(request.name())
                .type(request.type())
                .category(request.category())
                .contactInfo(request.contactInfo())
                .build();

        party = interestedPartyRepository.save(party);

        Year year = yearRepository.findById(request.yearId())
                .orElseThrow(() -> new RuntimeException("Year not found"));

        List<ProcessYear> processYears = new ArrayList<>();
        if (request.processYearIds() != null && !request.processYearIds().isEmpty()) {
            processYears = processYearRepository.findAllById(request.processYearIds());
        }

        InterestedPartyYear partyYear = InterestedPartyYear.builder()
                .interestedParty(party)
                .year(year)
                .needs(request.needs())
                .communicationAndMonitoringPlan(request.communicationAndMonitoringPlan())
                .processes(processYears)
                .build();

        partyYear = interestedPartyYearRepository.save(partyYear);
        party.getYears().add(partyYear);

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", party.getName() != null ? party.getName() : "");
        fields.put("type", party.getType() != null ? party.getType().name() : "");
        fields.put("category", party.getCategory() != null ? party.getCategory() : "");
        fields.put("contactInfo", party.getContactInfo() != null ? party.getContactInfo() : "");
        fields.put("year", String.valueOf(year.getYear()));
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.INTERESTED_PARTY,
                party.getId(),
                null,
                null,
                party.getName() != null ? party.getName() : "Parte Interessada",
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));

        return mapToResponse(partyYear);
    }

    public List<InterestedPartyResponse> getByYear(Long yearId) {
        List<InterestedPartyYear> years = interestedPartyYearRepository.findByYearId(yearId);
        return years.stream()
                .map(this::mapToResponse)
                .toList();
    }

    public InterestedPartyResponse getByInterestedPartyYearId(Long interestedPartyYearId) {
        InterestedPartyYear partyYear = interestedPartyYearRepository.findById(interestedPartyYearId)
                .orElseThrow(() -> new RuntimeException("InterestedPartyYear not found"));
        return mapToResponse(partyYear);
    }

    private InterestedPartyResponse mapToResponse(InterestedPartyYear partyYear) {
        InterestedParty party = partyYear.getInterestedParty();

        List<ProcessOptionResponse> processes = partyYear.getProcesses() != null
                ? partyYear.getProcesses().stream()
                .map(py -> new ProcessOptionResponse(
                        py.getId(),
                        py.getProcess().getId(),
                        py.getProcess().getName(),
                        py.getMacroProcessYear() != null ? py.getMacroProcessYear().getMacroProcess().getName() : null
                ))
                .toList()
                : List.of();

        List<DocumentWithVersionsResponse> evidences = partyYear.getEvidences() != null
                ? partyYear.getEvidences().stream()
                .map(doc -> documentService.getDocumentWithVersions(doc.getId()))
                .toList()
                : List.of();

        return new InterestedPartyResponse(
                party.getId(),
                partyYear.getId(),
                party.getName(),
                party.getType(),
                party.getCategory(),
                party.getContactInfo(),
                partyYear.getYear().getId(),
                partyYear.getYear().getYear(),
                partyYear.getNeeds(),
                partyYear.getCommunicationAndMonitoringPlan(),
                processes,
                evidences
        );
    }
}