package com.rodrigommfreitas.coreservice.leadershipcommitment;

import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
import com.rodrigommfreitas.coreservice.leadershipcommitment.dto.LeadershipCommitmentResponse;
import com.rodrigommfreitas.coreservice.leadershipcommitment.dto.LeadershipCommitmentYearDetail;
import com.rodrigommfreitas.coreservice.leadershipcommitment.dto.UpdateDocumentYearsRequest;
import com.rodrigommfreitas.coreservice.leadershipcommitment.dto.UpdateLeadershipCommitmentRequest;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LeadershipCommitmentService {

    private final LeadershipCommitmentRepository repository;
    private final LeadershipCommitmentYearRepository yearRepository;
    private final YearRepository yearRepo;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    @Transactional(readOnly = true)
    public LeadershipCommitmentResponse get() {
        LeadershipCommitment lc = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("LeadershipCommitment not found"));
        return mapToSingletonResponse(lc);
    }

    @Transactional
    public LeadershipCommitmentResponse update(UpdateLeadershipCommitmentRequest request) {
        LeadershipCommitment lc = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("LeadershipCommitment not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("description", lc.getDescription() != null ? lc.getDescription() : "");

        if (request.description() != null) {
            lc.setDescription(request.description());
        }

        repository.save(lc);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("description", lc.getDescription() != null ? lc.getDescription() : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.LEADERSHIP_COMMITMENT,
                    1L,
                    null,
                    null,
                    "Compromisso da Liderança",
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToSingletonResponse(lc);
    }

    @Transactional
    public LeadershipCommitmentYearDetail getOrCreateLeadershipCommitmentYear(Long yearId) {
        LeadershipCommitment lc = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("LeadershipCommitment not found"));

        return yearRepository.findByLeadershipCommitmentIdAndYearId(1L, yearId)
                .map(this::mapToYearDetail)
                .orElseGet(() -> {
                    Year year = yearRepo.findById(yearId)
                            .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));

                    LeadershipCommitmentYear lcy = LeadershipCommitmentYear.builder()
                            .leadershipCommitment(lc)
                            .year(year)
                            .build();

                    yearRepository.save(lcy);
                    lc.getYears().add(lcy);
                    return mapToYearDetail(lcy);
                });
    }

    @Transactional
    public LeadershipCommitmentYearDetail attachDocument(Long yearId, Long documentId) {
        LeadershipCommitment lc = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("LeadershipCommitment not found"));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        LeadershipCommitmentYear lcy = yearRepository.findByLeadershipCommitmentIdAndYearId(1L, yearId)
                .orElseGet(() -> {
                    Year year = yearRepo.findById(yearId)
                            .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));
                    LeadershipCommitmentYear newLcy = LeadershipCommitmentYear.builder()
                            .leadershipCommitment(lc)
                            .year(year)
                            .build();
                    yearRepository.save(newLcy);
                    lc.getYears().add(newLcy);
                    return newLcy;
                });

        lcy.getDocuments().add(document);
        yearRepository.save(lcy);

        String yearValue = lcy.getYear() != null ? String.valueOf(lcy.getYear().getYear()) : String.valueOf(yearId);
        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.LEADERSHIP_COMMITMENT,
                1L,
                lcy.getId(),
                yearId,
                "Compromisso da Liderança — " + yearValue,
                ActionType.ASSOCIATED,
                logDetailsBuilder.buildAssociation("document", document.getId().toString(), "associated")
        ));

        return mapToYearDetail(lcy);
    }

    @Transactional
    public void deleteDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        LeadershipCommitment lc = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("LeadershipCommitment not found"));

        List<LeadershipCommitmentYear> yearsToRemove = new ArrayList<>();
        for (LeadershipCommitmentYear lcy : lc.getYears()) {
            if (lcy.getDocuments().remove(document)) {
                if (lcy.getDocuments().isEmpty()) {
                    yearsToRemove.add(lcy);
                } else {
                    yearRepository.save(lcy);
                }
            }
        }

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.LEADERSHIP_COMMITMENT,
                1L,
                null,
                null,
                "Compromisso da Liderança",
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("document", document.getId().toString(), "disassociated")
        ));

        for (LeadershipCommitmentYear lcy : yearsToRemove) {
            lc.getYears().remove(lcy);
            yearRepository.delete(lcy);
        }

        documentService.deleteDocument(documentId);
    }

    @Transactional
    public LeadershipCommitmentYearDetail updateDocumentYears(Long documentId, UpdateDocumentYearsRequest request) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        LeadershipCommitment lc = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("LeadershipCommitment not found"));

        if (request.associateYearIds() != null) {
            for (Long yearId : request.associateYearIds()) {
                LeadershipCommitmentYear lcy = yearRepository.findByLeadershipCommitmentIdAndYearId(1L, yearId)
                        .orElseGet(() -> {
                            Year year = yearRepo.findById(yearId)
                                    .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));
                            LeadershipCommitmentYear newLcy = LeadershipCommitmentYear.builder()
                                    .leadershipCommitment(lc)
                                    .year(year)
                                    .build();
                            yearRepository.save(newLcy);
                            lc.getYears().add(newLcy);
                            return newLcy;
                        });

                lcy.getDocuments().add(document);
                yearRepository.save(lcy);

                String yearValue = lcy.getYear() != null ? String.valueOf(lcy.getYear().getYear()) : String.valueOf(yearId);
                Long userId = UserContextHolder.getUserId();
                logService.createLog(new CreateLogRequest(
                        userId,
                        EntityType.LEADERSHIP_COMMITMENT,
                        1L,
                        lcy.getId(),
                        yearId,
                        "Compromisso da Liderança — " + yearValue,
                        ActionType.ASSOCIATED,
                        logDetailsBuilder.buildAssociation("year", yearValue, "associated")
                ));
            }
        }

        if (request.disassociateYearIds() != null) {
            List<LeadershipCommitmentYear> yearsToRemove = new ArrayList<>();
            for (Long yearId : request.disassociateYearIds()) {
                LeadershipCommitmentYear lcy = yearRepository.findByLeadershipCommitmentIdAndYearId(1L, yearId)
                        .orElseThrow(() -> new EntityNotFoundException("LeadershipCommitmentYear not found for year " + yearId));

                String yearValue = lcy.getYear() != null ? String.valueOf(lcy.getYear().getYear()) : String.valueOf(yearId);

                lcy.getDocuments().remove(document);

                if (lcy.getDocuments().isEmpty()) {
                    yearsToRemove.add(lcy);
                } else {
                    yearRepository.save(lcy);
                }

                Long userId = UserContextHolder.getUserId();
                logService.createLog(new CreateLogRequest(
                        userId,
                        EntityType.LEADERSHIP_COMMITMENT,
                        1L,
                        null,
                        yearId,
                        "Compromisso da Liderança — " + yearValue,
                        ActionType.DISASSOCIATED,
                        logDetailsBuilder.buildAssociation("year", yearValue, "disassociated")
                ));
            }

            for (LeadershipCommitmentYear lcy : yearsToRemove) {
                lc.getYears().remove(lcy);
                yearRepository.delete(lcy);
            }
        }

        return yearRepository.findAll().stream()
                .filter(lcy -> lcy.getDocuments().contains(document))
                .findFirst()
                .map(this::mapToYearDetail)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public LeadershipCommitmentYearDetail getByYear(Long yearId) {
        LeadershipCommitmentYear lcy = yearRepository.findByLeadershipCommitmentIdAndYearId(1L, yearId)
                .orElseThrow(() -> new EntityNotFoundException("No evidence found for year " + yearId));
        return mapToYearDetail(lcy);
    }

    private LeadershipCommitmentResponse mapToSingletonResponse(LeadershipCommitment lc) {
        List<LeadershipCommitmentYearDetail> yearDetails = lc.getYears() != null
                ? lc.getYears().stream()
                .map(this::mapToYearDetail)
                .toList()
                : List.of();

        return new LeadershipCommitmentResponse(
                lc.getId(),
                lc.getDescription(),
                yearDetails
        );
    }

    private LeadershipCommitmentYearDetail mapToYearDetail(LeadershipCommitmentYear lcy) {
        List<DocumentWithVersionsResponse> documents = lcy.getDocuments() != null
                ? lcy.getDocuments().stream()
                .map(doc -> documentService.getDocumentWithVersions(doc.getId()))
                .toList()
                : List.of();

        return new LeadershipCommitmentYearDetail(
                lcy.getId(),
                lcy.getYear().getId(),
                lcy.getYear().getYear(),
                documents
        );
    }
}