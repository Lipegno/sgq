package com.rodrigommfreitas.coreservice.audit;

import com.rodrigommfreitas.coreservice.audit.dto.*;
import com.rodrigommfreitas.coreservice.department.Department;
import com.rodrigommfreitas.coreservice.department.DepartmentRepository;
import com.rodrigommfreitas.coreservice.department.dto.DepartmentResponse;
import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserReferenceService;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import com.rodrigommfreitas.coreservice.year.Year;
import com.rodrigommfreitas.coreservice.year.YearRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditRepository auditRepository;
    private final YearRepository yearRepository;
    private final UserRepository userRepository;
    private final UserReferenceService userRefService;
    private final DepartmentRepository departmentRepository;
    private final DocumentRepository documentRepository;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    @Transactional
    public AuditResponse create(CreateAuditRequest request) {
        User responsible = request.responsibleId() != null
                ? userRepository.findById(request.responsibleId()).orElse(null)
                : null;

        Department department = request.departmentId() != null
                ? departmentRepository.findById(request.departmentId()).orElse(null)
                : null;

        Year year = yearRepository.findById(request.yearId())
                .orElseThrow(() -> new RuntimeException("Year not found"));

        Audit audit = Audit.builder()
                .name(request.name())
                .type(request.type())
                .team(request.team())
                .notes(request.notes())
                .responsible(responsible)
                .department(department)
                .year(year)
                .status(request.status() != null ? request.status() : AuditStatus.PLANNED_NOT_CONFIRMED)
                .plannedDate(request.plannedDate() != null ? LocalDate.parse(request.plannedDate()) : null)
                .documents(new ArrayList<>())
                .build();

        auditRepository.save(audit);

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", request.name() != null ? request.name() : "");
        fields.put("type", request.type() != null ? request.type().name() : "");
        fields.put("team", request.team() != null ? request.team() : "");
        fields.put("responsible", responsible != null ? userRefService.fromEntity(responsible).firstName() + " " + userRefService.fromEntity(responsible).lastName() : "");
        fields.put("department", department != null ? department.getName() : "");
        fields.put("year", String.valueOf(year.getYear()));
        fields.put("status", request.status() != null ? request.status().name() : AuditStatus.PLANNED_NOT_CONFIRMED.name());

        logService.createLog(new CreateLogRequest(
                userId, EntityType.AUDIT, audit.getId(), null, null,
                audit.getName() != null ? audit.getName() : "Auditoria",
                ActionType.CREATED, logDetailsBuilder.buildCreated(fields)
        ));

        return mapToResponse(audit);
    }

    @Transactional
    public AuditResponse update(Long id, UpdateAuditRequest request) {
        Audit audit = auditRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Audit not found"));

        Map<String, Object> oldFields = new LinkedHashMap<>();
        oldFields.put("name", audit.getName() != null ? audit.getName() : "");
        oldFields.put("type", audit.getType() != null ? audit.getType().name() : "");
        oldFields.put("team", audit.getTeam() != null ? audit.getTeam() : "");
        oldFields.put("notes", audit.getNotes() != null ? audit.getNotes() : "");
        oldFields.put("responsible", audit.getResponsible() != null ? userRefService.fromEntity(audit.getResponsible()).firstName() + " " + userRefService.fromEntity(audit.getResponsible()).lastName() : "");
        oldFields.put("department", audit.getDepartment() != null ? audit.getDepartment().getName() : "");
        oldFields.put("status", audit.getStatus() != null ? audit.getStatus().name() : "");
        oldFields.put("plannedDate", audit.getPlannedDate() != null ? audit.getPlannedDate().toString() : "");

        if (request.name() != null) audit.setName(request.name());
        if (request.type() != null) audit.setType(request.type());
        if (request.team() != null) audit.setTeam(request.team());
        if (request.notes() != null) audit.setNotes(request.notes());
        if (request.status() != null) audit.setStatus(request.status());
        if (request.plannedDate() != null) audit.setPlannedDate(LocalDate.parse(request.plannedDate()));
        if (request.responsibleId() != null && request.responsibleId() > 0) {
            User responsible = userRepository.findById(request.responsibleId()).orElse(null);
            audit.setResponsible(responsible);
        } else if (request.responsibleId() != null && request.responsibleId() == 0) {
            audit.setResponsible(null);
        }
        if (request.departmentId() != null && request.departmentId() > 0) {
            Department department = departmentRepository.findById(request.departmentId()).orElse(null);
            audit.setDepartment(department);
        } else if (request.departmentId() != null && request.departmentId() == 0) {
            audit.setDepartment(null);
        }

        auditRepository.save(audit);

        Map<String, Object> newFields = new LinkedHashMap<>();
        newFields.put("name", audit.getName() != null ? audit.getName() : "");
        newFields.put("type", audit.getType() != null ? audit.getType().name() : "");
        newFields.put("team", audit.getTeam() != null ? audit.getTeam() : "");
        newFields.put("notes", audit.getNotes() != null ? audit.getNotes() : "");
        newFields.put("responsible", audit.getResponsible() != null ? userRefService.fromEntity(audit.getResponsible()).firstName() + " " + userRefService.fromEntity(audit.getResponsible()).lastName() : "");
        newFields.put("department", audit.getDepartment() != null ? audit.getDepartment().getName() : "");
        newFields.put("status", audit.getStatus() != null ? audit.getStatus().name() : "");
        newFields.put("plannedDate", audit.getPlannedDate() != null ? audit.getPlannedDate().toString() : "");

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId, EntityType.AUDIT, id, null, null,
                    audit.getName() != null ? audit.getName() : "Auditoria",
                    ActionType.UPDATED, logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToResponse(audit);
    }

    @Transactional
    public void delete(Long id) {
        Audit audit = auditRepository.findById(id).orElse(null);
        if (audit != null) {
            Long userId = UserContextHolder.getUserId();
            Map<String, Object> fields = Map.of("name", audit.getName() != null ? audit.getName() : "");
            logService.createLog(new CreateLogRequest(
                    userId, EntityType.AUDIT, id, null, null,
                    audit.getName() != null ? audit.getName() : "Auditoria",
                    ActionType.DELETED, logDetailsBuilder.buildDeleted(fields)
            ));
        }
        auditRepository.deleteById(id);
    }

    @Transactional
    public AuditResponse attachDocument(Long id, Long documentId) {
        Audit audit = auditRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Audit not found"));
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
        if (!audit.getDocuments().contains(document)) {
            audit.getDocuments().add(document);
            auditRepository.save(audit);
        }
        return mapToResponse(audit);
    }

    @Transactional
    public void removeDocument(Long id, Long documentId) {
        Audit audit = auditRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Audit not found"));
        audit.getDocuments().removeIf(d -> d.getId().equals(documentId));
        auditRepository.save(audit);
    }

    @Transactional(readOnly = true)
    public List<AuditResponse> getByYear(Long yearId) {
        return auditRepository.findByYearId(yearId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private AuditResponse mapToResponse(Audit audit) {
        List<DocumentSummary> docs = audit.getDocuments() != null
                ? audit.getDocuments().stream()
                .map(doc -> {
                    var cv = doc.getCurrentVersion();
                    String uploadedByFullName = "";
                    String uploadedAt = "";
                    if (cv != null) {
                        if (cv.getUploadedBy() != null) {
                            uploadedByFullName = cv.getUploadedBy().getFirstName() + " " + cv.getUploadedBy().getLastName();
                        }
                        if (cv.getUploadedAt() != null) {
                            uploadedAt = cv.getUploadedAt().toString();
                        }
                    }
                    return new DocumentSummary(
                            doc.getId(),
                            cv != null ? cv.getFileName() : "",
                            cv != null ? cv.getFileType() : "",
                            cv != null ? cv.getFileUrl() : "",
                            uploadedByFullName,
                            uploadedAt
                    );
                }).toList()
                : List.of();

        DepartmentResponse deptResponse = audit.getDepartment() != null
                ? new DepartmentResponse(audit.getDepartment().getId(), audit.getDepartment().getName(), 0)
                : null;

        return new AuditResponse(
                audit.getId(),
                audit.getName(),
                audit.getType(),
                audit.getTeam(),
                audit.getNotes(),
                userRefService.fromEntity(audit.getResponsible()),
                deptResponse,
                audit.getYear().getId(),
                audit.getYear().getYear(),
                audit.getStatus(),
                audit.getPlannedDate(),
                docs
        );
    }
}