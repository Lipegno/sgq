package com.rodrigommfreitas.coreservice.customersatisfaction;

import com.rodrigommfreitas.coreservice.customersatisfaction.dto.CustomerSatisfactionResponse;
import com.rodrigommfreitas.coreservice.customersatisfaction.dto.CustomerSatisfactionYearDetail;
import com.rodrigommfreitas.coreservice.customersatisfaction.dto.UpdateCustomerSatisfactionRequest;
import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
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
public class CustomerSatisfactionService {

    private final CustomerSatisfactionRepository repository;
    private final CustomerSatisfactionYearRepository yearRepository;
    private final YearRepository yearRepo;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    @Transactional(readOnly = true)
    public CustomerSatisfactionResponse get() {
        CustomerSatisfaction cs = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("CustomerSatisfaction not found"));
        return mapToSingletonResponse(cs);
    }

    @Transactional
    public CustomerSatisfactionResponse update(UpdateCustomerSatisfactionRequest request) {
        CustomerSatisfaction cs = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("CustomerSatisfaction not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("description", cs.getDescription() != null ? cs.getDescription() : "");

        if (request.description() != null) {
            cs.setDescription(request.description());
        }

        repository.save(cs);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("description", cs.getDescription() != null ? cs.getDescription() : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.CUSTOMER_SATISFACTION,
                    1L,
                    null,
                    null,
                    "Satisfação dos Estudantes",
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToSingletonResponse(cs);
    }

    @Transactional
    public CustomerSatisfactionYearDetail getOrCreateCustomerSatisfactionYear(Long yearId) {
        CustomerSatisfaction cs = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("CustomerSatisfaction not found"));

        return yearRepository.findByCustomerSatisfactionIdAndYearId(1L, yearId)
                .map(this::mapToYearDetail)
                .orElseGet(() -> {
                    Year year = yearRepo.findById(yearId)
                            .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));

                    CustomerSatisfactionYear csy = CustomerSatisfactionYear.builder()
                            .customerSatisfaction(cs)
                            .year(year)
                            .build();

                    yearRepository.save(csy);
                    cs.getYears().add(csy);
                    return mapToYearDetail(csy);
                });
    }

    @Transactional
    public CustomerSatisfactionYearDetail attachDocument(Long yearId, Long documentId) {
        CustomerSatisfaction cs = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("CustomerSatisfaction not found"));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        CustomerSatisfactionYear csy = yearRepository.findByCustomerSatisfactionIdAndYearId(1L, yearId)
                .orElseGet(() -> {
                    Year year = yearRepo.findById(yearId)
                            .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + yearId));
                    CustomerSatisfactionYear newCsy = CustomerSatisfactionYear.builder()
                            .customerSatisfaction(cs)
                            .year(year)
                            .build();
                    yearRepository.save(newCsy);
                    cs.getYears().add(newCsy);
                    return newCsy;
                });

        csy.getDocuments().add(document);
        yearRepository.save(csy);

        String yearValue = csy.getYear() != null ? String.valueOf(csy.getYear().getYear()) : String.valueOf(yearId);
        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.CUSTOMER_SATISFACTION,
                1L,
                csy.getId(),
                yearId,
                "Satisfação dos Estudantes — " + yearValue,
                ActionType.ASSOCIATED,
                logDetailsBuilder.buildAssociation("document", document.getId().toString(), "associated")
        ));

        return mapToYearDetail(csy);
    }

    @Transactional
    public void deleteDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));

        CustomerSatisfaction cs = repository.findById(1L)
                .orElseThrow(() -> new EntityNotFoundException("CustomerSatisfaction not found"));

        List<CustomerSatisfactionYear> yearsToRemove = new ArrayList<>();
        for (CustomerSatisfactionYear csy : cs.getYears()) {
            if (csy.getDocuments().remove(document)) {
                if (csy.getDocuments().isEmpty()) {
                    yearsToRemove.add(csy);
                } else {
                    yearRepository.save(csy);
                }
            }
        }

        Long userId = UserContextHolder.getUserId();
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.CUSTOMER_SATISFACTION,
                1L,
                null,
                null,
                "Satisfação dos Estudantes",
                ActionType.UPDATED,
                logDetailsBuilder.buildAssociation("document", document.getId().toString(), "disassociated")
        ));

        for (CustomerSatisfactionYear csy : yearsToRemove) {
            cs.getYears().remove(csy);
            yearRepository.delete(csy);
        }

        documentService.deleteDocument(documentId);
    }

    @Transactional(readOnly = true)
    public CustomerSatisfactionYearDetail getByYear(Long yearId) {
        CustomerSatisfactionYear csy = yearRepository.findByCustomerSatisfactionIdAndYearId(1L, yearId)
                .orElseThrow(() -> new EntityNotFoundException("No evidence found for year " + yearId));
        return mapToYearDetail(csy);
    }

    private CustomerSatisfactionResponse mapToSingletonResponse(CustomerSatisfaction cs) {
        List<CustomerSatisfactionYearDetail> yearDetails = cs.getYears() != null
                ? cs.getYears().stream()
                .map(this::mapToYearDetail)
                .toList()
                : List.of();

        return new CustomerSatisfactionResponse(
                cs.getId(),
                cs.getDescription(),
                yearDetails
        );
    }

    private CustomerSatisfactionYearDetail mapToYearDetail(CustomerSatisfactionYear csy) {
        List<DocumentWithVersionsResponse> documents = csy.getDocuments() != null
                ? csy.getDocuments().stream()
                .map(doc -> documentService.getDocumentWithVersions(doc.getId()))
                .toList()
                : List.of();

        return new CustomerSatisfactionYearDetail(
                csy.getId(),
                csy.getYear().getId(),
                csy.getYear().getYear(),
                documents
        );
    }
}
