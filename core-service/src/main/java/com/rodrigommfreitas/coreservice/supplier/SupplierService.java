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

        SupplierReview review = SupplierReview.builder()
                .supplier(supplier)
                .rating(request.rating())
                .text(request.text())
                .reviewDate(request.reviewDate())
                .build();

        reviewRepository.save(review);
        supplier.getReviews().add(review);

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("rating", String.valueOf(request.rating()));
        fields.put("text", request.text() != null ? request.text() : "");
        fields.put("reviewDate", request.reviewDate() != null ? request.reviewDate().toString() : "");
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.SUPPLIER_REVIEW,
                review.getId(),
                null,
                null,
                "Avaliação — " + supplier.getName(),
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

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("rating", String.valueOf(review.getRating()));
        oldFields.put("text", review.getText() != null ? review.getText() : "");
        oldFields.put("reviewDate", review.getReviewDate() != null ? review.getReviewDate().toString() : "");

        if (request.rating() != null) review.setRating(request.rating());
        if (request.text() != null) review.setText(request.text());
        if (request.reviewDate() != null) review.setReviewDate(request.reviewDate());

        reviewRepository.save(review);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("rating", String.valueOf(review.getRating()));
        newFields.put("text", review.getText() != null ? review.getText() : "");
        newFields.put("reviewDate", review.getReviewDate() != null ? review.getReviewDate().toString() : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.SUPPLIER_REVIEW,
                    reviewId,
                    null,
                    null,
                    "Avaliação — " + review.getSupplier().getName(),
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
            Map<String, Object> fields = Map.of("rating", String.valueOf(review.getRating()));
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.SUPPLIER_REVIEW,
                    reviewId,
                    null,
                    null,
                    "Avaliação — " + supplier.getName(),
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
                review.getRating(),
                review.getText(),
                review.getReviewDate(),
                documents
        );
    }
}
