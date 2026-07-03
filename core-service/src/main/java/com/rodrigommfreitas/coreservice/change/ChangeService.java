package com.rodrigommfreitas.coreservice.change;

import com.rodrigommfreitas.coreservice.change.dto.ChangeRequest;
import com.rodrigommfreitas.coreservice.change.dto.ChangeResponse;
import com.rodrigommfreitas.coreservice.log.ActionType;
import com.rodrigommfreitas.coreservice.log.EntityType;
import com.rodrigommfreitas.coreservice.log.LogService;
import com.rodrigommfreitas.coreservice.log.dto.CreateLogRequest;
import com.rodrigommfreitas.coreservice.log.utils.LogDetailsBuilder;
import com.rodrigommfreitas.coreservice.security.UserContextHolder;
import com.rodrigommfreitas.coreservice.user.User;
import com.rodrigommfreitas.coreservice.user.UserReferenceService;
import com.rodrigommfreitas.coreservice.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ChangeService {
    private final ChangeRepository changeRepository;
    private final UserRepository userRepository;
    private final UserReferenceService userRefService;
    private final LogService logService;
    private final LogDetailsBuilder logDetailsBuilder;

    private String userDisplayName(User user) {
        if (user == null) return "";
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        return (first + " " + last).trim();
    }

    @Transactional
    public ChangeResponse create(ChangeRequest request) {
        User createdBy = request.createdById() != null
                ? userRepository.findById(request.createdById()).orElse(null)
                : null;

        Change change = Change.builder()
                .description(request.description())
                .origin(request.origin())
                .whatWillBeDone(request.whatWillBeDone())
                .why(request.why())
                .createdBy(createdBy)
                .startDate(request.startDate())
                .timeLimitInDays(request.timeLimitInDays())
                .expectedEndDate(request.expectedEndDate())
                .realEndDate(request.realEndDate())
                .where(request.where())
                .how(request.how())
                .howMuch(request.howMuch())
                .status(request.status())
                .notes(request.notes())
                .createdAt(LocalDateTime.now())
                .build();

        ChangeResponse response = mapToResponse(changeRepository.save(change));

        Long userId = UserContextHolder.getUserId();
        Map<String, Object> fields = buildFieldMap(change);
        logService.createLog(new CreateLogRequest(
                userId,
                EntityType.CHANGE,
                change.getId(),
                null,
                null,
                change.getDescription() != null ? change.getDescription() : "Alteração",
                ActionType.CREATED,
                logDetailsBuilder.buildCreated(fields)
        ));

        return response;
    }

    @Transactional
    public ChangeResponse update(Long id, ChangeRequest request) {
        Change change = changeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Change not found"));

        Map<String, Object> oldFields = buildFieldMap(change);

        if (request.description() != null) change.setDescription(request.description());
        if (request.origin() != null) change.setOrigin(request.origin());
        if (request.whatWillBeDone() != null) change.setWhatWillBeDone(request.whatWillBeDone());
        if (request.why() != null) change.setWhy(request.why());
        if (request.createdById() != null) {
            User createdBy = userRepository.findById(request.createdById()).orElse(null);
            change.setCreatedBy(createdBy);
        }
        if (request.startDate() != null) change.setStartDate(request.startDate());
        if (request.timeLimitInDays() != null) change.setTimeLimitInDays(request.timeLimitInDays());
        if (request.expectedEndDate() != null) change.setExpectedEndDate(request.expectedEndDate());
        if (request.realEndDate() != null) change.setRealEndDate(request.realEndDate());
        if (request.where() != null) change.setWhere(request.where());
        if (request.how() != null) change.setHow(request.how());
        if (request.howMuch() != null) change.setHowMuch(request.howMuch());
        if (request.status() != null) change.setStatus(request.status());
        if (request.notes() != null) change.setNotes(request.notes());

        Map<String, Object> newFields = buildFieldMap(change);

        if (!oldFields.equals(newFields)) {
            Long userId = UserContextHolder.getUserId();
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.CHANGE,
                    id,
                    null,
                    null,
                    change.getDescription() != null ? change.getDescription() : "Alteração",
                    ActionType.UPDATED,
                    logDetailsBuilder.buildUpdated(oldFields, newFields)
            ));
        }

        return mapToResponse(change);
    }

    @Transactional
    public ChangeResponse patch(Long id, ChangeRequest request) {
        return update(id, request);
    }

    @Transactional(readOnly = true)
    public List<ChangeResponse> getAll() {
        return changeRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChangeResponse> getByYear(int year) {
        LocalDateTime start = LocalDateTime.of(year, 1, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(year, 12, 31, 23, 59, 59);
        return changeRepository.findByCreatedAtBetween(start, end)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public void delete(Long id) {
        Change change = changeRepository.findById(id).orElse(null);
        if (change != null) {
            Long userId = UserContextHolder.getUserId();
            Map<String, Object> fields = Map.of("description", change.getDescription() != null ? change.getDescription() : "");
            logService.createLog(new CreateLogRequest(
                    userId,
                    EntityType.CHANGE,
                    id,
                    null,
                    null,
                    change.getDescription() != null ? change.getDescription() : "Alteração",
                    ActionType.DELETED,
                    logDetailsBuilder.buildDeleted(fields)
            ));
        }
        changeRepository.deleteById(id);
    }

    private Map<String, Object> buildFieldMap(Change change) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("description", change.getDescription() != null ? change.getDescription() : "");
        fields.put("origin", change.getOrigin() != null ? change.getOrigin() : "");
        fields.put("whatWillBeDone", change.getWhatWillBeDone() != null ? change.getWhatWillBeDone() : "");
        fields.put("why", change.getWhy() != null ? change.getWhy() : "");
        fields.put("createdBy", change.getCreatedBy() != null ? userDisplayName(change.getCreatedBy()) : "");
        fields.put("startDate", change.getStartDate() != null ? change.getStartDate() : "");
        fields.put("timeLimitInDays", change.getTimeLimitInDays() != null ? change.getTimeLimitInDays().toString() : "");
        fields.put("expectedEndDate", change.getExpectedEndDate() != null ? change.getExpectedEndDate() : "");
        fields.put("realEndDate", change.getRealEndDate() != null ? change.getRealEndDate() : "");
        fields.put("where", change.getWhere() != null ? change.getWhere() : "");
        fields.put("how", change.getHow() != null ? change.getHow() : "");
        fields.put("howMuch", change.getHowMuch() != null ? change.getHowMuch() : "");
        fields.put("status", change.getStatus() != null ? change.getStatus().name() : "");
        fields.put("notes", change.getNotes() != null ? change.getNotes() : "");
        return fields;
    }

    private ChangeResponse mapToResponse(Change change) {
        return new ChangeResponse(
                change.getId(),
                change.getDescription(),
                change.getOrigin(),
                change.getWhatWillBeDone(),
                change.getWhy(),
                userRefService.fromEntity(change.getCreatedBy()),
                change.getStartDate(),
                change.getTimeLimitInDays(),
                change.getExpectedEndDate(),
                change.getRealEndDate(),
                change.getWhere(),
                change.getHow(),
                change.getHowMuch(),
                change.getStatus(),
                change.getNotes(),
                change.getCreatedAt()
        );
    }
}