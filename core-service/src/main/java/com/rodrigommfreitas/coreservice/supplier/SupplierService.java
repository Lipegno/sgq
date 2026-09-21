package com.rodrigommfreitas.coreservice.supplier;

import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse;
import com.rodrigommfreitas.coreservice.supplier.dto.*;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierReviewRepository reviewRepository;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    @Transactional(readOnly = true)
    public List<SupplierResponse> getAll() {
        return supplierRepository.findAllByOrderByNameAsc().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public SupplierResponse create(CreateSupplierRequest request) {
        Supplier supplier = Supplier.builder()
                .name(request.name())
                .description(request.description())
                .contactInfo(request.contactInfo())
                .createdAt(LocalDateTime.now())
                .build();

        supplierRepository.save(supplier);

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", supplier.getName());
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.SUPPLIER,
                supplier.getId(),
                null,
                null,
                supplier.getName(),
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));

        return mapToResponse(supplier);
    }

    @Transactional
    public SupplierResponse update(Long id, UpdateSupplierRequest request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Supplier not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("name", supplier.getName() != null ? supplier.getName() : "");
        oldFields.put("description", supplier.getDescription() != null ? supplier.getDescription() : "");
        oldFields.put("contactInfo", supplier.getContactInfo() != null ? supplier.getContactInfo() : "");

        if (request.name() != null) supplier.setName(request.name());
        if (request.description() != null) supplier.setDescription(request.description());
        if (request.contactInfo() != null) supplier.setContactInfo(request.contactInfo());

        supplierRepository.save(supplier);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("name", supplier.getName() != null ? supplier.getName() : "");
        newFields.put("description", supplier.getDescription() != null ? supplier.getDescription() : "");
        newFields.put("contactInfo", supplier.getContactInfo() != null ? supplier.getContactInfo() : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.SUPPLIER,
                    id,
                    null,
                    null,
                    supplier.getName(),
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToResponse(supplier);
    }

    @Transactional
    public void delete(Long id) {
        Supplier supplier = supplierRepository.findById(id).orElse(null);
        if (supplier != null) {
            Long userId = UserContextHolder.getUserId();
            Map<String, Object> fields = Map.of("name", supplier.getName() != null ? supplier.getName() : "");
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.SUPPLIER,
                    id,
                    null,
                    null,
                    supplier.getName(),
                    ActionType.DELETED,
                    logDetailsBuilder.buildDeleted(fields)
            ));
        }
        supplierRepository.deleteById(id);
    }

    @Transactional
    public SupplierReviewResponse createReview(Long supplierId, CreateSupplierReviewRequest request) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new EntityNotFoundException("Supplier not found"));

        validate(request);
        SupplierReview review = SupplierReview.builder().supplier(supplier).build();
        apply(review, request);

        reviewRepository.save(review);
        supplier.getReviews().add(review);

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = reviewFields(review);
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.SUPPLIER_REVIEW,
                supplier.getId(),
                null,
                null,
                reviewLogName(supplier, review),
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));

        return mapToReviewResponse(review);
    }

    @Transactional
    public SupplierReviewResponse updateReview(Long supplierId, Long reviewId, UpdateSupplierReviewRequest request) {
        SupplierReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("SupplierReview not found"));

        if (!review.getSupplier().getId().equals(supplierId)) {
            throw new IllegalArgumentException("Review does not belong to this supplier");
        }

        validate(request);
        Map<String, Object> oldFields = reviewFields(review);

        apply(review, request);

        reviewRepository.save(review);

        Map<String, Object> newFields = reviewFields(review);

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.SUPPLIER_REVIEW,
                    supplierId,
                    null,
                    null,
                    reviewLogName(review.getSupplier(), review),
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToReviewResponse(review);
    }

    @Transactional
    public void deleteReview(Long supplierId, Long reviewId) {
        SupplierReview review = reviewRepository.findById(reviewId).orElse(null);
        if (review != null) {
            Supplier supplier = review.getSupplier();
            if (!supplier.getId().equals(supplierId)) {
                throw new IllegalArgumentException("Review does not belong to this supplier");
            }

            Long userId = UserContextHolder.getUserId();
            Map<String, Object> fields = reviewFields(review);
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.SUPPLIER_REVIEW,
                    supplierId,
                    null,
                    null,
                    reviewLogName(supplier, review),
                    ActionType.DELETED,
                    logDetailsBuilder.buildDeleted(fields)
            ));

            supplier.getReviews().remove(review);
            reviewRepository.delete(review);
        }
    }

    @Transactional
    public SupplierReviewResponse attachDocument(Long supplierId, Long reviewId, Long documentId) {
        SupplierReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("SupplierReview not found"));

        if (!review.getSupplier().getId().equals(supplierId)) {
            throw new IllegalArgumentException("Review does not belong to this supplier");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found"));

        review.getDocuments().add(document);
        reviewRepository.save(review);

        return mapToReviewResponse(review);
    }

    @Transactional
    public void removeDocument(Long supplierId, Long reviewId, Long documentId) {
        SupplierReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new EntityNotFoundException("SupplierReview not found"));

        if (!review.getSupplier().getId().equals(supplierId)) {
            throw new IllegalArgumentException("Review does not belong to this supplier");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found"));

        review.getDocuments().remove(document);
        reviewRepository.save(review);
        documentService.deleteDocument(documentId);
    }

    private SupplierResponse mapToResponse(Supplier supplier) {
        List<SupplierReviewResponse> reviews = supplier.getReviews().stream()
                .map(this::mapToReviewResponse)
                .toList();

        return new SupplierResponse(
                supplier.getId(),
                supplier.getName(),
                supplier.getDescription(),
                supplier.getContactInfo(),
                supplier.getCreatedAt(),
                reviews
        );
    }

    private SupplierReviewResponse mapToReviewResponse(SupplierReview review) {
        List<DocumentWithVersionsResponse> documents = review.getDocuments() != null
                ? review.getDocuments().stream()
                .map(doc -> documentService.getDocumentWithVersions(doc.getId()))
                .toList()
                : List.of();

        return new SupplierReviewResponse(
                review.getId(),
                review.getEvaluationYear(),
                review.getSemester(),
                review.getReviewDate(),
                review.getCriteriaSentDate(),
                review.getConformityScore(),
                review.getDeadlineScore(),
                review.getQualityScore(),
                review.getDocumentationScore(),
                totalScore(review),
                review.getClassification(),
                review.getMeasures(),
                review.getJustification(),
                review.getText(),
                documents
        );
    }

    private static String reviewLogName(Supplier supplier, SupplierReview review) {
        String period = java.util.stream.Stream.of(
                        review.getEvaluationYear() != null ? review.getEvaluationYear().toString() : null,
                        review.getSemester() != null ? review.getSemester() + ".º semestre" : null)
                .filter(java.util.Objects::nonNull)
                .collect(java.util.stream.Collectors.joining(" · "));
        return "Avaliação — " + supplier.getName() + (period.isEmpty() ? "" : " (" + period + ")");
    }

    private static Integer totalScore(SupplierReview review) {
        List<Integer> scores = java.util.stream.Stream.of(
                        review.getConformityScore(), review.getDeadlineScore(),
                        review.getQualityScore(), review.getDocumentationScore())
                .filter(java.util.Objects::nonNull)
                .toList();
        return scores.isEmpty() ? null : scores.stream().mapToInt(Integer::intValue).sum();
    }

    private static void validate(SupplierReviewData data) {
        if (data.semester() != null && data.semester() != 1 && data.semester() != 2) {
            throw new IllegalArgumentException("O semestre tem de ser 1 ou 2.");
        }
        for (Integer score : java.util.Arrays.asList(
                data.conformityScore(), data.deadlineScore(), data.qualityScore(), data.documentationScore())) {
            if (score != null && (score < 1 || score > 4)) {
                throw new IllegalArgumentException("A pontuação de cada critério tem de estar entre 1 e 4.");
            }
        }
    }

    private static void apply(SupplierReview review, SupplierReviewData data) {
        review.setEvaluationYear(data.year());
        review.setSemester(data.semester());
        review.setReviewDate(data.reviewDate());
        review.setCriteriaSentDate(data.criteriaSentDate());
        review.setConformityScore(data.conformityScore());
        review.setDeadlineScore(data.deadlineScore());
        review.setQualityScore(data.qualityScore());
        review.setDocumentationScore(data.documentationScore());
        review.setClassification(blankToNull(data.classification()));
        review.setMeasures(blankToNull(data.measures()));
        review.setJustification(blankToNull(data.justification()));
        review.setText(blankToNull(data.text()));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static Map<String, Object> reviewFields(SupplierReview review) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("year", review.getEvaluationYear() != null ? review.getEvaluationYear().toString() : "");
        fields.put("semester", review.getSemester() != null ? review.getSemester().toString() : "");
        fields.put("reviewDate", review.getReviewDate() != null ? review.getReviewDate().toString() : "");
        fields.put("criteriaSentDate", review.getCriteriaSentDate() != null ? review.getCriteriaSentDate().toString() : "");
        fields.put("conformityScore", review.getConformityScore() != null ? review.getConformityScore().toString() : "");
        fields.put("deadlineScore", review.getDeadlineScore() != null ? review.getDeadlineScore().toString() : "");
        fields.put("qualityScore", review.getQualityScore() != null ? review.getQualityScore().toString() : "");
        fields.put("documentationScore", review.getDocumentationScore() != null ? review.getDocumentationScore().toString() : "");
        fields.put("classification", review.getClassification() != null ? review.getClassification() : "");
        fields.put("measures", review.getMeasures() != null ? review.getMeasures() : "");
        fields.put("justification", review.getJustification() != null ? review.getJustification() : "");
        fields.put("text", review.getText() != null ? review.getText() : "");
        return fields;
    }
}
