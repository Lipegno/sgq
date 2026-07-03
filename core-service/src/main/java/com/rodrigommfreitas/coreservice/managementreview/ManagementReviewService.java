package com.rodrigommfreitas.coreservice.managementreview;

import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
import com.rodrigommfreitas.coreservice.managementreview.dto.ManagementReviewResponse;
import com.rodrigommfreitas.coreservice.managementreview.dto.ManagementReviewYearDetail;
import com.rodrigommfreitas.coreservice.managementreview.dto.UpdateManagementReviewRequest;
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
public class ManagementReviewService {

    private final ManagementReviewRepository repository;
    private final ManagementReviewYearRepository yearRepository;
    private final YearRepository yearRepo;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    @Transactional(readOnly = true)
    public ManagementReviewResponse get() {
        ManagementReview mr = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("ManagementReview not found"));
        return mapToSingletonResponse(mr);
    }

    @Transactional
    public ManagementReviewResponse update(UpdateManagementReviewRequest request) {
        ManagementReview mr = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("ManagementReview not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("description", mr.getDescription() != null ? mr.getDescription() : "");

        if (request.description() != null) {
            mr.setDescription(request.description());
        }

        repository.save(mr);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("description", mr.getDescription() != null ? mr.getDescription() : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.MANAGEMENT_REVIEW,
                    1L,
                    null,
                    null,
                    "Revisão pela Gestão",
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToSingletonResponse(mr);
    }

    @Transactional
    public ManagementReviewYearDetail getOrCreateManagementReviewYear(Long yearId) {
        ManagementReview mr = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("ManagementReview not found"));

        return yearRepository.findByManagementReviewIdAndYearId(1L, yearId)
                .map(this::mapToYearDetail)
                .orElseGet(() -> {
                    Year year = yearRepo.findById(yearId)
                            .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));

                    ManagementReviewYear mry = ManagementReviewYear.builder()
                            .managementReview(mr)
                            .year(year)
                            .build();

                    yearRepository.save(mry);
                    mr.getYears().add(mry);
                    return mapToYearDetail(mry);
                });
    }

    @Transactional
    public ManagementReviewYearDetail attachDocument(Long yearId, Long documentId) {
        ManagementReview mr = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("ManagementReview not found"));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        ManagementReviewYear mry = yearRepository.findByManagementReviewIdAndYearId(1L, yearId)
                .orElseGet(() -> {
                    Year year = yearRepo.findById(yearId)
                            .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));
                    ManagementReviewYear newMry = ManagementReviewYear.builder()
                            .managementReview(mr)
                            .year(year)
                            .build();
                    yearRepository.save(newMry);
                    mr.getYears().add(newMry);
                    return newMry;
                });

        mry.getDocuments().add(document);
        yearRepository.save(mry);

        String yearValue = mry.getYear() != null ? String.valueOf(mry.getYear().getYear()) : String.valueOf(yearId);
        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.MANAGEMENT_REVIEW,
                1L,
                mry.getId(),
                yearId,
                "Revisão pela Gestão — " + yearValue,
                ActionType.ASSOCIATED,
                logDetailsBuilder.buildAssociation("document", document.getId().toString(), "associated")
        ));

        return mapToYearDetail(mry);
    }

    @Transactional
    public void deleteDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        ManagementReview mr = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("ManagementReview not found"));

        List<ManagementReviewYear> yearsToRemove = new ArrayList<>();
        for (ManagementReviewYear mry : mr.getYears()) {
            if (mry.getDocuments().remove(document)) {
                if (mry.getDocuments().isEmpty()) {
                    yearsToRemove.add(mry);
                } else {
                    yearRepository.save(mry);
                }
            }
        }

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.MANAGEMENT_REVIEW,
                1L,
                null,
                null,
                "Revisão pela Gestão",
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("document", document.getId().toString(), "disassociated")
        ));

        for (ManagementReviewYear mry : yearsToRemove) {
            mr.getYears().remove(mry);
            yearRepository.delete(mry);
        }

        documentService.deleteDocument(documentId);
    }

    @Transactional(readOnly = true)
    public ManagementReviewYearDetail getByYear(Long yearId) {
        ManagementReviewYear mry = yearRepository.findByManagementReviewIdAndYearId(1L, yearId)
                .orElseThrow(() -> new EntityNotFoundException("No evidence found for year " + yearId));
        return mapToYearDetail(mry);
    }

    private ManagementReviewResponse mapToSingletonResponse(ManagementReview mr) {
        List<ManagementReviewYearDetail> yearDetails = mr.getYears() != null
                ? mr.getYears().stream()
                .map(this::mapToYearDetail)
                .toList()
                : List.of();

        return new ManagementReviewResponse(
                mr.getId(),
                mr.getDescription(),
                yearDetails
        );
    }

    private ManagementReviewYearDetail mapToYearDetail(ManagementReviewYear mry) {
        List<DocumentWithVersionsResponse> documents = mry.getDocuments() != null
                ? mry.getDocuments().stream()
                .map(doc -> documentService.getDocumentWithVersions(doc.getId()))
                .toList()
                : List.of();

        return new ManagementReviewYearDetail(
                mry.getId(),
                mry.getYear().getId(),
                mry.getYear().getYear(),
                documents
        );
    }
}
