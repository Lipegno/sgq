package com.rodrigommfreitas.coreservice.managementreview;

import com.rodrigommfreitas.coreservice.document.Document;
import com.rodrigommfreitas.coreservice.document.DocumentRepository;
import com.rodrigommfreitas.coreservice.document.DocumentService;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.managementreview.dto.ManagementReviewMeetingRequest;
import com.rodrigommfreitas.coreservice.managementreview.dto.ManagementReviewMeetingResponse;
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
public class ManagementReviewMeetingService {

    private final ManagementReviewMeetingRepository repository;
    private final YearRepository yearRepository;
    private final DocumentRepository documentRepository;
    private final DocumentService documentService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    @Transactional(readOnly = true)
    public List<ManagementReviewMeetingResponse> listByYear(Long yearId) {
        return repository.findByYearIdOrderByMeetingDateAscIdAsc(yearId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public ManagementReviewMeetingResponse create(ManagementReviewMeetingRequest request) {
        if (request.yearId() == null) {
            throw new IllegalArgumentException("yearId is required");
        }
        Year year = yearRepository.findById(request.yearId())
                .orElseThrow(() -> new EntityNotFoundException("Year not found with id " + request.yearId()));
        ManagementReviewMeeting meeting = ManagementReviewMeeting.builder().year(year).build();
        apply(meeting, request);
        repository.save(meeting);
        log(meeting, ActionType.CREATED, logDetailsBuilder.buildCreated(fields(meeting)));
        return toResponse(meeting);
    }

    @Transactional
    public ManagementReviewMeetingResponse update(Long id, ManagementReviewMeetingRequest request) {
        ManagementReviewMeeting meeting = find(id);
        Map<String, Object> oldFields = fields(meeting);
        apply(meeting, request);
        repository.save(meeting);
        Map<String, Object> newFields = fields(meeting);
        if (!oldFields.equals(newFields)) {
            log(meeting, ActionType.UPDATED, logDetailsBuilder.buildUpdated(oldFields, newFields));
        }
        return toResponse(meeting);
    }

    @Transactional
    public void delete(Long id) {
        ManagementReviewMeeting meeting = find(id);
        log(meeting, ActionType.DELETED, logDetailsBuilder.buildDeleted(fields(meeting)));
        List<Long> documentIds = meeting.getDocuments().stream().map(Document::getId).toList();
        meeting.getDocuments().clear();
        repository.delete(meeting);
        repository.flush();
        documentIds.forEach(documentService::deleteDocument);
    }

    @Transactional
    public ManagementReviewMeetingResponse attachDocument(Long id, Long documentId) {
        ManagementReviewMeeting meeting = find(id);
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));
        meeting.getDocuments().add(document);
        repository.save(meeting);
        log(meeting, ActionType.ASSOCIATED, logDetailsBuilder.buildAssociation("document", documentId.toString(), "associated"));
        return toResponse(meeting);
    }

    @Transactional
    public void removeDocument(Long id, Long documentId) {
        ManagementReviewMeeting meeting = find(id);
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new EntityNotFoundException("Document not found with id " + documentId));
        if (!meeting.getDocuments().remove(document)) {
            throw new IllegalArgumentException("Document does not belong to this meeting");
        }
        repository.save(meeting);
        log(meeting, ActionType.DISASSOCIATED, logDetailsBuilder.buildAssociation("document", documentId.toString(), "disassociated"));
        documentService.deleteDocument(documentId);
    }

    private ManagementReviewMeeting find(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Management review meeting not found with id " + id));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void apply(ManagementReviewMeeting meeting, ManagementReviewMeetingRequest request) {
        meeting.setMeetingDate(request.meetingDate());
        meeting.setParticipants(blankToNull(request.participants()));
        meeting.setNotes(blankToNull(request.notes()));
        meeting.setDecisions(blankToNull(request.decisions()));
        meeting.setImprovementOutputs(blankToNull(request.improvementOutputs()));
        meeting.setChangeNeeds(blankToNull(request.changeNeeds()));
        meeting.setResourceNeeds(blankToNull(request.resourceNeeds()));
    }

    private Map<String, Object> fields(ManagementReviewMeeting m) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("meetingDate", m.getMeetingDate() != null ? m.getMeetingDate().toString() : "");
        fields.put("participants", m.getParticipants() != null ? m.getParticipants() : "");
        fields.put("notes", m.getNotes() != null ? m.getNotes() : "");
        fields.put("decisions", m.getDecisions() != null ? m.getDecisions() : "");
        fields.put("improvementOutputs", m.getImprovementOutputs() != null ? m.getImprovementOutputs() : "");
        fields.put("changeNeeds", m.getChangeNeeds() != null ? m.getChangeNeeds() : "");
        fields.put("resourceNeeds", m.getResourceNeeds() != null ? m.getResourceNeeds() : "");
        return fields;
    }

    private void log(ManagementReviewMeeting meeting, ActionType action, com.fasterxml.jackson.databind.JsonNode details) {
        String when = meeting.getMeetingDate() != null ? meeting.getMeetingDate().toString() : "sem data";
        logService.createLog(new CreateLogRequest(
                UserContextHolder.getUserId(),
                EntityType.MANAGEMENT_REVIEW_MEETING,
                meeting.getId(),
                null,
                meeting.getYear().getId(),
                "Reunião de revisão pela gestão — " + meeting.getYear().getYear() + " (" + when + ")",
                action,
                details
        ));
    }

    private ManagementReviewMeetingResponse toResponse(ManagementReviewMeeting m) {
        List<com.rodrigommfreitas.coreservice.document.dto.DocumentWithVersionsResponse> documents = new ArrayList<>();
        m.getDocuments().forEach(d -> documents.add(documentService.getDocumentWithVersions(d.getId())));
        return new ManagementReviewMeetingResponse(
                m.getId(), m.getYear().getId(), m.getYear().getYear(), m.getMeetingDate(),
                m.getParticipants(), m.getNotes(), m.getDecisions(),
                m.getImprovementOutputs(), m.getChangeNeeds(), m.getResourceNeeds(), documents);
    }
}
